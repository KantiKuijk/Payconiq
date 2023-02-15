import assert from "node:assert/strict";
import { verify } from "node:crypto";

export type PayconiqQRCodeFormat = "PNG" | "SVG";
export type PayconiqQRCodeSize = "S" | "M" | "L" | "XL";
export type PayconiqQRCodeColor = "magenta" | "black";
export type PayconiqQRCodeOptions = {
  format?: PayconiqQRCodeFormat;
  size?: PayconiqQRCodeSize;
  color?: PayconiqQRCodeColor;
};
export type PayconiqInvoiceInfo = {
  amount: number | string;
  description?: string;
  reference?: string;
};
export type PayconiqJWK = {
  kty: string;
  use: string;
  kid: string;
  "x5t#S256": string;
  alg: string;
  x5c: string[];
  n: string;
  e: string;
};
export type PayconiqJWKS = PayconiqJWK[];
export type PayconiqJWKSbyKid = {
  [key: string]: PayconiqJWK;
};
type PayconiqDebtor = {
  name?: string;
  iban?: string;
};
type PayconiqStatusCodes =
  | "PENDING"
  | "IDENTIFIED"
  | "AUTHORIZED"
  | "AUTHORIZATION_FAILED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";
export type PayconiqPOSCallbackBody = {
  paymentId: string;
  amount: number;
  transferAmount: number;
  tippingAmount: number;
  totalAmount: number;
  currency?: "EUR";
  description?: string;
  reference?: string;
  createdAt: string;
  expiresAt: string;
  succeededAt: string;
  status: PayconiqStatusCodes;
  debtor: PayconiqDebtor;
};
export type PayconiqPOSRequestBody = {
  amount: number;
  callbackUrl?: string;
  currency?: "EUR";
  description?: string;
  reference?: string;
  bulkId?: string;
  posId: string;
  shopId?: string;
  shopName?: string;
};
type PayconiqCreditor = {
  profileId: string;
  merchantId: string;
  name: string;
  iban: string;
  callbackUrl?: string;
};
type PayconiqLinks = {
  self?: {
    href?: string;
  };
  deeplink?: {
    href?: string;
  };
  qrcode?: {
    href?: string;
  };
  cancel?: {
    href?: string;
  };
};
export type PayconiqPOSResponseBody = {
  paymentId: string;
  status: PayconiqStatusCodes;
  createdAt: string;
  expiresAt: string;
  description?: string;
  reference?: string;
  amount: number;
  currency?: "EUR";
  creditor: PayconiqCreditor;
  _links: PayconiqLinks;
};
export type PayconiqResponseError = {
  code:
    | "UNAUTHORIZED"
    | "ACCESS_DENIED"
    | "PAYMENT_NOT_FOUND"
    | "TECHNICAL_ERROR"
    | "CALLER_NOT_ALLOWED_TO_CANCEL"
    | "PAYMENT_NOT_FOUND"
    | "PAYMENT_NOT_PENDING"
    | "PAYMENT_CONFLICT"
    | "BODY_MISSING"
    | "FIELD_REQUIRED"
    | "QR_NO_LONGER_IN_USE"
    | "UNABLE_TO_PAY_CREDITOR"
    | "TRY_AGAIN_LATER";
  message: string;
  traceId: string;
  spanId: string;
};

export type PayconiqCallbackVerificationErrorCategories = "INCORRECT" | "INVALID" | "FAILED" | "UNSUPPORTED";

export class PayconiqCallbackVerificationError extends Error {
  category: PayconiqCallbackVerificationErrorCategories;
  constructor(message: string, category?: string) {
    super(message);
    this.name = "PayconiqCallbackVerificationError";
    this.category = (category ?? message.split(" ")[0].toUpperCase()) as PayconiqCallbackVerificationErrorCategories;
    Object.setPrototypeOf(this, PayconiqCallbackVerificationError.prototype);
  }
}
const PCBVError = PayconiqCallbackVerificationError;

