// Re-exports from the canonical source so ui components can keep importing
// from "./theme" without knowing where the tokens live.
export {
  palette,
  BRAND_COLORS,
  theme,
} from "@/constants/colors";

export type {
  PaletteColor,
  PaletteColorValue,
  BrandColor,
  BrandColorValue,
  ThemeColor,
} from "@/constants/colors";
