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

test("make the correct invoice URL", () => {
  for (let pq of pqs) {
    expect(pq.createInvoiceURL({ amount: 24574 })).toBe(`https://payconiq.com/t/1/testPaymentIdpaymenTtesT?A=24574`);
    expect(pq.createInvoiceURL({ amount: 1254, reference: "referenceXYZ" })).toBe(
      `https://payconiq.com/t/1/testPaymentIdpaymenTtesT?A=1254&R=referenceXYZ`,
    );
    expect(pq.createInvoiceURL({ amount: 1254, description: "this is a description", reference: "referenceXYZ" })).toBe(
      `https://payconiq.com/t/1/testPaymentIdpaymenTtesT?A=1254&D=this+is+a+description&R=referenceXYZ`,
    );
  }
});
test("make the correct invoice QR-code URL", () => {
  for (let pq of pqs) {
    expect(pq.createInvoiceQRCodeURL({ amount: 24574 })).toBe(
      `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D24574`,
    );
    expect(pq.createInvoiceQRCodeURL({ amount: 1254, reference: "referenceXYZ" })).toBe(
      `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26R%3DreferenceXYZ`,
    );
    expect(
      pq.createInvoiceQRCodeURL({ amount: 1254, description: "this is a description", reference: "referenceXYZ" }),
    ).toBe(
      `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26D%3Dthis%2Bis%2Ba%2Bdescription%26R%3DreferenceXYZ`,
    );
  }
});
test("make the correct invoice QR-code URL with options", () => {
  for (let pq of pqs) {
    expect(pq.createInvoiceQRCodeURL({ amount: 24574 }, { color: "black" })).toBe(
      `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D24574&cl=black`,
    );
    expect(
      pq.createInvoiceQRCodeURL({ amount: 1254, reference: "referenceXYZ" }, { color: "magenta", size: "S" }),
    ).toBe(
      `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26R%3DreferenceXYZ&s=S&cl=magenta`,
    );
    expect(
      pq.createInvoiceQRCodeURL(
        { amount: 1254, description: "this is a description", reference: "referenceXYZ" },
        { format: "PNG", size: "L" },
      ),
    ).toBe(
      `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26D%3Dthis%2Bis%2Ba%2Bdescription%26R%3DreferenceXYZ&f=PNG&s=L`,
    );
  }
});
