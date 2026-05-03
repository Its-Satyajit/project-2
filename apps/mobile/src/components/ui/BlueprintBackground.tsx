import type React from "react";
import { StyleSheet, View } from "react-native";
// @ts-expect-error: react-native-svg components conflict with React 19 JSX types
import Svg, { Defs, Line, Rect, Pattern as SvgPattern } from "react-native-svg";
import { useTheme } from "../Provider";

// react-native-svg components conflict with React 19 JSX types — cast to ComponentType
type AnyComp = React.ComponentType<Record<string, unknown>>;

interface BlueprintBackgroundProps {
	children?: React.ReactNode;
	variant?: "grid" | "crosshatch";
}

export function BlueprintBackground({
	children,
	variant = "grid",
}: BlueprintBackgroundProps) {
	const { isDark } = useTheme();

	// Web matches: rgba(26, 29, 46, 0.03) in light, rgba(232, 228, 220, 0.04) in dark
	const gridColor = isDark
		? "rgba(232, 228, 220, 0.04)"
		: "rgba(26, 29, 46, 0.03)";
	const crosshatchColor = isDark
		? "rgba(232, 228, 220, 0.08)"
		: "rgba(26, 29, 46, 0.08)";

	const SvgComp = Svg as unknown as AnyComp;
	const DefsComp = Defs as unknown as AnyComp;
	const PatternComp = SvgPattern as unknown as AnyComp;
	const LineComp = Line as unknown as AnyComp;
	const RectComp = Rect as unknown as AnyComp;

	return (
		<View style={styles.container}>
			<View style={StyleSheet.absoluteFill}>
				{variant === "grid" ? (
					<SvgComp height="100%" width="100%">
						<DefsComp>
							<PatternComp
								height="24"
								id="blueprint"
								patternUnits="userSpaceOnUse"
								width="24"
							>
								<LineComp
									stroke={gridColor}
									strokeWidth={1}
									x1="0"
									x2="24"
									y1="0"
									y2="0"
								/>
								<LineComp
									stroke={gridColor}
									strokeWidth={1}
									x1="0"
									x2="0"
									y1="0"
									y2="24"
								/>
							</PatternComp>
						</DefsComp>
						<RectComp fill="url(#blueprint)" height="100%" width="100%" />
					</SvgComp>
				) : (
					<SvgComp height="100%" width="100%">
						<DefsComp>
							<PatternComp
								height="8"
								id="crosshatch"
								patternUnits="userSpaceOnUse"
								width="8"
							>
								<LineComp
									stroke={crosshatchColor}
									strokeWidth={1}
									x1="0"
									x2="8"
									y1="8"
									y2="0"
								/>
								<LineComp
									stroke={crosshatchColor}
									strokeWidth={1}
									x1="0"
									x2="8"
									y1="0"
									y2="8"
								/>
							</PatternComp>
						</DefsComp>
						<RectComp fill="url(#crosshatch)" height="100%" width="100%" />
					</SvgComp>
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
