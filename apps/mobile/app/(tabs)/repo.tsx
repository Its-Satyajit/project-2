import type { Contributor, FileTreeItem, HotspotData } from "@git-insights/api";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { Badge, Button, Card, Skeleton, Stat } from "~/components/ui";
import { ContributorChart, FileTree } from "~/components/viz";
import {
	useContributors,
	useDashboard,
	useRepoStatus,
	useTreemap,
} from "~/hooks";
import { BorderRadius, Colors, FontSizes, Spacing } from "~/utils/theme";

export default function RepoDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const repoId = params.id as string;
	const repoName = (params.name as string) ?? "";
	const insets = useSafeAreaInsets();
	const { width } = useWindowDimensions();
	const [activeTab, setActiveTab] = useState<
		"overview" | "files" | "contributors" | "treemap"
	>("overview");

	const { data: dashboard, isFetching } = useDashboard(repoId);
	const { data: contributors } = useContributors(repoId);
	const { data: treemap } = useTreemap(repoId);
	const { data: status } = useRepoStatus(repoId);

	const vizWidth = width - Spacing.lg * 2;

	return (
		<ScrollView
			contentContainerStyle={{
				paddingTop: insets.top + Spacing.lg,
				paddingBottom: insets.bottom + Spacing["4xl"],
			}}
			refreshControl={
				<RefreshControl
					onRefresh={() => {}}
					refreshing={isFetching}
					tintColor={Colors.accent.primary}
				/>
			}
			style={styles.container}
		>
			<View style={styles.header}>
				<View style={styles.headerRow}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backBtn}
					>
						<Text style={styles.backText}>←</Text>
					</TouchableOpacity>
					<Text numberOfLines={1} style={styles.title}>
						{repoName || `${dashboard?.owner}/${dashboard?.name}`}
					</Text>
				</View>

				{dashboard?.description && (
					<Text style={styles.description}>{dashboard.description}</Text>
				)}

				<View style={styles.metaRow}>
					{dashboard?.primaryLanguage && (
						<Badge label={dashboard.primaryLanguage} variant="info" />
					)}
					<StatusBadge status={dashboard?.analysisStatus ?? "unknown"} />
				</View>
			</View>

			<View style={styles.tabs}>
				{(["overview", "files", "contributors", "treemap"] as const).map(
					(tab) => (
						<TouchableOpacity
							key={tab}
							onPress={() => {
								void Haptics.selectionAsync();
								setActiveTab(tab);
							}}
							style={[styles.tab, activeTab === tab && styles.tabActive]}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === tab && styles.tabTextActive,
								]}
							>
								{tab.charAt(0).toUpperCase() + tab.slice(1)}
							</Text>
						</TouchableOpacity>
					),
				)}
			</View>

			{isFetching ? (
				<View style={styles.content}>
					<Skeleton height={120} style={{ marginBottom: Spacing.md }} />
					<Skeleton height={200} style={{ marginBottom: Spacing.md }} />
					<Skeleton height={150} />
				</View>
			) : (
				<View style={styles.content}>
					{activeTab === "overview" && (
						<>
							<Card style={styles.card}>
								<View style={styles.statsRow}>
									<Stat label="Stars" value={dashboard?.stars ?? 0} />
									<Stat label="Forks" value={dashboard?.forks ?? 0} />
									<Stat
										label="Contributors"
										value={dashboard?.contributorCount ?? 0}
									/>
								</View>
							</Card>

							<Card style={styles.card}>
								<View style={styles.statsRow}>
									<Stat label="Files" value={dashboard?.totalFiles ?? 0} />
									<Stat label="Dirs" value={dashboard?.totalDirectories ?? 0} />
									<Stat label="Lines" value={dashboard?.totalLines ?? 0} />
								</View>
							</Card>

							{dashboard?.fileTypeBreakdown && (
								<Card style={styles.card} title="File Type Breakdown">
									{Object.entries(dashboard.fileTypeBreakdown)
										.sort(
											([, a]: [string, number], [, b]: [string, number]) =>
												b - a,
										)
										.slice(0, 6)
										.map(([ext, count]: [string, number]) => (
											<View key={ext} style={styles.fileTypeRow}>
												<Text style={styles.fileTypeExt}>.{ext}</Text>
												<View style={styles.fileTypeBar}>
													<View
														style={[
															styles.fileTypeFill,
															{
																width: `${(count / (dashboard.totalFiles ?? 1)) * 100}%`,
															},
														]}
													/>
												</View>
												<Text style={styles.fileTypeCount}>{count}</Text>
											</View>
										))}
								</Card>
							)}

							{dashboard?.hotSpotData && dashboard.hotSpotData.length > 0 && (
								<Card style={styles.card} title="Top Hotspots">
									{dashboard.hotSpotData
										.sort((a: HotspotData, b: HotspotData) => b.score - a.score)
										.slice(0, 5)
										.map((h: HotspotData, i: number) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											<View key={i} style={styles.hotspotRow}>
												<Text style={styles.hotspotRank}>{i + 1}</Text>
												<Text numberOfLines={1} style={styles.hotspotFile}>
													{h.file}
												</Text>
												<Badge
													label={`Score: ${h.score}`}
													variant={h.score > 60 ? "error" : "warning"}
												/>
											</View>
										))}
								</Card>
							)}
						</>
					)}

					{activeTab === "files" && (
						<Card style={styles.card} title="File Structure">
							{dashboard?.fileTree && dashboard.fileTree.length > 0 ? (
								<FileTree maxDepth={4} tree={dashboard.fileTree} />
							) : (
								<Text style={styles.emptyText}>
									No file tree data available
								</Text>
							)}
						</Card>
					)}

					{activeTab === "contributors" && (
						<Card style={styles.card} title="Contributors">
							{contributors && contributors.length > 0 ? (
								<>
									<ContributorChart
										contributors={contributors.slice(0, 8)}
										size={vizWidth - Spacing.lg * 2}
									/>
									<View style={styles.contribList}>
										{contributors
											.slice(0, 10)
											.map((c: Contributor, i: number) => (
												<View key={c.id} style={styles.contribRow}>
													<Text style={styles.contribRank}>{i + 1}</Text>
													<Text style={styles.contribName}>
														{c.githubLogin}
													</Text>
													<Badge
														label={`${c.contributions} commits`}
														variant="info"
													/>
												</View>
											))}
									</View>
								</>
							) : (
								<Text style={styles.emptyText}>
									No contributor data available
								</Text>
							)}
						</Card>
					)}

					{activeTab === "treemap" && treemap && (
						<Card style={styles.card} title="Code Treemap">
							<Text style={styles.treemapStats}>
								{treemap.totalFiles} files · {formatNumber(treemap.totalLoc)}{" "}
								lines of code
							</Text>
						</Card>
					)}
				</View>
			)}
		</ScrollView>
	);
}

