import assert from "node:assert/strict";
import { verify } from "node:crypto";

export type PayconiqEnvironment = "PROD" | "EXT";
export type PayconiqQRCodeFormat = "PNG" | "SVG";
export type PayconiqQRCodeSize = "S" | "M" | "L" | "XL";
export type PayconiqQRCodeColor = "magenta" | "black";
export type PayconiqQRCodeOptions = {
  format?: PayconiqQRCodeFormat;
  size?: PayconiqQRCodeSize;
  color?: PayconiqQRCodeColor;
};
export type PayconiqReceiptOrInvoiceInfo = {
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
const payconiqCritHeaders = [
  "https://payconiq.com/sub",
  "https://payconiq.com/iss",
  "https://payconiq.com/iat",
  "https://payconiq.com/jti",
  "https://payconiq.com/path",
] as const;
type PayconiqCritHeader = (typeof payconiqCritHeaders)[number];
export type PayconiqJOSEHeader = {
  typ: string; //"jose+json";
  alg: string;
  kid: string;
  crit: [PayconiqCritHeader, PayconiqCritHeader, PayconiqCritHeader, PayconiqCritHeader, PayconiqCritHeader];
  "https://payconiq.com/sub": string;
  "https://payconiq.com/iss": string; // "Payconiq";
  "https://payconiq.com/iat": string;
  "https://payconiq.com/jti": string;
  "https://payconiq.com/path": string;
};
export type PayconiqStatusCode =
  | "PENDING"
  | "IDENTIFIED"
  | "AUTHORIZED"
  | "AUTHORIZATION_FAILED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";
export type PayconiqDebtor = {
  name?: string;
  iban?: string;
};
export type PayconiqCreditor = {
  profileId: string;
  merchantId: string;
  name: string;
  iban: string;
  callbackUrl?: string;
};
export type PayconiqLinks = {
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
export type PayconiqCallbackBody = {
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
  succeededAt?: string;
  status: PayconiqStatusCode;
  debtor?: PayconiqDebtor;
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
export type PayconiqPOSResponseBody = {
  paymentId: string;
  status: PayconiqStatusCode;
  createdAt: string;
  expiresAt: string;
  description?: string;
  reference?: string;
  amount: number;
  currency?: "EUR";
  creditor: PayconiqCreditor;
  _links: PayconiqLinks;
};
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
  status: PayconiqStatusCode;
  debtor: PayconiqDebtor;
};

export type PayconiqCallbackVerificationErrorCategories = "INCORRECT" | "INVALID" | "FAILED" | "UNSUPPORTED";

export class PayconiqCallbackVerificationError extends Error {
  category: PayconiqCallbackVerificationErrorCategories;
  constructor(message: string, category?: string) {
    super(message);
    this.name = "PayconiqCallbackVerificationError";
    this.category = (category ?? message.split(" ")[0]?.toUpperCase()) as PayconiqCallbackVerificationErrorCategories;
    Object.setPrototypeOf(this, PayconiqCallbackVerificationError.prototype);
  }
}
const PCBVError = PayconiqCallbackVerificationError;

export type PayconiqProductType = "predefined" | "invoice" | "receipt" | "instore";
export type PayconiqProductTypeToClass<T extends PayconiqProductType> = T extends "instore"
  ? typeof PayconiqInstore
  : T extends "predefined"
  ? typeof PayconiqPredefined
  : T extends "invoice"
  ? typeof PayconiqInvoice
  : T extends "receipt"
  ? typeof PayconiqReceipt
  : never;
export type PayconiqProductTypeToInstance<T extends PayconiqProductType> = T extends "instore"
  ? PayconiqInstore
  : T extends "predefined"
  ? PayconiqPredefined
  : T extends "invoice"
  ? PayconiqInvoice
  : T extends "receipt"
  ? PayconiqReceipt
  : never;
export type PayconiqProductOptions = {
  callbackURL?: string | null;
  defQRCodeOpts?: PayconiqQRCodeOptions;
  environment?: PayconiqEnvironment;
};

function isPayconiqJOSEHeader(header: unknown): header is PayconiqJOSEHeader {
  if (typeof header !== "object" || header === null) return false;
  if (
    !("typ" in header) ||
    !("alg" in header) ||
    !("kid" in header) ||
    !("crit" in header) ||
    !("https://payconiq.com/sub" in header) ||
    !("https://payconiq.com/iss" in header) ||
    !("https://payconiq.com/iat" in header) ||
    !("https://payconiq.com/jti" in header) ||
    !("https://payconiq.com/path" in header)
  )
    return false;
  const {
    typ,
    alg,
    kid,
    crit,
    "https://payconiq.com/sub": sub,
    "https://payconiq.com/iss": iss,
    "https://payconiq.com/iat": iat,
    "https://payconiq.com/jti": jti,
    "https://payconiq.com/path": path,
  } = header;
  return (
    typeof typ === "string" &&
    // typ === "jose+json" &&
    typeof alg === "string" &&
    typeof kid === "string" &&
    Array.isArray(crit) &&
    crit.every((c) => typeof c === "string" && payconiqCritHeaders.includes(c)) &&
    typeof sub === "string" &&
    typeof iss === "string" &&
    // iss === "Payconiq" &&
    typeof iat === "string" &&
    typeof jti === "string" &&
    typeof path === "string"
  );
}

export default class PayconiqProduct {
  ppid: string;
  readonly callbackURL: string | null | undefined;
  defQRCodeOpts: PayconiqQRCodeOptions;
  readonly environment: PayconiqEnvironment;
  readonly verifier: PayconiqVerify | PayconiqVerifyEXT;
  // #apiKey: string;
  constructor(
    ppid: string,
    apiKey: string,
    { callbackURL, defQRCodeOpts, environment = "PROD" }: PayconiqProductOptions = { environment: "PROD" },
  ) {
    assert(typeof ppid === "string" && ppid.length === 24, "Invalid Payment id");
    this.ppid = ppid;
    this.callbackURL = callbackURL;
    this.defQRCodeOpts = defQRCodeOpts ?? {};
    this.environment = environment;
    this.verifier =
      this.environment === "PROD"
        ? new PayconiqVerify({ product: this, callbackURL })
        : new PayconiqVerifyEXT({ product: this, callbackURL });
    assert(typeof apiKey === "string" && apiKey.length === 36, "Invalid API key");
    // this.#apiKey = apiKey;
  }
  async fetchJWKS({ JWKS, force = false }: { JWKS?: PayconiqJWKS; force?: boolean } = { force: false }) {
    return (this.environment === "PROD" ? PayconiqVerify : PayconiqVerifyEXT).fetchJWKS({ JWKS, force });
  }
  verify(
    signature: string,
    body: string,
    { maxAgeMs, now, callbackURL }: { maxAgeMs?: number; now?: number; callbackURL?: string | null } = {},
  ) {
    return this.verifier.verifyCallback(signature, body, { maxAgeMs, now, callbackURL });
  }
}

export class PayconiqInstore extends PayconiqProduct {
  // #apiKey: string;
  constructor(ppid: string, apiKey: string, productOptions: PayconiqProductOptions = { environment: "PROD" }) {
    super(ppid, apiKey, productOptions);
    // this.#apiKey = apiKey;
  }
  makePayment() {
    return `https://payconiq.com/merchant/1/${this.ppid}`;
  }
}
export class PayconiqPredefined extends PayconiqProduct {
  #apiKey: string;
  constructor(ppid: string, apiKey: string, productOptions: PayconiqProductOptions = { environment: "PROD" }) {
    super(ppid, apiKey, productOptions);
    this.#apiKey = apiKey;
  }
  makePOSURL(posId: string) {
    assert(/^([a-z0-9]{1,36}|[A-Z0-9]{1,36})$/.test(posId), "Invalid posId");
    const payloadURL = new URL(`https://payconiq.com/l/1/${this.ppid}/${posId}`);
    return payloadURL.toString();
  }
  makeQRcode(posId: string, qrCodeOpts: PayconiqQRCodeOptions = {}) {
    const serviceURL = new URL("https://portal.payconiq.com/qrcode");
    serviceURL.searchParams.append("c", this.makePOSURL(posId));
    qrCodeOpts = Object.assign({}, this.defQRCodeOpts, qrCodeOpts);
    if (qrCodeOpts.format) serviceURL.searchParams.append("f", qrCodeOpts.format);
    if (qrCodeOpts.size) serviceURL.searchParams.append("s", qrCodeOpts.size);
    if (qrCodeOpts.color) serviceURL.searchParams.append("cl", qrCodeOpts.color);
    return serviceURL.toString();
  }
  validatePaymentInfo(POSReqBody: PayconiqPOSRequestBody) {
    assert(/^([a-z0-9]{1,36}|[A-Z0-9]{1,36})$/.test(POSReqBody.posId), "Invalid posId");
    assert(POSReqBody.amount >= 1 && POSReqBody.amount <= 999999, "Invalid amount");
    if (POSReqBody.currency) assert(POSReqBody.currency === "EUR", "Invalid currency");
    if (POSReqBody.description) assert(POSReqBody.description.length <= 140, "Description too long");
    if (POSReqBody.reference) assert(POSReqBody.reference.length <= 35, "Reference too long");
    if (POSReqBody.bulkId) assert(POSReqBody.bulkId.length <= 35, "BulkId too long");
    if (POSReqBody.shopId) assert(POSReqBody.shopId.length <= 36, "ShopId too long");
    if (POSReqBody.shopName) assert(POSReqBody.shopName.length <= 36, "ShopName too long");
  }
  async makePayment(
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
    this.validatePaymentInfo({
      posId,
      amount,
      callbackUrl,
      currency,
      description,
      reference,
      bulkId,
      shopId,
      shopName,
    });
    const body: PayconiqPOSRequestBody = { amount, posId, currency: "EUR" };
    if (callbackUrl) body.callbackUrl = callbackUrl;
    if (currency) body.currency = currency;
    if (description) body.description = description.substring(0, 140);
    if (reference) body.reference = reference.substring(0, 35);
    if (bulkId) body.bulkId = bulkId.substring(0, 35);
    if (shopId) body.shopId = shopId.substring(0, 36);
    if (shopName) body.shopName = shopName.substring(0, 36);
    const paymentResponse = await fetch(
      this.environment === "PROD"
        ? "https://api.payconiq.com/v3/payments/pos"
        : "https://api.ext.payconiq.com/v3/payments/pos",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.#apiKey}`,
        },
        body: JSON.stringify(body),
      },
    );
    if (paymentResponse.status === 201) {
      // success
      const json = (await paymentResponse.json()) as PayconiqPOSResponseBody;
      return json;
    } else {
      const json = (await paymentResponse.json()) as PayconiqResponseError;
      throw new Error(`Error creating payment: ${json.message} (${json.traceId})`);
    }
  }
  async cancelPayment(bodyOrCancelLink: PayconiqPOSResponseBody | string) {
    if (typeof bodyOrCancelLink !== "string") bodyOrCancelLink = bodyOrCancelLink._links?.cancel?.href ?? "";
    if (bodyOrCancelLink) {
      const res = await fetch(bodyOrCancelLink, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.#apiKey}`,
        },
      });
      if (res.status === 204) return true;
      else {
        const json = (await res.json()) as PayconiqResponseError;
        throw new Error(`Error ${res.status} deleting payment: ${json.message} (${json.traceId})`);
      }
    } else throw new Error(`No cancel link found`);
  }
}
export class PayconiqInvoice extends PayconiqProduct {
  // #apiKey: string;
  constructor(ppid: string, apiKey: string, productOptions: PayconiqProductOptions = { environment: "PROD" }) {
    super(ppid, apiKey, productOptions);
    // this.#apiKey = apiKey;
  }
  assertInvoiceInfo(invoiceInfo: PayconiqReceiptOrInvoiceInfo) {
    assert(Number(invoiceInfo.amount) >= 1 && Number(invoiceInfo.amount) <= 999999, "Invalid amount");
    if (invoiceInfo.description) assert(invoiceInfo.description.length <= 35, "Description too long");
    if (invoiceInfo.reference) assert(invoiceInfo.reference.length <= 35, "Reference too long");
  }
  makePayment(invoiceInfo: PayconiqReceiptOrInvoiceInfo) {
    this.assertInvoiceInfo(invoiceInfo);
    const payloadURL = new URL(`https://payconiq.com/t/1/${this.ppid}`);
    if (invoiceInfo.amount) payloadURL.searchParams.append("A", String(invoiceInfo.amount));
    if (invoiceInfo.description) payloadURL.searchParams.append("D", invoiceInfo.description);
    if (invoiceInfo.reference) payloadURL.searchParams.append("R", invoiceInfo.reference);
    return payloadURL.toString();
  }
  makeQRcode(invoiceInfo: PayconiqReceiptOrInvoiceInfo | string, qrCodeOpts: PayconiqQRCodeOptions = {}) {
    const serviceURL = new URL("https://portal.payconiq.com/qrcode");
    serviceURL.searchParams.append("c", typeof invoiceInfo === "string" ? invoiceInfo : this.makePayment(invoiceInfo));
    qrCodeOpts = Object.assign({}, this.defQRCodeOpts, qrCodeOpts);
    if (qrCodeOpts.format) serviceURL.searchParams.append("f", qrCodeOpts.format);
    if (qrCodeOpts.size) serviceURL.searchParams.append("s", qrCodeOpts.size);
    if (qrCodeOpts.color) serviceURL.searchParams.append("cl", qrCodeOpts.color);
    return serviceURL.toString();
  }
}
export class PayconiqReceipt extends PayconiqProduct {
  // #apiKey: string;
  constructor(ppid: string, apiKey: string, productOptions: PayconiqProductOptions = { environment: "PROD" }) {
    super(ppid, apiKey, productOptions);
    // this.#apiKey = apiKey;
  }
  assertReceiptInfo(receiptInfo: PayconiqReceiptOrInvoiceInfo) {
    assert(Number(receiptInfo.amount) >= 1 && Number(receiptInfo.amount) <= 999999, "Invalid amount");
    if (receiptInfo.description) assert(receiptInfo.description.length <= 35, "Description too long");
    if (receiptInfo.reference) assert(receiptInfo.reference.length <= 35, "Reference too long");
  }
  makePayment(receiptInfo: PayconiqReceiptOrInvoiceInfo) {
    this.assertReceiptInfo(receiptInfo);
    const payloadURL = new URL(`https://payconiq.com/t/1/${this.ppid}`);
    if (receiptInfo.amount) payloadURL.searchParams.append("A", String(receiptInfo.amount));
    if (receiptInfo.description) payloadURL.searchParams.append("D", receiptInfo.description);
    if (receiptInfo.reference) payloadURL.searchParams.append("R", receiptInfo.reference);
    return payloadURL.toString();
  }
  makeQRcode(receiptInfo: PayconiqReceiptOrInvoiceInfo | string, qrCodeOpts: PayconiqQRCodeOptions = {}) {
    const serviceURL = new URL("https://portal.payconiq.com/qrcode");
    serviceURL.searchParams.append("c", typeof receiptInfo === "string" ? receiptInfo : this.makePayment(receiptInfo));
    qrCodeOpts = Object.assign({}, this.defQRCodeOpts, qrCodeOpts);
    if (qrCodeOpts.format) serviceURL.searchParams.append("f", qrCodeOpts.format);
    if (qrCodeOpts.size) serviceURL.searchParams.append("s", qrCodeOpts.size);
    if (qrCodeOpts.color) serviceURL.searchParams.append("cl", qrCodeOpts.color);
    return serviceURL.toString();
  }
}

