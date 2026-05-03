import { useRouter } from "expo-router";
import {
	BarChart3,
	ChevronRight,
	Code2,
	ExternalLink,
	FileText,
	Network,
	Shield,
	Sparkles,
	Target,
} from "lucide-react-native";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/components/Provider";
import { BorderRadius, FontSizes, Spacing } from "~/utils/theme";

const FAQ_DATA = [
	{
		q: "What is Git Insights Analyzer?",
		a: "Git Insights Analyzer is a free, open-source tool that performs deep structural analysis of GitHub repositories. It visualizes file structures, maps dependency graphs, identifies code hotspots, and provides AI-powered insights about your codebase architecture.",
	},
	{
		q: "Is my code stored on your servers?",
		a: "No. We never store your source code. Repository contents are fetched directly from GitHub on-demand and displayed temporarily in your browser only. We only cache public metadata like repository names, star counts, and contributor information.",
	},
	{
		q: "How does the dependency analysis work?",
		a: "We use Tree-sitter AST parsing to generate precise Syntax Trees for every file in your repository. This enables accurate detection of imports, exports, and dependencies across 100+ programming languages without relying on regex patterns.",
	},
	{
		q: "What are code hotspots?",
		a: "Code hotspots are files identified as high-risk based on a combination of complexity metrics, dependency weights, and change frequency from git history. These are the files that typically benefit most from refactoring or additional attention.",
	},
	{
		q: "Does it work with private repositories?",
		a: "Yes. Git Insights Analyzer supports private repositories through GitHub OAuth authentication. Your repository contents remain private and are fetched securely on-demand.",
	},
];

const FEATURES = [
	{
		icon: Code2,
		title: "File Structure",
		desc: "Interactive file tree with language breakdown",
	},
	{
		icon: Network,
		title: "Dependency Graph",
		desc: "AST-powered import detection",
	},
	{
		icon: Target,
		title: "Hotspot Detection",
		desc: "Identify high-risk files",
	},
	{
		icon: BarChart3,
		title: "Visual Analytics",
		desc: "Code composition charts",
	},
];

export default function AboutScreen() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const router = useRouter();

	const handleOpenGithub = () => {
		Linking.openURL("https://github.com/your-org/repo");
	};

	return (
		<View style={[styles.container, { backgroundColor: "transparent" }]}>
			<ScrollView
				contentContainerStyle={{
					paddingTop: insets.top + Spacing.lg,
					paddingBottom: insets.bottom + Spacing.xl,
				}}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text.primary }]}>About</Text>
					<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
						Deep structural analysis for GitHub repositories
					</Text>
				</View>

				<View style={styles.section}>
					<Text style={[styles.sectionLabel, { color: colors.accent.primary }]}>What We Do</Text>
					<View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
						<Text style={[styles.contentText, { color: colors.text.secondary }]}>
							Git Insights Analyzer is a free tool that performs deep structural
							analysis of GitHub repositories. Visualize file structures, map
							dependencies, find code hotspots, and get AI-powered architecture
							insights.
						</Text>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={[styles.sectionLabel, { color: colors.accent.primary }]}>Features</Text>
					<View style={[styles.featuresGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
						{FEATURES.map((feature) => (
							<View key={feature.title} style={[styles.featureCard, { borderRightColor: colors.border, borderBottomColor: colors.border }]}>
								<View style={styles.featureIconBox}>
									<feature.icon color={colors.accent.primary} size={22} />
								</View>
								<Text style={[styles.featureTitle, { color: colors.text.primary }]}>{feature.title}</Text>
								<Text style={[styles.featureDesc, { color: colors.text.muted }]}>{feature.desc}</Text>
							</View>
						))}
					</View>
				</View>

				<View style={styles.section}>
					<Text style={[styles.sectionLabel, { color: colors.accent.primary }]}>FAQ</Text>
					<View style={[styles.faqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
						{FAQ_DATA.map((faq) => (
							<View key={faq.q} style={[styles.faqItem, { borderBottomColor: colors.border }]}>
								<Text style={[styles.faqQ, { color: colors.text.primary }]}>{faq.q}</Text>
								<Text style={[styles.faqA, { color: colors.text.secondary }]}>{faq.a}</Text>
							</View>
						))}
					</View>
				</View>

				<TouchableOpacity
					onPress={() => router.push("/legal")}
					style={[styles.linkRow, { backgroundColor: colors.surface }]}
				>
					<View style={styles.linkContent}>
						<Shield color={colors.text.muted} size={18} />
						<Text style={[styles.linkText, { color: colors.text.primary }]}>Privacy Policy</Text>
					</View>
					<ChevronRight color={colors.text.muted} size={18} />
				</TouchableOpacity>

				<View style={styles.footer}>
					<Text style={[styles.version, { color: colors.text.muted }]}>Version 1.0.0</Text>
					<Text style={[styles.copyright, { color: colors.text.muted }]}>Open source - MIT License</Text>
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
		paddingHorizontal: Spacing.xl,
		paddingBottom: Spacing.xl,
	},
	title: {
		fontSize: FontSizes["3xl"],
		fontWeight: "700",
		marginBottom: Spacing.sm,
	},
	subtitle: {
		fontSize: FontSizes.md,
	},
	section: {
		paddingHorizontal: Spacing.xl,
		marginBottom: Spacing.xl,
	},
	sectionLabel: {
		fontSize: FontSizes.xs,
		textTransform: "uppercase",
		letterSpacing: 2,
		marginBottom: Spacing.md,
	},
	contentCard: {
		borderRadius: BorderRadius.lg,
		padding: Spacing.lg,
		borderWidth: 1,
	},
	contentText: {
		fontSize: FontSizes.sm,
		lineHeight: 22,
	},
	featuresGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 1,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
		overflow: "hidden",
	},
	featureCard: {
		width: "50%",
		padding: Spacing.lg,
		borderRightWidth: 1,
		borderBottomWidth: 1,
	},
	featureIconBox: {
		marginBottom: Spacing.sm,
	},
	featureTitle: {
		fontSize: FontSizes.sm,
		fontWeight: "600",
		marginBottom: Spacing.xs,
	},
	featureDesc: {
		fontSize: FontSizes.xs,
		lineHeight: 16,
	},
	faqCard: {
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
	},
	faqItem: {
		padding: Spacing.lg,
		borderBottomWidth: 1,
	},
	faqQ: {
		fontSize: FontSizes.sm,
		fontWeight: "600",
		marginBottom: Spacing.sm,
	},
	faqA: {
		fontSize: FontSizes.sm,
		lineHeight: 20,
	},
	linkRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing.xl,
		paddingVertical: Spacing.lg,
		marginHorizontal: Spacing.xl,
		borderRadius: BorderRadius.lg,
		marginBottom: Spacing.xl,
	},
	linkContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.md,
	},
	linkText: {
		fontSize: FontSizes.md,
	},
	footer: {
		alignItems: "center",
		paddingVertical: Spacing.xl,
	},
	version: {
		fontSize: FontSizes.sm,
		marginBottom: Spacing.xs,
	},
	copyright: {
		fontSize: FontSizes.xs,
	},
});
