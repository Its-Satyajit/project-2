import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge, Card, EmptyState, Skeleton } from "~/components/ui";
import { HotspotList, HotspotViz, TreemapViz } from "~/components/viz";
import { useHotspots, useTopRepos, useTreemap } from "~/hooks";
import { BorderRadius, Colors, FontSizes, Spacing } from "~/utils/theme";

export default function HotspotsScreen() {
	const insets = useSafeAreaInsets();
	const { width } = useWindowDimensions();
	const params = useLocalSearchParams();
	const repoId = (params.id as string) || undefined;

	const { data: allRepos } = useTopRepos(10);
	const selectedRepoId = repoId || allRepos?.[0]?.id;

	const { data: hotspots, isFetching: hotspotsLoading } = useHotspots(
		selectedRepoId ?? "",
	);
	const { data: treemap } = useTreemap(selectedRepoId ?? "");
	const [viewMode, setViewMode] = useState<"chart" | "list">("chart");

	const vizWidth = width - Spacing.lg * 2;

	if (!selectedRepoId) {
		return (
			<View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
				<Text style={styles.emptyText}>
					Select a repository to view hotspots
				</Text>
			</View>
		);
	}

	const criticalCount = hotspots?.filter((h) => h.score > 60).length ?? 0;
	const avgScore = hotspots?.length
		? Math.round(
				hotspots.reduce((sum: number, h) => sum + h.score, 0) / hotspots.length,
			)
		: 0;

	return (
		<ScrollView
			contentContainerStyle={{
				paddingTop: insets.top + Spacing.lg,
				paddingBottom: insets.bottom + Spacing["4xl"],
			}}
			refreshControl={
				<RefreshControl
					onRefresh={() => {}}
					refreshing={hotspotsLoading}
					tintColor={Colors.accent.primary}
				/>
			}
			style={styles.container}
		>
			<View style={styles.header}>
				<Text style={styles.title}>Hotspot Detection</Text>
				<Text style={styles.subtitle}>
					Identify risky and frequently modified files
				</Text>
			</View>

			<View style={styles.statsRow}>
				<Card style={styles.statCard}>
					<Text style={styles.statValue}>{hotspots?.length ?? 0}</Text>
					<Text style={styles.statLabel}>Hotspots</Text>
				</Card>
				<Card style={styles.statCard}>
					<Text style={[styles.statValue, { color: Colors.status.error }]}>
						{criticalCount}
					</Text>
					<Text style={styles.statLabel}>Critical</Text>
				</Card>
				<Card style={styles.statCard}>
					<Text style={styles.statValue}>{avgScore}</Text>
					<Text style={styles.statLabel}>Avg Score</Text>
				</Card>
			</View>

			<View style={styles.viewToggle}>
				<TouchableOpacity
					onPress={() => {
						void Haptics.selectionAsync();
						setViewMode("chart");
					}}
					style={[
						styles.toggleBtn,
						viewMode === "chart" && styles.toggleBtnActive,
					]}
				>
					<Text
						style={[
							styles.toggleText,
							viewMode === "chart" && styles.toggleTextActive,
						]}
					>
						Chart
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => {
						void Haptics.selectionAsync();
						setViewMode("list");
					}}
					style={[
						styles.toggleBtn,
						viewMode === "list" && styles.toggleBtnActive,
					]}
				>
					<Text
						style={[
							styles.toggleText,
							viewMode === "list" && styles.toggleTextActive,
						]}
					>
						List
					</Text>
				</TouchableOpacity>
			</View>

			{hotspotsLoading ? (
				<View style={styles.content}>
					<Skeleton height={200} />
				</View>
			) : hotspots && hotspots.length > 0 ? (
				<View style={styles.content}>
					{viewMode === "chart" ? (
						<>
							<Card style={styles.card} title="Risk Distribution">
								<HotspotViz data={hotspots} width={vizWidth} />
							</Card>
							{treemap && (
								<Card style={styles.card} title="Code Structure Map">
									<TreemapViz
										data={treemap.files}
										height={300}
										width={vizWidth}
									/>
								</Card>
							)}
						</>
					) : (
						<Card style={styles.card} title="Ranked Hotspots">
							<HotspotList data={hotspots} />
						</Card>
					)}
				</View>
			) : (
				<EmptyState
					description="Run a repository analysis to detect hotspots"
					icon="🔥"
					title="No hotspot data"
				/>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	header: {
		paddingHorizontal: Spacing.lg,
		marginBottom: Spacing.lg,
	},
	title: {
		fontSize: FontSizes["3xl"],
		fontWeight: "700",
		color: Colors.text.primary,
	},
	subtitle: {
		fontSize: FontSizes.md,
		color: Colors.text.muted,
		marginTop: Spacing.xs,
	},
	statsRow: {
		flexDirection: "row",
		paddingHorizontal: Spacing.lg,
		marginBottom: Spacing.lg,
		gap: Spacing.sm,
	},
	statCard: {
		flex: 1,
		alignItems: "center",
		padding: Spacing.md,
	},
	statValue: {
		fontSize: FontSizes["2xl"],
		fontWeight: "700",
		color: Colors.accent.primary,
	},
	statLabel: {
		fontSize: FontSizes.xs,
		color: Colors.text.muted,
		marginTop: Spacing.xs,
		textTransform: "uppercase",
	},
	viewToggle: {
		flexDirection: "row",
		paddingHorizontal: Spacing.lg,
		marginBottom: Spacing.lg,
		gap: Spacing.sm,
	},
	toggleBtn: {
		flex: 1,
		paddingVertical: Spacing.sm,
		borderRadius: BorderRadius.md,
		backgroundColor: Colors.surface,
		borderWidth: 1,
		borderColor: Colors.border,
		alignItems: "center",
	},
	toggleBtnActive: {
		backgroundColor: Colors.accent.primary,
		borderColor: Colors.accent.primary,
	},
	toggleText: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		fontWeight: "500",
	},
	toggleTextActive: {
		color: "#000",
		fontWeight: "600",
	},
	content: {
		paddingHorizontal: Spacing.lg,
		gap: Spacing.lg,
	},
	card: {
		marginBottom: 0,
	},
	emptyText: {
		fontSize: FontSizes.md,
		color: Colors.text.muted,
		textAlign: "center",
		paddingVertical: Spacing["4xl"],
	},
});