function createPOSURL(paymentId: string, posId: string) {
  assert(/^([a-z0-9]{1,36}|[A-Z0-9]{1,36})$/.test(posId), "Invalid posId");
  const payloadURL = new URL(`https://payconiq.com/l/1/${paymentId}/${posId}`);
  return payloadURL.toString();
}
function createPOSQRCodeURL(paymentId: string, posId: string, qrCodeOpts: PayconiqQRCodeOptions = {}) {
  const serviceURL = new URL("https://portal.payconiq.com/qrcode");
  serviceURL.searchParams.append("c", createPOSURL(paymentId, posId));
  if (qrCodeOpts.format) serviceURL.searchParams.append("f", qrCodeOpts.format);
  if (qrCodeOpts.size) serviceURL.searchParams.append("s", qrCodeOpts.size);
  if (qrCodeOpts.color) serviceURL.searchParams.append("cl", qrCodeOpts.color);
  return serviceURL.toString();
}
function validateInvoiceInfo(invoiceInfo: PayconiqInvoiceInfo) {
  assert(invoiceInfo.amount >= 1 && invoiceInfo.amount <= 999999, "Invalid amount");
  if (invoiceInfo.description) assert(invoiceInfo.description.length <= 35, "Description too long");
  if (invoiceInfo.reference) assert(invoiceInfo.reference.length <= 35, "Reference too long");
}
function createInvoiceURL(paymentId: string, invoiceInfo: PayconiqInvoiceInfo) {
  validateInvoiceInfo(invoiceInfo);
  const payloadURL = new URL(`https://payconiq.com/t/1/${paymentId}`);
  if (invoiceInfo.amount) payloadURL.searchParams.append("A", String(invoiceInfo.amount));
  if (invoiceInfo.description) payloadURL.searchParams.append("D", invoiceInfo.description);
  if (invoiceInfo.reference) payloadURL.searchParams.append("R", invoiceInfo.reference);
  return payloadURL.toString();
}
function createInvoiceQRCodeURL(
  paymentId: string,
  invoiceInfo: PayconiqInvoiceInfo | string,
  qrCodeOpts: PayconiqQRCodeOptions = {},
) {
  const serviceURL = new URL("https://portal.payconiq.com/qrcode");
  serviceURL.searchParams.append(
    "c",
    typeof invoiceInfo === "string" ? invoiceInfo : createInvoiceURL(paymentId, invoiceInfo),
  );
  if (qrCodeOpts.format) serviceURL.searchParams.append("f", qrCodeOpts.format);
  if (qrCodeOpts.size) serviceURL.searchParams.append("s", qrCodeOpts.size);
  if (qrCodeOpts.color) serviceURL.searchParams.append("cl", qrCodeOpts.color);
  return serviceURL.toString();
}
async function restPayconiqRequest(
  apiKey: string,
  url: string,
  { method = "POST", body = {} }: { method?: "POST" | "DELETE"; body?: any } = {
    method: "POST",
    body: {},
  },
) {
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}
function validatePOSPaymentInfo(POSReqBody: PayconiqPOSRequestBody) {
  assert(/^([a-z0-9]{1,36}|[A-Z0-9]{1,36})$/.test(POSReqBody.posId), "Invalid posId");
  assert(POSReqBody.amount >= 1 && POSReqBody.amount <= 999999, "Invalid amount");
  if (POSReqBody.currency) assert(POSReqBody.currency === "EUR", "Invalid currency");
  if (POSReqBody.description) assert(POSReqBody.description.length <= 140, "Description too long");
  if (POSReqBody.reference) assert(POSReqBody.reference.length <= 35, "Reference too long");
  if (POSReqBody.bulkId) assert(POSReqBody.bulkId.length <= 35, "BulkId too long");
  if (POSReqBody.shopId) assert(POSReqBody.shopId.length <= 36, "ShopId too long");
  if (POSReqBody.shopName) assert(POSReqBody.shopName.length <= 36, "ShopName too long");
}
async function createPOSQRCodePayment(
  apiKey: string,
  POSQRCodeURL: string,
  posId: string,
  amount: number,
  {
    callbackUrl,
    currency,
    description,
    reference,
    bulkId,
    shopId,
    shopName,
  }: Omit<PayconiqPOSRequestBody, "posId" | "amount"> = {},
) {
  validatePOSPaymentInfo({ posId, amount, callbackUrl, currency, description, reference, bulkId, shopId, shopName });
  const body: PayconiqPOSRequestBody = { amount, posId, currency: "EUR" };
  if (callbackUrl) body.callbackUrl = callbackUrl;
  if (currency) body.currency = currency;
  if (description) body.description = description.substring(0, 140);
  if (reference) body.reference = reference.substring(0, 35);
  if (bulkId) body.bulkId = bulkId.substring(0, 35);
  if (shopId) body.shopId = shopId.substring(0, 36);
  if (shopName) body.shopName = shopName.substring(0, 36);
  console.log(apiKey, POSQRCodeURL, body);
  const paymentResponse = await restPayconiqRequest(apiKey, POSQRCodeURL, {
    body,
  });
  if (paymentResponse.status === 201) {
    // success
    const json = (await paymentResponse.json()) as PayconiqPOSResponseBody;
    return json;
  } else {
    const json = (await paymentResponse.json()) as PayconiqResponseError;
    throw new Error(`Error creating payment: ${json.message} (${json.traceId})`);
  }
}
async function deletePOSQRCodePayment(apiKey: string, bodyOrCancelLink: PayconiqPOSResponseBody | string) {
  if (typeof bodyOrCancelLink !== "string") bodyOrCancelLink = bodyOrCancelLink._links?.cancel?.href ?? "";
  if (bodyOrCancelLink) {
    const res = await restPayconiqRequest(apiKey, bodyOrCancelLink, {
      method: "DELETE",
    });
    if (res.status === 204) return true;
    else {
      const json = (await res.json()) as PayconiqResponseError;
      throw new Error(`Error ${res.status} deleting payment: ${json.message} (${json.traceId})`);
    }
  } else {
    throw new Error(`No cancel link found`);
  }
}

