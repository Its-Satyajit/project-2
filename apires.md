// http://localhost:3000/api/dashboard/867bf926-f4be-448d-a452-b96d60df6942

interface Response {
id: string;
userId: null;
owner: string;
name: string;
fullName: string;
url: string;
description: string;
defaultBranch: string;
primaryLanguage: string;
isPrivate: boolean;
stars: number;
forks: number;
avatarUrl: string;
license: string;
analysisStatus: string;
analysisPhase: string;
createdAt: string;
updatedAt: string;
analysisResults: AnalysisResult[];
fileTypeBreakdown: FileTypeBreakdown;
dependencyGraph: DependencyGraph;
hotSpotData: HotSpotDatum[];
commits: Commit[];
fileTree: FileTree[];
contributorCount: number;
}

interface FileTree {
name: string;
items?: Item19[];
}

interface Item19 {
name: string;
items?: (Item4 | Items2 | Items3 | Items4 | Items52 | Items62 | Items7 | Items32 | Items9 | Items10 | Items11 | Items12 | Item2 | Items14 | Items15 | Item | Items17 | Items18 | Item5 | Items20 | Items21)[];
}

interface Items21 {
name: string;
items: (Items3 | Item2)[];
}

interface Items20 {
name: string;
items: Item18[];
}

interface Item18 {
name: string;
items: Item7[];
}

interface Items18 {
name: string;
items: Item17[];
}

interface Item17 {
name: string;
items: Item16[];
}

interface Item16 {
name: string;
items?: Items3[];
}

interface Items17 {
name: string;
items: Item12[];
}

interface Items15 {
name: string;
items: (Item15 | Item2)[];
}

interface Item15 {
name: string;
items: Item2[];
}

interface Items14 {
name: string;
items?: (Item12 | Items22 | Item6 | Items9 | Items9 | Item3 | Item | Item11 | Items92 | Item7 | Item5)[];
}

interface Items92 {
name: string;
items?: (Items3 | Item2 | Item3 | Item | Item | Item5 | Item5)[];
}

interface Items22 {
name: string;
items?: (Item14 | Items2)[];
}

interface Item14 {
name: string;
items: Item13[];
}

interface Item13 {
name: string;
items: Items2[];
}

interface Item12 {
name: string;
items?: Item8[];
}

interface Items12 {
name: string;
items: Item4[];
}

interface Items11 {
name: string;
items: Item2[];
}

interface Items10 {
name: string;
items: Items3[];
}

interface Items9 {
name: string;
items?: Item11[];
}

interface Items7 {
name: string;
items: (Item4 | Items4 | Item2)[];
}

interface Items62 {
name: string;
items: Item11[];
}

interface Item11 {
name: string;
items?: Item6[];
}

interface Items52 {
name: string;
items: (Items3 | Items4 | Items32 | Item2 | Items5 | Items6)[];
}

interface Items6 {
name: string;
items: Item10[];
}

interface Item10 {
name: string;
items?: Item9[];
}

interface Item9 {
name: string;
items?: Item[];
}

interface Items5 {
name: string;
items: Item8[];
}

interface Item8 {
name: string;
items?: Item7[];
}

interface Item7 {
name: string;
items?: any[];
}

interface Items32 {
name: string;
items: Items4[];
}

interface Items4 {
name: string;
items: Item6[];
}

interface Item6 {
name: string;
items?: Item5[];
}

interface Items3 {
name: string;
items: Item5[];
}

interface Item5 {
name: string;
items?: Item[];
}

interface Items2 {
name: string;
items: any[];
}

interface Item4 {
name: string;
items: Item3[];
}

interface Item3 {
name: string;
items?: Item2[];
}

interface Item2 {
name: string;
items: Item[];
}

interface Item {
name: string;
}

interface Commit {
sha: string;
message: string;
authorName: string;
committedAt: string;
}

interface HotSpotDatum {
path: string;
language: string;
fanIn: number;
fanOut: number;
loc: number;
score: number;
rank: number;
}

interface DependencyGraph {
nodes: Node[];
edges: Edge[];
metadata: Metadata;
}

interface Metadata {
totalNodes: number;
totalEdges: number;
languageBreakdown: LanguageBreakdown;
unresolvedImports: number;
}

