import type { Repository } from "@git-insights/api";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
	Alert,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge, Button, Card, Skeleton } from "~/components/ui";
import { useAnalyzeRepo, useTopRepos } from "~/hooks";
import { BorderRadius, Colors, FontSizes, Spacing } from "~/utils/theme";

export default function ReposScreen() {
	const insets = useSafeAreaInsets();
	const { data: repos, isLoading, isFetching, refetch } = useTopRepos(50);
	const analyzeMutation = useAnalyzeRepo();
	const [githubUrl, setGithubUrl] = useState("");
	const [filter, setFilter] = useState<
		"all" | "complete" | "analyzing" | "queued"
	>("all");

	const handleAnalyze = () => {
		if (!githubUrl.includes("github.com")) {
			Alert.alert("Invalid URL", "Please enter a valid GitHub repository URL");
			return;
		}
		void Haptics.selectionAsync();
		analyzeMutation.mutate(githubUrl, {
			onSuccess: () => {
				setGithubUrl("");
				Alert.alert("Success", "Repository analysis has been queued");
			},
			onError: () => {
				Alert.alert("Error", "Failed to queue repository analysis");
			},
		});
	};

	const filtered = repos?.filter((r: Repository) => {
		if (filter === "all") return true;
		return r.analysisStatus === filter;
	});

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
				<Text style={styles.title}>Repositories</Text>
				<Text style={styles.subtitle}>Manage and analyze repositories</Text>
			</View>

			<Card style={styles.analyzeCard} title="Analyze Repository">
				<View style={styles.analyzeRow}>
					<TextInput
						autoCapitalize="none"
						autoCorrect={false}
						keyboardType="url"
						onChangeText={setGithubUrl}
						placeholder="https://github.com/owner/repo"
						placeholderTextColor={Colors.text.muted}
						style={styles.input}
						value={githubUrl}
					/>
					<Button
						disabled={!githubUrl.trim()}
						loading={analyzeMutation.isPending}
						onPress={handleAnalyze}
						style={{ marginLeft: Spacing.sm }}
						title="Analyze"
					/>
				</View>
			</Card>

			<View style={styles.filters}>
				{(["all", "complete", "analyzing", "queued"] as const).map((f) => (
					<TouchableOpacity
						key={f}
						onPress={() => {
							void Haptics.selectionAsync();
							setFilter(f);
						}}
						style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
					>
						<Text
							style={[
								styles.filterText,
								filter === f && styles.filterTextActive,
							]}
						>
							{f.charAt(0).toUpperCase() + f.slice(1)}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{isLoading ? (
				<View style={styles.list}>
					{[1, 2, 3, 4, 5].map((i) => (
						<Skeleton
							height={80}
							key={i}
							style={{ marginBottom: Spacing.md }}
						/>
					))}
				</View>
			) : (
				<View style={styles.list}>
					{filtered?.map((repo: Repository) => (
						<Card key={repo.id} style={styles.repoCard}>
							<View style={styles.repoHeader}>
								<Text style={styles.repoName}>{repo.fullName}</Text>
								<StatusBadge status={repo.analysisStatus} />
							</View>
							<View style={styles.repoMeta}>
								<Text style={styles.meta}>⭐ {formatNumber(repo.stars)}</Text>
								<Text style={styles.meta}>
									👥 {formatNumber(repo.contributorCount)}
								</Text>
								<Text style={styles.meta}>{repo.primaryLanguage}</Text>
							</View>
						</Card>
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
	analyzeCard: {
		marginHorizontal: Spacing.lg,
		marginBottom: Spacing.lg,
	},
	analyzeRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	input: {
		flex: 1,
		backgroundColor: Colors.surfaceElevated,
		borderRadius: BorderRadius.md,
		paddingVertical: Spacing.md,
		paddingHorizontal: Spacing.lg,
		fontSize: FontSizes.sm,
		color: Colors.text.primary,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	filters: {
		flexDirection: "row",
		paddingHorizontal: Spacing.lg,
		marginBottom: Spacing.lg,
		gap: Spacing.sm,
	},
	filterBtn: {
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.sm,
		borderRadius: BorderRadius.full,
		backgroundColor: Colors.surface,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	filterBtnActive: {
		backgroundColor: Colors.accent.primary,
		borderColor: Colors.accent.primary,
	},
	filterText: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		fontWeight: "500",
	},
	filterTextActive: {
		color: "#000",
		fontWeight: "600",
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
		alignItems: "center",
		marginBottom: Spacing.sm,
	},
	repoName: {
		fontSize: FontSizes.md,
		fontWeight: "600",
		color: Colors.text.primary,
		flex: 1,
	},
	repoMeta: {
		flexDirection: "row",
		gap: Spacing.lg,
	},
	meta: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
	},
});
