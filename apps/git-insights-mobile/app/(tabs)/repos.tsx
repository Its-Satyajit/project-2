import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { GitFork, Search, Star } from "lucide-react-native";
import { useState } from "react";
import {
	FlatList,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { api, type Repository } from "../../src/api/client";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../src/utils/theme";

export default function ReposScreen() {
	const [search, setSearch] = useState("");

	const { data: repos, isLoading } = useQuery({
		queryKey: ["search-repos", search],
		queryFn: () => api.searchRepos(search),
		enabled: search.length >= 2,
	});

	const renderRepo = ({ item }: { item: Repository }) => (
		<Link asChild href={`/repo/${item.id}`}>
			<TouchableOpacity style={styles.repoCard}>
				<Text style={styles.repoName}>
					{item.owner}/{item.name}
				</Text>
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
					{item.primaryLanguage && (
						<Text style={styles.language}>{item.primaryLanguage}</Text>
					)}
				</View>
			</TouchableOpacity>
		</Link>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Repositories</Text>
			<View style={styles.searchContainer}>
				<Search color={Colors.text.muted} size={18} style={styles.searchIcon} />
				<TextInput
					autoCapitalize="none"
					onChangeText={setSearch}
					placeholder="Search GitHub repos..."
					placeholderTextColor={Colors.text.muted}
					style={styles.searchInput}
					value={search}
				/>
			</View>
			<FlatList
				contentContainerStyle={styles.list}
				data={repos || []}
				keyExtractor={(item) => item.id}
				ListEmptyComponent={
					search.length >= 2 && !isLoading ? (
						<Text style={styles.emptyText}>No repositories found</Text>
					) : search.length < 2 ? (
						<Text style={styles.emptyText}>Type to search</Text>
					) : null
				}
				renderItem={renderRepo}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}

function formatNumber(num: number): string {
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
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: Colors.surface,
		margin: Spacing.xl,
		marginBottom: 0,
		paddingHorizontal: Spacing.md,
		borderRadius: BorderRadius.md,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	searchIcon: {
		marginRight: Spacing.sm,
	},
	searchInput: {
		flex: 1,
		paddingVertical: Spacing.md,
		fontSize: FontSizes.md,
		color: Colors.text.primary,
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
	repoName: {
		fontSize: FontSizes.lg,
		fontWeight: "600",
		color: Colors.text.primary,
		marginBottom: Spacing.xs,
	},
	repoDescription: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		marginBottom: Spacing.md,
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
	},
	language: {
		fontSize: FontSizes.sm,
		color: Colors.accent.primary,
		marginLeft: "auto",
	},
	emptyText: {
		fontSize: FontSizes.md,
		color: Colors.text.muted,
		textAlign: "center",
		marginTop: Spacing.xl,
	},
});