const signatureRegex = /^([a-zA-Z0-9+_\-]+)\.\.([a-zA-Z0-9+_\-]+)$/;
async function verifyCallback(
  getJWK: Function,
  signature: string,
  body: string,
  maxAgeMs: number = 5000,
  callbackURL: string,
  paymentId: string,
  now?: number,
) {
  const match = signature.match(signatureRegex);
  if (match === null) throw new PCBVError("Incorrect compact detached signature");
  const protectedHeader = match[1] as string;
  const header = JSON.parse(Buffer.from(protectedHeader, "base64").toString());
  if (header.typ.toUpperCase() !== "JOSE+JSON") throw new PCBVError("Unsupported type");
  if (header.alg !== "ES256") throw new PCBVError("Unsupported algorithm");
  if (header["https://payconiq.com/iss"] !== "Payconiq") throw new PCBVError("Invalid issuer");
  if (header["https://payconiq.com/sub"] !== paymentId) throw new PCBVError("Invalid subject");
  if (callbackURL && header["https://payconiq.com/path"] !== callbackURL) throw new PCBVError("Invalid path");
  now = now ?? Date.now();
  const iat = Date.parse(header["https://payconiq.com/iat"]);
  if (now - iat > maxAgeMs || iat - now > 100) {
    console.warn(`Invalid issued at: ${iat} .:. ${now}`);
    throw new PCBVError("Invalid issued at");
  }
  // TODO jti check
  const jwk = await getJWK(header.kid);
  if (!jwk) throw new PCBVError("Missing kid");
  const verified = verify(
    "sha256",
    Buffer.from(protectedHeader + "." + Buffer.from(body).toString("base64url")),
    { dsaEncoding: "ieee-p1363", format: "jwk", key: jwk },
    Buffer.from(match[2], "base64url"),
  );
  if (!verified) throw new PCBVError("Failed verfication");
  return true;
}
export type PayconiqProductTypes = "instore" | "predefined" | "invoice" | "receipt";
/* TODO: Maak een verschillende class per product type
 * zodat hun methodes soort van gelijk benoemd kunnen zijn:
 * - makeQRCode (alle)
 * - verify (alle)
 * - makePayment (predefined, invoice, receipt?)
 * - deletePayment (predefined)
 */
