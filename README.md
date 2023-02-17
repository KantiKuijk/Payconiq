# Payconiq

## **Node.js implementation for interacting with the Payconiq V3 API**

> _Disclaimer: this is not an official package from Payconiq International or any affiliated owners of a Payconiq brand. This is my own implementation following the [API Docs](https://developer.payconiq.com). In no way do I make any guarantees that this code is valid, safe, or well-written. That being said, I wrote this code for my own use, and if you want to use it in your project(s), you're free to do so._

Payconiq is a Belgian digital payment provider with different products. This package aims to have a simpler way of using the [Payconiq API V3](https://developer.payconiq.com/online-payments-dock/#payment-api-version-3-v3-).

### Preamble

This package is in no way feature-complete. I needed to use the Payconiq API for a project and decided to make a module out of it for my own enjoyment. Thus the roadmap and (planned) features are mostly decided by my needs. That being said, I do try to make the use and implementation general enough such that it can be used in any project. I also more than welcome feature requests or pull requests.

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
// Every payconiq product has it's own class
// Here, the invoice product is used
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

For every (implemented: predefined, invoice, receipt) URL-string product there is a class exported: `PayconiqPredefined`, `PayconiqInvoice`, and `PayconiqReceipt`. Since they all need an API key in their constructor **_it should only be used in the backend_**.

The constructor parameters are the same for all product classes:

- `ppid` _(string)_ .:. paymentId given by Payconiq.
- `apiKey` _(string)_ .:. API key given by Payconiq.
- `productOptions` .:. an object with some optional keys:
  - `callbackURL` _(string | null)_ .:. your callbackURL used to check the critical header `path` of requests. Use `null` to explicitly skip checking this critical header.
  - `defQRCodeOpts` _(object)_ .:. if you want to set defaults for generated QR-codes.
  - `environment` _(`"PROD"` or `"EXT"`)_ .:. for use of the external of production environment, default is `"PROD"`.

Every product has the same basic methods, however, their exact use may differ, mostly in being synchronous or asynchronous and its arguments.

**`makePayment(…)`** .:. depends on the product where it may have to register the payment against URL-string servers or only generate a URL-string identifying a payment

**`makeQRcode(…[, QRCodeOpts])`** .:. will return a URL-string of the QR-code. The given `QRCodeOpts` will overwrite the ones in the constructor, and use the constructor ones when omitted.

> Everywhere a Payconiq QR-code is generated, an object to customize it can be passed in. This object can contain any of the following entries, all of them being optional but overwriting the defaults set in the constructor for that function call. Payconiq should default to the the first value for every option: a small magenta png.
>
> - `format` .:. _`"PNG"`, or `"SVG"`_
> - `size` .:. _`"S"`, `"M"`, `"L"`, `"XL"`_
> - `color` .:. _`"magenta"` or `"black"`_

**`verify(signature, body[, verifyOpts])`** .:. returns a boolean and is used to verify an incoming request from Payconiq servers to your callbackURL. Eventhough this method is shared among all product classs, the verification checks for `ppid` and thus should be used on the corresponding instance. The `verifyOpts` parameter is an object with following optional keys:

- `callbackURL` _(string | null)_ .:. your callbackURL used to check the critical header `path` of requests. Use `null` to explicitly skip checking this critical header. If not given, the one given to the constructor is used. However, skipping the use in both constructor and method will result in a runtime error unless one of the two is explicitly set to `null` to skip the check altogether.
- `now` _(number)_ .:. the timestamp to be used to compare against for the critical header `iat`, in milliseconds since epoch
- `maxAgeMs` _(number)_ .:. the maximum allowable time difference with the critical header `iat` when `iat` is earlier than `now`. A hard limit of 100ms is set when `now` is earlier than `iat`.

**`fetchJWKS({force, JWKS, lastFetch})`** .:. (re)fetches the JWKS from Payconiq servers. Force (re)fetching by setting `force` to `true`. If you fetched the JWKS seperately, you can pass it in as `JWKS` and set its fetch time with `lastFetch`.

The JWKS is lazily fetched and cached. So the first `verify` call will check if there is a JWKS in the cache. If not or if they are too old or if `force` is set to `true`, they will be fetched and cached for later used. This can lengthen a (first) `verify` call. To expedite a `verify` call and alleviate it from having to (re)fetch JWKS, you can fetch them beforehand using the `fetchJWKS` method. The JWKS cache is shared among all products of the same environment, thus manually setting JWKS will also overwrite it for all other products using the same environment (although I am not completely sure when you would want different JWKS for products in the same environment).

## Product classes

Currently three products are partly implemented. Since Payconiq can't always make up their minds on how to call them, I chose to use `PayconiqPredefined`, `PayconiqInvoice`, and `PayconiqReceipt`.

Payment amounts are always given in (euro)cents _(integer)_.

Payconiq only allows `"EUR"` as currency but relevant methods still include it for completeness.

### PayconiqPredefined

Also referred to as Static QR Sticker or Pre-defined sticker.

#### General info

This product is based on a Point-Of-Sale id (posId), which identifies a cash register or similar, and can handle 1 payment at a time, but many consecutive ones. When the payment is made, it is only valid for 2 minutes.

#### Methods

A `posId` consists of 1 to 36 characters, where the characters can be numbers or letters. Letters can be uppercase (x)or lowercase but _cannot_ be a mix of lowercase and uppercase (ask me how I know).

**`makePOSURL(posId)`** .:. Returns a URL-string of the given `posId`.

**`makeQRcode(posId, qrCodeOpts)`** .:. Returns the URL-string of the QR-code for the given `posId`.

**`makePayment(posId, amount, extra)`** .:. Given a posId, an amount and other extra info, it will asynchronously create a payment for that posId, returning the [response body](https://developer.payconiq.com/online-payments-dock/#create-payment60) in object form. `extra` is an object with optional properties (`callbackUrl`, `currency`, `description`, `reference`, `bulkId`, `shopId`, `shopName`) as described in [the payconiq docs](https://developer.payconiq.com/online-payments-dock/#create-payment60).

**`cancelPayment(bodyOrCancelLink)`** _experimental_.:. Given the response from `makePayment` or the cancel link itself, it will cancel the payment and return true, or error when unsuccessful. This method is untested and behaviour will change.

### PayconiqReceipt

#### General info

A receipt is uniquely defined by three things: the `amount`, the `description` and the `reference`. Trying to make a second distinct receipt with those three things the same, will refer to the same receipt for Payconiq. The `amount` cannot exceed 999999 (euro)cents. The `description` and `reference` are (optional) strings with a length of maximum 35 characters. The `description` will be displayed to the customer, the `reference` can be used for your own internal reference. Eventhough the `reference` won't be made visible in the user's UI, it cannot contain sensitive data since it will be included in the URL. An object containing `amount` and the optional `description` and `reference` is herein refered to as `receiptInfo`.

Eventhough no methods using the API key are implemented, it is still needed in the constructor. This is for future use and to make sure your product is really activated (no API key, no product).

#### Methods

**`assertReceiptInfo(receiptInfo)`** .:. Throws assertion errors when the `receiptInfo` seems to be invalid.

**`makePayment(receiptInfo)`** .:. Synchronously returns a URL-string for the given `receiptInfo` that can be used as a deeplink.

**`makeQRcode(receiptInfoOrPaymentURL, qrCodeOpts)`** .:. Synchronously returns the URL-string of the QR-code for the given `receiptInfo` or from a URL-string (deeplink) like the one returned from `makePayment`.

### PayconiqInvoice

#### General info

An invoice is uniquely defined by three things: the `amount`, the `description` and the `reference`. Trying to make a second distinct invoice with those three things the same will refer to the same invoice for Payconiq. The `amount` cannot exceed 999999 (euro)cents. The `description` and `reference` are (optional) strings with a length of maximum 35 characters. The `description` will be displayed to the customer, the `reference` can be used for your own internal reference. Eventhough the `reference` won't be made visible in the user's UI, it cannot contain sensitive data since it will be included in the URL. An object containing `amount` and the optional `description` and `reference` is herein refered to as `invoiceInfo`.

Eventhough no methods using the API key are implemented, it is still needed in the constructor. This is for future use and to make sure your product is really activated (no API key, no product). I guess if you really only need `makePayment` and `makeQRcode` methods in a front-end, you could supply it with a bogus API key.

#### Methods

**`assertInvoiceInfo(invoiceInfo)`** .:. Throws assertion errors when the `invoiceInfo` seems to be invalid.

**`makePayment(invoiceInfo)`** .:. Synchronously returns a URL-string for the given `invoiceInfo` that can be used as a deeplink.

**`makeQRcode(invoiceInfoOrPaymentURL, qrCodeOpts)`** .:. Synchronously returns the URL-string of the QR-code for the given `invoiceInfo` or from a URL-string (deeplink) like the one returned from `makePayment`.

## Missing Features

This module does not include any features for partner integration or the following products: Terminal & Display, Custom Online, App2App, Top-up. The Static QR-code also called sticker, ECR sticker or some other confusing names, is not supported since Payconiq misses anything to be implemented (so no automation for this product except by webscraping the portal). This module cannot do payout reconciliation or help with refund services. The supported products are only partly so, in that they miss features for getting payments, getting a payment list or refunding.
