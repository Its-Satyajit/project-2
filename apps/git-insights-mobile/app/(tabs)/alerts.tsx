import {
	AlertCircle,
	Bell,
	CheckCircle,
	RefreshCw,
	XCircle,
} from "lucide-react-native";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../src/utils/theme";

interface Alert {
	id: string;
	type: "success" | "error" | "warning" | "info";
	title: string;
	message: string;
	time: string;
	read: boolean;
}

const mockAlerts: Alert[] = [
	{
		id: "1",
		type: "success",
		title: "Analysis Complete",
		message: "facebook/react analysis finished successfully",
		time: "2 hours ago",
		read: false,
	},
	{
		id: "2",
		type: "error",
		title: "CI/CD Failed",
		message: "Build failed on main branch",
		time: "5 hours ago",
		read: false,
	},
	{
		id: "3",
		type: "warning",
		title: "Rate Limit Warning",
		message: "GitHub API rate limit approaching 80%",
		time: "1 day ago",
		read: true,
	},
];

export default function AlertsScreen() {
	const unreadCount = mockAlerts.filter((a) => !a.read).length;

	const getIcon = (type: Alert["type"]) => {
		switch (type) {
			case "success":
				return <CheckCircle color={Colors.status.success} size={20} />;
			case "error":
				return <XCircle color={Colors.status.error} size={20} />;
			case "warning":
				return <AlertCircle color={Colors.status.warning} size={20} />;
			case "info":
				return <Bell color={Colors.status.info} size={20} />;
		}
	};

	const renderAlert = (alert: Alert) => (
		<TouchableOpacity
			key={alert.id}
			style={[styles.alertCard, !alert.read && styles.alertCardUnread]}
		>
			<View style={styles.alertIcon}>{getIcon(alert.type)}</View>
			<View style={styles.alertContent}>
				<View style={styles.alertHeader}>
					<Text style={styles.alertTitle}>{alert.title}</Text>
					{!alert.read && <View style={styles.unreadBadge} />}
				</View>
				<Text style={styles.alertMessage}>{alert.message}</Text>
				<Text style={styles.alertTime}>{alert.time}</Text>
			</View>
		</TouchableOpacity>
	);

	return (
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Alerts</Text>
				{unreadCount > 0 && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{unreadCount}</Text>
					</View>
				)}
			</View>
			<Text style={styles.subtitle}>Real-time notifications</Text>

			<View style={styles.refreshInfo}>
				<RefreshCw color={Colors.text.muted} size={16} />
				<Text style={styles.refreshText}>Pull to refresh</Text>
			</View>

			{mockAlerts.map(renderAlert)}

			<View style={styles.emptyCard}>
				<Bell color={Colors.text.muted} size={32} />
				<Text style={styles.emptyTitle}>All Caught Up</Text>
				<Text style={styles.emptyText}>No new alerts</Text>
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
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: Spacing.xl,
		gap: Spacing.sm,
	},
	title: {
		fontSize: FontSizes["3xl"],
		fontWeight: "700",
		color: Colors.text.primary,
	},
	badge: {
		backgroundColor: Colors.accent.primary,
		paddingHorizontal: Spacing.sm,
		paddingVertical: Spacing.xs,
		borderRadius: BorderRadius.full,
	},
	badgeText: {
		fontSize: FontSizes.xs,
		fontWeight: "600",
		color: Colors.background,
	},
	subtitle: {
		fontSize: FontSizes.md,
		color: Colors.text.secondary,
		paddingHorizontal: Spacing.xl,
		marginBottom: Spacing.lg,
	},
	refreshInfo: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.xs,
		marginBottom: Spacing.lg,
	},
	refreshText: {
		fontSize: FontSizes.sm,
		color: Colors.text.muted,
	},
	alertCard: {
		flexDirection: "row",
		backgroundColor: Colors.surface,
		marginHorizontal: Spacing.xl,
		marginBottom: Spacing.md,
		padding: Spacing.lg,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	alertCardUnread: {
		borderColor: Colors.accent.primary + "50",
	},
	alertIcon: {
		marginRight: Spacing.md,
	},
	alertContent: {
		flex: 1,
	},
	alertHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.sm,
	},
	alertTitle: {
		fontSize: FontSizes.md,
		fontWeight: "600",
		color: Colors.text.primary,
	},
	unreadBadge: {
		width: 8,
		height: 8,
		borderRadius: BorderRadius.full,
		backgroundColor: Colors.accent.primary,
	},
	alertMessage: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		marginTop: Spacing.xs,
	},
	alertTime: {
		fontSize: FontSizes.xs,
		color: Colors.text.muted,
		marginTop: Spacing.sm,
	},
	emptyCard: {
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.lg,
		padding: Spacing.xl,
		marginHorizontal: Spacing.xl,
		marginTop: Spacing.lg,
		alignItems: "center",
		borderWidth: 1,
		borderColor: Colors.border,
	},
	emptyTitle: {
		fontSize: FontSizes.lg,
		fontWeight: "600",
		color: Colors.text.primary,
		marginTop: Spacing.md,
	},
	emptyText: {
		fontSize: FontSizes.md,
		color: Colors.text.muted,
		marginTop: Spacing.xs,
	},
});
