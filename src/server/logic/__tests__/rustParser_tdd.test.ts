import { describe, expect, it } from "vitest";
import { parseRust } from "../parsers/rust";

describe("Rust Parser (TDD)", () => {
	it("should handle nested imports in use_list", async () => {
		const content = `
use std::collections::{HashMap, HashSet};
use crate::proxy::{self, Proxy};
use super::utils::{format_date, parse_date as pdate};
`;
		const result = await parseRust(content, "test.rs");

		const sources = result.imports.map((i) => i.source);
		expect(sources).toContain("std::collections::HashMap");
		expect(sources).toContain("std::collections::HashSet");
		expect(sources).toContain("crate::proxy::self");
		expect(sources).toContain("crate::proxy::Proxy");
		expect(sources).toContain("super::utils::format_date");
		expect(sources).toContain("super::utils::parse_date");
	});

	it("should handle nested use lists with multiple levels", async () => {
		const content = `
use a::b::{c, d::{e, f}};
`;
		const result = await parseRust(content, "test.rs");

		const sources = result.imports.map((i) => i.source);
		expect(sources).toContain("a::b::c");
		expect(sources).toContain("a::b::d::e");
		expect(sources).toContain("a::b::d::f");
	});
});
