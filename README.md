# Payconiq

## **Node.js implementation for interacting with the Payconiq V3 API**

> _Disclaimer: this is not an official package from Payconiq International or any affiliated owners of a Payconiq brand. This is my own implementation following the [API Docs](https://developer.payconiq.com). In no way do I make any guarantees that this code is valid, safe, or well-written. That being said, I wrote this code for my own use, and if you want to use it in your project(s), you're free to do so._

Payconiq is a Belgian digital payment provider with different products. This package aims to have a simple way of using the [Payconiq API V3](https://developer.payconiq.com/online-payments-dock/#payment-api-version-3-v3-).

### Requirements

`Node.js 17.5+` because this package aims to have 0 dependencies, thus native fetch is needed.

`TypeScript 4.7+` for ESM support, of course use of TypeScript is optional.

### Installation

Install using npm:

```
npm install payconiq
```

## Usage

```typescript
import { PayconiqInvoice } from "payconiq"

// Every product has it's own class
const payconiqInvoicing = PayconiqInvoice("lessSecretPaymentId", "verySecretAPIKey");

// deeplink
const invoiceURL = payconiqInvoicing.makePayment({
  amount: 1234,
  description: "products from us",
  reference: "myOwnReference"
});
// qr-code
const invoiceQRURL1 = payconiqInvoicing.makeQRcode({amount: 1234, …})
const invoiceQRURL2 = payconiqInvoicing.makeQRcode(invoiceURL, {format: "SVG"})

// verify callback
const isLegit = payconiqInvoicing.verify(signatureFromRequest, bodyFromRequest, {callbackURL: 'https://…'})
```

# Reference

## Quick Overview

For every (implemented: predefined, invoice, receipt) payconiq product there is a class exported: `PayconiqPredefined`, `PayconiqInvoice`, and `PayconiqReceipt`. Since they all need an API key in their constructor **_it should only be used in the backend_**.

The constructor parameters are:

- `ppid` _(string)_ .:. paymentId given by Payconiq
- `apiKey` _(string)_ .:. API key given by Payconiq
- `productOptions` .:. an object with some optional keys:
  - `callbackURL` _(string | null)_ .:. your callbackUrl used to check the critical header `path` of requests, use null to explicitly skip checking this critical header
  - `defQRCodeOpts` _(object)_ .:. if you want to set defaults for generated QR-codes
  - `environment` _(`"EXT" | "PROD"`)_ .:. for use of the external of production environment

Every product has the same basic methods, however, their exact use may differ, mostly in being synchronous or asynchronous and its arguments.

**`makePayment(…)`** .:. depends heavily on the product where it may have to communicate with payconiq servers or only generate a URL-string

**`makeQRcode(…[, QRCodeOpts])`** .:. will return a URL-string of the QR-code. The given QRCodeOpts will overwrite the ones in the constructor, and use the constructor ones when omitted.

> Everywhere a Payconiq QR-code is generated, an object to customize it can be passed. This object can contain any of the following entries, all of them being optional but overwriting the defaults set in the constructor (Payconiq should default the the first one for every option: a small magenta png):
>
> - format: `"PNG"`, or `"SVG"`
> - size: `"S"`, `"M"`, `"L"`, `"XL"`
> - color: `"magenta"` or `"black"`

**`verify(signature, body[, verifyOpts])`** .:. returns a boolean and is used to verify an incoming request from payconiq servers to your callbackURL. Eventhough this method is shared among all products, the verification checks for ppid and thus should be used on the corresponding instance. The `verifyOpts` parameter is an object with following optional keys:

- `callbackURL` _(string | null)_ .:. your callbackUrl used to check the critical header `path` of requests, use null to explicitly skip checking this critical header. If not given, the one given to the constructor is used. However, skipping the use in both constructor and method will result in an error unless one of the two is explicitly set to null to skip the check altogether.
- `now` _(number)_ .:. the timestamp to be used to compare against in milliseconds since epoch
- `maxAgeMs` _(number)_ .:. the maximum allowable time difference with the critical header `iat`

**`fetchJWKS({force, JWKS, lastFetch})`** .:. (re)fetches the JWKS from Payconiq servers. The JWKS is lazily fetched and cached. So the first `verify` call will check if there is a JWKS in the cache. If not or if they are too old or if `force` is set to `true`, they will be fetched and cached for later used. This can lengthen a first `verify` call. To expediate the call, you can fetch them beforehand using this method. The JWKS cache is shared among all products, only differentiating between environments. If you fetched the JWKS seperately, you can pass it in as `JWKS` and set its fetch time with `lastFetch`.

## Product classes

Currently three products are partly implemented. Since Payconiq can't make up their own minds on how to call them, I chose to use `PayconiqPredefined`, `PayconiqInvoice`, and `PayconiqReceipt`.

Payment amounts are always given in (euro)cents.

Payconiq only allows `"EUR"` as currency but methods still include it for completeness.

### PayconiqPredefined

Also referred to as Static QR Sticker or Pre-defined sticker.

#### General info

This product is based around a Point-Of-Sale id (posId), which identifies a cash register or similar, and can handle 1 payment at a time, but many consecutive ones. When the payment is made, it is only valid for 2 minutes.

#### Methods

A `posId` consists of 1 to 36 characters, where the characters can be number or letters. Letters can be uppercase (x)or lowercase but _cannot_ be a mix of lowercase and uppercase.

**`makePOSURL(posId)`** .:. Returns a url-string of the given `posId`.

**`makeQRcode(posId, qrCodeOpts)`** .:. Returns the url-string of the QR-code for the given `posId`.

**`makePayment(posId, amount, extra)`** .:. Given a posId, an amount and other optional info, it will asynchronously create a payment for that posId returning the [response body](https://developer.payconiq.com/online-payments-dock/#create-payment60) in object form. `extra` is an object with optional properties (`callbackUrl`, `currency`, `description`, `reference`, `bulkId`, `shopId`, `shopName`) as described in [the payconiq docs](https://developer.payconiq.com/online-payments-dock/#create-payment60).

**`cancelPayment(bodyOrCancelLink)`** _experimental_.:. Given the response from `makePayment` or the cancel link itself, it will cancel the payment and return true, or error when unsuccessful. This method is untested and behaviour will change.

### PayconiqReceipt

#### General info

A receipt is uniquely defined by three things: the `amount`, the `description` and the `reference`. Making a second distinct receipt with those three things the same will refer to the same receipt for Payconiq. The `amount` cannot exceed 999999 (euro)cents. The `description` and `reference` are (optional) strings with a length of maximum 35 characters. The `description` will be displayed to the customer, the `reference` can be used for your own internal reference. Eventhough the `reference` won't be made visible in the user's UI, it cannot contain sensitive data since it will be included in the URL. An object containing `amount` and the optional `description` and `reference` is refered to as `receiptInfo`.

Eventhough no methods using the API key are implemented, it is still needed in the constructor. This for future use and to make sure your product is really activated (no API key, no product).

#### Methods

**`assertReceiptInfo(receiptInfo)`** .:. Throws assertion errors when the `receiptInfo` seems to be invalid.

**`makePayment(receiptInfo)`** .:. Synchronously returns a url-string for the given `receiptInfo` that can be used as a deeplink.

**`makeQRcode(receiptInfo, qrCodeOpts)`** .:. Synchronously returns the url-string of the QR-code for the given `receiptInfo`

### PayconiqInvoice

#### General info

An invoice is uniquely defined by three things: the `amount`, the `description` and the `reference`. Making a second distinct invoice with those three things the same will refer to the same invoice for Payconiq. The `amount` cannot exceed 999999 (euro)cents. The `description` and `reference` are (optional) strings with a length of maximum 35 characters. The `description` will be displayed to the customer, the `reference` can be used for your own internal reference. Eventhough the `reference` won't be made visible in the user's UI, it cannot contain sensitive data since it will be included in the URL. An object containing `amount` and the optional `description` and `reference` is refered to as `invoiceInfo`.

Eventhough no methods using the API key are implemented, it is still needed in the constructor. This for future use and to make sure your product is really activated (no API key, no product).

#### Methods

**`assertInvoiceInfo(invoiceInfo)`** .:. Throws assertion errors when the `invoiceInfo` seems to be invalid.

**`makePayment(invoiceInfo)`** .:. Synchronously returns a url-string for the given `invoiceInfo` that can be used as a deeplink.

**`makeQRcode(invoiceInfo, qrCodeOpts)`** .:. Synchronously returns the url-string of the QR-code for the given `invoiceInfo`
