// colors.ts (או בתוך אותו קובץ)

import { gradientColors } from "../types/types";

type Gradient = { from: string; to: string };

// מחזיר את הגרדיאנט לפי מפתח הצבע, עם fallback בטוח
export const getTaskGradient = (colorKey?: string | null): Gradient => {
  if (!colorKey || !gradientColors[colorKey as keyof typeof gradientColors]) {
    return gradientColors.white; // fallback: לבן
  }
  return gradientColors[colorKey as keyof typeof gradientColors];
};

// בודק אם הצבע בהיר → כדי לבחור צבע טקסט מתאים על הקובייה
const isLightColor = (hex?: string): boolean => {
  if (!hex) return true;
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
};

// מחזיר גרדיאנט + צבע טקסט מתאים
export const getTaskCubeColors = (colorKey?: string | null) => {
  const gradient = getTaskGradient(colorKey);
  const from = gradient?.from || "#ffffff";
  const to = gradient?.to || "#ffffff";
  return {
    from,
    to,
    textColor: isLightColor(from) ? "#3a3a3a" : "#ffffff",
  };
};