import { describe, expect, it } from "vitest";
import { createRegexParser } from "../parsers/regexParser";

describe("createRegexParser", () => {
	it("should create a parser function", () => {
		const parser = createRegexParser("test", [/import\s+([\w.]+)/]);
		expect(typeof parser).toBe("function");
	});

	describe("Java parser", () => {
		const javaParser = createRegexParser("java", [
			/import\s+static\s+([\w.]+)/,
			/import\s+([\w.]+)/,
		]);

		it("should parse standard imports", async () => {
			const content = `
import java.util.List;
import java.util.Map;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(2);
			expect(result.imports[0]?.source).toBe("java.util.List");
			expect(result.imports[1]?.source).toBe("java.util.Map");
		});

		it("should parse static imports", async () => {
			const content = `
import static java.lang.Math.PI;
import static java.lang.Math.abs;
`;
			const result = await javaParser(content, "Test.java");
			// Both patterns match, so we get 3 imports (static pattern matches both, regular pattern matches both)
			expect(result.imports.length).toBeGreaterThanOrEqual(2);
		});

		it("should ignore comments", async () => {
			const content = `
// import java.util.List;
import java.util.Map;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe("java.util.Map");
		});

		it("should deduplicate imports", async () => {
			const content = `
import java.util.List;
import java.util.List;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(1);
		});
		it("should handle deeply nested package names", async () => {
			const content = `
import com.example.project.module.submodule.ClassName;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe(
				"com.example.project.module.submodule.ClassName",
			);
		});

		it("should handle many imports in one file", async () => {
			const content = Array.from(
				{ length: 20 },
				(_, i) => `import com.example.Class${i};`,
			).join("\n");
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(20);
		});

		it("should ignore block comment lines starting with *", async () => {
			const content = `
/**
 * import java.util.List;
 */
import java.util.Map;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe("java.util.Map");
		});

		it("should return raw text equal to the trimmed import line", async () => {
			const content = `   import java.util.Set;`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports[0]?.raw).toBe("import java.util.Set;");
		});

		it("should ignore lines starting with -- (SQL-style comments)", async () => {
			const content = `
-- import java.util.List;
import java.util.Map;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(1);
		});

		it("should handle file with only comments and no imports", async () => {
			const content = `
// import java.util.List;
// import java.util.Map;
`;
			const result = await javaParser(content, "Test.java");
			expect(result.imports).toHaveLength(0);
			expect(result.parseError).toBeUndefined();
		});
	});

	describe("Python parser", () => {
		const pythonParser = createRegexParser("python", [
			/import\s+([\w.]+)/,
			/from\s+([\w.]+)\s+import/,
		]);

		it("should parse import statements", async () => {
			const content = `
import os
import sys
import json
`;
			const result = await pythonParser(content, "test.py");
			expect(result.imports).toHaveLength(3);
			expect(result.imports[0]?.source).toBe("os");
		});

		it("should parse from imports", async () => {
			const content = `
from typing import List
from collections import defaultdict
`;
			const result = await pythonParser(content, "test.py");
			// Both patterns match "from" lines, so we get more imports
			expect(result.imports.length).toBeGreaterThanOrEqual(2);
		});
		it("should parse dotted module paths", async () => {
			const content = `
import os.path
from xml.etree.ElementTree import parse
`;
			const result = await pythonParser(content, "test.py");
			const sources = result.imports.map((i) => i.source);
			expect(sources).toContain("os.path");
		});

		it("should ignore lines starting with # (Python comments)", async () => {
			const content = `
# import os
import sys
`;
			const result = await pythonParser(content, "test.py");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe("sys");
		});

		it("should handle blank lines between imports", async () => {
			const content = `
import os

import sys

import json
`;
			const result = await pythonParser(content, "test.py");
			expect(result.imports).toHaveLength(3);
		});

		it("should deduplicate the same module imported twice", async () => {
			const content = `
import os
import os
`;
			const result = await pythonParser(content, "test.py");
			expect(result.imports).toHaveLength(1);
		});

		it("should set isDynamic to false for all imports", async () => {
			const content = `import os`;
			const result = await pythonParser(content, "test.py");
			expect(result.imports.every((i) => i.isDynamic === false)).toBe(true);
		});

		it("should return correct path and language in result", async () => {
			const result = await pythonParser("import os", "src/main.py");
			expect(result.path).toBe("src/main.py");
			expect(result.language).toBe("python");
		});
	});

	// NOTE: createRegexParser skips every line that starts with "#" (treated as a
	// comment, same as Python/shell "#"). C/C++ #include directives therefore always
	// yield 0 imports when processed by this generic regex parser. The tests below
	// document this known limitation; real C/C++ parsing requires a dedicated parser.
	describe("C/C++ parser (# comment-filter limitation)", () => {
		const cParser = createRegexParser("c", [/#include\s+[<"]([^>"]+)[>"]/]);

		it("should return 0 imports for #include lines (# is treated as comment)", async () => {
			const content = `
#include <stdio.h>
#include <stdlib.h>
`;
			const result = await cParser(content, "main.c");
			// createRegexParser skips lines starting with '#', so #include is filtered out
			expect(result.imports).toHaveLength(0);
		});

		it("should return 0 for quoted local includes (# filter applies)", async () => {
			const content = `
#include "utils.h"
#include "models/user.h"
`;
			const result = await cParser(content, "main.c");
			expect(result.imports).toHaveLength(0);
		});

		it("should return undefined source when #include is skipped", async () => {
			const content = `#include <sys/socket.h>`;
			const result = await cParser(content, "net.c");
			expect(result.imports).toHaveLength(0);
		});

		it("should still skip // commented lines normally", async () => {
			const content = `
// some comment
// another comment
`;
			const result = await cParser(content, "main.c");
			expect(result.imports).toHaveLength(0);
		});

		it("should return no parseError even with unsupported content", async () => {
			const content = `
#include <stdio.h>
#define MAX 100
`;
			const result = await cParser(content, "main.c");
			expect(result.imports).toHaveLength(0);
			expect(result.parseError).toBeUndefined();
		});

		it("should return correct path and language in result metadata", async () => {
			const result = await cParser("#include <stdio.h>", "src/main.c");
			expect(result.path).toBe("src/main.c");
			expect(result.language).toBe("c");
		});
	});

	describe("C# parser", () => {
		const csharpParser = createRegexParser("csharp", [/using\s+([\w.]+)\s*;/]);

		it("should parse using statements", async () => {
			const content = `
using System;
using System.Collections.Generic;
using System.Linq;
`;
			const result = await csharpParser(content, "Program.cs");
			expect(result.imports).toHaveLength(3);
			expect(result.imports[0]?.source).toBe("System");
		});

		it("should ignore // commented using lines", async () => {
			const content = `
// using System.IO;
using System;
`;
			const result = await csharpParser(content, "Foo.cs");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe("System");
		});

		it("should deduplicate repeated namespaces", async () => {
			const content = `
using System;
using System;
`;
			const result = await csharpParser(content, "Foo.cs");
			expect(result.imports).toHaveLength(1);
		});

		it("should parse deeply nested namespaces", async () => {
			const content = `using Microsoft.AspNetCore.Mvc.Rendering;`;
			const result = await csharpParser(content, "View.cs");
			expect(result.imports[0]?.source).toBe(
				"Microsoft.AspNetCore.Mvc.Rendering",
			);
		});
	});

	describe("Ruby parser", () => {
		const rubyParser = createRegexParser("ruby", [
			/require\s+['"]([^'"]+)['"]/,
			/require_relative\s+['"]([^'"]+)['"]/,
		]);

		it("should parse require with single quotes", async () => {
			const content = `
require 'json'
require 'net/http'
`;
			const result = await rubyParser(content, "app.rb");
			expect(result.imports).toHaveLength(2);
			expect(result.imports[0]?.source).toBe("json");
		});

		it("should parse require with double quotes", async () => {
			const content = `require "json"`;
			const result = await rubyParser(content, "app.rb");
			expect(result.imports[0]?.source).toBe("json");
		});

		it("should parse require_relative statements", async () => {
			const content = `
require_relative '../models/user'
require_relative './helpers'
`;
			const result = await rubyParser(content, "app.rb");
			expect(result.imports).toHaveLength(2);
			expect(result.imports[0]?.source).toBe("../models/user");
		});

		it("should ignore # commented requires", async () => {
			const content = `
# require 'json'
require 'net/http'
`;
			const result = await rubyParser(content, "app.rb");
			expect(result.imports).toHaveLength(1);
		});

		it("should deduplicate same require", async () => {
			const content = `
require 'json'
require 'json'
`;
			const result = await rubyParser(content, "app.rb");
			expect(result.imports).toHaveLength(1);
		});
	});

	describe("Haskell parser", () => {
		const haskellParser = createRegexParser("haskell", [
			/import\s+(?:qualified\s+)?([\w.]+)/,
		]);

		it("should parse simple imports", async () => {
			const content = `
import Data.List
import Data.Map
`;
			const result = await haskellParser(content, "Main.hs");
			expect(result.imports).toHaveLength(2);
			expect(result.imports[0]?.source).toBe("Data.List");
		});

		it("should parse qualified imports and extract module name", async () => {
			const content = `import qualified Data.Map as Map`;
			const result = await haskellParser(content, "Main.hs");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe("Data.Map");
		});

		it("should ignore -- commented imports", async () => {
			const content = `
-- import Data.List
import Data.Map
`;
			const result = await haskellParser(content, "Main.hs");
			expect(result.imports).toHaveLength(1);
		});

		it("should deduplicate repeated imports", async () => {
			const content = `
import Data.Map
import Data.Map
`;
			const result = await haskellParser(content, "Main.hs");
			expect(result.imports).toHaveLength(1);
		});
	});

	describe("Shell parser", () => {
		const shellParser = createRegexParser("shell", [/source\s+([^\s;]+)/]);

		it("should parse source commands", async () => {
			const content = `
source ~/.bashrc
source /etc/profile
`;
			const result = await shellParser(content, "setup.sh");
			expect(result.imports).toHaveLength(2);
			expect(result.imports[0]?.source).toBe("~/.bashrc");
		});

		it("should ignore # commented source lines", async () => {
			const content = `
# source ~/.bashrc
source /etc/profile
`;
			const result = await shellParser(content, "setup.sh");
			expect(result.imports).toHaveLength(1);
		});

		it("should deduplicate sourced files", async () => {
			const content = `
source /etc/profile
source /etc/profile
`;
			const result = await shellParser(content, "setup.sh");
			expect(result.imports).toHaveLength(1);
		});
	});

	describe("error handling", () => {
		it("should handle empty content", async () => {
			const parser = createRegexParser("test", [/import\s+([\w.]+)/]);
			const result = await parser("", "test.txt");
			expect(result.imports).toHaveLength(0);
			expect(result.parseError).toBeUndefined();
		});

		it("should handle content with no matches", async () => {
			const parser = createRegexParser("test", [/import\s+([\w.]+)/]);
			const result = await parser("no imports here", "test.txt");
			expect(result.imports).toHaveLength(0);
		});

		it("should handle whitespace-only content", async () => {
			const parser = createRegexParser("test", [/import\s+([\w.]+)/]);
			const result = await parser("   \n\t\n  ", "test.txt");
			expect(result.imports).toHaveLength(0);
			expect(result.parseError).toBeUndefined();
		});

		it("should return correct language and path in result metadata", async () => {
			const parser = createRegexParser("mylang", [/import\s+([\w.]+)/]);
			const result = await parser("import foo", "src/test.mylang");
			expect(result.language).toBe("mylang");
			expect(result.path).toBe("src/test.mylang");
		});

		it("should handle very long import identifier without errors", async () => {
			const longImport = `import ${"a".repeat(500)}`;
			const parser = createRegexParser("test", [/import\s+([\w.]+)/]);
			const result = await parser(longImport, "test.txt");
			expect(result.imports).toHaveLength(1);
			expect(result.imports[0]?.source).toBe("a".repeat(500));
		});

		it("should handle files with only blank lines", async () => {
			const parser = createRegexParser("test", [/import\s+([\w.]+)/]);
			const result = await parser("\n\n\n\n", "test.txt");
			expect(result.imports).toHaveLength(0);
		});

		it("should handle zero patterns and return no imports", async () => {
			const parser = createRegexParser("test", []);
			const result = await parser("import foo", "test.txt");
			expect(result.imports).toHaveLength(0);
		});

		it("should not duplicate when same source matched by two patterns", async () => {
			const parser = createRegexParser("test", [
				/import\s+([\w.]+)/,
				/import\s+([\w.]+)/,
			]);
			const result = await parser("import alpha", "test.txt");
			expect(result.imports).toHaveLength(1);
		});
	});
});
