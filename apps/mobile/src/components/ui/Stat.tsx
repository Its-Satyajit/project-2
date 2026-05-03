import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Colors, FontSizes, Spacing } from "../../utils/theme";

interface StatProps {
  label: string;
  value: string | number;
  suffix?: string;
}

export function Stat({ label, value, suffix }: StatProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.value}>
        {typeof value === "number" ? formatNumber(value) : value}
        {suffix && <Text style={styles.suffix}> {suffix}</Text>}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  value: {
    fontSize: FontSizes.displayLarge,
    fontWeight: "300",
    color: Colors.text.primary,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  suffix: {
    fontSize: FontSizes.lg,
    color: Colors.text.secondary,
    fontWeight: "400",
  },
  label: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: Spacing.xs,
    fontWeight: "500",
  },
});