function StatusBadge({ status }: { status: string }) {
	const config: Record<
		string,
		{ label: string; variant: "default" | "success" | "warning" | "error" }
	> = {
		complete: { label: "Ready", variant: "success" },
		analyzing: { label: "Analyzing", variant: "warning" },
		queued: { label: "Queued", variant: "default" },
		failed: { label: "Failed", variant: "error" },
		unknown: { label: "Unknown", variant: "default" },
	};
	const { label, variant } = config[status] ?? {
		label: status,
		variant: "default",
	};
	return <Badge label={label} variant={variant} />;
}

function formatNumber(num: number): string {
	if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
	if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
	return num.toString();
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
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.md,
		marginBottom: Spacing.sm,
	},
	backBtn: {
		padding: Spacing.sm,
	},
	backText: {
		fontSize: FontSizes.xl,
		color: Colors.accent.primary,
	},
	title: {
		flex: 1,
		fontSize: FontSizes["2xl"],
		fontWeight: "700",
		color: Colors.text.primary,
	},
	description: {
		fontSize: FontSizes.md,
		color: Colors.text.secondary,
		marginBottom: Spacing.sm,
	},
	metaRow: {
		flexDirection: "row",
		gap: Spacing.sm,
	},
	tabs: {
		flexDirection: "row",
		paddingHorizontal: Spacing.lg,
		marginBottom: Spacing.lg,
		gap: Spacing.sm,
	},
	tab: {
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.sm,
		borderRadius: BorderRadius.full,
		backgroundColor: Colors.surface,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	tabActive: {
		backgroundColor: Colors.accent.primary,
		borderColor: Colors.accent.primary,
	},
	tabText: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		fontWeight: "500",
	},
	tabTextActive: {
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
	statsRow: {
		flexDirection: "row",
		gap: Spacing.md,
	},
	fileTypeRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: Spacing.sm,
	},
	fileTypeExt: {
		fontSize: FontSizes.sm,
		color: Colors.text.primary,
		width: 50,
		fontWeight: "500",
	},
	fileTypeBar: {
		flex: 1,
		height: 8,
		backgroundColor: Colors.surfaceElevated,
		borderRadius: 4,
		marginHorizontal: Spacing.sm,
	},
	fileTypeFill: {
		height: "100%",
		backgroundColor: Colors.accent.primary,
		borderRadius: 4,
	},
	fileTypeCount: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		width: 30,
		textAlign: "right",
	},
	hotspotRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
	},
	hotspotRank: {
		fontSize: FontSizes.md,
		fontWeight: "700",
		color: Colors.accent.primary,
		width: 24,
		textAlign: "center",
	},
	hotspotFile: {
		flex: 1,
		fontSize: FontSizes.sm,
		color: Colors.text.primary,
		marginLeft: Spacing.sm,
	},
	contribList: {
		marginTop: Spacing.lg,
	},
	contribRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
	},
	contribRank: {
		fontSize: FontSizes.md,
		fontWeight: "700",
		color: Colors.accent.primary,
		width: 24,
		textAlign: "center",
	},
	contribName: {
		flex: 1,
		fontSize: FontSizes.md,
		color: Colors.text.primary,
		marginLeft: Spacing.sm,
	},
	treemapStats: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
	},
	emptyText: {
		fontSize: FontSizes.md,
		color: Colors.text.muted,
		textAlign: "center",
		paddingVertical: Spacing["4xl"],
	},
});
