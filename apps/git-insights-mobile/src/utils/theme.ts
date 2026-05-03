export const Colors = {
  background: "#0a0a0a",
  surface: "#171717",
  surfaceElevated: "#262626",
  border: "#404040",
  text: {
    primary: "#fafafa",
    secondary: "#a1a1a1",
    muted: "#737373",
  },
  accent: {
    primary: "#22c55e",
    secondary: "#16a34a",
    muted: "#166534",
  },
  chart: {
    green: "#22c55e",
    blue: "#3b82f6",
    purple: "#a855f7",
    orange: "#f97316",
    red: "#ef4444",
    yellow: "#eab308",
    pink: "#ec4899",
    cyan: "#06b6d4",
  },
  status: {
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
    info: "#3b82f6",
  },
} as const;

export const Spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  "4xl": 32,
} as const;

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  "2xl": 22,
  "3xl": 26,
  "4xl": 30,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;