"use client";

import type { Repository } from "@git-insights/api";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { BarChart3, ExternalLink } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/components/Provider";
import { Badge, EmptyState, Skeleton, Stat } from "~/components/ui";
import { useDashboard, useTopRepos } from "~/hooks";
import { BorderRadius, FontSizes, Spacing } from "~/utils/theme";

export default function AnalyticsScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { data: repos, isLoading } = useTopRepos(50);
	const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
	const [view, setView] = useState(0);

	useEffect(() => {
		if (repos && repos.length > 0 && !selectedRepo) {
			setSelectedRepo(repos[0]);
		}
	}, [repos, selectedRepo]);

	const { data: dashboard, isLoading: dashboardLoading } = useDashboard(
		selectedRepo?.id || "",
	);

	const formatNum = (n?: number) =>
		!n
			? "0"
			: n >= 1000000
				? `${(n / 1000000).toFixed(1)}M`
				: n >= 1000
					? `${(n / 1000).toFixed(1)}K`
					: n.toString();

	const handleSelectRepo = (repo: Repository) => {
		void Haptics.selectionAsync();
		setSelectedRepo(repo);
		router.push({
			pathname: "/[owner]/[name]",
			params: { owner: repo.owner, name: repo.name },
		});
	};

	const renderRepoSelector = () => (
		<View style={styles.repoSelector}>
			<ScrollView
				contentContainerStyle={styles.repoScroll}
				horizontal
				showsHorizontalScrollIndicator={false}
			>
				{isLoading ? (
					<Skeleton height={48} width={120} />
				) : (
					repos?.slice(0, 10).map((repo) => (
						<TouchableOpacity
							key={repo.id}
							onPress={() => handleSelectRepo(repo)}
							style={[
								styles.repoChip,
								{ backgroundColor: colors.surface },
								selectedRepo?.id === repo.id && {
									backgroundColor: colors.accent.primary,
								},
							]}
						>
							<Text
								numberOfLines={1}
								style={[
									styles.repoChipText,
									{ color: colors.text.secondary },
									selectedRepo?.id === repo.id && {
										color: colors.primary || colors.background,
										fontWeight: "700",
									},
								]}
							>
								{repo.name}
							</Text>
						</TouchableOpacity>
					))
				)}
			</ScrollView>
		</View>
	);

	const renderOverview = () => (
		<View style={styles.contentSection}>
			<Text style={[styles.sectionLabel, { color: colors.accent.primary }]}>
				Summary
			</Text>
			<View style={styles.statsGrid}>
				<View
					style={[
						styles.statCard,
						{ backgroundColor: colors.surface, borderColor: colors.border },
					]}
				>
					<Text style={[styles.statValue, { color: colors.accent.primary }]}>
						{formatNum(dashboard?.stars)}
					</Text>
					<Text style={[styles.statLabel, { color: colors.text.muted }]}>
						Stars
					</Text>
				</View>
				<View
					style={[
						styles.statCard,
						{ backgroundColor: colors.surface, borderColor: colors.border },
					]}
				>
					<Text style={[styles.statValue, { color: colors.accent.primary }]}>
						{formatNum(dashboard?.forks)}
					</Text>
					<Text style={[styles.statLabel, { color: colors.text.muted }]}>
						Forks
					</Text>
				</View>
				<View
					style={[
						styles.statCard,
						{ backgroundColor: colors.surface, borderColor: colors.border },
					]}
				>
					<Text style={[styles.statValue, { color: colors.accent.primary }]}>
						{formatNum(dashboard?.contributorCount)}
					</Text>
					<Text style={[styles.statLabel, { color: colors.text.muted }]}>
						Contributors
					</Text>
				</View>
			</View>

			<View style={styles.statsGrid}>
				<View
					style={[
						styles.statCard,
						{ backgroundColor: colors.surface, borderColor: colors.border },
					]}
				>
					<Text style={[styles.statValue, { color: colors.accent.primary }]}>
						{formatNum(dashboard?.totalFiles)}
					</Text>
					<Text style={[styles.statLabel, { color: colors.text.muted }]}>
						Files
					</Text>
				</View>
				<View
					style={[
						styles.statCard,
						{ backgroundColor: colors.surface, borderColor: colors.border },
					]}
				>
					<Text style={[styles.statValue, { color: colors.accent.primary }]}>
						{formatNum(dashboard?.totalDirectories)}
					</Text>
					<Text style={[styles.statLabel, { color: colors.text.muted }]}>
						Directories
					</Text>
				</View>
				<View
					style={[
						styles.statCard,
						{ backgroundColor: colors.surface, borderColor: colors.border },
					]}
				>
					<Text style={[styles.statValue, { color: colors.accent.primary }]}>
						{formatNum(dashboard?.totalLines)}
					</Text>
					<Text style={[styles.statLabel, { color: colors.text.muted }]}>
						Lines
					</Text>
				</View>
			</View>

			{dashboard?.fileTypeBreakdown && (
				<>
					<Text style={[styles.sectionLabel, { color: colors.accent.primary }]}>
						Language Breakdown
					</Text>
					<View
						style={[
							styles.chartCard,
							{ backgroundColor: colors.surface, borderColor: colors.border },
						]}
					>
						{Object.entries(
							dashboard.fileTypeBreakdown as Record<string, number>,
						)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 8)
							.map(([ext, count]) => {
								const total = dashboard?.totalFiles || 1;
								const pct = Math.round((count / total) * 100);
								return pct >= 1 ? (
									<View key={ext} style={styles.barRow}>
										<Text
											style={[styles.barExt, { color: colors.text.primary }]}
										>
											.{ext}
										</Text>
										<View
											style={[
												styles.barBg,
												{ backgroundColor: colors.surfaceElevated },
											]}
										>
											<View
												style={[
													styles.barFill,
													{
														width: `${pct}%`,
														backgroundColor: colors.accent.primary,
													},
												]}
											/>
										</View>
										<Text style={styles.barPct}>{pct}%</Text>
									</View>
								) : null;
							})}
					</View>
				</>
			)}
		</View>
	);

	const renderData = () => {
		if (!selectedRepo) {
			return (
				<EmptyState
					description="Select a repository to view insights"
					icon={BarChart3}
					title="No repository"
				/>
			);
		}

		if (dashboardLoading) {
			return (
				<View style={styles.loadingContainer}>
					<ActivityIndicator color={colors.accent.primary} />
					<Text style={[styles.loadingText, { color: colors.text.muted }]}>
						Loading insights...
					</Text>
				</View>
			);
		}

		switch (view) {
			case 0:
				return renderOverview();
			default:
				return (
					<TouchableOpacity
						onPress={() =>
							router.push({
								pathname: "/[owner]/[name]",
								params: { owner: selectedRepo.owner, name: selectedRepo.name },
							})
						}
						style={[
							styles.viewOnWeb,
							{
								backgroundColor: colors.surface,
								borderColor: colors.accent.primary,
							},
						]}
					>
						<ExternalLink color={colors.accent.primary} size={18} />
						<Text
							style={[styles.viewOnWebText, { color: colors.accent.primary }]}
						>
							View full dashboard in browser
						</Text>
					</TouchableOpacity>
				);
		}
	};

	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={{
					paddingTop: insets.top + Spacing.lg,
					paddingBottom: insets.bottom + 100,
				}}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text.primary }]}>
						Insights
					</Text>
					<Text style={[styles.subtitle, { color: colors.text.muted }]}>
						Repository analytics & metrics
					</Text>
				</View>

				{renderRepoSelector()}

				{selectedRepo && (
					<View style={styles.selectedRepoHeader}>
						<Text
							style={[styles.selectedRepoName, { color: colors.text.primary }]}
						>
							{selectedRepo.owner}/{selectedRepo.name}
						</Text>
						<Badge
							label={
								selectedRepo.analysisStatus === "complete"
									? "Ready"
									: "Analyzing"
							}
							variant={
								selectedRepo.analysisStatus === "complete"
									? "success"
									: "warning"
							}
						/>
					</View>
				)}

				<View style={styles.viewTabs}>
					{["Overview", "Files", "Deps"].map((v, i) => (
						<TouchableOpacity
							key={v}
							onPress={() => {
								void Haptics.selectionAsync();
								setView(i);
							}}
							style={[
								styles.viewTab,
								{ backgroundColor: colors.surface },
								view === i && { backgroundColor: colors.accent.primary },
							]}
						>
							<Text
								style={[
									styles.viewTabText,
									{ color: colors.text.secondary },
									view === i && { color: colors.background, fontWeight: "600" },
								]}
							>
								{v}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{renderData()}

				<View style={styles.footer}>
					<TouchableOpacity
						onPress={() => router.push("/about")}
						style={styles.footerLink}
					>
						<ExternalLink color={colors.text.muted} size={14} />
						<Text style={[styles.footerLinkText, { color: colors.text.muted }]}>
							About
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => router.push("/legal")}
						style={styles.footerLink}
					>
						<Text style={[styles.footerLinkText, { color: colors.text.muted }]}>
							Privacy & Legal
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent",
	},
	header: {
		paddingHorizontal: Spacing.xl,
		marginBottom: Spacing.lg,
	},
	title: {
		fontSize: FontSizes["2xl"],
		fontWeight: "700",
		marginBottom: Spacing.xs,
	},
	subtitle: {
		fontSize: FontSizes.sm,
	},
	repoSelector: {
		marginBottom: Spacing.lg,
		borderBottomWidth: 1,
	},
	repoScroll: {
		paddingHorizontal: Spacing.xl,
		gap: Spacing.sm,
	},
	repoChip: {
		paddingVertical: Spacing.sm,
		paddingHorizontal: Spacing.md,
		borderRadius: BorderRadius.full,
		maxWidth: 140,
	},
	repoChipActive: {},
	repoChipText: {
		fontSize: 11, // ~0.6875rem
		fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
		textTransform: "uppercase",
		letterSpacing: 1,
		fontWeight: "500",
	},
	repoChipTextActive: {
		fontWeight: "700",
	},
	selectedRepoHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing.xl,
		marginBottom: Spacing.lg,
	},
	selectedRepoName: {
		fontSize: FontSizes.lg,
		fontWeight: "600",
	},
	viewTabs: {
		flexDirection: "row",
		paddingHorizontal: Spacing.xl,
		marginBottom: Spacing.lg,
		gap: Spacing.sm,
	},
	viewTab: {
		paddingVertical: Spacing.sm,
		paddingHorizontal: Spacing.md,
		borderRadius: BorderRadius.md,
	},
	viewTabActive: {},
	viewTabText: {
		fontSize: FontSizes.sm,
	},
	viewTabTextActive: {
		fontWeight: "600",
	},
	contentSection: {
		paddingHorizontal: Spacing.xl,
	},
	sectionLabel: {
		fontSize: FontSizes.xs,
		textTransform: "uppercase",
		letterSpacing: 2,
		marginBottom: Spacing.md,
	},
	statsGrid: {
		flexDirection: "row",
		gap: Spacing.sm,
		marginBottom: Spacing.md,
	},
	statCard: {
		flex: 1,
		borderRadius: BorderRadius.lg,
		padding: Spacing.md,
		alignItems: "center",
		borderWidth: 1,
	},
	statValue: {
		fontSize: FontSizes.lg,
		fontWeight: "700",
		marginBottom: Spacing.xs,
	},
	statLabel: {
		fontSize: FontSizes.xs,
	},
	chartCard: {
		borderRadius: BorderRadius.lg,
		padding: Spacing.lg,
		borderWidth: 1,
	},
	barRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: Spacing.sm,
	},
	barExt: {
		width: 40,
		fontSize: FontSizes.sm,
	},
	barBg: {
		flex: 1,
		height: 8,
		borderRadius: 4,
		marginHorizontal: Spacing.sm,
	},
	barFill: {
		height: "100%",
		borderRadius: 4,
	},
	barPct: {
		width: 35,
		fontSize: FontSizes.sm,
		textAlign: "right",
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: Spacing.xl * 2,
	},
	loadingText: {
		marginTop: Spacing.md,
		fontSize: FontSizes.sm,
	},
	viewOnWeb: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.sm,
		marginTop: Spacing.xl,
		padding: Spacing.lg,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
	},
	viewOnWebText: {
		fontSize: FontSizes.sm,
		fontWeight: "600",
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		paddingVertical: Spacing.xl,
		gap: Spacing.xl,
		marginTop: Spacing.xl,
	},
	footerLink: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.xs,
	},
	footerLinkText: {
		fontSize: FontSizes.xs,
	},
});
