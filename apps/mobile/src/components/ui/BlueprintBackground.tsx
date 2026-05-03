import type React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";
import { useTheme } from "../Provider";

interface BlueprintBackgroundProps {
	children?: React.ReactNode;
	variant?: "grid" | "crosshatch";
}

export function BlueprintBackground({
	children,
	variant = "grid",
}: BlueprintBackgroundProps) {
	const { isDark, colors } = useTheme();

	// Web matches: rgba(26, 29, 46, 0.03) in light, rgba(232, 228, 220, 0.04) in dark
	const gridColor = isDark
		? "rgba(232, 228, 220, 0.04)"
		: "rgba(26, 29, 46, 0.03)";
	const crosshatchColor = isDark
		? "rgba(232, 228, 220, 0.08)"
		: "rgba(26, 29, 46, 0.08)";

	return (
		<View style={styles.container}>
			<View style={StyleSheet.absoluteFill}>
				{variant === "grid" ? (
					<Svg width="100%" height="100%">
						<Defs>
							<Pattern
								id="blueprint"
								width="24"
								height="24"
								patternUnits="userSpaceOnUse"
							>
								<Line
									x1="0"
									y1="0"
									x2="24"
									y2="0"
									stroke={gridColor}
									strokeWidth="1"
								/>
								<Line
									x1="0"
									y1="0"
									x2="0"
									y2="24"
									stroke={gridColor}
									strokeWidth="1"
								/>
							</Pattern>
						</Defs>
						<Rect width="100%" height="100%" fill="url(#blueprint)" />
					</Svg>
				) : (
					<Svg width="100%" height="100%">
						<Defs>
							<Pattern
								id="crosshatch"
								width="8"
								height="8"
								patternUnits="userSpaceOnUse"
							>
								<Line
									x1="0"
									y1="8"
									x2="8"
									y2="0"
									stroke={crosshatchColor}
									strokeWidth="1"
								/>
								<Line
									x1="0"
									y1="0"
									x2="8"
									y2="8"
									stroke={crosshatchColor}
									strokeWidth="1"
								/>
							</Pattern>
						</Defs>
						<Rect width="100%" height="100%" fill="url(#crosshatch)" />
					</Svg>
				)}
			</View>
			<View style={styles.content}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
});
