import type { Contributor } from "@git-insights/api";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import RNSvg, { Circle, Path, Text as RNSvgText } from "react-native-svg";
import { Colors, FontSizes, Spacing } from "../../utils/theme";

interface ContributorChartProps {
	contributors: Contributor[];
	size?: number;
}

const CHART_COLORS = [
	"#22c55e",
	"#3b82f6",
	"#a855f7",
	"#f97316",
	"#ec4899",
	"#06b6d4",
	"#eab308",
	"#ef4444",
];

export function ContributorChart({
	contributors,
	size = 200,
}: ContributorChartProps) {
	const top = contributors.slice(0, 8);
	const total = top.reduce((sum, c) => sum + c.contributions, 0);

	if (total === 0) return null;

	const cx = size / 2;
	const cy = size / 2;
	const radius = size / 2 - 10;
	const innerRadius = radius * 0.6;

	let currentAngle = -Math.PI / 2;

	const slices = top.map((contributor, i) => {
		const fraction = contributor.contributions / total;
		const angle = fraction * Math.PI * 2;
		const startAngle = currentAngle;
		const endAngle = currentAngle + angle;
		currentAngle = endAngle;

		const startOuter = polarToCartesian(cx, cy, radius, startAngle);
		const endOuter = polarToCartesian(cx, cy, radius, endAngle);
		const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
		const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);

		const largeArc = angle > Math.PI ? 1 : 0;

		const path = [
			`M ${startOuter.x} ${startOuter.y}`,
			`A ${radius} ${radius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
			`L ${startInner.x} ${startInner.y}`,
			`A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
			"Z",
		].join(" ");

		return { path, color: CHART_COLORS[i % CHART_COLORS.length], contributor };
	});

	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const Svg = RNSvg as any;
	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const SVGPath = Path as any;
	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const SVGCircle = Circle as any;
	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const SVGText = RNSvgText as any;

	return (
		<View style={styles.container}>
			<Svg height={size} width={size}>
				{slices.map((slice) => (
					<SVGPath
						d={slice.path}
						fill={slice.color}
						key={slice.contributor.githubLogin}
						opacity={0.85}
					/>
				))}
				<SVGCircle cx={cx} cy={cy} fill={Colors.surface} r={innerRadius - 2} />
				<SVGText
					fill={Colors.text.primary}
					fontSize={16}
					fontWeight="700"
					textAnchor="middle"
					x={cx}
					y={cy - 6}
				>
					{formatNumber(total)}
				</SVGText>
				<SVGText
					fill={Colors.text.muted}
					fontSize={9}
					textAnchor="middle"
					x={cx}
					y={cy + 12}
				>
					commits
				</SVGText>
			</Svg>
			<View style={styles.legend}>
				{top.map((c, i) => (
					<View key={c.id} style={styles.legendItem}>
						<View
							style={[
								styles.dot,
								{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] },
							]}
						/>
						<Text style={styles.legendName}>{c.githubLogin}</Text>
						<Text style={styles.legendCount}>{c.contributions}</Text>
					</View>
				))}
			</View>
		</View>
	);
}

export function ActivityHeatmap({
	data,
	cellSize = 10,
	gap = 2,
}: {
	data: number[];
	cellSize?: number;
	gap?: number;
}) {
	const weeks = Math.ceil(data.length / 7);
	const width = weeks * (cellSize + gap);
	const height = 7 * (cellSize + gap);

	const maxVal = Math.max(...data, 1);

	function getColor(value: number): string {
		const intensity = value / maxVal;
		if (intensity === 0) return Colors.surfaceElevated;
		if (intensity < 0.25) return "#0e4429";
		if (intensity < 0.5) return "#166534";
		if (intensity < 0.75) return "#1a7f37";
		return "#22c55e";
	}

	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const Svg = RNSvg as any;
	// biome-ignore lint/suspicious/noExplicitAny: React 19 / react-native-svg type conflict workaround
	const SVGCircle = Circle as any;

	return (
		<Svg height={height} width={width}>
			{data.map((value, i) => {
				const week = Math.floor(i / 7);
				const day = i % 7;
				return (
					<SVGCircle
						cx={week * (cellSize + gap) + cellSize / 2}
						cy={day * (cellSize + gap) + cellSize / 2}
						fill={getColor(value)}
						// biome-ignore lint/suspicious/noArrayIndexKey: No other unique identifier for heatmap cells
						key={i}
						r={cellSize / 2}
					/>
				);
			})}
		</Svg>
	);
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
	return {
		x: cx + r * Math.cos(angle),
		y: cy + r * Math.sin(angle),
	};
}

function formatNumber(num: number): string {
	if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
	return num.toString();
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
	},
	legend: {
		marginTop: Spacing.md,
		width: "100%",
	},
	legendItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacing.xs,
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginRight: Spacing.sm,
	},
	legendName: {
		flex: 1,
		fontSize: FontSizes.sm,
		color: Colors.text.primary,
	},
	legendCount: {
		fontSize: FontSizes.sm,
		color: Colors.text.secondary,
		fontWeight: "600",
	},
});
