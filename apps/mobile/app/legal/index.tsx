import { Database, Eye, Lock, Shield } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, Colors, FontSizes, Spacing } from "~/utils/theme";

const POLICIES = [
	{
		icon: Lock,
		title: "No Source Code Storage",
		content:
			"We never store your source code. Repository contents are fetched directly from GitHub on-demand and displayed temporarily in your browser only.",
	},
	{
		icon: Database,
		title: "Minimal Metadata Caching",
		content:
			"We only cache public metadata (names, star counts, contributor counts) for performance.",
	},
	{
		icon: Eye,
		title: "No Cookies or Tracking",
		content:
			"We don't use cookies or persistent tracking. No personal data is collected.",
	},
	{
		icon: Shield,
		title: "Secure Fetching",
		content:
			"All data is fetched directly from GitHub's API on-demand. No third-party servers.",
	},
];

const LEGAL_CONTENT = [
	{
		title: "Privacy Policy",
		content: `Git Insights Analyzer ("we", "our", or "us") is committed to protecting your privacy.

Data We Don't Collect:
- No personal information
- No cookies or tracking
- No source code storage

Data We May Cache:
- Repository metadata (names, descriptions)
- Star/fork counts
- Contributor counts
- File type statistics`,
	},
	{
		title: "Terms of Service",
		content: `By using Git Insights Analyzer, you agree to:
1. Use for legitimate code analysis
2. Not extract/store content beyond display
3. Respect GitHub's API terms
4. Not use for unlawful purposes`,
	},
	{
		title: "License",
		content: `MIT License
Copyright (c) 2024 Git Insights Analyzer
Permission is hereby granted to use, copy, modify, and distribute.`,
	},
];

export default function LegalScreen() {
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={{
					paddingTop: insets.top + Spacing.lg,
					paddingBottom: insets.bottom + Spacing.xl,
				}}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Text style={styles.title}>Privacy - Legal</Text>
					<Text style={styles.subtitle}>Your privacy is our priority</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Our Commitment</Text>
					<View style={styles.policiesGrid}>
						{POLICIES.map((policy, i) => (
							<View key={i} style={styles.policyCard}>
								<View style={styles.policyIconBox}>
									<policy.icon color={Colors.accent.primary} size={22} />
								</View>
								<Text style={styles.policyTitle}>{policy.title}</Text>
								<Text style={styles.policyContent}>{policy.content}</Text>
							</View>
						))}
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Legal Documents</Text>
					<View style={styles.legalCard}>
						{LEGAL_CONTENT.map((item, i) => (
							<View key={i} style={styles.legalItem}>
								<Text style={styles.legalTitle}>{item.title}</Text>
								<Text style={styles.legalContent}>{item.content}</Text>
							</View>
						))}
					</View>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>Last updated: May 2024</Text>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	header: {
		paddingHorizontal: Spacing.xl,
		paddingBottom: Spacing.xl,
	},
	title: {
		fontSize: FontSizes["3xl"],
		fontWeight: "700",
		color: Colors.text.primary,
		marginBottom: Spacing.sm,
	},
	subtitle: {
		fontSize: FontSizes.md,
		color: Colors.text.secondary,
	},
	section: {
		paddingHorizontal: Spacing.xl,
		marginBottom: Spacing.xl,
	},
	sectionLabel: {
		fontSize: FontSizes.xs,
		color: Colors.accent.primary,
		textTransform: "uppercase",
		letterSpacing: 2,
		marginBottom: Spacing.md,
	},
	policiesGrid: {
		gap: 1,
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
		borderColor: Colors.border,
		overflow: "hidden",
	},
	policyCard: {
		padding: Spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
	},
	policyIconBox: {
		marginBottom: Spacing.sm,
	},
	policyTitle: {
		fontSize: FontSizes.md,
		fontWeight: "600",
		color: Colors.text.primary,
		marginBottom: Spacing.xs,
	},
	policyContent: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		lineHeight: 20,
	},
	legalCard: {
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
		borderColor: Colors.border,
		overflow: "hidden",
	},
	legalItem: {
		padding: Spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
	},
	legalTitle: {
		fontSize: FontSizes.md,
		fontWeight: "600",
		color: Colors.text.primary,
		marginBottom: Spacing.md,
	},
	legalContent: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		lineHeight: 22,
	},
	footer: {
		alignItems: "center",
		paddingVertical: Spacing.xl,
	},
	footerText: {
		fontSize: FontSizes.sm,
		color: Colors.text.muted,
	},
});
