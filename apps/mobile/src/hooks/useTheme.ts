import { useState, useEffect } from "react";
import { useColorScheme } from "react-native";

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === "dark" || systemColorScheme === null;

  return {
    isDark,
    colors: isDark ? "dark" : "light",
  };
}

export function useColors() {
  return {
    primary: "#e8e4dc",
    secondary: "#7a7c88",
  };
}