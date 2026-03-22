export type FileTreeItem =
	| { name: string }
	| { name: string; items: FileTreeItem[] };

export function convertToFileTree(
	files: { path: string; isDirectory: boolean }[] | null | undefined,
): FileTreeItem[] {
	if (!files) return [];

	const root: FileTreeItem[] = [];
	const lookup: Record<string, FileTreeItem> = {};

	files.forEach((file) => {
		const parts = file.path.split("/");
		let currentPath = "";
		let currentLevel = root;

		parts.forEach((part, index) => {
			currentPath = currentPath ? `${currentPath}/${part}` : part;
			const isLast = index === parts.length - 1;

			if (!lookup[currentPath]) {
				if (isLast && !file.isDirectory) {
					const newItem: FileTreeItem = { name: part };
					lookup[currentPath] = newItem;
					currentLevel.push(newItem);
				} else {
					// It's a directory or an intermediate path part
					const newItem: FileTreeItem = { name: part, items: [] };
					lookup[currentPath] = newItem;
					currentLevel.push(newItem);
					currentLevel = (newItem as { name: string; items: FileTreeItem[] })
						.items;
				}
			} else {
				const existing = lookup[currentPath];
				if (existing && "items" in existing) {
					currentLevel = existing.items;
				}
			}
		});
	});

	return root;
}

export function getAllPaths(tree: FileTreeItem[]): string[] {
	const paths: string[] = [];

	const walk = (items: FileTreeItem[], parentPath: string) => {
		for (const item of items) {
			const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
			const isDirectory = "items" in item;

			// Push the current path
			paths.push(currentPath);

			// What goes here to recurse into ALL directories?
			if (isDirectory && item.items) {
				walk(item.items, currentPath);
			}
		}
	};

	walk(tree, "");
	return paths;
}
