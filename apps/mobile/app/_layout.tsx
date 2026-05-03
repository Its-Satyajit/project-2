import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { Provider, useTheme } from "~/components/Provider";
import { BlueprintBackground } from "~/components/ui/BlueprintBackground";

function RootLayoutContent() {
  const { isDark, colors } = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<StatusBar style={isDark ? "light" : "dark"} />
			<BlueprintBackground variant="grid">
				<Stack
					screenOptions={{
						headerStyle: { backgroundColor: colors.background },
						headerTintColor: colors.text.primary,
						headerTitleStyle: { fontWeight: "600" },
						headerBackTitleVisible: false,
						contentStyle: { backgroundColor: "transparent" },
					}}
				>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen
						name="[owner]/[name]"
						options={{
							headerShown: false,
						}}
					/>
					<Stack.Screen
						name="about/index"
						options={{
							title: "About",
							headerLargeTitle: false,
						}}
					/>
					<Stack.Screen
						name="legal/index"
						options={{
							title: "Legal",
							headerLargeTitle: false,
						}}
					/>
				</Stack>
			</BlueprintBackground>
		</View>
	);
}

export default function RootLayout() {
  return (
    <Provider>
      <RootLayoutContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