export default class Payconiq {
  paymentId: string;
  callbackURL: string;
  defQRCodeOpts: PayconiqQRCodeOptions;
  constructor(
    paymentId: string,
    {
      callbackURL,
      defQRCodeOpts,
    }: {
      callbackURL?: string;
      defQRCodeOpts?: PayconiqQRCodeOptions;
    } = {},
  ) {
    assert(typeof paymentId === "string" && paymentId.length === 24, "Invalid Payment id");
    this.paymentId = paymentId;
    this.callbackURL = callbackURL ?? "";
    this.defQRCodeOpts = defQRCodeOpts ?? {};
  }
  createPOSQRCodeURL = (posId: string, qrCodeOpts?: PayconiqQRCodeOptions) =>
    createPOSQRCodeURL(this.paymentId, posId, Object.assign({}, this.defQRCodeOpts, qrCodeOpts));
  createInvoiceURL = (invoiceInfo: PayconiqInvoiceInfo) => createInvoiceURL(this.paymentId, invoiceInfo);
  createInvoiceQRCodeURL = (invoiceInfo: PayconiqInvoiceInfo | string, qrcodeOpts?: PayconiqQRCodeOptions) =>
    createInvoiceQRCodeURL(this.paymentId, invoiceInfo, Object.assign({}, this.defQRCodeOpts, qrcodeOpts));
}

