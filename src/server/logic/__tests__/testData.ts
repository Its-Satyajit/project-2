// Test data for all language parsers
// Each test case has: code, filePath, expected imports

export interface ParserTestCase {
	name: string;
	code: string;
	filePath: string;
	expectedImports: {
		source: string;
		isExternal?: boolean;
	}[];
}

// ============================================
// TypeScript/JavaScript Test Cases
// ============================================
export const typescriptTestCases: ParserTestCase[] = [
	{
		name: "ES6 import default",
		code: `import React from "react";`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "react", isExternal: true }],
	},
	{
		name: "ES6 import named",
		code: `import { useState, useEffect } from "react";`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "react", isExternal: true }],
	},
	{
		name: "ES6 import all",
		code: `import * as React from "react";`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "react", isExternal: true }],
	},
	{
		name: "ES6 import side effect",
		code: `import "./styles.css";`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "./styles.css", isExternal: false }],
	},
	{
		name: "ES6 import relative",
		code: `import { utils } from "./utils";`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "./utils", isExternal: false }],
	},
	{
		name: "ES6 import parent",
		code: `import { config } from "../config";`,
		filePath: "src/components/Button.tsx",
		expectedImports: [{ source: "../config", isExternal: false }],
	},
	{
		name: "ES6 import alias @",
		code: `import { Button } from "@/components/Button";`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "@/components/Button", isExternal: false }],
	},
	{
		name: "ES6 import alias ~",
		code: `import { utils } from "~/lib/utils";`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "~/lib/utils", isExternal: false }],
	},
	{
		name: "Dynamic import",
		code: `const module = await import("./dynamicModule");`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "./dynamicModule", isExternal: false }],
	},
	{
		name: "require CommonJS",
		code: `const fs = require("fs");`,
		filePath: "src/utils.js",
		expectedImports: [{ source: "fs", isExternal: true }],
	},
	{
		name: "require relative",
		code: `const utils = require("./utils");`,
		filePath: "src/App.js",
		expectedImports: [{ source: "./utils", isExternal: false }],
	},
	{
		name: "Multiple imports",
		code: `
import React from "react";
import { useState } from "react";
import { utils } from "./utils";
import { api } from "../api";
import lodash from "lodash";
`,
		filePath: "src/App.tsx",
		expectedImports: [
			{ source: "react", isExternal: true },
			{ source: "./utils", isExternal: false },
			{ source: "../api", isExternal: false },
			{ source: "lodash", isExternal: true },
		],
	},
	{
		name: "Import with .js extension",
		code: `import { foo } from "./foo.js";`,
		filePath: "src/bar.ts",
		expectedImports: [{ source: "./foo.js", isExternal: false }],
	},
	{
		name: "Scoped package",
		code: `import { QueryClient } from "@tanstack/react-query";`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "@tanstack/react-query", isExternal: true }],
	},
	{
		name: "No imports",
		code: `const x = 1; export const y = x + 1;`,
		filePath: "src/utils.ts",
		expectedImports: [],
	},
	{
		name: "Commented import (should ignore)",
		code: `// import { foo } from "./foo";
import { bar } from "./bar";`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "./bar", isExternal: false }],
	},
	{
		name: "TypeScript type-only import",
		code: `import type { User } from "./types";`,
		filePath: "src/App.tsx",
		expectedImports: [{ source: "./types", isExternal: false }],
	},
	{
		name: "Mixed inline imports",
		code: `
import a from "a";
import b from "b";
import c from "c";
`,
		filePath: "src/App.tsx",
		expectedImports: [
			{ source: "a", isExternal: true },
			{ source: "b", isExternal: true },
			{ source: "c", isExternal: true },
		],
	},
	{
		name: "Export from",
		code: `export { foo } from "./utils";`,
		filePath: "src/index.ts",
		expectedImports: [{ source: "./utils", isExternal: false }],
	},
];

