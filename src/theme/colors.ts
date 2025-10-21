export const palette = {
  background: "#040B16",
  surface: "#0D1423",
  elevatedSurface: "#121B33",
  overlay: "rgba(4, 11, 22, 0.7)",
  primary: "#FF0033",
  primaryAlt: "#FF3B6B",
  accentCyan: "#00F0FF",
  accentBlue: "#4C6BFF",
  accentPurple: "#7A2BFF",
  buttonGradientStart: "#6C63FF",
  buttonGradientEnd: "#3EE9F2",
  buttonGlow: "rgba(110, 234, 255, 0.45)",
  textPrimary: "#F7FAFF",
  textSecondary: "rgba(247, 250, 255, 0.65)",
  textMuted: "rgba(247, 250, 255, 0.45)",
  success: "#18FFB2",
  warning: "#FFC857",
  danger: "#FF5E5B",
  border: "rgba(255, 255, 255, 0.08)",
} as const;

export type Palette = typeof palette;
