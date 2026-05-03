import { useLocalSearchParams } from "expo-router";
import { BarChart3, FileCode, TrendingUp, Users } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../src/utils/theme";

export default function AnalyticsScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();

	return (
		<ScrollView style={styles.container}>
			<Text style={styles.title}>Analytics</Text>
			<Text style={styles.subtitle}>Repository insights and metrics</Text>

			<View style={styles.grid}>
				<View style={styles.card}>
					<BarChart3 color={Colors.chart.green} size={24} />
					<Text style={styles.cardValue}>0</Text>
					<Text style={styles.cardLabel}>Files</Text>
				</View>
				<View style={styles.card}>
					<TrendingUp color={Colors.chart.blue} size={24} />
					<Text style={styles.cardValue}>0</Text>
					<Text style={styles.cardLabel}>Commits</Text>
				</View>
				<View style={styles.card}>
					<Users color={Colors.chart.purple} size={24} />
					<Text style={styles.cardValue}>0</Text>
					<Text style={styles.cardLabel}>Contributors</Text>
				</View>
				<View style={styles.card}>
					<FileCode color={Colors.chart.orange} size={24} />
					<Text style={styles.cardValue}>0</Text>
					<Text style={styles.cardLabel}>Lines</Text>
				</View>
			</View>

			<View style={styles.placeholderCard}>
				<Text style={styles.placeholderTitle}>Commit Activity</Text>
				<Text style={styles.placeholderText}>
					Select a repository to view commit activity
				</Text>
			</View>

			<View style={styles.placeholderCard}>
				<Text style={styles.placeholderTitle}>Contributor Insights</Text>
				<Text style={styles.placeholderText}>
					Select a repository to view contributor data
				</Text>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
		paddingTop: Spacing.lg,
	},
	title: {
		fontSize: FontSizes["3xl"],
		fontWeight: "700",
		color: Colors.text.primary,
		paddingHorizontal: Spacing.xl,
	},
	subtitle: {
		fontSize: FontSizes.md,
		color: Colors.text.secondary,
		paddingHorizontal: Spacing.xl,
		marginBottom: Spacing.lg,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: Spacing.xl,
		gap: Spacing.md,
	},
	card: {
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.lg,
		padding: Spacing.lg,
		width: "47%",
		alignItems: "center",
		borderWidth: 1,
		borderColor: Colors.border,
	},
	cardValue: {
		fontSize: FontSizes["3xl"],
		fontWeight: "700",
		color: Colors.text.primary,
		marginTop: Spacing.sm,
	},
	cardLabel: {
		fontSize: FontSizes.sm,
		color: Colors.text.muted,
		marginTop: Spacing.xs,
	},
	placeholderCard: {
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.lg,
		padding: Spacing.xl,
		marginHorizontal: Spacing.xl,
		marginTop: Spacing.lg,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	placeholderTitle: {
		fontSize: FontSizes.lg,
		fontWeight: "600",
		color: Colors.text.primary,
		marginBottom: Spacing.sm,
	},
	placeholderText: {
		fontSize: FontSizes.md,
		color: Colors.text.muted,
	},
});