// ============================================
// Rust Test Cases
// ============================================
export const rustTestCases: ParserTestCase[] = [
	{
		name: "Simple use statement",
		code: `use std::collections::HashMap;`,
		filePath: "src/main.rs",
		expectedImports: [], // std is external, filtered out
	},
	{
		name: "External crate use",
		code: `use anyhow::Result;`,
		filePath: "src/main.rs",
		expectedImports: [], // anyhow is external, filtered out
	},
	{
		name: "Local crate import",
		code: `use devbind_core::config::DevBindConfig;`,
		filePath: "cli/src/cmd/add.rs",
		expectedImports: [{ source: "./core/src/config.rs", isExternal: false }],
	},
	{
		name: "Multiple use statements",
		code: `
use anyhow::Result;
use devbind_core::config::DevBindConfig;
use std::path::PathBuf;
use tracing::info;
`,
		filePath: "cli/src/cmd/add.rs",
		expectedImports: [{ source: "./core/src/config.rs", isExternal: false }],
	},
	{
		name: "use crate:: relative import",
		code: `use crate::utils::helper;`,
		filePath: "core/src/lib.rs",
		expectedImports: [
			{ source: "./core/src/utils/helper.rs", isExternal: false },
		],
	},
	{
		name: "use super:: parent import",
		code: `use super::config;`,
		filePath: "core/src/dns.rs",
		expectedImports: [{ source: "./core/src/config.rs", isExternal: false }],
	},
	{
		name: "use self:: same module import",
		code: `use self::helper::validate;`,
		filePath: "core/src/dns.rs",
		expectedImports: [{ source: "./core/src/helper.rs", isExternal: false }],
	},
	{
		name: "extern crate declaration",
		code: `extern crate devbind_core;`,
		filePath: "cli/src/main.rs",
		expectedImports: [], // extern crate is external
	},
	{
		name: "Multiple use with curly braces",
		code: `use devbind_core::config::{DevBindConfig, RouteConfig};`,
		filePath: "cli/src/cmd/add.rs",
		expectedImports: [{ source: "./core/src/config.rs", isExternal: false }],
	},
	{
		name: "Nested module path",
		code: `use devbind_core::dns::resolver::Resolver;`,
		filePath: "cli/src/cmd/run.rs",
		expectedImports: [
			{ source: "./core/src/dns/resolver.rs", isExternal: false },
		],
	},
	{
		name: "No imports",
		code: `pub fn add(a: i32, b: i32) -> i32 { a + b }`,
		filePath: "core/src/utils.rs",
		expectedImports: [],
	},
	{
		name: "Commented use (should ignore)",
		code: `// use std::io;
use std::fs;`,
		filePath: "src/main.rs",
		expectedImports: [], // Both are std, filtered out
	},
];

// ============================================
// Python Test Cases
// ============================================
export const pythonTestCases: ParserTestCase[] = [
	{
		name: "Simple import",
		code: `import os`,
		filePath: "src/main.py",
		expectedImports: [], // os is stdlib, external
	},
	{
		name: "From import",
		code: `from typing import List`,
		filePath: "src/main.py",
		expectedImports: [], // typing is stdlib, external
	},
	{
		name: "Relative import single dot",
		code: `from .utils import helper`,
		filePath: "src/module/main.py",
		expectedImports: [{ source: "src/module/utils.py", isExternal: false }],
	},
	{
		name: "Relative import double dot",
		code: `from ..config import settings`,
		filePath: "src/module/main.py",
		expectedImports: [{ source: "src/config.py", isExternal: false }],
	},
	{
		name: "External package import",
		code: `import requests`,
		filePath: "src/main.py",
		expectedImports: [{ source: "requests", isExternal: true }],
	},
	{
		name: "External package from import",
		code: `from flask import Flask`,
		filePath: "src/app.py",
		expectedImports: [{ source: "flask", isExternal: true }],
	},
	{
		name: "Multiple imports",
		code: `
import os
import sys
from typing import Dict
from .models import User
`,
		filePath: "src/api/main.py",
		expectedImports: [{ source: "src/api/models.py", isExternal: false }],
	},
	{
		name: "Import with alias",
		code: `import numpy as np`,
		filePath: "src/science.py",
		expectedImports: [{ source: "numpy", isExternal: true }],
	},
	{
		name: "No imports",
		code: `x = 1
y = 2
print(x + y)`,
		filePath: "src/main.py",
		expectedImports: [],
	},
	{
		name: "Third dot level relative import",
		code: `from ...utils import helper`,
		filePath: "src/a/b/main.py",
		expectedImports: [{ source: "src/utils.py", isExternal: false }],
	},
];

