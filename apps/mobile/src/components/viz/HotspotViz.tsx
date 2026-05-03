import type { HotspotData } from "@git-insights/api";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import RNSvg, { G, Rect, Text as RNSvgText } from "react-native-svg";
import { BorderRadius, Colors, FontSizes, Spacing } from "../../utils/theme";

interface HotspotVizProps {
	data: HotspotData[];
	width?: number;
}

function getRiskLevel(score: number): { label: string; color: string } {
	if (score > 80) return { label: "Critical", color: "#ef4444" };
	if (score > 60) return { label: "High", color: "#f97316" };
	if (score > 40) return { label: "Medium", color: "#eab308" };
	if (score > 20) return { label: "Low", color: "#22c55e" };
	return { label: "Minimal", color: "#3b82f6" };
}

const BAR_MAX_WIDTH = 200;

export function HotspotViz({ data, width = 350 }: HotspotVizProps) {
	const [selected, setSelected] = useState<number | null>(null);

	const sorted = [...data].sort((a, b) => b.score - a.score).slice(0, 15);
	const maxScore = Math.max(...sorted.map((d) => d.score), 1);

	const rowHeight = 48;
	const totalHeight = sorted.length * rowHeight + 40;

	const handlePress = (index: number) => {
		void Haptics.selectionAsync();
		setSelected(selected === index ? null : index);
	};

	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const Svg = RNSvg as any;
	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const SVGText = RNSvgText as any;
	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const SVGRect = Rect as any;
	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const SVGG = G as any;

	return (
		<ScrollView horizontal showsHorizontalScrollIndicator={false}>
			<View style={{ width: width + 40 }}>
				<Svg height={totalHeight} width={width + 40}>
					<SVGText
						fill={Colors.text.primary}
						fontSize={12}
						fontWeight="700"
						x={20}
						y={24}
					>
						File Hotspot Analysis
					</SVGText>

					{sorted.map((item, i) => {
						const y = 40 + i * rowHeight;
						const risk = getRiskLevel(item.score);
						const barWidth = (item.score / maxScore) * BAR_MAX_WIDTH;
						const isSelected = selected === i;

						return (
							<SVGG key={item.file}>
								<SVGRect
									fill={isSelected ? Colors.surfaceElevated : "transparent"}
									height={rowHeight}
									onPress={() => handlePress(i)}
									rx={4}
									width={width + 40}
									x={0}
									y={y - 4}
								/>

								<SVGText
									fill={Colors.text.primary}
									fontSize={10}
									x={20}
									y={y + 14}
								>
									{truncateFile(item.file, 20)}
								</SVGText>

								<SVGRect
									fill={Colors.surfaceElevated}
									height={6}
									rx="3"
									width={BAR_MAX_WIDTH}
									x={20}
									y={y + 22}
								/>
								<SVGRect
									fill={risk.color}
									height={6}
									rx="3"
									width={barWidth}
									x={20}
									y={y + 22}
								/>

								<SVGText
									fill={risk.color}
									fontSize={9}
									fontWeight="600"
									x={20 + BAR_MAX_WIDTH + 10}
									y={y + 14}
								>
									{item.score}
								</SVGText>

								<SVGText
									fill={Colors.text.muted}
									fontSize={8}
									x={20}
									y={y + 40}
								>
									Churn: {item.churn} · Lines: {item.lines} · Deps:{" "}
									{item.dependencies}
								</SVGText>
							</SVGG>
						);
					})}
				</Svg>
			</View>
		</ScrollView>
	);
}

export function HotspotList({ data }: { data: HotspotData[] }) {
	const sorted = [...data].sort((a, b) => b.score - a.score);

	return (
		<View style={styles.list}>
			{sorted.map((item, i) => {
				const risk = getRiskLevel(item.score);
				return (
					<View key={item.file} style={styles.listItem}>
						<View style={styles.rankCircle}>
							<Text style={styles.rankText}>{i + 1}</Text>
						</View>
						<View style={styles.listContent}>
							<Text style={styles.fileName}>{truncateFile(item.file, 30)}</Text>
							<Text style={styles.fileStats}>
								Churn: {item.churn} · Lines: {item.lines} · Dependencies:{" "}
								{item.dependencies}
							</Text>
						</View>
						<View
							style={[styles.riskBadge, { backgroundColor: `${risk.color}20` }]}
						>
							<Text style={[styles.riskText, { color: risk.color }]}>
								{risk.label}
							</Text>
						</View>
					</View>
				);
			})}
		</View>
	);
}

function truncateFile(path: string, maxLen: number): string {
	const parts = path.split("/");
	return parts.length > 2
		? `.../${parts.slice(-2).join("/")}`
		: path.slice(0, maxLen);
}

const styles = StyleSheet.create({
	list: {
		gap: Spacing.sm,
	},
	listItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: Spacing.md,
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.md,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	rankCircle: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: Colors.surfaceElevated,
		alignItems: "center",
		justifyContent: "center",
		marginRight: Spacing.md,
	},
	rankText: {
		fontSize: FontSizes.sm,
		fontWeight: "700",
		color: Colors.accent.primary,
	},
	listContent: {
		flex: 1,
	},
	fileName: {
		fontSize: FontSizes.md,
		color: Colors.text.primary,
		fontWeight: "500",
	},
	fileStats: {
		fontSize: FontSizes.xs,
		color: Colors.text.muted,
		marginTop: Spacing.xs,
	},
	riskBadge: {
		paddingHorizontal: Spacing.md,
		paddingVertical: Spacing.xs,
		borderRadius: BorderRadius.full,
	},
	riskText: {
		fontSize: FontSizes.xs,
		fontWeight: "700",
	},
});
