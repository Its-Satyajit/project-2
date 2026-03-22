"use client";

import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRightIcon, FileIcon, FolderIcon, Loader2, SearchIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import type { FileTreeItem } from "~/components/CollapsibleFileTree";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { api } from "~/lib/eden";
import { createIndex, useFlexSearch } from "~/lib/flexsearch";
import { useDebounce } from "~/lib/useDebounce";
import { cn } from "~/lib/utils";
import { Input } from "../ui/input";

interface FlatNode {
  id: string; // full path
  name: string;
  depth: number;
  isDirectory: boolean;
  items?: FileTreeItem[];
}

interface VirtualizedFileTreeProps {
  fileTree: FileTreeItem[];
  repoId: string;
  owner: string;
  name: string;
  defaultBranch?: string | null;
  isPrivate?: boolean | null;
}

export function VirtualizedFileTree({
  fileTree,
  repoId,
  owner,
  name,
  defaultBranch,
  isPrivate,
}: VirtualizedFileTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const parentRef = React.useRef<HTMLDivElement>(null);
  const { data: fileContent, isLoading: isContentLoading } = useQuery({
    queryKey: ["file-content", repoId, selectedFile],
    queryFn: async () => {
      if (!selectedFile) return null;

      // Hybrid Strategy: Client-side for public, Server-side for private
      if (!isPrivate) {
        const branch = defaultBranch || "main";
        const url = `https://raw.githubusercontent.com/${owner}/${name}/refs/heads/${branch}/${selectedFile}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch public file");
        return res.text();
      }

      const res = await api["file-content"].get({
        query: { repoId, path: selectedFile },
      });
      if (res.error) {
        const errorVal = res.error.value;
        const errorMsg =
          typeof errorVal === "string"
            ? errorVal
            : errorVal && typeof errorVal === "object" && "summary" in errorVal
              ? (errorVal as { summary: string }).summary
              : JSON.stringify(errorVal);
        throw new Error(errorMsg);
      }
      return res.data?.content;
    },
    enabled: !!selectedFile,
  });

  const allPaths = useMemo(() => {
    const paths: string[] = [];

    const walk = (items: FileTreeItem[], parentPath: string) => {
      for (const item of items) {
        const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
        paths.push(currentPath);

        if ("items" in item && item.items) {
          walk(item.items, currentPath);
        }
      }
    };

    walk(fileTree, "");
    return paths;
  }, [fileTree]);

  const index = useMemo(() => {
    const idx = createIndex({ tokenize: "forward" });
    for (let i = 0; i < allPaths.length; i++) {
      const path = allPaths[i];
      if (path) idx.add(i, path);
    }
    return idx;
  }, [allPaths]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 350);

  const matchingIndices = useFlexSearch(debouncedQuery, index, allPaths);
  const hasSearch = debouncedQuery.trim().length > 0;

  const toggleFolder = (path: string) => {
    const newSet = new Set(expandedPaths);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setExpandedPaths(newSet);
  };

  const filteredPaths = useMemo(() => {
    if (!hasSearch) return null;

    const pathsToShow = new Set<string>();

    for (const path of matchingIndices) {
      pathsToShow.add(path);
      const parts = path.split("/");
      let currentPath = "";
      for (const part of parts.slice(0, -1)) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        pathsToShow.add(currentPath);
      }
    }

    return pathsToShow;
  }, [matchingIndices, hasSearch]);

  // Flatten the tree based on expanded state (or search results)
  const visibleNodes = useMemo(() => {
    const nodes: FlatNode[] = [];

    const walk = (items: FileTreeItem[], depth: number, parentPath: string) => {
      for (const item of items) {
        const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
        const isDirectory = "items" in item;

        // If searching, only show paths in filteredPaths
        if (filteredPaths && !filteredPaths.has(currentPath)) {
          continue;
        }

        nodes.push({
          id: currentPath,
          name: item.name,
          depth,
          isDirectory,
          items: isDirectory ? item.items : undefined,
        });

        // When searching, auto-expand matching paths; otherwise use expandedPaths
        const shouldExpand = filteredPaths || expandedPaths.has(currentPath);
        if (isDirectory && shouldExpand && item.items) {
          walk(item.items, depth + 1, currentPath);
        }
      }
    };

    walk(fileTree, 0, "");
    return nodes;
  }, [fileTree, expandedPaths, filteredPaths]);

  const rowVirtualizer = useVirtualizer({
    count: visibleNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // height of each row
    overscan: 10,
  });

  return (
    <>
      <Card className="flex h-150 flex-col border-none shadow-none">
        <CardHeader className="py-4">
          <CardTitle className="text-lg">Repository Explorer</CardTitle>
          <div className="relative">
            <SearchIcon className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              value={searchQuery}
            />
          </div>
        </CardHeader>
        <CardContent className="relative flex-1 overflow-hidden p-0">
          <div className="scrollbar-thin h-full overflow-auto overflow-x-auto" ref={parentRef}>
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const node = visibleNodes[virtualRow.index];
                if (!node) return null;

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div
                      className={cn("group flex items-center px-2 hover:bg-accent/50")}
                      style={{ paddingLeft: `${node.depth * 1.25}rem` }}
                    >
                      {node.isDirectory ? (
                        <Button
                          className="h-8 w-full justify-start gap-2 px-1 hover:bg-transparent"
                          onClick={() => toggleFolder(node.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <ChevronRightIcon
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              expandedPaths.has(node.id) && "rotate-90",
                            )}
                          />
                          <FolderIcon className="h-4 w-4 fill-blue-500/20 text-blue-500" />
                          <span className="truncate font-medium text-sm">{node.name}</span>
                        </Button>
                      ) : (
                        <Button
                          className="h-8 w-full justify-start gap-2 pr-1 pl-6 hover:bg-transparent"
                          onClick={() => setSelectedFile(node.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate font-normal text-sm opacity-80">
                            {node.name}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {visibleNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              No files found.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog onOpenChange={(open) => !open && setSelectedFile(null)} open={!!selectedFile}>
        <DialogContent className="flex max-h-[80vh] max-w-full flex-col overflow-hidden p-0">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="flex items-center gap-2 font-mono text-base">
              <FileIcon className="h-4 w-4" />
              {selectedFile?.split("/").pop()}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-100 flex-1 overflow-auto bg-slate-950 p-4">
            {isContentLoading ? (
              <div
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-4 text-muted-foreground",
                )}
              >
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Fetching content...</p>
              </div>
            ) : (
              <pre className={cn("whitespace-pre-wrap font-mono text-slate-50 text-sm")}>
                <code>{fileContent}</code>
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
