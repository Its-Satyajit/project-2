import React from "react";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	type ViewStyle,
} from "react-native";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../utils/theme";

interface ButtonProps {
	onPress: () => void;
	title: string;
	variant?: "primary" | "secondary" | "ghost" | "outline";
	size?: "sm" | "md" | "lg";
	disabled?: boolean;
	loading?: boolean;
	style?: ViewStyle;
}

export function Button({
	onPress,
	title,
	variant = "primary",
	size = "md",
	disabled = false,
	loading = false,
	style,
}: ButtonProps) {
	const variantStyles = {
		primary: {
			container: styles.primaryContainer,
			text: styles.primaryText,
		},
		secondary: {
			container: styles.secondaryContainer,
			text: styles.secondaryText,
		},
		ghost: {
			container: styles.ghostContainer,
			text: styles.ghostText,
		},
		outline: {
			container: styles.outlineContainer,
			text: styles.outlineText,
		},
	};

	const sizeStyles = {
		sm: { container: styles.smContainer, text: styles.smText },
		md: { container: styles.mdContainer, text: styles.mdText },
		lg: { container: styles.lgContainer, text: styles.lgText },
	};

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			disabled={disabled || loading}
			onPress={onPress}
			style={[
				styles.button,
				variantStyles[variant].container,
				sizeStyles[size].container,
				disabled && styles.disabled,
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator
					color={
						variant === "primary" ? Colors.text.primary : Colors.accent.primary
					}
					size="small"
				/>
			) : (
				<Text
					style={[
						styles.text,
						variantStyles[variant].text,
						sizeStyles[size].text,
					]}
				>
					{title}
				</Text>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	button: {
		borderRadius: BorderRadius.md,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
	},
	primaryContainer: {
		backgroundColor: Colors.accent.primary,
		paddingVertical: Spacing.sm + 2,
		paddingHorizontal: Spacing.lg,
	},
	primaryText: {
		color: Colors.text.primary,
		fontWeight: "600",
		letterSpacing: 0.3,
	},
	secondaryContainer: {
		backgroundColor: Colors.surfaceElevated,
		paddingVertical: Spacing.sm + 2,
		paddingHorizontal: Spacing.lg,
	},
	secondaryText: {
		color: Colors.text.primary,
		fontWeight: "500",
	},
	ghostContainer: {
		backgroundColor: "transparent",
		paddingVertical: Spacing.sm + 2,
		paddingHorizontal: Spacing.lg,
	},
	ghostText: {
		color: Colors.accent.primary,
		fontWeight: "500",
	},
	outlineContainer: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: Colors.accent.primary,
		paddingVertical: Spacing.sm + 2,
		paddingHorizontal: Spacing.lg,
	},
	outlineText: {
		color: Colors.accent.primary,
		fontWeight: "500",
	},
	smContainer: {
		paddingVertical: Spacing.xs + 2,
		paddingHorizontal: Spacing.md,
	},
	mdContainer: {
		paddingVertical: Spacing.sm + 2,
		paddingHorizontal: Spacing.lg,
	},
	lgContainer: {
		paddingVertical: Spacing.md,
		paddingHorizontal: Spacing.xl,
	},
	smText: {
		fontSize: FontSizes.sm - 1,
		letterSpacing: 0.2,
	},
	mdText: {
		fontSize: FontSizes.md,
		letterSpacing: 0.3,
	},
	lgText: {
		fontSize: FontSizes.lg,
		letterSpacing: 0.3,
	},
	text: {
		fontWeight: "600",
	},
	disabled: {
		opacity: 0.4,
	},
});
