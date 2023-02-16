import assert from "node:assert/strict";
import { createPrivateKey, createPublicKey, verify } from "node:crypto";

export type PayconiqEnvironments = "PROD" | "EXT";
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

export type PayconiqProductType = "predefined" | "invoice" | "receipt"; // | "instore";
/* TODO: Maak een verschillende class per product type
 * zodat hun methodes soort van gelijk benoemd kunnen zijn:
 * - makeQRCode (alle)
 * - verify (alle)
 * - makePayment (predefined, invoice, receipt?)
 * - deletePayment (predefined)
 */
export type PayconiqProductTypeToClass<T extends PayconiqProductType> =
  // T extends "instore"
  // ? typeof PayconiqInstore :
  T extends "predefined"
    ? typeof PayconiqPredefined
    : T extends "invoice"
    ? typeof PayconiqInvoice
    : T extends "receipt"
    ? typeof PayconiqReceipt
    : never;
export type PayconiqProductTypeToInstance<T extends PayconiqProductType> =
  // T extends "instore"
  // ? PayconiqInstore :
  T extends "predefined"
    ? PayconiqPredefined
    : T extends "invoice"
    ? PayconiqInvoice
    : T extends "receipt"
    ? PayconiqReceipt
    : never;
export type PayconiqProductOptions = {
  callbackURL?: string | null;
  defQRCodeOpts?: PayconiqQRCodeOptions;
  environment?: PayconiqEnvironments;
};

export default class PayconiqProduct {
  ppid: string;
  readonly callbackURL: string | null | undefined;
  defQRCodeOpts: PayconiqQRCodeOptions;
  readonly environment: PayconiqEnvironments;
  readonly verifier: PayconiqVerify | PayconiqVerifyEXT;
  #apiKey: string;
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
    this.#apiKey = apiKey;
  }
  verify(
    signature: string,
    body: string,
    { maxAgeMs, now, callbackURL }: { maxAgeMs?: number; now?: number; callbackURL?: string | null } = {},
  ) {
    return this.verifier.verifyCallback(signature, body, { maxAgeMs, now, callbackURL });
  }
}

