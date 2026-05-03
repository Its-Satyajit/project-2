import FlexSearch, { type Index } from "flexsearch";

// Flexible index type to handle FlexSearch's complex generics
type AnyIndex = Index<any, any, any>;

import { useMemo } from "react";

type SearchId = string | number;

export type SearchStore<T> =
	| ReadonlyArray<T>
	| Readonly<Record<string, T>>
	| ReadonlyMap<SearchId, T>;

function resolveFromStore<T>(
	store: SearchStore<T>,
	id: SearchId,
): T | undefined {
	if (store instanceof Map) return store.get(id);
	if (Array.isArray(store)) return store[id as number];
	return (store as Record<string, T>)[String(id)];
}

function collectIds(value: unknown, out: SearchId[]): void {
	if (value == null) return;

	if (Array.isArray(value)) {
		for (const v of value) collectIds(v, out);
		return;
	}

	if (typeof value === "string" || typeof value === "number") {
		out.push(value);
	}
}

function runSearch(index: AnyIndex, query: string, options?: unknown) {
	if (typeof options === "number") {
		return index.search(query, options);
	}

	if (options && typeof options === "object") {
		return index.search(query, options as any);
	}

	return index.search(query);
}

export function createIndex(
	options: ConstructorParameters<typeof Index>[0] = {},
) {
	return new FlexSearch.Index(options);
}

function searchFlexSearch<T>(
	query: string | null | undefined,
	index: AnyIndex | null | undefined,
	store: SearchStore<T> | null | undefined,
	searchOptions?: unknown,
): T[] {
	if (!query?.trim() || !index || !store) return [];

	const raw = runSearch(index, query, searchOptions);
	const ids: SearchId[] = [];

	collectIds(raw, ids);

	return ids
		.map((id) => resolveFromStore(store, id))
		.filter((v): v is T => v !== undefined);
}

async function serializeIndex(index: AnyIndex): Promise<string> {
	return await (index as any).export();
}

async function deserializeIndex(
	serialized: string,
	options: ConstructorParameters<typeof Index>[0] = {},
): Promise<AnyIndex> {
	const index = new FlexSearch.Index(options);

	await (index as any).import(serialized);

	return index;
}

export function useFlexSearch<T>(
	query: string | null | undefined,
	index: AnyIndex | null | undefined,
	store: SearchStore<T> | null | undefined,
	searchOptions?: unknown,
): T[] {
	return useMemo(
		() => searchFlexSearch(query, index, store, searchOptions),
		[query, index, store, searchOptions],
	);
}
