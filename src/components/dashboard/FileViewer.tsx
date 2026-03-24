"use client";

import { Copy, FileCode, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { Button } from "~/components/ui/button";

interface FileViewerProps {
  filePath: string;
  content: string | null;
  isLoading: boolean;
  error: Error | null;
}

const languageMap: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  rs: "rust",
  go: "go",
  rb: "ruby",
  java: "java",
  cpp: "cpp",
  c: "c",
  css: "css",
  html: "html",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  toml: "toml",
  sql: "sql",
  svelte: "svelte",
  vue: "vue",
  astro: "astro",
};

async function highlightLine(line: string, lang: string, isDark: boolean): Promise<string> {
  if (!line) return " ";
  try {
    const html = await codeToHtml(line, {
      lang,
      theme: isDark ? "github-dark" : "github-light",
    });
    // Extract just the inner code spans, ignoring the pre and code wrappers that add background colors and block layout
    const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
    return match ? match[1] : html;
  } catch {
    return line;
  }
}

export function FileViewer({ filePath, content, isLoading, error }: FileViewerProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState<string[]>([]);
  const { resolvedTheme } = useTheme();

  // Keep track of mounting to avoid hydration mismatches
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const fileName = filePath.split("/").pop() || filePath;
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const language = languageMap[extension] || "text";

  const lines = content ? content.split("\n") : [];

  useEffect(() => {
    if (!content || !mounted) {
      setHighlightedLines([]);
      return;
    }

    Promise.all(lines.map((line) => highlightLine(line, language, isDark))).then(
      setHighlightedLines,
    );
  }, [content, language, lines, isDark, mounted]);

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLanguageColor = (ext: string) => {
    const colors: Record<string, string> = {
      ts: "text-blue-400",
      tsx: "text-blue-400",
      js: "text-yellow-400",
      jsx: "text-yellow-400",
      py: "text-green-400",
      rs: "text-orange-400",
      go: "text-cyan-400",
      rb: "text-red-400",
      java: "text-red-400",
      cpp: "text-blue-400",
      c: "text-blue-400",
      css: "text-purple-400",
      html: "text-orange-400",
      json: "text-yellow-400",
      yaml: "text-pink-400",
      yml: "text-pink-400",
      md: "text-gray-400",
    };
    return colors[ext] || "text-foreground/60";
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-cyan-400" />
        <p className="font-mono text-muted-foreground text-sm">Loading file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="font-mono text-red-400 text-sm">Failed to load file: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center">
        <p className="font-mono text-muted-foreground text-sm">No file selected</p>
      </div>
    );
  }

  const isHighlighted = highlightedLines.length > 0;

  return (
    <div className="flex h-full min-h-[400px] flex-col">
      <div className="flex items-center justify-between border-border border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <FileCode className="h-4 w-4 text-cyan-400" />
          <span className={`font-mono text-sm ${getLanguageColor(extension)}`}>{fileName}</span>
          <span className="font-mono text-muted-foreground text-xs">{extension.toUpperCase()}</span>
        </div>
        <Button
          className="h-7 px-2 font-mono text-xs"
          onClick={handleCopy}
          size="sm"
          variant="ghost"
        >
          {copied ? (
            <span className="text-green-400">Copied!</span>
          ) : (
            <Copy className="mr-1 h-3 w-3" />
          )}
        </Button>
      </div>
      <div className="flex h-full min-h-0 overflow-auto bg-card">
        <div className="w-full py-2">
          {isHighlighted
            ? highlightedLines.map((html, i) => (
                <div key={`line-${i}`} className="flex hover:bg-muted/50 transition-colors">
                  <div className="shrink-0 select-none border-border border-r w-12 text-right pr-3 font-mono text-muted-foreground text-xs py-0.5 leading-6">
                    {i + 1}
                  </div>
                  <div
                    className="flex-1 whitespace-pre-wrap break-all px-3 py-0.5 font-mono text-sm leading-6 [&>span]:!bg-transparent"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              ))
            : lines.map((line, i) => (
                <div key={`line-${i}`} className="flex hover:bg-muted/50 transition-colors">
                  <div className="shrink-0 select-none border-border border-r w-12 text-right pr-3 font-mono text-muted-foreground text-xs py-0.5 leading-6">
                    {i + 1}
                  </div>
                  <div className="flex-1 whitespace-pre-wrap break-all px-3 py-0.5 font-mono text-sm leading-6">
                    {line}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
