import { describe, expect, it } from "vitest";
import { getExtension } from "../getExtension";

describe("getExtension", () => {
	it("returns extension for file with extension", () => {
		expect(getExtension("file.ts")).toBe("ts");
	});

	it("returns lowercase extension", () => {
		expect(getExtension("file.TS")).toBe("ts");
	});

	it("returns no-extension for undefined", () => {
		expect(getExtension()).toBe("no-extension");
	});

	it("returns no-extension for path without dot", () => {
		expect(getExtension("file")).toBe("no-extension");
	});

	it("handles multiple dots", () => {
		expect(getExtension("file.test.ts")).toBe("ts");
	});

	it("handles empty string", () => {
		expect(getExtension("")).toBe("no-extension");
	});
});
