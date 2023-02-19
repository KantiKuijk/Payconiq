import PayconiqProduct, { PayconiqInvoice, PayconiqPredefined, PayconiqReceipt } from ".";

test("fail on incorrect paymentId", () => {
  expect(() => new PayconiqProduct("tooShortPaymentId", apiKey)).toThrow("Invalid Payment id");
  expect(() => new PayconiqPredefined("tooShortPaymentId", apiKey)).toThrow("Invalid Payment id");
  expect(() => new PayconiqInvoice("tooShortPaymentId", apiKey)).toThrow("Invalid Payment id");
  expect(() => new PayconiqReceipt("tooShortPaymentId", apiKey)).toThrow("Invalid Payment id");
});

const paymentId = "testPaymentIdpaymenTtesT";

test("fail on incorrect apiKey", () => {
  expect(() => new PayconiqPredefined(paymentId, "tooShortAPIKey")).toThrow("Invalid API key");
  expect(() => new PayconiqInvoice(paymentId, "tooShortAPIKey")).toThrow("Invalid API key");
  expect(() => new PayconiqReceipt(paymentId, "tooShortAPIKey")).toThrow("Invalid API key");
});

const apiKey = "APIkeytestAPIkeytestAPIkeytestAPIkey";

const pqPredefined = new PayconiqPredefined(paymentId, apiKey);
const pqInvoice = new PayconiqInvoice(paymentId, apiKey);
const pqReceipt = new PayconiqReceipt(paymentId, apiKey);
const pqPredefinedExt = new PayconiqPredefined(paymentId, apiKey, { environment: "EXT" });
const pqInvoiceExt = new PayconiqInvoice(paymentId, apiKey, { environment: "EXT" });
const pqReceiptExt = new PayconiqReceipt(paymentId, apiKey, { environment: "EXT" });

test("make the correct POS QR-code URL", () => {
  const posId = "testposid";
  expect(pqPredefined.makeQRcode(posId)).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}`,
  );
});
test("make the correct POS QR-code URL with options", () => {
  const posId = "testposid";
  expect(pqPredefined.makeQRcode(posId, { format: "SVG" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}&f=SVG`,
  );
  expect(pqPredefined.makeQRcode(posId, { size: "XL" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}&s=XL`,
  );
  expect(pqPredefined.makeQRcode(posId, { color: "black" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}&cl=black`,
  );
});
test("fail on invalid posId", () => {
  expect(() => pqPredefined.makeQRcode("tooLongPOSIdtooLongPOSIdtooLongPOSIdd")).toThrow("Invalid posId");
  expect(() => pqPredefined.makeQRcode("POSIdWithSpecialCharacter_")).toThrow("Invalid posId");
  expect(() => pqPredefined.makeQRcode("Service Center")).toThrow("Invalid posId");
  expect(() => pqPredefined.makeQRcode("Payconiq")).toThrow("Invalid posId");
});
test("don't fail on valid posId", () => {
  expect(() => pqPredefined.makeQRcode("servicecenter")).not.toThrow();
  expect(() => pqPredefined.makeQRcode("POS00001")).not.toThrow();
  expect(() => pqPredefined.makeQRcode("23455")).not.toThrow();
  expect(() => pqPredefined.makeQRcode("PAYCONIQ")).not.toThrow();
  expect(() => pqPredefined.makeQRcode("payconiq")).not.toThrow();
});

