import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Bell, Home, LayoutDashboard, User } from "lucide-react-native";
import { Provider, useTheme } from "~/components/Provider";

function TabsLayoutContent() {
	const { colors } = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: "transparent" }]}>
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarStyle: {
						backgroundColor: colors.surface,
						borderTopColor: colors.border,
						borderTopWidth: StyleSheet.hairlineWidth,
						height: 80,
						paddingBottom: 20,
						paddingTop: 8,
					},
					tabBarActiveTintColor: colors.accent.primary,
					tabBarInactiveTintColor: colors.text.muted,
					tabBarLabelStyle: {
						fontSize: 10,
						fontWeight: "600",
					},
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: "Home",
						tabBarIcon: ({ color }) => (
							<Home size={24} color={color} strokeWidth={2} />
						),
					}}
				/>
				<Tabs.Screen
					name="analytics"
					options={{
						title: "Insights",
						tabBarIcon: ({ color }) => (
							<LayoutDashboard size={24} color={color} strokeWidth={2} />
						),
					}}
				/>
				<Tabs.Screen
					name="alerts"
					options={{
						title: "Alerts",
						tabBarIcon: ({ color }) => (
							<Bell size={24} color={color} strokeWidth={2} />
						),
					}}
				/>
				<Tabs.Screen
					name="profile"
					options={{
						title: "Profile",
						tabBarIcon: ({ color }) => (
							<User size={24} color={color} strokeWidth={2} />
						),
					}}
				/>
			</Tabs>
		</View>
	);
}

export default function TabsLayout() {
	return (
		<Provider>
			<TabsLayoutContent />
		</Provider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
