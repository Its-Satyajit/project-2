import type React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../Provider";

interface LineRuleProps {
	variant?: "default" | "accent";
	orientation?: "horizontal" | "vertical";
	marginVertical?: number;
}

export function LineRule({
	variant = "default",
	orientation = "horizontal",
	marginVertical = 0,
}: LineRuleProps) {
	const { colors } = useTheme();

	const isHorizontal = orientation === "horizontal";

	return (
		<View
			style={[
				{
					backgroundColor:
						variant === "accent" ? colors.accent.primary : colors.border,
					...(isHorizontal
						? {
								height: variant === "accent" ? 2 : StyleSheet.hairlineWidth,
								width: "100%",
								marginVertical,
						  }
						: {
								width: variant === "accent" ? 2 : StyleSheet.hairlineWidth,
								height: "100%",
								marginHorizontal: marginVertical, // Reusing prop for horizontal margin when vertical
						  }),
				},
			]}
		/>
	);
}
