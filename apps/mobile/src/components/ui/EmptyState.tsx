import type { LucideIcon } from "lucide-react-native";
import type React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../utils/theme";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
	style?: ViewStyle;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	style,
}: EmptyStateProps) {
	return (
		<View style={[styles.container, style]}>
			{Icon && (
				<View style={styles.iconWrapper}>
					<Icon color={Colors.text.muted} size={48} strokeWidth={1.5} />
				</View>
			)}
			<Text style={styles.title}>{title}</Text>
			{description && <Text style={styles.description}>{description}</Text>}
			{action && <View style={styles.action}>{action}</View>}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: Spacing["4xl"],
		paddingHorizontal: Spacing.xl,
	},
	iconWrapper: {
		marginBottom: Spacing.lg,
		opacity: 0.6,
	},
	title: {
		fontSize: FontSizes.xl,
		fontWeight: "600",
		color: Colors.text.primary,
		textAlign: "center",
		marginBottom: Spacing.sm,
	},
	description: {
		fontSize: FontSizes.md,
		color: Colors.text.secondary,
		textAlign: "center",
		marginBottom: Spacing.lg,
	},
	action: {
		marginTop: Spacing.md,
	},
});
