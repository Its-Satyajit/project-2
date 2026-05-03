export const Colors = {
  background: "#0d0f18",
  surface: "#141623",
  surfaceElevated: "#1c1f30",
  border: "#252840",
  text: {
    primary: "#e8e4dc",
    secondary: "#7a7c88",
    muted: "#5a5c66",
  },
  accent: {
    primary: "#e85d4a",
    secondary: "#d64534",
    muted: "rgba(232, 93, 74, 0.1)",
  },
  chart: {
    primary: "#e8e4dc",
    accent: "#e85d4a",
    blue: "#5a7ec2",
    green: "#6b9e6b",
    yellow: "#d4a843",
    purple: "#8b5cf6",
    cyan: "#22d3ee",
    pink: "#ec4899",
    orange: "#f97316",
    red: "#ef4444",
  },
  status: {
    success: "#6b9e6b",
    warning: "#d4a843",
    error: "#e85d4a",
    info: "#5a7ec2",
  },
} as const;

export const LightColors = {
  background: "#faf6f0", // Warm Parchment
  surface: "#f5efe6",
  surfaceElevated: "#ede7db",
  border: "#d9d1c4",
  text: {
    primary: "#1a1d2e", // Deep Navy
    secondary: "#6b6d7a",
    muted: "#6b6d7a",
  },
  accent: {
    primary: "#d64534", // Vermillion
    secondary: "#e85d4a",
    muted: "rgba(214, 69, 52, 0.08)",
  },
  chart: {
    primary: "#1a1d2e",
    accent: "#d64534",
    blue: "#3d5a99",
    green: "#5a7d5a",
    yellow: "#c4953a",
    purple: "#9333ea",
    cyan: "#0891b2",
    pink: "#db2777",
    orange: "#f97316",
    red: "#d64534",
  },
  status: {
    success: "#5a7d5a",
    warning: "#c4953a",
    error: "#d64534",
    info: "#3d5a99",
  },
} as const;

export type ThemeColors = typeof Colors;

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
  display: 42,
  displayLarge: 56,
} as const;

export const BorderRadius = {
  sm: 0, // Sharp architectural corners
  md: 2,
  lg: 4,
  xl: 6,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;