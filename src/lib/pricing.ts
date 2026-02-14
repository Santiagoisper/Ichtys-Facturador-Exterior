import {
  PROTOCOL_TIERS,
  VISIT_DISCOUNT_TIERS,
  ONSITE_VISIT_PRICE,
  REMOTE_VISIT_PRICE,
  IMPLEMENTATION_FEE,
} from "./constants";

export function getProtocolUnitPrice(count: number): number {
  if (count <= 0) return 0;
  for (const tier of PROTOCOL_TIERS) {
    if (count >= tier.min && count <= tier.max) return tier.price;
  }
  return 600;
}

export function getVisitDiscountPercent(totalVisits: number): number {
  if (totalVisits <= 0) return 0;
  for (const tier of VISIT_DISCOUNT_TIERS) {
    if (totalVisits >= tier.min && totalVisits <= tier.max) return tier.discount;
  }
  return 50;
}

export interface InvoiceCalculationInput {
  protocolCount: number;
  onsiteVisits: number;
  remoteVisits: number;
  includeImplementation: boolean;
  lineItems: { quantity: number; unitPrice: number }[];
}

export interface InvoiceCalculationResult {
  protocolUnitPrice: number;
  protocolTotal: number;
  onsiteTotal: number;
  remoteTotal: number;
  visitSubtotal: number;
  visitDiscountPercent: number;
  visitDiscountAmount: number;
  visitAfterDiscount: number;
  implementationFee: number;
  lineItemsTotal: number;
  subtotal: number;
  discountAmount: number;
  total: number;
}

export function calculateInvoiceTotals(
  data: InvoiceCalculationInput
): InvoiceCalculationResult {
  const protocolUnitPrice = getProtocolUnitPrice(data.protocolCount);
  const protocolTotal = protocolUnitPrice > 0 ? protocolUnitPrice : 0;

  const onsiteTotal = data.onsiteVisits * ONSITE_VISIT_PRICE;
  const remoteTotal = data.remoteVisits * REMOTE_VISIT_PRICE;

  const totalVisits = data.onsiteVisits + data.remoteVisits;
  const visitDiscountPercent = getVisitDiscountPercent(totalVisits);
  const visitSubtotal = onsiteTotal + remoteTotal;
  const visitDiscountAmount = visitSubtotal * (visitDiscountPercent / 100);
  const visitAfterDiscount = visitSubtotal - visitDiscountAmount;

  const implementationFee = data.includeImplementation ? IMPLEMENTATION_FEE : 0;

  const lineItemsTotal = data.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const subtotal = protocolTotal + visitSubtotal + implementationFee + lineItemsTotal;
  const discountAmount = visitDiscountAmount;
  const total = subtotal - discountAmount;

  return {
    protocolUnitPrice,
    protocolTotal,
    onsiteTotal,
    remoteTotal,
    visitSubtotal,
    visitDiscountPercent,
    visitDiscountAmount,
    visitAfterDiscount,
    implementationFee,
    lineItemsTotal,
    subtotal,
    discountAmount,
    total,
  };
}

export function formatCurrency(value: number): string {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
