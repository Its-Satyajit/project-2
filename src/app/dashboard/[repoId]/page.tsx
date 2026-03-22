"use client";
import { useQuery } from "@tanstack/react-query";
import { Suspense, use } from "react";
import type { FileTreeItem } from "~/components/CollapsibleFileTree";
import { FileTypeChart } from "~/components/dashboard/FileTypeChart";
import { StatCards, StatCardsSkeleton } from "~/components/dashboard/StatCards";
import { VirtualizedFileTree } from "~/components/dashboard/VirtualizedFileTree";

import { api } from "~/lib/eden";

export default function RepoPage({ params }: { params: Promise<{ repoId: string }> }) {
  return (
    <main className="mx-auto flex max-w-[120ch] flex-col gap-8 p-8">
      <Suspense fallback={<StatCardsSkeleton />}>
        <DashboardData params={params} />
      </Suspense>
    </main>
  );
}

function DashboardData({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);

  const { data: response, isLoading } = useQuery({
    queryKey: ["repo-dashboard", repoId],
    queryFn: async () => {
      const res = await api.dashboard({ repoId }).get();
      return res;
    },
    enabled: !!repoId,
    retry: false,
  });

  if (isLoading) return <StatCardsSkeleton />;

  if (!response?.data || typeof response.data !== "object") {
    return <p>Error loading repository data.</p>;
  }

  const data = response.data as {
    id: string;
    owner: string;
    name: string;
    defaultBranch: string;
    isPrivate: boolean;
    primaryLanguage: string;
    fileTree: FileTreeItem[];
    analysisResults: Array<{
      totalFiles: number;
      totalDirectories: number;
      totalLines: number;
      fileTypeBreakdownJson: Record<string, number>;
    }>;
  };
  const analysis = data.analysisResults?.[0];

  return (
    <div className="flex flex-col gap-8">
      <StatCards
        primaryLanguage={data.primaryLanguage}
        totalDirectories={analysis?.totalDirectories ?? 0}
        totalFiles={analysis?.totalFiles ?? 0}
        totalLines={analysis?.totalLines ?? 0}
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {analysis?.fileTypeBreakdownJson && (
            <FileTypeChart data={analysis.fileTypeBreakdownJson as Record<string, number>} />
          )}
        </div>
        <div className="lg:col-span-3">
          <VirtualizedFileTree
            defaultBranch={data.defaultBranch}
            fileTree={data.fileTree ?? []}
            isPrivate={data.isPrivate}
            name={data.name}
            owner={data.owner}
            repoId={data.id}
          />
        </div>
      </div>
    </div>
  );
}