interface LanguageBreakdown {
typescript: number;
javascript: number;
shell: number;
}

interface Edge {
source: string;
target: string;
}

interface Node {
id: string;
path: string;
language: string;
imports: number;
loc: number;
}

interface FileTypeBreakdown {
yaml: number;
'github/codeowners': number;
md: number;
yml: number;
js: number;
gitignore: number;
'husky/pre-commit': number;
nvmrc: number;
png: number;
json: number;
babelrc: number;
production: number;
ico: number;
css: number;
mjs: number;
svg: number;
jsx: number;
tsx: number;
ts: number;
html: number;
bru: number;
sample: number;
plist: number;
icns: number;
env: number;
txt: number;
'no-extension': number;
toml: number;
sh: number;
proto: number;
cer: number;
xml: number;
pfx: number;
}

interface AnalysisResult {
id: string;
repositoryId: string;
s3StorageKey: string;
totalFiles: number;
totalDirectories: number;
totalLines: number;
summaryText: null;
createdAt: string;
updatedAt: string;
}

// http://localhost:3000/api/dashboard/867bf926-f4be-448d-a452-b96d60df6942/status

interface Response {
repoId: string;
status: string;
phase: string;
metadata: Metadata;
analysis: Analysis;
}

interface Analysis {
totalFiles: number;
totalDirectories: number;
totalLines: number;
fileTypeBreakdown: FileTypeBreakdown;
dependencyGraph: DependencyGraph;
hotSpotData: HotSpotDatum[];
summary: Summary;
}

interface Summary {
basic: Basic;
languages: Languages;
structure: Structure;
dependencies: Dependencies;
hotspots: Hotspots;
fileTypes: FileTypes;
}

interface FileTypes {
topExtensions: TopExtension[];
}

interface TopExtension {
extension: string;
count: number;
}

interface Hotspots {
topHotspots: TopHotspot[];
}

interface TopHotspot {
path: string;
score: number;
rank: number;
}

interface Dependencies {
totalNodes: number;
totalEdges: number;
mostDependedUpon: MostDependedUpon[];
mostDependent: MostDependent[];
}

interface MostDependent {
path: string;
fanOut: number;
}

interface MostDependedUpon {
path: string;
fanIn: number;
}

interface Structure {
maxDepth: number;
topLevelDirectories: string[];
}

interface Languages {
primaryLanguage: string;
topLanguages: TopLanguage[];
}

interface TopLanguage {
name: string;
percentage: number;
}

interface Basic {
totalFiles: number;
totalDirectories: number;
totalLines: number;
}

interface HotSpotDatum {
path: string;
language: string;
fanIn: number;
fanOut: number;
loc: number;
score: number;
rank: number;
}

interface DependencyGraph {
nodes: Node[];
edges: Edge[];
metadata: Metadata2;
}

interface Metadata2 {
totalNodes: number;
totalEdges: number;
languageBreakdown: LanguageBreakdown;
unresolvedImports: number;
}

interface LanguageBreakdown {
typescript: number;
javascript: number;
shell: number;
}

interface Edge {
source: string;
target: string;
}

interface Node {
id: string;
path: string;
language: string;
imports: number;
loc: number;
}

interface FileTypeBreakdown {
yaml: number;
'github/codeowners': number;
md: number;
yml: number;
js: number;
gitignore: number;
'husky/pre-commit': number;
nvmrc: number;
png: number;
json: number;
babelrc: number;
production: number;
ico: number;
css: number;
mjs: number;
svg: number;
jsx: number;
tsx: number;
ts: number;
html: number;
bru: number;
sample: number;
plist: number;
icns: number;
env: number;
txt: number;
'no-extension': number;
toml: number;
sh: number;
proto: number;
cer: number;
xml: number;
pfx: number;
}

interface Metadata {
owner: string;
name: string;
fullName: string;
description: string;
defaultBranch: string;
primaryLanguage: string;
isPrivate: boolean;
stars: number;
forks: number;
avatarUrl: string;
}

// http://localhost:3000/api/repos/top?limit=10

interface Response {
id: string;
owner: string;
name: string;
fullName: string;
description: null | string;
stars: number;
forks: number;
contributorCount: number;
primaryLanguage: string;
analysisStatus: string;
}
