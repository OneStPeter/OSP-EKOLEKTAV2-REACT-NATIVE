export const BRAND_COLORS = {
  primaryGreen: "#109448",
  darkGreen: "#006838",
  softGreen: "#92DDBF",
  pastelPeaGreen: "#ACD6A6",
  seafoamGreen: "#92DDBF",
  lightCyan: "#D3EDEE",
  successBg: "#F0FDF4",
  warningBg: "#FFF7ED",
  warningText: "#F1592B",
  warningBorder: "#F4845F",
  errorBg: "#FEF2F2",
  destructiveRed: "#BF1F2F",
  errorRed: "#EF4444",
  neutralText: "#22223B",
  neutralBorder: "#E5E7EB",
  mutedBg: "#F3F4F6",
  subtleBg: "#F9FAFB",
  white: "#FFFFFF",
  black: "#000000",
  grey: "#808080",
  ashWhite: "#ECECEC",
  gold: "#CBA135",
  brightGold: "#FFD026",
  paleGold: "#FFF48E",
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;
export type BrandColorValue = (typeof BRAND_COLORS)[BrandColor];