// export class PayconiqInstore extends PayconiqProduct {
//   #apiKey: string;
//   constructor(ppid: string, apiKey: string, productOptions: PayconiqProductOptions = { environment: "PROD" }) {
//     super(ppid, apiKey, productOptions);
//     this.#apiKey = apiKey;
//   }
//   makeQRcode() {
//     return `HTTPS://PAYCONIQ.COM/MERCHANT/1/${this.ppid}`;
//   }
// }
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
  #apiKey: string;
  constructor(ppid: string, apiKey: string, productOptions: PayconiqProductOptions = { environment: "PROD" }) {
    super(ppid, apiKey, productOptions);
    this.#apiKey = apiKey;
  }
  validatePaymentInfo(invoiceInfo: PayconiqInvoiceInfo) {
    assert(invoiceInfo.amount >= 1 && invoiceInfo.amount <= 999999, "Invalid amount");
    if (invoiceInfo.description) assert(invoiceInfo.description.length <= 35, "Description too long");
    if (invoiceInfo.reference) assert(invoiceInfo.reference.length <= 35, "Reference too long");
  }
  makePayment(invoiceInfo: PayconiqInvoiceInfo) {
    this.validatePaymentInfo(invoiceInfo);
    const payloadURL = new URL(`https://payconiq.com/t/1/${this.ppid}`);
    if (invoiceInfo.amount) payloadURL.searchParams.append("A", String(invoiceInfo.amount));
    if (invoiceInfo.description) payloadURL.searchParams.append("D", invoiceInfo.description);
    if (invoiceInfo.reference) payloadURL.searchParams.append("R", invoiceInfo.reference);
    return payloadURL.toString();
  }
  makeQRcode(invoiceInfo: PayconiqInvoiceInfo | string, qrCodeOpts: PayconiqQRCodeOptions = {}) {
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
  #apiKey: string;
  constructor(ppid: string, apiKey: string, productOptions: PayconiqProductOptions = { environment: "PROD" }) {
    super(ppid, apiKey, productOptions);
    this.#apiKey = apiKey;
  }
  validatePaymentInfo(invoiceInfo: PayconiqInvoiceInfo) {
    assert(invoiceInfo.amount >= 1 && invoiceInfo.amount <= 999999, "Invalid amount");
    if (invoiceInfo.description) assert(invoiceInfo.description.length <= 35, "Description too long");
    if (invoiceInfo.reference) assert(invoiceInfo.reference.length <= 35, "Reference too long");
  }
  makePayment(invoiceInfo: PayconiqInvoiceInfo) {
    this.validatePaymentInfo(invoiceInfo);
    const payloadURL = new URL(`https://payconiq.com/t/1/${this.ppid}`);
    if (invoiceInfo.amount) payloadURL.searchParams.append("A", String(invoiceInfo.amount));
    if (invoiceInfo.description) payloadURL.searchParams.append("D", invoiceInfo.description);
    if (invoiceInfo.reference) payloadURL.searchParams.append("R", invoiceInfo.reference);
    return payloadURL.toString();
  }
  makeQRcode(invoiceInfo: PayconiqInvoiceInfo | string, qrCodeOpts: PayconiqQRCodeOptions = {}) {
    const serviceURL = new URL("https://portal.payconiq.com/qrcode");
    serviceURL.searchParams.append("c", typeof invoiceInfo === "string" ? invoiceInfo : this.makePayment(invoiceInfo));
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
  // instore: PayconiqInstore,
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
  static #lastJWKSUpdate: number;
  static async setJWKS({ JWKS, force = false }: { JWKS?: PayconiqJWKS; force?: boolean } = { force: false }) {
    if (
      JWKS === null &&
      (force || this.#JWKS === undefined || this.#lastJWKSUpdate + PAYCONIQJWKLIFETIMEMS < Date.now())
    ) {
      const jwksResponse = await fetch(this.#JWKPath);
      JWKS = ((await jwksResponse.json()) as { keys: PayconiqJWK[] }).keys.filter(
        (key) =>
          key.use === "sig" && key.kty === "RSA" && key.alg === "RS256" && key.kid && typeof key.x5c[0] === "string",
      );
      this.#lastJWKSUpdate = Date.now();
    }
    this.#JWKS = Object.fromEntries((JWKS ?? []).map((jwk) => [jwk.kid, jwk]));
    return this.#JWKS;
  }
  async setJWKS({ JWKS, force = false }: { JWKS?: PayconiqJWKS; force?: boolean } = { force: false }) {
    return PayconiqVerify.setJWKS({ JWKS, force });
  }
  static async #getJWK(kid: string) {
    let jwk = (await this.setJWKS())[kid];
    if (!jwk) jwk = (await this.setJWKS({ force: true }))[kid];
    return jwk;
  }
  async verifyCallback(
    signature: string,
    body: string,
    {
      pqProductInstance: pqProductInstance,
      maxAgeMs = 5000,
      now,
      callbackURL,
    }: { pqProductInstance?: PayconiqProduct | null; maxAgeMs?: number; now?: number; callbackURL?: string | null } = {
      maxAgeMs: 5000,
    },
  ) {
    const match = signature.match(PAYCONIQSIGNATUREREGEX);
    if (pqProductInstance === undefined) throw new PCBVError("Missing payconiq product instance");
    if (match === null) throw new PCBVError("Incorrect compact detached signature");
    const protectedHeader = match[1] as string;
    const header = JSON.parse(Buffer.from(protectedHeader, "base64").toString());
    if (header.typ.toUpperCase() !== "JOSE+JSON") throw new PCBVError("Unsupported type");
    if (header.alg !== "ES256") throw new PCBVError("Unsupported algorithm");
    if (header["https://payconiq.com/iss"] !== "Payconiq") throw new PCBVError("Invalid issuer");
    if (pqProductInstance && header["https://payconiq.com/sub"] !== pqProductInstance.ppid)
      throw new PCBVError("Invalid subject");
    callbackURL = callbackURL ?? this.callbackURL;
    if (callbackURL === undefined) throw new PCBVError("Missing callbackURL");
    if (callbackURL && header["https://payconiq.com/path"] !== callbackURL) throw new PCBVError("Invalid path");
    now = now ?? Date.now();
    const iat = Date.parse(header["https://payconiq.com/iat"]);
    if (now - iat > maxAgeMs || iat - now > 100) {
      console.warn(`Invalid issued at: ${iat} .:. ${now}`);
      throw new PCBVError("Invalid issued at");
    }
    // TODO jti check
    const jwk = await PayconiqVerify.#getJWK(header.kid);
    if (!jwk) throw new PCBVError("Missing kid");
    const verified = verify(
      "sha256",
      Buffer.from(protectedHeader + "." + Buffer.from(body).toString("base64url")),
      { dsaEncoding: "ieee-p1363", format: "jwk", key: jwk as any },
      Buffer.from(match[2], "base64url"),
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
  static #lastJWKSUpdate: number;
  static async setJWKS({ JWKS, force = false }: { JWKS?: PayconiqJWKS; force?: boolean } = { force: false }) {
    if (
      JWKS === null &&
      (force || this.#JWKS === undefined || this.#lastJWKSUpdate + PAYCONIQJWKLIFETIMEMS < Date.now())
    ) {
      const jwksResponse = await fetch(this.#JWKPath);
      JWKS = ((await jwksResponse.json()) as { keys: PayconiqJWK[] }).keys.filter(
        (key) =>
          key.use === "sig" && key.kty === "RSA" && key.alg === "RS256" && key.kid && typeof key.x5c[0] === "string",
      );
      this.#lastJWKSUpdate = Date.now();
    }
    this.#JWKS = Object.fromEntries((JWKS ?? []).map((jwk) => [jwk.kid, jwk]));
    return this.#JWKS;
  }
  async setJWKS({ JWKS, force = false }: { JWKS?: PayconiqJWKS; force?: boolean } = { force: false }) {
    return PayconiqVerifyEXT.setJWKS({ JWKS, force });
  }
  static async #getJWK(kid: string) {
    let jwk = (await this.setJWKS())[kid];
    if (!jwk) jwk = (await this.setJWKS({ force: true }))[kid];
    return jwk;
  }
  async verifyCallback(
    signature: string,
    body: string,
    {
      pqProductInstance: pqProductInstance,
      maxAgeMs = 5000,
      now,
      callbackURL,
    }: { pqProductInstance?: PayconiqProduct | null; maxAgeMs?: number; now?: number; callbackURL?: string | null } = {
      maxAgeMs: 5000,
    },
  ) {
    const match = signature.match(PAYCONIQSIGNATUREREGEX);
    if (pqProductInstance === undefined) throw new PCBVError("Missing payconiq product instance");
    if (match === null) throw new PCBVError("Incorrect compact detached signature");
    const protectedHeader = match[1] as string;
    const header = JSON.parse(Buffer.from(protectedHeader, "base64").toString());
    if (header.typ.toUpperCase() !== "JOSE+JSON") throw new PCBVError("Unsupported type");
    if (header.alg !== "ES256") throw new PCBVError("Unsupported algorithm");
    if (header["https://payconiq.com/iss"] !== "Payconiq") throw new PCBVError("Invalid issuer");
    if (pqProductInstance && header["https://payconiq.com/sub"] !== pqProductInstance.ppid)
      throw new PCBVError("Invalid subject");
    callbackURL = callbackURL ?? this.callbackURL;
    if (callbackURL === undefined) throw new PCBVError("Missing callbackURL");
    if (callbackURL && header["https://payconiq.com/path"] !== callbackURL) throw new PCBVError("Invalid path");
    now = now ?? Date.now();
    const iat = Date.parse(header["https://payconiq.com/iat"]);
    if (now - iat > maxAgeMs || iat - now > 100) {
      console.warn(`Invalid issued at: ${iat} .:. ${now}`);
      throw new PCBVError("Invalid issued at");
    }
    // TODO jti check
    const jwk = await PayconiqVerifyEXT.#getJWK(header.kid);
    if (!jwk) throw new PCBVError("Missing kid");
    const verified = verify(
      "sha256",
      Buffer.from(protectedHeader + "." + Buffer.from(body).toString("base64url")),
      { dsaEncoding: "ieee-p1363", format: "jwk", key: jwk as any },
      Buffer.from(match[2], "base64url"),
    );
    if (!verified) throw new PCBVError("Failed verfication");
    return true;
  }
}
