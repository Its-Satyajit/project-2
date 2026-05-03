import type React from "react";
import {
	type StyleProp,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from "react-native";
import { BorderRadius, Shadows, Spacing } from "../../utils/theme";
import { useTheme } from "../Provider";

interface CardProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	title?: string;
	subtitle?: string;
	action?: React.ReactNode;
	noPadding?: boolean;
}

export function Card({
	children,
	style,
	title,
	subtitle,
	action,
	noPadding = false,
}: CardProps) {
	const { colors } = useTheme();
	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: colors.surface,
					borderColor: colors.border,
				},
				Shadows.sm,
				style,
			]}
		>
			{(title || subtitle || action) && (
				<View
					style={[
						styles.header,
						{ borderBottomColor: colors.border },
					]}
				>
					<View style={styles.titleRow}>
						{title && (
							<Text style={[styles.title, { color: colors.text.primary }]}>
								{title}
							</Text>
						)}
						{subtitle && (
							<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
								{subtitle}
							</Text>
						)}
					</View>
					{action && <View>{action}</View>}
				</View>
			)}
			<View style={[noPadding ? styles.noPadding : styles.padding]}>
				{children}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: BorderRadius.sm,
		borderWidth: 1,
		overflow: "hidden",
		marginVertical: Spacing.sm,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	titleRow: {
		flex: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		letterSpacing: -0.3,
	},
	subtitle: {
		fontSize: 14,
		marginTop: 4,
		letterSpacing: 0.1,
	},
	padding: {
		padding: 20,
	},
	noPadding: {
		padding: 0,
	},
});
