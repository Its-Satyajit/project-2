import { brotliCompressSync, brotliDecompressSync } from "node:zlib";
import { decode, encode } from "@msgpack/msgpack";
import type { AnalysisData } from "../types/analysis";

const SERIALIZATION_VERSION = 2;

/**
 * Packs AnalysisData using Path Interning, MessagePack, and Brotli compression.
 * This can reduce storage size by 80-90% for large repositories.
 */
export function packAnalysisData(data: AnalysisData): Buffer {
	const stringTable: string[] = [];
	const stringMap = new Map<string, number>();

	function getIdx(s: string): number {
		const existing = stringMap.get(s);
		if (existing !== undefined) return existing;
		const idx = stringTable.length;
		stringTable.push(s);
		stringMap.set(s, idx);
		return idx;
	}

	// Clone and intern paths
	const internedData = {
		...data,
		stringTable,
		_v: SERIALIZATION_VERSION,
		files: data.files.map((f) => ({
			...f,
			path: getIdx(f.path),
		})),
		dependencyGraph: data.dependencyGraph
			? {
					...data.dependencyGraph,
					nodes: data.dependencyGraph.nodes.map((n) => ({
						...n,
						path: getIdx(n.path),
					})),
					edges: data.dependencyGraph.edges.map((e) => ({
						source: getIdx(e.source),
						target: getIdx(e.target),
					})),
				}
			: undefined,
		hotSpotData: data.hotSpotData?.map((h) => ({
			...h,
			path: getIdx(h.path),
		})),
	};

	const msgpacked = encode(internedData);
	return brotliCompressSync(Buffer.from(msgpacked));
}

type PackedAnalysisData = Omit<
	AnalysisData,
	"files" | "dependencyGraph" | "hotSpotData"
> & {
	stringTable: string[];
	_v: number;
	files: Array<Omit<AnalysisData["files"][number], "path"> & { path: number }>;
	dependencyGraph?: {
		nodes: Array<
			Omit<
				NonNullable<AnalysisData["dependencyGraph"]>["nodes"][number],
				"path"
			> & {
				path: number;
			}
		>;
		edges: Array<{ source: number; target: number }>;
	};
	hotSpotData?: Array<
		Omit<NonNullable<AnalysisData["hotSpotData"]>[number], "path"> & {
			path: number;
		}
	>;
};

/**
 * Unpacks AnalysisData, supporting both legacy JSON and new Compressed formats.
 */
export function unpackAnalysisData(buffer: Buffer): AnalysisData {
	// Detect legacy JSON (starts with '{')
	if (buffer[0] === 123) {
		return JSON.parse(buffer.toString()) as AnalysisData;
	}

	try {
		const decompressed = brotliDecompressSync(buffer);
		const unpacked = decode(decompressed) as unknown as PackedAnalysisData;

		if (unpacked._v !== SERIALIZATION_VERSION) {
			throw new Error(`Unsupported serialization version: ${unpacked._v}`);
		}

		const { stringTable } = unpacked;
		const getStr = (idx: number) => stringTable[idx] ?? "";

		const result: AnalysisData = {
			...unpacked,
			files: unpacked.files.map((f) => ({
				...f,
				path: getStr(f.path),
			})),
			dependencyGraph: unpacked.dependencyGraph
				? {
						...unpacked.dependencyGraph,
						nodes: unpacked.dependencyGraph.nodes.map((n) => ({
							...n,
							path: getStr(n.path),
						})),
						edges: unpacked.dependencyGraph.edges.map((e) => ({
							source: getStr(e.source),
							target: getStr(e.target),
						})),
					}
				: undefined,
			hotSpotData: unpacked.hotSpotData?.map((h) => ({
				...h,
				path: getStr(h.path),
			})),
		};

		return result;
	} catch (error) {
		console.error("Failed to unpack analysis data:", error);

		// Fallback to trying JSON if something went wrong (though unlikely if first byte wasn't '{')
		try {
			return JSON.parse(buffer.toString()) as AnalysisData;
		} catch {
			throw error;
		}
	}
}
