export const COMPANY_INFO = {
  name: "ICHTYS TECHNOLOGY",
  adb: "ADB: ICHTYS TECHNOLOGY",
  legalName: "Veritas Lux Capital LLC",
  address: "104 Crandon Blvd. Suite 312",
  city: "Key Biscayne, FL 33149",
} as const;

export const BANK_DETAILS = {
  bank: "CITI BANK",
  aba: "266086554",
  swift: "CITIUS33",
  beneficiary: "VERITAS LUX TECH CAPITAL LLC",
  account: "9154428841",
  address: "104 Crandon Blvd, Key Biscayne, FL 33149",
  notes: [
    "Include invoice number as reference in bank transfer",
    "Amount must be NET and free of transfer fees",
  ],
} as const;

export const PROTOCOL_TIERS = [
  { min: 1, max: 5, price: 150 },
  { min: 6, max: 10, price: 200 },
  { min: 11, max: 20, price: 250 },
  { min: 21, max: 30, price: 300 },
  { min: 31, max: 40, price: 350 },
  { min: 41, max: 50, price: 400 },
  { min: 51, max: Infinity, price: 600 },
] as const;

export const VISIT_DISCOUNT_TIERS = [
  { min: 1, max: 50, discount: 0 },
  { min: 51, max: 100, discount: 10 },
  { min: 101, max: 150, discount: 20 },
  { min: 151, max: 200, discount: 30 },
  { min: 201, max: 250, discount: 40 },
  { min: 251, max: 400, discount: 45 },
  { min: 401, max: Infinity, discount: 50 },
] as const;

export const ONSITE_VISIT_PRICE = 10.0;
export const REMOTE_VISIT_PRICE = 2.5;
export const IMPLEMENTATION_FEE = 1000.0;
