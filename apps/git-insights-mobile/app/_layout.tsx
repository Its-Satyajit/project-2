import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { Provider } from "../src/components/Provider";
import { Colors } from "../src/utils/theme";

export default function RootLayout() {
	return (
		<Provider>
			<View style={styles.container}>
				<StatusBar style="light" />
				<Stack
					screenOptions={{
						headerStyle: { backgroundColor: Colors.background },
						headerTintColor: Colors.text.primary,
						headerTitleStyle: { fontWeight: "600" },
						contentStyle: { backgroundColor: Colors.background },
					}}
				>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen
						name="repo/[id]"
						options={{
							title: "Repository",
							presentation: "card",
						}}
					/>
					<Stack.Screen
						name="files/[id]"
						options={{
							title: "File Structure",
							presentation: "card",
						}}
					/>
					<Stack.Screen
						name="analysis/[id]"
						options={{
							title: "Analysis",
							presentation: "card",
						}}
					/>
					<Stack.Screen
						name="hotspots/[id]"
						options={{
							title: "Hotspots",
							presentation: "card",
						}}
					/>
				</Stack>
			</View>
		</Provider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
});
