import { Search } from "lucide-react-native";
import React from "react";
import {
	type StyleProp,
	StyleSheet,
	TextInput,
	type TextInputProps,
	View,
	type ViewStyle,
} from "react-native";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../utils/theme";

interface SearchInputProps extends TextInputProps {
	containerStyle?: StyleProp<ViewStyle>;
	onClear?: () => void;
}

export function SearchInput({
	containerStyle,
	onClear,
	...props
}: SearchInputProps) {
	return (
		<View style={[styles.container, containerStyle]}>
			<View style={styles.iconWrapper}>
				<Search color={Colors.text.muted} size={18} strokeWidth={2} />
			</View>
			<TextInput
				clearButtonMode="while-editing"
				placeholder="Search repositories..."
				placeholderTextColor={Colors.text.muted}
				style={styles.input}
				{...props}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.md,
		borderWidth: 1,
		borderColor: Colors.border,
		overflow: "hidden",
	},
	iconWrapper: {
		paddingLeft: Spacing.md,
		paddingRight: Spacing.sm,
	},
	input: {
		flex: 1,
		paddingVertical: Spacing.md,
		paddingRight: Spacing.lg,
		paddingBottom: Spacing.md,
		fontSize: FontSizes.md,
		color: Colors.text.primary,
		letterSpacing: 0.2,
	},
});
