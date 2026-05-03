import type { Repository } from "@git-insights/api";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
	Platform,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "~/api/client";
import {
	Badge,
	Card,
	EmptyState,
	SearchInput,
	Skeleton,
	Stat,
} from "~/components/ui";
import { useTopRepos } from "~/hooks";
import { BorderRadius, Colors, FontSizes, Spacing } from "~/utils/theme";

import { useTheme } from "~/components/Provider";
import { LineRule } from "~/components/ui/LineRule";

export default function HomeScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { data: repos, isLoading, isFetching, refetch } = useTopRepos(20);
	const [searchQuery, setSearchQuery] = useState("");
	const [filtered, setFiltered] = useState<Repository[]>([]);

	useEffect(() => {
		if (repos) {
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				setFiltered(
					repos.filter(
						(r) =>
							r.fullName.toLowerCase().includes(q) ||
							r.description?.toLowerCase().includes(q) ||
							r.primaryLanguage?.toLowerCase().includes(q),
					),
				);
			} else {
				setFiltered(repos);
			}
		}
	}, [searchQuery, repos]);

	const totalStars =
		repos?.reduce((sum: number, r: Repository) => sum + r.stars, 0) ?? 0;
	const totalContributors =
		repos?.reduce(
			(sum: number, r: Repository) => sum + r.contributorCount,
			0,
		) ?? 0;
	const analyzedCount =
		repos?.filter((r: Repository) => r.analysisStatus === "complete").length ??
		0;

	return (
		<ScrollView
			contentContainerStyle={{
				paddingTop: insets.top + Spacing.lg,
				paddingBottom: insets.bottom + Spacing["4xl"],
			}}
			refreshControl={
				<RefreshControl
					onRefresh={() => refetch()}
					refreshing={isFetching}
					tintColor={Colors.accent.primary}
				/>
			}
			style={styles.container}
		>
			<View style={styles.header}>
				<Text style={[styles.title, { color: colors.text.primary }]}>Git Insights</Text>
				<Text style={[styles.subtitle, { color: colors.text.muted }]}>Developer Intelligence Platform</Text>
			</View>

			<LineRule marginVertical={Spacing.md} />

			<View style={styles.statsRow}>
				<Stat label="Repos" value={repos?.length ?? 0} />
				<Stat label="Stars" value={formatNumber(totalStars)} />
				<Stat label="Analyzed" value={analyzedCount} />
			</View>

			<LineRule marginVertical={Spacing.md} variant="accent" />

			<SearchInput
				containerStyle={styles.search}
				onChangeText={setSearchQuery}
				placeholder="Filter repositories..."
				value={searchQuery}
			/>

			{isLoading ? (
				<View style={styles.list}>
					{[1, 2, 3].map((i) => (
						<Skeleton
							height={100}
							key={i}
							style={{ marginBottom: Spacing.md }}
						/>
					))}
				</View>
			) : filtered.length === 0 ? (
				<EmptyState
					description={
						searchQuery
							? "Try a different search term"
							: "Analyze a repository to get started"
					}
					icon={Search}
					title="No repositories found"
				/>
			) : (
				<View style={styles.list}>
					{filtered.map((repo) => (
						<TouchableOpacity
							activeOpacity={0.7}
							key={repo.id}
							onPress={() => {
								void Haptics.selectionAsync();
								router.push({
									pathname: "repo" as any,
									params: { id: repo.id, name: repo.fullName },
								});
							}}
						>
							<Card style={styles.repoCard}>
								<View style={styles.repoHeader}>
									<Text style={[styles.repoName, { color: colors.text.primary }]}>{repo.fullName}</Text>
									<StatusBadge status={repo.analysisStatus} />
								</View>
								{repo.description && (
									<Text numberOfLines={2} style={[styles.repoDesc, { color: colors.text.secondary }]}>
										{repo.description}
									</Text>
								)}
								<View style={styles.repoMeta}>
									<Text style={[styles.metaItem, { color: colors.text.secondary }]}>
										⭐ {formatNumber(repo.stars)}
									</Text>
									<Text style={[styles.metaItem, { color: colors.text.secondary }]}>
										🔀 {formatNumber(repo.forks)}
									</Text>
									<Text style={[styles.metaItem, { color: colors.text.secondary }]}>
										👥 {formatNumber(repo.contributorCount)}
									</Text>
									{repo.primaryLanguage && (
										<Badge label={repo.primaryLanguage} variant="info" />
									)}
								</View>
							</Card>
						</TouchableOpacity>
					))}
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
		backgroundColor: "transparent",
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
		gap: Spacing.md,
	},
	search: {
		marginHorizontal: Spacing.lg,
		marginBottom: Spacing.lg,
	},
	list: {
		paddingHorizontal: Spacing.lg,
		gap: Spacing.md,
	},
	repoCard: {
		marginBottom: 0,
	},
	repoHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: Spacing.sm,
	},
	repoName: {
		fontSize: FontSizes.lg,
		fontWeight: "600",
		color: Colors.text.primary,
		flex: 1,
		marginRight: Spacing.sm,
	},
	repoDesc: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		marginBottom: Spacing.sm,
	},
	repoMeta: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.md,
		flexWrap: "wrap",
	},
	metaItem: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
	},
});