// ============================================
// Go Test Cases
// ============================================
export const goTestCases: ParserTestCase[] = [
	{
		name: "Standard library import",
		code: `import "fmt"`,
		filePath: "main.go",
		expectedImports: [], // fmt is stdlib, external
	},
	{
		name: "Multiple standard library imports",
		code: `
import (
    "fmt"
    "os"
    "strings"
)`,
		filePath: "main.go",
		expectedImports: [], // All stdlib, external
	},
	{
		name: "External package import",
		code: `import "github.com/gin-gonic/gin"`,
		filePath: "main.go",
		expectedImports: [{ source: "github.com/gin-gonic/gin", isExternal: true }],
	},
	{
		name: "Local module import",
		code: `import "github.com/user/project/pkg/utils"`,
		filePath: "cmd/main.go",
		expectedImports: [{ source: "./pkg/utils/utils.go", isExternal: false }],
	},
	{
		name: "Dot import",
		code: `. "fmt"`,
		filePath: "main.go",
		expectedImports: [], // Dot imports are external
	},
	{
		name: "Blank identifier import",
		code: `_ "net/http"`,
		filePath: "main.go",
		expectedImports: [], // Blank imports are external
	},
	{
		name: "Named import",
		code: `import h "github.com/user/project/handlers"`,
		filePath: "main.go",
		expectedImports: [{ source: "./handlers/handlers.go", isExternal: false }],
	},
	{
		name: "No imports",
		code: `
package main

func main() {
    println("Hello")
}`,
		filePath: "main.go",
		expectedImports: [],
	},
	{
		name: "Mixed local and external imports",
		code: `
import (
    "fmt"
    "github.com/user/project/config"
)`,
		filePath: "cmd/main.go",
		expectedImports: [{ source: "./config/config.go", isExternal: false }],
	},
];

// ============================================
// Integration Test Cases (full file analysis)
// ============================================
export interface IntegrationTestCase {
	name: string;
	files: {
		path: string;
		content: string;
	}[];
	expectedEdges: {
		source: string;
		target: string;
	}[];
}

export const integrationTestCases: IntegrationTestCase[] = [
	{
		name: "TypeScript project with local imports",
		files: [
			{
				path: "src/App.tsx",
				content: `
import { Button } from "./components/Button";
import { api } from "../services/api";
import { config } from "~/config";
`,
			},
			{
				path: "src/components/Button.tsx",
				content: `export const Button = () => {};`,
			},
			{ path: "src/services/api.ts", content: `export const api = {};` },
			{ path: "src/config.ts", content: `export const config = {};` },
		],
		expectedEdges: [
			{ source: "src/App.tsx", target: "src/components/Button.tsx" },
			{ source: "src/App.tsx", target: "src/services/api.ts" },
			{ source: "src/App.tsx", target: "src/config.ts" },
		],
	},
	{
		name: "Rust workspace with crate dependencies",
		files: [
			{
				path: "cli/src/cmd/add.rs",
				content: `
use anyhow::Result;
use devbind_core::config::DevBindConfig;
use tracing::info;
`,
			},
			{ path: "core/src/config.rs", content: `pub struct DevBindConfig {}` },
			{ path: "core/src/lib.rs", content: `pub mod config;` },
		],
		expectedEdges: [
			{ source: "cli/src/cmd/add.rs", target: "core/src/config.rs" },
		],
	},
	{
		name: "Python package with relative imports",
		files: [
			{
				path: "src/api/main.py",
				content: `
from .routes import router
from ..models import User
`,
			},
			{ path: "src/api/routes.py", content: `router = {}` },
			{ path: "src/models.py", content: `class User: pass` },
		],
		expectedEdges: [
			{ source: "src/api/main.py", target: "src/api/routes.py" },
			{ source: "src/api/main.py", target: "src/models.py" },
		],
	},
	{
		name: "Go module with internal packages",
		files: [
			{
				path: "cmd/main.go",
				content: `
package main

import (
    "fmt"
    "github.com/user/project/pkg/utils"
)
`,
			},
			{ path: "pkg/utils/utils.go", content: `package utils` },
		],
		expectedEdges: [{ source: "cmd/main.go", target: "pkg/utils/utils.go" }],
	},
	{
		name: "Mixed language project",
		files: [
			{
				path: "frontend/src/App.tsx",
				content: `import { api } from "./api";`,
			},
			{ path: "frontend/src/api.ts", content: `export const api = {};` },
			{
				path: "backend/src/main.rs",
				content: `use devbind_core::config::Config;`,
			},
			{ path: "backend/core/src/config.rs", content: `pub struct Config {}` },
		],
		expectedEdges: [
			{ source: "frontend/src/App.tsx", target: "frontend/src/api.ts" },
			{ source: "backend/src/main.rs", target: "backend/core/src/config.rs" },
		],
	},
];
