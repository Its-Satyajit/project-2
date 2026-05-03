import { describe, expect, it } from "vitest";
import { cn, getHotspotColor } from "../utils";

describe("cn", () => {
	it("merges class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar");
	});

	it("handles conditional classes", () => {
		expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
	});

	it("merges tailwind classes correctly", () => {
		expect(cn("p-4", "p-2")).toBe("p-2");
	});
});

describe("getHotspotColor", () => {
	it("returns gray for score 0", () => {
		expect(getHotspotColor(0)).toBe("#e5e7eb");
	});

	it("returns color for score 1", () => {
		const color = getHotspotColor(1);
		expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
	});

	it("returns color for score 0.5", () => {
		const color = getHotspotColor(0.5);
		expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
	});
});
