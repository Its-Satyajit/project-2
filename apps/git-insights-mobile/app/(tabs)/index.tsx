import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { GitFork, Star, Users } from "lucide-react-native";
import { useState } from "react";
import {
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { api, type Repository } from "../../src/api/client";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../src/utils/theme";

export default function DashboardScreen() {
	const [refreshing, setRefreshing] = useState(false);

	const {
		data: repos,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["top-repos"],
		queryFn: () => api.getTopRepos(20),
	});

	const onRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

	const renderRepo = ({ item }: { item: Repository }) => (
		<Link asChild href={`/repo/${item.id}`}>
			<TouchableOpacity style={styles.repoCard}>
				<View style={styles.repoHeader}>
					<View style={styles.repoInfo}>
						<Text style={styles.repoName}>{item.name}</Text>
						<Text style={styles.repoOwner}>{item.owner}</Text>
					</View>
					<View
						style={[
							styles.statusBadge,
							item.analysisStatus === "complete"
								? styles.statusComplete
								: styles.statusPending,
						]}
					>
						<Text style={styles.statusText}>
							{item.analysisStatus === "complete" ? "Ready" : "Pending"}
						</Text>
					</View>
				</View>
				{item.description && (
					<Text numberOfLines={2} style={styles.repoDescription}>
						{item.description}
					</Text>
				)}
				<View style={styles.repoStats}>
					<View style={styles.stat}>
						<Star color={Colors.chart.yellow} size={14} />
						<Text style={styles.statText}>{formatNumber(item.stars)}</Text>
					</View>
					<View style={styles.stat}>
						<GitFork color={Colors.chart.blue} size={14} />
						<Text style={styles.statText}>{formatNumber(item.forks)}</Text>
					</View>
					<View style={styles.stat}>
						<Users color={Colors.chart.purple} size={14} />
						<Text style={styles.statText}>{item.contributorCount}</Text>
					</View>
					{item.primaryLanguage && (
						<Text style={styles.language}>{item.primaryLanguage}</Text>
					)}
				</View>
			</TouchableOpacity>
		</Link>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Top Repositories</Text>
			<Text style={styles.subtitle}>Most starred open source projects</Text>
			<FlatList
				contentContainerStyle={styles.list}
				data={repos || []}
				keyExtractor={(item) => item.id}
				ListEmptyComponent={
					isLoading ? (
						<View style={styles.loading}>
							<Text style={styles.loadingText}>Loading...</Text>
						</View>
					) : null
				}
				refreshControl={
					<RefreshControl
						onRefresh={onRefresh}
						refreshing={refreshing}
						tintColor={Colors.accent.primary}
					/>
				}
				renderItem={renderRepo}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
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
	list: {
		padding: Spacing.xl,
	},
	repoCard: {
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.lg,
		padding: Spacing.lg,
		marginBottom: Spacing.md,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	repoHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: Spacing.sm,
	},
	repoInfo: {
		flex: 1,
	},
	repoName: {
		fontSize: FontSizes.lg,
		fontWeight: "600",
		color: Colors.text.primary,
	},
	repoOwner: {
		fontSize: FontSizes.sm,
		color: Colors.text.muted,
		marginTop: 2,
	},
	statusBadge: {
		paddingHorizontal: Spacing.sm,
		paddingVertical: Spacing.xs,
		borderRadius: BorderRadius.sm,
	},
	statusComplete: {
		backgroundColor: Colors.accent.muted,
	},
	statusPending: {
		backgroundColor: Colors.status.warning + "30",
	},
	statusText: {
		fontSize: FontSizes.xs,
		fontWeight: "600",
		color: Colors.text.primary,
	},
	repoDescription: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		marginBottom: Spacing.md,
		lineHeight: 18,
	},
	repoStats: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.lg,
	},
	stat: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.xs,
	},
	statText: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		fontWeight: "500",
	},
	language: {
		fontSize: FontSizes.sm,
		color: Colors.accent.primary,
		fontWeight: "500",
		marginLeft: "auto",
	},
	loading: {
		padding: Spacing.xl,
		alignItems: "center",
	},
	loadingText: {
		color: Colors.text.muted,
		fontSize: FontSizes.md,
	},
});
