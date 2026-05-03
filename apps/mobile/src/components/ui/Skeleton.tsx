import React from "react";
import { View, StyleSheet, type ViewStyle, type DimensionValue } from "react-native";
import { Colors, Spacing, BorderRadius } from "../../utils/theme";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  variant?: "text" | "circle" | "rect";
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  variant = "rect",
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: variant === "circle" ? 9999 : variant === "text" ? 4 : BorderRadius.md,
        },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={20} style={{ marginBottom: Spacing.md }} width="60%" />
      <Skeleton height={14} style={{ marginBottom: Spacing.sm }} width="100%" />
      <Skeleton height={14} style={{ marginBottom: Spacing.sm }} width="80%" />
      <View style={styles.row}>
        <Skeleton height={32} style={{ marginRight: Spacing.sm }} width={80} />
        <Skeleton height={32} width={80} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surfaceElevated,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    marginTop: Spacing.md,
  },
});