export class PayconiqAPI extends Payconiq {
  #apiKey: string;
  constructor(
    apiKey: string,
    paymentId: string,
    {
      callbackURL,
      defQRCodeOpts,
    }: {
      callbackURL?: string;
      defQRCodeOpts?: PayconiqQRCodeOptions;
    } = {},
  ) {
    super(paymentId, { defQRCodeOpts, callbackURL });
    assert(typeof apiKey === "string" && apiKey.length === 36, "Invalid API key");
    this.#apiKey = apiKey;
  }
  static #JWKPath = "https://payconiq.com/certificates";
  static #JWKS: PayconiqJWKSbyKid;
  static #lastJWKSUpdate: number;
  static async setJWKS(JWKS: null | PayconiqJWKS = null, force = false) {
    if (
      JWKS === null &&
      (force || PayconiqAPI.#JWKS === undefined || PayconiqAPI.#lastJWKSUpdate + 12 * 3600 * 1000 < Date.now())
    ) {
      const jwksResponse = await fetch(PayconiqAPI.#JWKPath);
      JWKS = ((await jwksResponse.json()) as { keys: PayconiqJWK[] }).keys.filter(
        (key) =>
          key.use === "sig" && key.kty === "RSA" && key.alg === "RS256" && key.kid && typeof key.x5c[0] === "string",
      );
      PayconiqAPI.#lastJWKSUpdate = Date.now();
    }
    PayconiqAPI.#JWKS = Object.fromEntries((JWKS ?? []).map((jwk) => [jwk.kid, jwk]));
    return PayconiqAPI.#JWKS;
  }
  static async #getJWK(kid: string) {
    let jwk = (await this.setJWKS())[kid];
    if (!jwk) jwk = (await this.setJWKS(null, true))[kid];
    return jwk;
  }
  verifyCallback = async (
    signature: string,
    body: string,
    { maxAgeMs, callbackURL, now }: { maxAgeMs?: number; callbackURL?: string; now?: number } = {},
  ) =>
    verifyCallback(
      (kid: string) => PayconiqAPI.#getJWK(kid),
      signature,
      body,
      maxAgeMs ?? 15000,
      callbackURL ?? this.callbackURL,
      this.paymentId,
      now,
    );
  restRequest = async (
    url: string,
    { method = "POST", body = {} }: { method?: "POST" | "DELETE"; body?: any } = {
      method: "POST",
      body: {},
    },
  ) => {
    return restPayconiqRequest(this.#apiKey, url, { method, body });
  };
  static #POSQRCodeURL = "https://api.payconiq.com/v3/payments/pos";
  createPOSQRCodePayment = async (
    posId: string,
    amount: number,
    {
      callbackUrl,
      description,
      reference,
      bulkId,
      shopId,
      shopName,
    }: {
      callbackUrl?: string;
      description?: string;
      reference?: string;
      bulkId?: string;
      shopId?: string;
      shopName?: string;
    } = {},
  ) =>
    createPOSQRCodePayment(this.#apiKey, PayconiqAPI.#POSQRCodeURL, posId, amount, {
      callbackUrl,
      description,
      reference,
      bulkId,
      shopId,
      shopName,
    });
  deletePOSQRCodePayment = async (bodyOrCancelLink: PayconiqPOSResponseBody | string) =>
    deletePOSQRCodePayment(this.#apiKey, bodyOrCancelLink);
}

export class PayconiqTest extends Payconiq {
  #apiKey: string;
  constructor(
    apiKey: string,
    paymentId: string,
    {
      callbackURL,
      defQRCodeOpts,
    }: {
      callbackURL?: string;
      defQRCodeOpts?: PayconiqQRCodeOptions;
    } = {},
  ) {
    super(paymentId, { defQRCodeOpts, callbackURL });
    assert(typeof apiKey === "string" && apiKey.length === 36, "Invalid API key");
    this.#apiKey = apiKey;
  }
  static #JWKPath = "https://ext.payconiq.com/certificates";
  static #JWKS: PayconiqJWKSbyKid;
  static #lastJWKSUpdate: number;
  static async setJWKS(JWKS: null | PayconiqJWKS = null, force = false) {
    if (
      JWKS === null &&
      (force || PayconiqTest.#JWKS === undefined || PayconiqTest.#lastJWKSUpdate + 12 * 3600 * 1000 < Date.now())
    ) {
      PayconiqTest.#lastJWKSUpdate = Date.now();
      const jwksResponse = await fetch(PayconiqTest.#JWKPath);
      JWKS = ((await jwksResponse.json()) as { keys: PayconiqJWK[] }).keys.filter(
        (key) =>
          key.use === "sig" && key.kty === "EC" && key.alg === "ES256" && key.kid && typeof key.x5c[0] === "string",
      );
      PayconiqTest.#JWKS = Object.fromEntries((JWKS ?? []).map((jwk) => [jwk.kid, jwk]));
    }
    return PayconiqTest.#JWKS;
  }
  static async #getJWK(kid: string) {
    let jwk = (await this.setJWKS())[kid];
    if (!jwk) {
      jwk = (await this.setJWKS(null, true))[kid];
    }
    return jwk;
  }
  verifyCallback = async (
    signature: string,
    body: string,
    { maxAgeMs, callbackURL, now }: { maxAgeMs?: number; callbackURL?: string; now?: number } = {},
  ) =>
    verifyCallback(
      (kid: string) => PayconiqTest.#getJWK(kid),
      signature,
      body,
      maxAgeMs ?? 15000,
      callbackURL ?? this.callbackURL,
      this.paymentId,
      now,
    );
  restRequest = async (
    url: string,
    { method = "POST", body = {} }: { method?: "POST" | "DELETE"; body?: any } = {
      method: "POST",
      body: {},
    },
  ) => {
    return restPayconiqRequest(this.#apiKey, url, { method, body });
  };
  static #POSQRCodeURL = "https://api.ext.payconiq.com/v3/payments/pos";
  createPOSQRCodePayment = async (
    posId: string,
    amount: number,
    {
      callbackUrl,
      description,
      reference,
      bulkId,
      shopId,
      shopName,
    }: {
      callbackUrl?: string;
      description?: string;
      reference?: string;
      bulkId?: string;
      shopId?: string;
      shopName?: string;
    } = {},
  ) =>
    createPOSQRCodePayment(this.#apiKey, PayconiqTest.#POSQRCodeURL, posId, amount, {
      callbackUrl,
      description,
      reference,
      bulkId,
      shopId,
      shopName,
    });
  deletePOSQRCodePayment = async (bodyOrCancelLink: PayconiqPOSResponseBody | string) =>
    deletePOSQRCodePayment(this.#apiKey, bodyOrCancelLink);
}

/* TODO: on instance creation, have option to 'enforce' invoice info uniqueness, by giving an array of invoiceInfo objects. When an instance wants to create an invoiceURL with existing invoiceInfo, error is thrown */
