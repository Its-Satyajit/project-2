import type { TreemapFile } from "@git-insights/api";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import RNSvg, { G, Rect, Text as RNSvgText } from "react-native-svg";
import { Colors, FontSizes, Spacing } from "../../utils/theme";

interface TreemapVizProps {
	data: TreemapFile[];
	width: number;
	height: number;
	onFileSelect?: (file: TreemapFile) => void;
}

interface TreemapNode {
	x: number;
	y: number;
	width: number;
	height: number;
	file: TreemapFile;
}

const LANG_COLORS: Record<string, string> = {
	".ts": "#3178c6",
	".tsx": "#3178c6",
	".js": "#f7df1e",
	".jsx": "#f7df1e",
	".py": "#3572A5",
	".rs": "#dea584",
	".go": "#00ADD8",
	".java": "#b07219",
	".css": "#563d7c",
	".json": "#f7df1e",
	".md": "#083fa1",
	".yml": "#cb171e",
	".yaml": "#cb171e",
};

function getScoreColor(score: number): string {
	if (score > 80) return "#ef4444";
	if (score > 60) return "#f97316";
	if (score > 40) return "#eab308";
	if (score > 20) return "#22c55e";
	return "#3b82f6";
}

function squarify(
	files: TreemapFile[],
	x: number,
	y: number,
	width: number,
	height: number,
): TreemapNode[] {
	if (files.length === 0) return [];
	if (files.length === 1) {
		return [{ x, y, width, height, file: files[0] }];
	}

	const total = files.reduce((sum, f) => sum + Math.max(f.loc, 1), 0);
	const mid = Math.ceil(files.length / 2);
	const leftFiles = files.slice(0, mid);
	const rightFiles = files.slice(mid);

	const leftTotal = leftFiles.reduce((sum, f) => sum + Math.max(f.loc, 1), 0);
	const ratio = leftTotal / total;

	const isWide = width > height;
	const splitPoint = isWide ? width * ratio : height * ratio;

	return [
		...squarify(
			leftFiles,
			x,
			y,
			isWide ? splitPoint : width,
			isWide ? height : splitPoint,
		),
		...squarify(
			rightFiles,
			isWide ? splitPoint : x,
			isWide ? y : splitPoint,
			isWide ? width - splitPoint : width,
			isWide ? height : height - splitPoint,
		),
	];
}

export function TreemapViz({
	data,
	width,
	height,
	onFileSelect,
}: TreemapVizProps) {
	const [selectedFile, setSelectedFile] = useState<TreemapFile | null>(null);

	const sorted = [...data].sort((a, b) => b.loc - a.loc).slice(0, 30);

	const nodes = squarify(sorted, 0, 0, width, height);

	const handlePress = useCallback(
		(file: TreemapFile) => {
			void Haptics.selectionAsync();
			setSelectedFile(file);
			onFileSelect?.(file);
		},
		[onFileSelect],
	);

	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const Svg = RNSvg as any;
	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const SVGG = G as any;
	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const SVGRect = Rect as any;
	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const SVGText = RNSvgText as any;

	return (
		<View style={styles.container}>
			<Svg height={height} width={width}>
				{nodes.map((node) => {
					const color =
						LANG_COLORS[node.file.extension] ||
						getScoreColor(node.file.hotspotScore);
					const opacity =
						selectedFile && selectedFile.path !== node.file.path ? 0.4 : 1;

					return (
						<SVGG key={node.file.path}>
							<SVGRect
								fill={color}
								height={Math.max(node.height - 2, 0)}
								onPress={() => handlePress(node.file)}
								opacity={opacity}
								rx={2}
								width={Math.max(node.width - 2, 0)}
								x={node.x + 1}
								y={node.y + 1}
							/>
							{node.width > 40 && node.height > 20 && (
								<SVGText
									fill="#fff"
									fontSize={8}
									fontWeight="600"
									x={node.x + 4}
									y={node.y + 14}
								>
									{truncatePath(node.file.path, Math.floor(node.width / 6))}
								</SVGText>
							)}
							{node.width > 40 && node.height > 30 && (
								<SVGText
									fill="rgba(255,255,255,0.7)"
									fontSize={7}
									x={node.x + 4}
									y={node.y + 24}
								>
									{node.file.loc} LOC
								</SVGText>
							)}
						</SVGG>
					);
				})}
			</Svg>
			{selectedFile && (
				<View style={styles.detail}>
					<Text style={styles.detailPath}>{selectedFile.path}</Text>
					<Text style={styles.detailStats}>
						{selectedFile.loc} LOC · Score: {selectedFile.hotspotScore} ·
						Fan-In: {selectedFile.fanIn} · Fan-Out: {selectedFile.fanOut}
					</Text>
				</View>
			)}
		</View>
	);
}

function truncatePath(path: string, maxLen: number): string {
	const parts = path.split("/");
	if (parts.length <= 1) return path.slice(0, maxLen);
	const name = parts[parts.length - 1];
	if (name.length > maxLen) return name.slice(0, maxLen);
	return name;
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
	},
	detail: {
		marginTop: Spacing.md,
		paddingHorizontal: Spacing.md,
	},
	detailPath: {
		fontSize: FontSizes.sm,
		color: Colors.text.primary,
		fontWeight: "600",
	},
	detailStats: {
		fontSize: FontSizes.xs,
		color: Colors.text.secondary,
		marginTop: Spacing.xs,
	},
});
