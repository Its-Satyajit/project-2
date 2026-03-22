import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

export type FileTreeItem = { name: string } | { name: string; items: FileTreeItem[] };

export function CollapsibleFileTree({ fileTree }: { fileTree: FileTreeItem[] }) {
	// const fileTree: FileTreeItem[] = [
	// 	{
	// 		name: "components",
	// 		items: [
	// 			{
	// 				name: "ui",
	// 				items: [
	// 					{ name: "button.tsx" },
	// 					{ name: "card.tsx" },
	// 					{ name: "dialog.tsx" },
	// 					{ name: "input.tsx" },
	// 					{ name: "select.tsx" },
	// 					{ name: "table.tsx" },
	// 				],
	// 			},
	// 			{ name: "login-form.tsx" },
	// 			{ name: "register-form.tsx" },
	// 		],
	// 	},
	// 	{
	// 		name: "lib",
	// 		items: [{ name: "utils.ts" }, { name: "cn.ts" }, { name: "api.ts" }],
	// 	},
	// 	{
	// 		name: "hooks",
	// 		items: [
	// 			{ name: "use-media-query.ts" },
	// 			{ name: "use-debounce.ts" },
	// 			{ name: "use-local-storage.ts" },
	// 		],
	// 	},
	// 	{
	// 		name: "types",
	// 		items: [{ name: "index.d.ts" }, { name: "api.d.ts" }],
	// 	},
	// 	{
	// 		name: "public",
	// 		items: [
	// 			{ name: "favicon.ico" },
	// 			{ name: "logo.svg" },
	// 			{ name: "images" },
	// 		],
	// 	},
	// 	{ name: "app.tsx" },
	// 	{ name: "layout.tsx" },
	// 	{ name: "globals.css" },
	// 	{ name: "package.json" },
	// 	{ name: "tsconfig.json" },
	// 	{ name: "README.md" },
	// 	{ name: ".gitignore" },
	// ];

	const renderItem = (fileItem: FileTreeItem) => {
		if ("items" in fileItem) {
			return (
				<Collapsible key={fileItem.name}>
					<CollapsibleTrigger
						render={
							<Button
								className="group w-full justify-start transition-none hover:bg-accent hover:text-accent-foreground"
								size="sm"
								variant="ghost"
							>
								<ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
								<FolderIcon />
								{fileItem.name}
							</Button>
						}
					/>
					<CollapsibleContent className="mt-1 ml-5 style-lyra:ml-4">
						<div className="flex flex-col gap-1">
							{fileItem.items.map((child) => renderItem(child))}
						</div>
					</CollapsibleContent>
				</Collapsible>
			);
		}
		return (
			<Button
				className="w-full justify-start gap-2 text-foreground"
				key={fileItem.name}
				size="sm"
				variant="link"
			>
				<FileIcon />
				<span>{fileItem.name}</span>
			</Button>
		);
	};

	return (
		<Card className="mx-auto w-full max-w-[16rem] gap-2" size="sm">
			<CardHeader>
				<Tabs defaultValue="explorer">
					<TabsList className="w-full">
						<TabsTrigger value="explorer">Explorer</TabsTrigger>
						<TabsTrigger value="settings">Outline</TabsTrigger>
					</TabsList>
				</Tabs>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-1">
					{fileTree.map((item) => renderItem(item))}
				</div>
			</CardContent>
		</Card>
	);
}
