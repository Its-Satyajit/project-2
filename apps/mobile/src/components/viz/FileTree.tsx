import type { FileTreeItem } from "@git-insights/api";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../utils/theme";

interface FileTreeProps {
	tree: FileTreeItem[];
	onFileSelect?: (item: FileTreeItem) => void;
	maxDepth?: number;
}

export function FileTree({ tree, onFileSelect, maxDepth = 5 }: FileTreeProps) {
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	const toggle = (path: string) => {
		void Haptics.selectionAsync();
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(path)) next.delete(path);
			else next.add(path);
			return next;
		});
	};

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			{tree.map((item) => (
				<TreeNode
					depth={0}
					expanded={expanded}
					item={item}
					key={item.path}
					maxDepth={maxDepth}
					onFileSelect={onFileSelect}
					onToggle={toggle}
				/>
			))}
		</ScrollView>
	);
}

interface TreeNodeProps {
	item: FileTreeItem;
	depth: number;
	expanded: Set<string>;
	onToggle: (path: string) => void;
	onFileSelect?: (item: FileTreeItem) => void;
	maxDepth: number;
}

function TreeNode({
	item,
	depth,
	expanded,
	onToggle,
	onFileSelect,
	maxDepth,
}: TreeNodeProps) {
	const isDir = item.type === "directory";
	const isExpanded = expanded.has(item.path);
	const paddingLeft = depth * 16 + 8;

	const handlePress = () => {
		if (isDir) {
			onToggle(item.path);
		} else {
			onFileSelect?.(item);
		}
	};

	if (isDir && depth >= maxDepth) {
		return (
			<View style={[styles.row, { paddingLeft }]}>
				<Text style={styles.icon}>📁</Text>
				<Text style={[styles.name, styles.muted]}>{item.name}/</Text>
			</View>
		);
	}

	return (
		<View>
			<TouchableOpacity
				activeOpacity={0.7}
				onPress={handlePress}
				style={[styles.row, { paddingLeft }]}
			>
				<Text style={styles.icon}>
					{isDir ? (isExpanded ? "📂" : "📁") : getFileIcon(item.name)}
				</Text>
				<Text style={[styles.name, !isDir && styles.file]}>
					{item.name}
					{isDir ? "/" : ""}
				</Text>
				{item.size !== undefined && !isDir && (
					<Text style={styles.size}>{formatSize(item.size)}</Text>
				)}
			</TouchableOpacity>
			{isDir && isExpanded && item.children && (
				<View>
					{item.children.map((child) => (
						<TreeNode
							depth={depth + 1}
							expanded={expanded}
							item={child}
							key={child.path}
							maxDepth={maxDepth}
							onFileSelect={onFileSelect}
							onToggle={onToggle}
						/>
					))}
				</View>
			)}
		</View>
	);
}

function getFileIcon(name: string): string {
	const ext = name.split(".").pop()?.toLowerCase();
	const icons: Record<string, string> = {
		ts: "📘",
		tsx: "⚛️",
		js: "📙",
		jsx: "⚛️",
		py: "🐍",
		rs: "🦀",
		go: "🔵",
		json: "📋",
		md: "📝",
		css: "🎨",
		yml: "⚙️",
		yaml: "⚙️",
	};
	return icons[ext || ""] || "📄";
}

function formatSize(bytes: number): string {
	if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
	if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${bytes}B`;
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacing.sm,
	},
	icon: {
		fontSize: FontSizes.sm,
		marginRight: Spacing.sm,
	},
	name: {
		fontSize: FontSizes.sm,
		color: Colors.text.primary,
		flex: 1,
	},
	file: {
		color: Colors.text.secondary,
	},
	muted: {
		color: Colors.text.muted,
	},
	size: {
		fontSize: FontSizes.xs,
		color: Colors.text.muted,
	},
});
