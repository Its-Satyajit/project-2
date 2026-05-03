import { Tabs } from "expo-router";
import {
	Activity,
	Bell,
	FileSearch,
	GitBranch,
	Home,
} from "lucide-react-native";
import { Colors } from "../../src/utils/theme";

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarStyle: {
					backgroundColor: Colors.surface,
					borderTopColor: Colors.border,
					height: 85,
					paddingTop: 8,
					paddingBottom: 28,
				},
				tabBarActiveTintColor: Colors.accent.primary,
				tabBarInactiveTintColor: Colors.text.muted,
				tabBarLabelStyle: {
					fontSize: 11,
					fontWeight: "500",
				},
				headerStyle: {
					backgroundColor: Colors.background,
					shadowColor: "transparent",
				},
				headerTintColor: Colors.text.primary,
				headerTitleStyle: {
					fontWeight: "600",
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="repos"
				options={{
					title: "Repositories",
					tabBarIcon: ({ color, size }) => (
						<GitBranch color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="analytics"
				options={{
					title: "Analytics",
					tabBarIcon: ({ color, size }) => (
						<Activity color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="hotspots"
				options={{
					title: "Hotspots",
					tabBarIcon: ({ color, size }) => (
						<FileSearch color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="alerts"
				options={{
					title: "Alerts",
					tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
				}}
			/>
		</Tabs>
	);
}
