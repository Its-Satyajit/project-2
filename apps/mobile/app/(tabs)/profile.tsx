import { useRouter } from "expo-router";
import {
	ArrowRight,
	FileText,
	GitBranch,
	Info,
	Moon,
	Settings,
	Sun,
	User,
} from "lucide-react-native";
import React from "react";
import {
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/components/Provider";
import { BorderRadius, Colors, FontSizes, Spacing } from "~/utils/theme";

const MENU_ITEMS = [
	{ icon: User, label: "Profile", route: null, badge: null },
	{ icon: Info, label: "About", route: "/about", badge: null },
	{ icon: FileText, label: "Privacy & Legal", route: "/legal", badge: null },
];

export default function ProfileScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { isDark, toggleTheme, colors } = useTheme();

	const handlePress = (route?: string) => {
		if (route) {
			router.push(route as any);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: "transparent" }]}>
			<ScrollView
				contentContainerStyle={{
					paddingTop: insets.top + Spacing.lg,
					paddingBottom: insets.bottom + 100,
				}}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<View
						style={[
							styles.avatar,
							{ backgroundColor: colors.surface, borderColor: colors.border },
						]}
					>
						<User color={colors.text.muted} size={32} />
					</View>
					<Text style={[styles.title, { color: colors.text.primary }]}>
						Guest User
					</Text>
					<Text style={[styles.subtitle, { color: colors.text.muted }]}>
						Sign in to save progress
					</Text>
				</View>

				<TouchableOpacity
					style={[
						styles.signInButton,
						{ backgroundColor: colors.accent.primary },
					]}
				>
					<GitBranch color={Colors.background} size={18} />
					<Text style={styles.signInText}>Sign in with GitHub</Text>
				</TouchableOpacity>

				<View style={styles.menuSection}>
					<Text style={[styles.sectionLabel, { color: colors.accent.primary }]}>
						Menu
					</Text>
					<View
						style={[
							styles.menuCard,
							{ backgroundColor: colors.surface, borderColor: colors.border },
						]}
					>
						{MENU_ITEMS.map((item, i) => (
							<TouchableOpacity
								key={i}
								onPress={() => handlePress(item.route || undefined)}
								style={[styles.menuItem, { borderBottomColor: colors.border }]}
							>
								<item.icon color={colors.text.secondary} size={20} />
								<Text
									style={[styles.menuLabel, { color: colors.text.primary }]}
								>
									{item.label}
								</Text>
								{item.badge && (
									<View
										style={[
											styles.menuBadge,
											{ backgroundColor: colors.accent.muted },
										]}
									>
										<Text
											style={[
												styles.menuBadgeText,
												{ color: colors.accent.primary },
											]}
										>
											{item.badge}
										</Text>
									</View>
								)}
								<ArrowRight color={colors.text.muted} size={16} />
							</TouchableOpacity>
						))}
					</View>
				</View>

				<View style={styles.menuSection}>
					<Text style={[styles.sectionLabel, { color: colors.accent.primary }]}>
						Appearance
					</Text>
					<View
						style={[
							styles.menuCard,
							{ backgroundColor: colors.surface, borderColor: colors.border },
						]}
					>
						<View
							style={[styles.menuItem, { borderBottomColor: colors.border }]}
						>
							{isDark ? (
								<Moon color={colors.text.secondary} size={20} />
							) : (
								<Sun color={colors.text.secondary} size={20} />
							)}
							<Text style={[styles.menuLabel, { color: colors.text.primary }]}>
								Dark Mode
							</Text>
							<Switch
								onValueChange={toggleTheme}
								thumbColor={colors.background}
								trackColor={{
									false: colors.border,
									true: colors.accent.primary,
								}}
								value={isDark}
							/>
						</View>
					</View>
				</View>

				<View style={styles.footer}>
					<Text style={[styles.footerText, { color: colors.text.muted }]}>
						Git Insights Analyzer v1.0.0
					</Text>
					<Text style={[styles.footerSubtext, { color: colors.text.muted }]}>
						Free - Open Source
					</Text>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		alignItems: "center",
		paddingHorizontal: Spacing.xl,
		paddingBottom: Spacing.xl,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: Spacing.lg,
		borderWidth: 2,
	},
	title: {
		fontSize: FontSizes.xl,
		fontWeight: "700",
		marginBottom: Spacing.xs,
	},
	subtitle: {
		fontSize: FontSizes.sm,
	},
	signInButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.sm,
		marginHorizontal: Spacing.xl,
		marginBottom: Spacing.xl,
		padding: Spacing.md,
		borderRadius: BorderRadius.sm,
	},
	signInText: {
		fontSize: FontSizes.sm,
		fontWeight: "600",
		color: "#ffffff",
	},
	menuSection: {
		paddingHorizontal: Spacing.xl,
		marginBottom: Spacing.xl,
	},
	sectionLabel: {
		fontSize: FontSizes.xs,
		textTransform: "uppercase",
		letterSpacing: 2,
		marginBottom: Spacing.md,
	},
	menuCard: {
		borderRadius: BorderRadius.sm,
		borderWidth: 1,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: Spacing.lg,
		borderBottomWidth: 1,
		gap: Spacing.md,
	},
	menuLabel: {
		flex: 1,
		fontSize: FontSizes.md,
	},
	menuBadge: {
		paddingHorizontal: Spacing.sm,
		paddingVertical: 2,
		borderRadius: BorderRadius.sm,
	},
	menuBadgeText: {
		fontSize: FontSizes.xs,
		fontWeight: "600",
	},
	footer: {
		alignItems: "center",
		paddingVertical: Spacing.xl,
	},
	footerText: {
		fontSize: FontSizes.sm,
		marginBottom: Spacing.xs,
	},
	footerSubtext: {
		fontSize: FontSizes.xs,
	},
});