test("make the correct invoice URL", () => {
  expect(pqInvoice.makePayment({ amount: 24574 })).toBe(`https://payconiq.com/t/1/${paymentId}?A=24574`);
  expect(pqInvoice.makePayment({ amount: 1254, reference: "referenceXYZ" })).toBe(
    `https://payconiq.com/t/1/${paymentId}?A=1254&R=referenceXYZ`,
  );
  expect(pqInvoice.makePayment({ amount: 1254, description: "this is a description", reference: "referenceXYZ" })).toBe(
    `https://payconiq.com/t/1/${paymentId}?A=1254&D=this+is+a+description&R=referenceXYZ`,
  );
});
test("make the correct invoice QR-code URL", () => {
  expect(pqInvoice.makeQRcode({ amount: 24574 })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D24574`,
  );
  expect(pqInvoice.makeQRcode({ amount: 1254, reference: "referenceXYZ" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26R%3DreferenceXYZ`,
  );
  expect(pqInvoice.makeQRcode({ amount: 1254, description: "this is a description", reference: "referenceXYZ" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26D%3Dthis%2Bis%2Ba%2Bdescription%26R%3DreferenceXYZ`,
  );
});
test("make the correct invoice QR-code URL with options", () => {
  expect(pqInvoice.makeQRcode({ amount: 24574 }, { color: "black" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D24574&cl=black`,
  );
  expect(pqInvoice.makeQRcode({ amount: 1254, reference: "referenceXYZ" }, { color: "magenta", size: "S" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26R%3DreferenceXYZ&s=S&cl=magenta`,
  );
  expect(
    pqInvoice.makeQRcode(
      { amount: 1254, description: "this is a description", reference: "referenceXYZ" },
      { format: "PNG", size: "L" },
    ),
  ).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26D%3Dthis%2Bis%2Ba%2Bdescription%26R%3DreferenceXYZ&f=PNG&s=L`,
  );
});

test("make the correct receipt URL", () => {
  expect(pqReceipt.makePayment({ amount: 24574 })).toBe(`https://payconiq.com/t/1/${paymentId}?A=24574`);
  expect(pqReceipt.makePayment({ amount: 1254, reference: "referenceXYZ" })).toBe(
    `https://payconiq.com/t/1/${paymentId}?A=1254&R=referenceXYZ`,
  );
  expect(pqReceipt.makePayment({ amount: 1254, description: "this is a description", reference: "referenceXYZ" })).toBe(
    `https://payconiq.com/t/1/${paymentId}?A=1254&D=this+is+a+description&R=referenceXYZ`,
  );
});
test("make the correct receipt QR-code URL", () => {
  expect(pqReceipt.makeQRcode({ amount: 24574 })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D24574`,
  );
  expect(pqReceipt.makeQRcode({ amount: 1254, reference: "referenceXYZ" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26R%3DreferenceXYZ`,
  );
  expect(pqReceipt.makeQRcode({ amount: 1254, description: "this is a description", reference: "referenceXYZ" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26D%3Dthis%2Bis%2Ba%2Bdescription%26R%3DreferenceXYZ`,
  );
});
test("make the correct receipt QR-code URL with options", () => {
  expect(pqReceipt.makeQRcode({ amount: 24574 }, { color: "black" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D24574&cl=black`,
  );
  expect(pqReceipt.makeQRcode({ amount: 1254, reference: "referenceXYZ" }, { color: "magenta", size: "S" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26R%3DreferenceXYZ&s=S&cl=magenta`,
  );
  expect(
    pqReceipt.makeQRcode(
      { amount: 1254, description: "this is a description", reference: "referenceXYZ" },
      { format: "PNG", size: "L" },
    ),
  ).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26D%3Dthis%2Bis%2Ba%2Bdescription%26R%3DreferenceXYZ&f=PNG&s=L`,
  );
});

test("make the correct POS QR-code URL [EXT]", () => {
  const posId = "testposid";
  expect(pqPredefinedExt.makeQRcode(posId)).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}`,
  );
});
test("make the correct POS QR-code URL with options [EXT]", () => {
  const posId = "testposid";
  expect(pqPredefinedExt.makeQRcode(posId, { format: "SVG" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}&f=SVG`,
  );
  expect(pqPredefinedExt.makeQRcode(posId, { size: "XL" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}&s=XL`,
  );
  expect(pqPredefinedExt.makeQRcode(posId, { color: "black" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Fl%2F1%2F${paymentId}%2F${posId}&cl=black`,
  );
});
test("fail on invalid posId [EXT]", () => {
  expect(() => pqPredefinedExt.makeQRcode("tooLongPOSIdtooLongPOSIdtooLongPOSIdd")).toThrow("Invalid posId");
  expect(() => pqPredefinedExt.makeQRcode("POSIdWithSpecialCharacter_")).toThrow("Invalid posId");
  expect(() => pqPredefinedExt.makeQRcode("Service Center")).toThrow("Invalid posId");
  expect(() => pqPredefinedExt.makeQRcode("Payconiq")).toThrow("Invalid posId");
});
test("don't fail on valid posId [EXT]", () => {
  expect(() => pqPredefinedExt.makeQRcode("servicecenter")).not.toThrow();
  expect(() => pqPredefinedExt.makeQRcode("POS00001")).not.toThrow();
  expect(() => pqPredefinedExt.makeQRcode("23455")).not.toThrow();
  expect(() => pqPredefinedExt.makeQRcode("PAYCONIQ")).not.toThrow();
  expect(() => pqPredefinedExt.makeQRcode("payconiq")).not.toThrow();
});

test("make the correct invoice URL [EXT]", () => {
  expect(pqInvoiceExt.makePayment({ amount: 24574 })).toBe(`https://payconiq.com/t/1/${paymentId}?A=24574`);
  expect(pqInvoiceExt.makePayment({ amount: 1254, reference: "referenceXYZ" })).toBe(
    `https://payconiq.com/t/1/${paymentId}?A=1254&R=referenceXYZ`,
  );
  expect(
    pqInvoiceExt.makePayment({ amount: 1254, description: "this is a description", reference: "referenceXYZ" }),
  ).toBe(`https://payconiq.com/t/1/${paymentId}?A=1254&D=this+is+a+description&R=referenceXYZ`);
});
test("make the correct invoice QR-code URL [EXT]", () => {
  expect(pqInvoiceExt.makeQRcode({ amount: 24574 })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D24574`,
  );
  expect(pqInvoiceExt.makeQRcode({ amount: 1254, reference: "referenceXYZ" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26R%3DreferenceXYZ`,
  );
  expect(
    pqInvoiceExt.makeQRcode({ amount: 1254, description: "this is a description", reference: "referenceXYZ" }),
  ).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26D%3Dthis%2Bis%2Ba%2Bdescription%26R%3DreferenceXYZ`,
  );
});
test("make the correct invoice QR-code URL with options [EXT]", () => {
  expect(pqInvoiceExt.makeQRcode({ amount: 24574 }, { color: "black" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D24574&cl=black`,
  );
  expect(pqInvoiceExt.makeQRcode({ amount: 1254, reference: "referenceXYZ" }, { color: "magenta", size: "S" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26R%3DreferenceXYZ&s=S&cl=magenta`,
  );
  expect(
    pqInvoiceExt.makeQRcode(
      { amount: 1254, description: "this is a description", reference: "referenceXYZ" },
      { format: "PNG", size: "L" },
    ),
  ).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26D%3Dthis%2Bis%2Ba%2Bdescription%26R%3DreferenceXYZ&f=PNG&s=L`,
  );
});

test("make the correct receipt URL [EXT]", () => {
  expect(pqReceiptExt.makePayment({ amount: 24574 })).toBe(`https://payconiq.com/t/1/${paymentId}?A=24574`);
  expect(pqReceiptExt.makePayment({ amount: 1254, reference: "referenceXYZ" })).toBe(
    `https://payconiq.com/t/1/${paymentId}?A=1254&R=referenceXYZ`,
  );
  expect(
    pqReceiptExt.makePayment({ amount: 1254, description: "this is a description", reference: "referenceXYZ" }),
  ).toBe(`https://payconiq.com/t/1/${paymentId}?A=1254&D=this+is+a+description&R=referenceXYZ`);
});
test("make the correct receipt QR-code URL [EXT]", () => {
  expect(pqReceiptExt.makeQRcode({ amount: 24574 })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D24574`,
  );
  expect(pqReceiptExt.makeQRcode({ amount: 1254, reference: "referenceXYZ" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26R%3DreferenceXYZ`,
  );
  expect(
    pqReceiptExt.makeQRcode({ amount: 1254, description: "this is a description", reference: "referenceXYZ" }),
  ).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26D%3Dthis%2Bis%2Ba%2Bdescription%26R%3DreferenceXYZ`,
  );
});
test("make the correct receipt QR-code URL with options [EXT]", () => {
  expect(pqReceiptExt.makeQRcode({ amount: 24574 }, { color: "black" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D24574&cl=black`,
  );
  expect(pqReceiptExt.makeQRcode({ amount: 1254, reference: "referenceXYZ" }, { color: "magenta", size: "S" })).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26R%3DreferenceXYZ&s=S&cl=magenta`,
  );
  expect(
    pqReceiptExt.makeQRcode(
      { amount: 1254, description: "this is a description", reference: "referenceXYZ" },
      { format: "PNG", size: "L" },
    ),
  ).toBe(
    `https://portal.payconiq.com/qrcode?c=https%3A%2F%2Fpayconiq.com%2Ft%2F1%2F${paymentId}%3FA%3D1254%26D%3Dthis%2Bis%2Ba%2Bdescription%26R%3DreferenceXYZ&f=PNG&s=L`,
  );
});
