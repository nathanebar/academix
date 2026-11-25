// Task / axis color gradients (the color picked on a task, axis or event). Moved from
// src/types/types.ts by issue #100; types.ts re-exports it so existing imports keep working.
// The keys are stored in the database (task.color, axis.color): never rename or remove a key.
export const gradientColors = {
  coral: { from: "#E95742", to: "#FF9E90" },
  lightPink: { from: "#FF9ACA", to: "#FEB9DC" },
  pink: { from: "#F4C1D9", to: "#DE4B90" },
  lightPurple: { from: "#EFE3F3", to: "#D1AEDD" },
  purple: { from: "#C8A8F5", to: "#7A2CE7" },
  green: { from: "#B2DAC0", to: "#0E8A39" },
  lightGreen: { from: "#49C6A3", to: "#BEEED5" },
  lightBlue: { from: "#D3DFF8", to: "#4F7EE3" },
  skull: { from: "#9FEAFF", to: "#32D3FF" },
  lightSkull: { from: "#70DAE4", to: "#B6EAEF" },
  lightCoral: { from: "#F7C2B2", to: "#EA633A" },
  orange: { from: "#FE9B20", to: "#FDF3C0" },
  lightOrange: { from: "#FFDEA9", to: "#FFAE2C" },
  yellow: { from: "#F6F1C1", to: "#E6D221" },
  gray: { from: "#B5B4C2", to: "#26244D" },
  lightGray: { from: "#FFFFFF", to: "#999999" },
  purpleBlue: { from: "#CECFFA", to: "#5D5FEF" },
  deepPurpleBlue: { from: "#A59AD5", to: "#31189E" },
  brown: { from: "#BD8B55", to: "#9D5200" },
  blue: { from: "#4A90E2", to: "#A0C4FF" },
  black: { from: "#8f8e8e", to: "#0A0A0A" },
  white: { from: "#ffffff", to: "#ffffff" },
  null: { from: "#ffffff", to: "#ffffff" },
};
