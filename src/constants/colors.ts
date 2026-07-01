// ── Raw palette ───────────────────────────────────────────────────────────────
// Single source of truth for every hex value in the app.
export const palette = {
  // Brand greens
  primaryGreen: "#1B9E57",
  darkGreen: "#006838",
  softGreen: "#92DDBF",
  pastelPeaGreen: "#ACD6A6",
  seafoamGreen: "#92DDBF",
  lightCyan: "#D3EDEE",

  // Text hierarchy
  ink: "#1B2024",
  body: "#71717a",
  muted: "#8B9097",
  neutralText: "#22223B",

  // Surfaces
  bg: "#F6F7F8",
  white: "#FFFFFF",
  ashWhite: "#ECECEC",
  subtleBg: "#F9FAFB",
  mutedBg: "#F3F4F6",

  // Borders
  border: "#ECEEF0",
  neutralBorder: "#E5E7EB",
  dots: "#D1D5DB",

  // Semantic foregrounds
  error: "#D32F2F",
  destructiveRed: "#BF1F2F",
  errorRed: "#EF4444",
  warning: "#F57C00",
  warningText: "#F1592B",
  warningBorder: "#F4845F",
  info: "#1976D2",

  // Semantic backgrounds
  successBg: "#F0FDF4",
  errorBg: "#FEF2F2",
  warningBg: "#FFF7ED",
  infoBg: "#E3F2FD",

  // Gold
  gold: "#CBA135",
  brightGold: "#FFD026",
  paleGold: "#FFF48E",

  // Misc
  black: "#000000",
  grey: "#808080",
} as const;

export type PaletteColor = keyof typeof palette;
export type PaletteColorValue = (typeof palette)[PaletteColor];

// Backward-compat alias — existing `BRAND_COLORS.x` imports keep working.
export const BRAND_COLORS = palette;
export type BrandColor = PaletteColor;
export type BrandColorValue = PaletteColorValue;

// ── Design tokens ─────────────────────────────────────────────────────────────
// Semantic layer: maps purpose → palette value.
export const theme = {
  color: {
    // Text
    ink: palette.ink,
    body: palette.body,
    muted: palette.muted,
    // Surfaces
    bg: palette.bg,
    card: palette.white,
    // Borders
    border: palette.border,
    dots: palette.dots,
    // Brand
    accent: palette.primaryGreen,
    // Semantic
    error: palette.error,
    errorBg: palette.errorBg,
    warning: palette.warning,
    warningBg: palette.warningBg,
    info: palette.info,
    infoBg: palette.infoBg,
    successBg: palette.successBg,
  },
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
} as const;

export type ThemeColor = keyof typeof theme.color;
