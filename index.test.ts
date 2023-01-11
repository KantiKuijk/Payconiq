import { default as Payconiq, PayconiqAPI, PayconiqTest } from ".";

test("fail on incorrect paymentId", () => {
  expect(() => new Payconiq("tooShortPaymentId")).toThrow("Invalid Payment id");
  expect(() => new PayconiqAPI(apiKey, "tooShortPaymentId")).toThrow("Invalid Payment id");
  expect(() => new PayconiqTest(apiKey, "tooShortPaymentId")).toThrow("Invalid Payment id");
});

const paymentId = "testPaymentIdpaymenTtesT";

test("fail on incorrect apiKey", () => {
  expect(() => new PayconiqAPI("tooShortAPIKey", paymentId)).toThrow("Invalid API key");
  expect(() => new PayconiqTest("tooShortAPIKey", paymentId)).toThrow("Invalid API key");
});

const apiKey = "APIkeytestAPIkeytestAPIkeytestAPIkey";

const payconiq = new Payconiq(paymentId);
const payconiqapi = new PayconiqAPI(apiKey, paymentId);
const payconiqtest = new PayconiqTest(apiKey, paymentId);
const pqs = [payconiq, payconiqapi, payconiqtest];

test("make the correct POS QR-code URL", () => {
  const posId = "testPosId";
  for (let pq of pqs) {
    expect(pq.createPOSQRCodeURL(posId)).toBe(
      `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}`,
    );
  }
});
test("make the correct POS QR-code URL with options", () => {
  const posId = "testPosId";
  for (let pq of pqs) {
    expect(payconiq.createPOSQRCodeURL(posId, { format: "SVG" })).toBe(
      `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}&f=SVG`,
    );
    expect(payconiq.createPOSQRCodeURL(posId, { size: "XL" })).toBe(
      `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}&s=XL`,
    );
    expect(payconiq.createPOSQRCodeURL(posId, { color: "black" })).toBe(
      `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}&cl=black`,
    );
  }
});
test("fail on invalid posId", () => {
  expect(() => payconiq.createPOSQRCodeURL("tooLongPOSIdtooLongPOSIdtooLongPOSIdd")).toThrow("Invalid posId");
  expect(() => payconiq.createPOSQRCodeURL("POSIdWithSpecialCharacter_")).toThrow("Invalid posId");
  expect(() => payconiq.createPOSQRCodeURL("Service Center")).toThrow("Invalid posId");
});
test("don't fail on valid posId", () => {
  expect(() => payconiq.createPOSQRCodeURL("ServiceCenter")).not.toThrow();
  expect(() => payconiq.createPOSQRCodeURL("POS00001")).not.toThrow();
  expect(() => payconiq.createPOSQRCodeURL("23455")).not.toThrow();
  expect(() => payconiq.createPOSQRCodeURL("PAYCONIQ")).not.toThrow();
  expect(() => payconiq.createPOSQRCodeURL("Payconiq")).not.toThrow();
  expect(() => payconiq.createPOSQRCodeURL("payconiq")).not.toThrow();
});
