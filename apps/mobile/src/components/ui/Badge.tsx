import React from "react";
import {
	StyleSheet,
	Text,
	type TextStyle,
	View,
	type ViewStyle,
} from "react-native";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../utils/theme";

interface BadgeProps {
	label: string;
	variant?: "default" | "success" | "warning" | "error" | "info" | "accent";
	style?: ViewStyle;
}

import { useTheme } from "../Provider";

export function Badge({ label, variant = "default", style }: BadgeProps) {
	const { colors } = useTheme();

	const variantConfig = {
		default: {
			bg: colors.surfaceElevated,
			text: colors.text.secondary,
			border: colors.border,
		},
		success: {
			bg: `${colors.status.success}15`,
			text: colors.status.success,
			border: `${colors.status.success}30`,
		},
		warning: {
			bg: `${colors.status.warning}15`,
			text: colors.status.warning,
			border: `${colors.status.warning}30`,
		},
		error: {
			bg: `${colors.status.error}15`,
			text: colors.status.error,
			border: `${colors.status.error}30`,
		},
		info: {
			bg: `${colors.status.info}15`,
			text: colors.status.info,
			border: `${colors.status.info}30`,
		},
		accent: {
			bg: `${colors.accent.primary}15`,
			text: colors.accent.primary,
			border: `${colors.accent.primary}30`,
		},
	};

	const config = variantConfig[variant];

	return (
		<View
			style={[
				styles.badge,
				{ backgroundColor: config.bg, borderColor: config.border },
				style,
			]}
		>
			<Text style={[styles.text, { color: config.text }]}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	badge: {
		paddingHorizontal: Spacing.md,
		paddingVertical: Spacing.xs,
		borderRadius: BorderRadius.full,
		borderWidth: 1,
		alignSelf: "flex-start",
	},
	text: {
		fontSize: FontSizes.xs,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		fontFamily: "monospace",
	},
});
