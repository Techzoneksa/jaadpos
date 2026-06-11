export const DEFAULT_VAT_RATE = 0.15;
export const eInvoiceMode = "basic_qr_only";
export const zatcaIntegrationStatus = "not_enabled";

export type TaxLine = {
  subtotal: number;
  tax: number;
  total: number;
};

export function calculateTax(amount: number, pricesIncludeTax: boolean, rate = DEFAULT_VAT_RATE): TaxLine {
  if (pricesIncludeTax) {
    const subtotal = amount / (1 + rate);
    const tax = amount - subtotal;
    return roundTax({ subtotal, tax, total: amount });
  }

  const tax = amount * rate;
  return roundTax({ subtotal: amount, tax, total: amount + tax });
}

export function buildBasicQrPayload(input: {
  sellerName: string;
  vatNumber: string;
  issuedAt: Date;
  total: number;
  tax: number;
}) {
  return JSON.stringify({
    seller: input.sellerName,
    vatNumber: input.vatNumber,
    issuedAt: input.issuedAt.toISOString(),
    total: input.total.toFixed(2),
    vat: input.tax.toFixed(2)
  });
}

function roundTax(line: TaxLine): TaxLine {
  return {
    subtotal: Number(line.subtotal.toFixed(2)),
    tax: Number(line.tax.toFixed(2)),
    total: Number(line.total.toFixed(2))
  };
}