export const PayconiqProducts: { [T in PayconiqProductType]: PayconiqProductTypeToClass<T> } = {
  predefined: PayconiqPredefined,
  invoice: PayconiqInvoice,
  receipt: PayconiqReceipt,
  instore: PayconiqInstore,
};

/* TODO: on instance creation, have option to 'enforce' invoice info uniqueness, by giving an array of invoiceInfo objects. When an instance wants to create an invoiceURL with existing invoiceInfo, error is thrown */

const PAYCONIQSIGNATUREREGEX = /^([a-zA-Z0-9+_\-]+)\.\.([a-zA-Z0-9+_\-]+)$/;
const PAYCONIQJWKLIFETIMEMS = 12 * 3600 * 1000;
export class PayconiqVerify {
  callbackURL: string | null | undefined;
  product: PayconiqProduct | null | undefined;
  constructor({ callbackURL, product }: { callbackURL?: string | null; product?: PayconiqProduct | null } = {}) {
    this.callbackURL = callbackURL;
    this.product = product;
  }
  static #JWKPath = "https://payconiq.com/certificates";
  static #JWKS: PayconiqJWKSbyKid;
  static #lastJWKSFetch: number = 0;
  static async fetchJWKS(
    { JWKS, force = false, lastUpdate: lastFetch }: { JWKS?: PayconiqJWKS; force?: boolean; lastUpdate?: number } = {
      force: false,
    },
  ) {
    if (
      JWKS === undefined &&
      (force || this.#JWKS === undefined || this.#lastJWKSFetch + PAYCONIQJWKLIFETIMEMS < Date.now())
    ) {
      this.#lastJWKSFetch = lastFetch ?? Date.now();
      const jwksResponse = await fetch(this.#JWKPath);
      JWKS = ((await jwksResponse.json()) as { keys: PayconiqJWK[] }).keys.filter(
        (key) =>
          key.use === "sig" &&
          ((key.kty === "RSA" && key.alg === "RS256") || (key.kty === "EC" && key.alg === "ES256")) &&
          key.kid &&
          typeof key.x5c[0] === "string",
      );
    }
    this.#JWKS = Object.fromEntries((JWKS ?? []).map((jwk) => [jwk.kid, jwk]));
    return this.#JWKS;
  }
  static async #getJWK(kid: string) {
    let jwk = (await this.fetchJWKS())[kid];
    if (!jwk) jwk = (await this.fetchJWKS({ force: true }))[kid];
    return jwk;
  }
  async verifyCallback(
    signature: string,
    body: string,
    { maxAgeMs = 5000, now, callbackURL }: { maxAgeMs?: number; now?: number; callbackURL?: string | null } = {
      maxAgeMs: 5000,
    },
  ) {
    const match = signature.match(PAYCONIQSIGNATUREREGEX);
    if (this.product === undefined) throw new PCBVError("Missing payconiq product instance");
    if (match === null) throw new PCBVError("Incorrect compact detached signature");
    const protectedHeader = match[1] as string;
    const header = JSON.parse(Buffer.from(protectedHeader, "base64").toString());
    if (!isPayconiqJOSEHeader(header)) throw new PCBVError("Invalid header");
    if (header.typ.toUpperCase() !== "JOSE+JSON") throw new PCBVError("Unsupported type");
    if (header.alg.toUpperCase() !== "ES256") throw new PCBVError("Unsupported algorithm");
    if (header["https://payconiq.com/iss"] !== "Payconiq") throw new PCBVError("Invalid issuer");
    if (this.product && header["https://payconiq.com/sub"] !== this.product.ppid)
      throw new PCBVError("Invalid subject");
    callbackURL = callbackURL ?? this.callbackURL;
    if (callbackURL === undefined) throw new PCBVError("Missing callbackURL");
    if (callbackURL && header["https://payconiq.com/path"] !== callbackURL) throw new PCBVError("Invalid path");
    now = now ?? Date.now();
    const iat = Date.parse(header["https://payconiq.com/iat"]);
    if (now - iat > maxAgeMs || iat - now > 100) {
      throw new PCBVError("Invalid issued at");
    }
    const jwk = await PayconiqVerify.#getJWK(header.kid);
    if (!jwk) throw new PCBVError("Missing kid");
    const verified = verify(
      "sha256",
      Buffer.from(protectedHeader + "." + Buffer.from(body).toString("base64url")),
      { dsaEncoding: "ieee-p1363", format: "jwk", key: jwk },
      Buffer.from(match[2]!, "base64url"),
    );
    if (!verified) throw new PCBVError("Failed verfication");
    return true;
  }
}
export class PayconiqVerifyEXT {
  callbackURL: string | null | undefined;
  product: PayconiqProduct | null | undefined;
  constructor({ callbackURL, product }: { callbackURL?: string | null; product?: PayconiqProduct | null } = {}) {
    this.callbackURL = callbackURL;
    this.product = product;
  }
  static #JWKPath = "https://ext.payconiq.com/certificates";
  static #JWKS: PayconiqJWKSbyKid;
  static #lastJWKSFetch: number = 0;
  static async fetchJWKS(
    { JWKS, force = false, lastFetch }: { JWKS?: PayconiqJWKS; force?: boolean; lastFetch?: number } = { force: false },
  ) {
    if (
      JWKS === undefined &&
      (force || this.#JWKS === undefined || this.#lastJWKSFetch + PAYCONIQJWKLIFETIMEMS < Date.now())
    ) {
      this.#lastJWKSFetch = lastFetch ?? Date.now();
      const jwksResponse = await fetch(this.#JWKPath);
      JWKS = ((await jwksResponse.json()) as { keys: PayconiqJWK[] }).keys.filter(
        (key) =>
          key.use === "sig" &&
          ((key.kty === "RSA" && key.alg === "RS256") || (key.kty === "EC" && key.alg === "ES256")) &&
          key.kid &&
          typeof key.x5c[0] === "string",
      );
    }
    this.#JWKS = Object.fromEntries((JWKS ?? []).map((jwk) => [jwk.kid, jwk]));
    return this.#JWKS;
  }
  static async #getJWK(kid: string) {
    let jwk = (await this.fetchJWKS())[kid];
    if (!jwk) jwk = (await this.fetchJWKS({ force: true }))[kid];
    return jwk;
  }
  async verifyCallback(
    signature: string,
    body: string,
    { maxAgeMs = 5000, now, callbackURL }: { maxAgeMs?: number; now?: number; callbackURL?: string | null } = {
      maxAgeMs: 5000,
    },
  ) {
    const match = signature.match(PAYCONIQSIGNATUREREGEX);
    if (this.product === undefined) throw new PCBVError("Missing payconiq product instance");
    if (match === null) throw new PCBVError("Incorrect compact detached signature");
    const protectedHeader = match[1] as string;
    const header = JSON.parse(Buffer.from(protectedHeader, "base64").toString());
    if (!isPayconiqJOSEHeader(header)) throw new PCBVError("Invalid header");
    if (header.typ.toUpperCase() !== "JOSE+JSON") throw new PCBVError("Unsupported type");
    if (header.alg.toUpperCase() !== "ES256") throw new PCBVError("Unsupported algorithm");
    if (header["https://payconiq.com/iss"] !== "Payconiq") throw new PCBVError("Invalid issuer");
    if (this.product && header["https://payconiq.com/sub"] !== this.product.ppid)
      throw new PCBVError("Invalid subject");
    callbackURL = callbackURL ?? this.callbackURL;
    if (callbackURL === undefined) throw new PCBVError("Missing callbackURL");
    if (callbackURL && header["https://payconiq.com/path"] !== callbackURL) throw new PCBVError("Invalid path");
    now = now ?? Date.now();
    const iat = Date.parse(header["https://payconiq.com/iat"]);
    if (now - iat > maxAgeMs || iat - now > 100) {
      throw new PCBVError("Invalid issued at");
    }
    // no way to do a jti check
    const jwk = await PayconiqVerifyEXT.#getJWK(header.kid);
    if (!jwk) throw new PCBVError("Missing kid");
    const verified = verify(
      "sha256",
      Buffer.from(protectedHeader + "." + Buffer.from(body).toString("base64url")),
      { dsaEncoding: "ieee-p1363", format: "jwk", key: jwk },
      Buffer.from(match[2]!, "base64url"),
    );
    if (!verified) throw new PCBVError("Failed verfication");
    return true;
  }
}
