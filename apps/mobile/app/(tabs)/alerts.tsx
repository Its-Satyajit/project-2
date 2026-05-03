import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, BellRing, AlertTriangle, CheckCircle, Flame } from "lucide-react-native";
import { Badge, EmptyState } from "~/components/ui";
import { useTheme } from "~/components/Provider";
import { BorderRadius, FontSizes, Spacing } from "~/utils/theme";

const ALERTS = [
	{ id: "1", type: "analysis_complete", title: "Analysis Complete", repo: "facebook/react", time: "5m ago" },
	{ id: "2", type: "hotspot_detected", title: "Hotspot Detected", repo: "facebook/react", time: "30m ago" },
	{ id: "3", type: "ci_failure", title: "CI Failed", repo: "vercel/next.js", time: "2h ago" },
	{ id: "4", type: "pr_update", title: "PR Updated", repo: "vercel/next.js", time: "4h ago" },
];

const FILTERS = ["All", "Unread", "Alerts", "CI"];

export default function AlertsScreen() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const [filter, setFilter] = useState(0);
	const [read, setRead] = useState<Set<string>>(new Set());

	const filtered = ALERTS.filter((a) => {
		if (filter === 1) return !read.has(a.id);
		if (filter === 2) return a.type === "hotspot_detected" || a.type === "ci_failure";
		if (filter === 3) return a.type === "ci_failure";
		return true;
	});

	const unread = ALERTS.filter((a) => !read.has(a.id)).length;

	const getIcon = (type: string) => {
		switch (type) {
			case "ci_failure": return <AlertTriangle size={20} color={colors.status.error} />;
			case "hotspot_detected": return <Flame size={20} color={colors.status.warning} />;
			case "analysis_complete": return <CheckCircle size={20} color={colors.status.success} />;
			default: return <Bell size={20} color={colors.accent.primary} />;
		}
	};

	return (
		<ScrollView
			contentContainerStyle={{
				paddingTop: insets.top + Spacing.lg,
				paddingBottom: insets.bottom + 80,
			}}
			style={styles.container}
		>
			<View style={styles.header}>
				<View style={styles.titleRow}>
					<Text style={[styles.title, { color: colors.text.primary }]}>Alerts</Text>
					{unread > 0 && <Badge label={`${unread}`} variant="error" />}
				</View>
				<Text style={[styles.subtitle, { color: colors.text.muted }]}>Real-time notifications</Text>
			</View>

			<TouchableOpacity style={[styles.pushCard, { backgroundColor: colors.accent.muted }]}>
				<BellRing size={20} color={colors.accent.primary} />
				<View style={styles.pushContent}>
					<Text style={[styles.pushTitle, { color: colors.text.primary }]}>Push Notifications</Text>
					<Text style={[styles.pushDesc, { color: colors.text.muted }]}>Tap to enable</Text>
				</View>
			</TouchableOpacity>

			<View style={styles.filters}>
				{FILTERS.map((f, i) => (
					<TouchableOpacity
						key={f}
						onPress={() => {
							void Haptics.selectionAsync();
							setFilter(i);
						}}
						style={[styles.filter, filter === i && { backgroundColor: colors.accent.primary }]}
					>
						<Text style={[styles.filterText, { color: colors.text.secondary }, filter === i && { color: colors.background, fontWeight: "700" }]}>{f}</Text>
					</TouchableOpacity>
				))}
			</View>

			{filtered.length === 0 ? (
				<EmptyState icon={Bell} title="All caught up" description="No alerts" />
			) : (
				<View style={styles.list}>
					{filtered.map((alert) => (
						<TouchableOpacity
							key={alert.id}
							onPress={() => {
								void Haptics.selectionAsync();
								setRead((prev) => new Set([...prev, alert.id]));
							}}
							style={[
								styles.alertCard,
								{ backgroundColor: colors.surface },
								!read.has(alert.id) && { opacity: 1, borderLeftWidth: 3, borderLeftColor: colors.accent.primary }
							]}
						>
							{getIcon(alert.type)}
							<View style={styles.alertContent}>
								<Text style={[styles.alertTitle, { color: colors.text.primary }]}>{alert.title}</Text>
								<Text style={[styles.alertRepo, { color: colors.text.muted }]}>{alert.repo}</Text>
								<Text style={[styles.alertTime, { color: colors.text.muted }]}>{alert.time}</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "transparent" },
	header: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
	titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
	title: { fontSize: FontSizes.xl, fontWeight: "700" },
	subtitle: { fontSize: FontSizes.sm },
	pushCard: {
		flexDirection: "row",
		alignItems: "center",
		marginHorizontal: Spacing.lg,
		marginBottom: Spacing.md,
		padding: Spacing.md,
		borderRadius: BorderRadius.sm,
		gap: Spacing.md,
	},
	pushContent: { flex: 1 },
	pushTitle: { fontSize: FontSizes.sm, fontWeight: "600" },
	pushDesc: { fontSize: FontSizes.xs },
	filters: { flexDirection: "row", paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.xs },
	filter: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full },
	filterActive: { },
	filterText: { fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 },
	filterTextActive: { fontWeight: "700" },
	list: { paddingHorizontal: Spacing.lg },
	alertCard: {
		flexDirection: "row",
		alignItems: "center",
		padding: Spacing.md,
		borderRadius: BorderRadius.sm,
		marginBottom: Spacing.sm,
		opacity: 0.7,
	},
	alertUnread: { },
	alertContent: { flex: 1, marginLeft: Spacing.sm },
	alertTitle: { fontSize: FontSizes.sm, fontWeight: "600" },
	alertRepo: { fontSize: FontSizes.xs },
	alertTime: { fontSize: FontSizes.xs },
});