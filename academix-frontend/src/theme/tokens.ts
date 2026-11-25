// Design tokens (redesign-prep Epic #97, issue #100).
// Single source of truth for colors, radii and shadows. Every value here is EXACTLY a value the app
// already uses, so moving code onto tokens changes nothing visually. The future design is applied by
// changing the values here (and in variables.css, kept in sync by tokens.test.ts).
// How to use them: see src/theme/README.md.

/**
 * Semantic tokens: named by role. Prefer these when the role matches.
 * CSS variable: --ax-<kebab-case name>, e.g. appBg -> --ax-app-bg.
 */
export const semantic = {
  appBg: "#f8f6f2", // page background (index.css, App.css, Layout.css)
  surface: "#ffffff", // cards, modals, inputs
  navAccent: "#6de1e3", // Topbar active item
  inputPlaceholder: "#333333", // antd Input placeholder (global theme)
  modalMask: "rgba(0, 0, 0, 0.1)", // antd Modal mask (global theme)
  scrollbarThumb: "#e6e1d8",
  scrollbarThumbHover: "#dad5ce",
} as const;

/**
 * Palette: the raw colors used 10+ times in the code (inventory of 2026-11-25), named by family and
 * shade. Use one when no semantic token fits. A color that is not here stays local with TODO(tokens).
 * CSS variable: --ax-<kebab-case name>, e.g. antBlue -> --ax-ant-blue, slate500 -> --ax-slate500.
 */
export const palette = {
  // neutrals
  white: "#ffffff",
  black: "#000000",
  grey333: "#333333",
  grey666: "#666666",
  grey999: "#999999",
  greyAaa: "#aaaaaa",
  greyCcc: "#cccccc",
  greyE0: "#e0e0e0",
  greyE8: "#e8e8e8",
  // antd v4 defaults (still hardcoded across the app)
  antBlue: "#1890ff",
  antBlue1: "#e6f7ff",
  antdPrimary: "#1677ff",
  antRed: "#ff4d4f",
  antRed1: "#fff1f0",
  antRed2: "#ffccc7",
  antErrorBg: "#fff2f0",
  antGreen: "#52c41a",
  antGreen1: "#f6ffed",
  antGreen3: "#b7eb8f",
  antGold: "#faad14",
  antPurple: "#722ed1",
  antGray2: "#fafafa",
  antGray3: "#f5f5f5",
  antGray4: "#f0f0f0",
  antGray5: "#d9d9d9",
  antGray6: "#bfbfbf",
  antGray7: "#8c8c8c",
  antGray8: "#595959",
  antGray9: "#262626",
  // warm beiges (app identity)
  sand50: "#faf9f6",
  sand100: "#f4f1eb",
  sand150: "#ece8df",
  sand200: "#ece5d6",
  sand250: "#e7e2d6",
  sand300: "#e6e1d8",
  sand400: "#d4c7ad",
  sand500: "#bfac8b",
  sand600: "#a09a8c",
  cream50: "#fffaf0",
  honey200: "#f2ddb0",
  honey700: "#c77f00",
  // cool greys and dark blues
  steel400: "#a3a6a8",
  steel600: "#6e7072",
  steel700: "#5b6472",
  navy800: "#2b2f3e",
  navy900: "#232b3a",
  denim: "#2b5d8a",
  plum: "#611f69",
  // tailwind-like slate / gray
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate800: "#1e293b",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  // tailwind-like accents
  blue500: "#3b82f6",
  emerald600: "#059669",
  amber500: "#f59e0b",
  red500: "#ef4444",
  // bootstrap-like
  bsBlue: "#007bff",
  bsGray100: "#f8f9fa",
  bsGray200: "#e9ecef",
} as const;

/** Border radii used most often (inventory of 2026-11-25). CSS variable: --ax-radius-<key>. */
export const radius = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "10px",
  xl: "12px",
  "15": "15px",
  "16": "16px",
  "20": "20px",
  "30": "30px",
  "50": "50px",
  pill: "999px",
  round: "50%",
} as const;

/** Box shadows used most often (inventory of 2026-11-25). CSS variable: --ax-shadow-<key>. */
export const shadow = {
  sm: "0 2px 4px rgba(0, 0, 0, 0.1)",
  soft: "0 2px 6px rgba(0, 0, 0, 0.06)",
  md: "0 2px 8px rgba(0, 0, 0, 0.1)",
  card: "0 4px 12px rgba(0, 0, 0, 0.08)",
  tw: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  navy: "0 4px 18px rgba(35, 43, 58, 0.05)",
} as const;

/** Font stack forced on every element by index.css. CSS variable: --ax-font-family. */
export const fontFamily =
  '"myFont", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** camelCase / alphanumeric key -> CSS variable suffix (appBg -> app-bg, slate500 -> slate500). */
export const toCssVarName = (key: string): string =>
  key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

/** `var(--ax-...)` reference for inline styles, e.g. cssVar("appBg") -> "var(--ax-app-bg)". */
export const cssVar = (key: keyof typeof semantic | keyof typeof palette): string =>
  `var(--ax-${toCssVarName(key)})`;
