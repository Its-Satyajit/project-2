import { AlertTriangle, Clock, TrendingUp } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../src/utils/theme";

export default function HotspotsScreen() {
	return (
		<ScrollView style={styles.container}>
			<Text style={styles.title}>Hotspots</Text>
			<Text style={styles.subtitle}>Frequently modified or risky files</Text>

			<View style={styles.infoCard}>
				<AlertTriangle color={Colors.status.warning} size={20} />
				<View style={styles.infoContent}>
					<Text style={styles.infoTitle}>Hotspot Detection</Text>
					<Text style={styles.infoText}>
						Hotspots are files that have high churn, complexity, or many
						dependencies. Select a repository to identify potential hotspots.
					</Text>
				</View>
			</View>

			<View style={styles.placeholderCard}>
				<TrendingUp color={Colors.chart.orange} size={32} />
				<Text style={styles.placeholderTitle}>No Hotspots Data</Text>
				<Text style={styles.placeholderText}>
					Analyze a repository to detect hotspots
				</Text>
			</View>

			<View style={styles.legend}>
				<Text style={styles.legendTitle}>How Hotspots Work</Text>
				<View style={styles.legendItem}>
					<Clock color={Colors.text.muted} size={16} />
					<Text style={styles.legendText}>High commit frequency</Text>
				</View>
				<View style={styles.legendItem}>
					<TrendingUp color={Colors.text.muted} size={16} />
					<Text style={styles.legendText}>Many lines changed over time</Text>
				</View>
				<View style={styles.legendItem}>
					<AlertTriangle color={Colors.text.muted} size={16} />
					<Text style={styles.legendText}>Complex dependencies</Text>
				</View>
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
	infoCard: {
		flexDirection: "row",
		backgroundColor: Colors.status.warning + "15",
		marginHorizontal: Spacing.xl,
		padding: Spacing.lg,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
		borderColor: Colors.status.warning + "30",
	},
	infoContent: {
		flex: 1,
		marginLeft: Spacing.md,
	},
	infoTitle: {
		fontSize: FontSizes.md,
		fontWeight: "600",
		color: Colors.text.primary,
		marginBottom: Spacing.xs,
	},
	infoText: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		lineHeight: 18,
	},
	placeholderCard: {
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.lg,
		padding: Spacing.xl,
		marginHorizontal: Spacing.xl,
		marginTop: Spacing.lg,
		alignItems: "center",
		borderWidth: 1,
		borderColor: Colors.border,
	},
	placeholderTitle: {
		fontSize: FontSizes.lg,
		fontWeight: "600",
		color: Colors.text.primary,
		marginTop: Spacing.md,
	},
	placeholderText: {
		fontSize: FontSizes.md,
		color: Colors.text.muted,
		marginTop: Spacing.xs,
	},
	legend: {
		marginTop: Spacing.xl,
		marginHorizontal: Spacing.xl,
		padding: Spacing.lg,
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	legendTitle: {
		fontSize: FontSizes.md,
		fontWeight: "600",
		color: Colors.text.primary,
		marginBottom: Spacing.md,
	},
	legendItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.sm,
		marginBottom: Spacing.sm,
	},
	legendText: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
	},
});
