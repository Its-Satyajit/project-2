"use client";

import { Label, Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { cn } from "~/lib/utils";

interface FileTypeChartProps {
  data: Record<string, number>;
}

export function FileTypeChart({ data }: FileTypeChartProps) {
  // Transform Record<string, number> to Recharts format: { name, value, fill }
  const chartData = Object.entries(data)
    .map(([name, value]) => ({
      name,
      value,
      // We'll use CSS variables for colors, mapping them to the chart config
      fill: `var(--color-${name})`,
    }))
    .sort((a, b) => b.value - a.value); // Sort by count descending

  // Dynamically generate chart config based on extensions
  const chartConfig = Object.keys(data).reduce((acc, key, index) => {
    acc[key] = {
      label: key.toUpperCase(),
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return acc;
  }, {} as ChartConfig);

  const totalFiles = Object.values(data).reduce((acc, curr) => acc + curr, 0);

  return (
    <Card className="flex flex-col border-none shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>File Type Distribution</CardTitle>
        <CardDescription>Breakdown by extension</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer className="mx-auto aspect-square max-h-62.5" config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
            <Pie data={chartData} dataKey="value" innerRadius={60} nameKey="name" strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        dominantBaseline="middle"
                        textAnchor="middle"
                        x={viewBox.cx}
                        y={viewBox.cy}
                      >
                        <tspan
                          className={cn("fill-foreground font-bold text-3xl")}
                          x={viewBox.cx}
                          y={viewBox.cy}
                        >
                          {totalFiles.toLocaleString()}
                        </tspan>
                        <tspan
                          className="fill-muted-foreground"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                        >
                          Files
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
