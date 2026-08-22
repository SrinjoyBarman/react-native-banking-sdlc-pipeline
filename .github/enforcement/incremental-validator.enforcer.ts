/**
 * Incremental Validation Mode
 *
 * Analyzes only changed files and their dependents instead of the entire codebase.
 * Reduces token usage by 60-80% for small changes.
 */

export interface IncrementalScope {
  mode: "full" | "incremental";
  changed_files: string[];
  dependent_files: string[];
  analysis_files: string[];
  files_skipped: number;
  estimated_token_savings: number;
}

export interface DependencyGraph {
  [file: string]: {
    imports: string[];
    imported_by: string[];
    module: string;
  };
}

/**
 * Determine if incremental mode should be used
 */
export function shouldUseIncrementalMode(
  trigger: string,
  changed_files_count: number,
  total_files_count: number,
): boolean {
  // Use incremental mode if:
  // 1. Trigger is "validate" (not a feature implementation)
  // 2. Changed files are < 30% of total codebase
  // 3. At least 10 files exist in the codebase

  if (trigger !== "validate") {
    return false;
  }

  if (total_files_count < 10) {
    return false;
  }

  const change_ratio = changed_files_count / total_files_count;
  return change_ratio < 0.3;
}

/**
 * Build dependency graph from source files
 */
export async function buildDependencyGraph(
  grep_search: (
    pattern: string,
    path_filter?: string,
  ) => Promise<
    Array<{
      file: string;
      line: number;
      text: string;
    }>
  >,
  list_files: (pattern: string) => Promise<string[]>,
): Promise<DependencyGraph> {
  const graph: DependencyGraph = {};

  // Get all TypeScript files
  const all_files = await list_files("src/**/*.{ts,tsx}");

  // For each file, find its imports
  for (const file of all_files) {
    const module = extractModule(file);
    const import_matches = await grep_search(
      "^import .* from ['\"](finvault/[^'\"]*)|(\\.\\.?/[^'\"]*))",
      file,
    );

    const imports = import_matches
      .map((match) => extractImportPath(match.text, file))
      .filter(Boolean) as string[];

    graph[file] = {
      imports,
      imported_by: [],
      module,
    };
  }

  // Build reverse dependencies (imported_by)
  for (const [file, data] of Object.entries(graph)) {
    for (const imported_file of data.imports) {
      if (graph[imported_file]) {
        graph[imported_file].imported_by.push(file);
      }
    }
  }

  return graph;
}

/**
 * Calculate incremental scope based on changed files
 */
export function calculateIncrementalScope(
  changed_files: string[],
  dependency_graph: DependencyGraph,
  total_files: number,
  instructions_tokens: number,
): IncrementalScope {
  // Find all files that depend on changed files (direct + transitive)
  const dependent_files = new Set<string>();
  const to_process = [...changed_files];
  const processed = new Set<string>();

  while (to_process.length > 0) {
    const file = to_process.pop()!;
    if (processed.has(file)) continue;
    processed.add(file);

    const file_data = dependency_graph[file];
    if (!file_data) continue;

    for (const dependent of file_data.imported_by) {
      if (!processed.has(dependent)) {
        dependent_files.add(dependent);
        to_process.push(dependent);
      }
    }
  }

  const analysis_files = [
    ...new Set([...changed_files, ...Array.from(dependent_files)]),
  ];

  const files_skipped = total_files - analysis_files.length;

  // Estimate token savings
  // Each file analyzed requires ~200 tokens (read + analyze)
  // Plus full context for each agent (~4500 tokens per agent * 7 agents)
  const tokens_per_file = 200;
  const estimated_token_savings = files_skipped * tokens_per_file;

  return {
    mode: "incremental",
    changed_files,
    dependent_files: Array.from(dependent_files),
    analysis_files,
    files_skipped,
    estimated_token_savings,
  };
}

/**
 * Generate filtered change manifest for incremental mode
 */
export async function generateIncrementalManifest(
  scope: IncrementalScope,
  original_manifest_path: string,
  read_json: (path: string) => Promise<any>,
  write_json: (path: string, data: any) => Promise<void>,
): Promise<string> {
  const original_manifest = await read_json(original_manifest_path);

  // Filter manifest to only include files in scope
  const filtered_manifest = {
    ...original_manifest,
    files: original_manifest.files.filter((f: any) =>
      scope.analysis_files.includes(f.path),
    ),
    summary: {
      ...original_manifest.summary,
      total_files: scope.analysis_files.length,
      mode: "incremental",
      files_skipped: scope.files_skipped,
      original_total: original_manifest.summary.total_files,
    },
  };

  const incremental_manifest_path = original_manifest_path.replace(
    ".json",
    "-incremental.json",
  );

  await write_json(incremental_manifest_path, filtered_manifest);
  return incremental_manifest_path;
}

/**
 * Extract module name from file path
 */
function extractModule(file_path: string): string {
  const match = file_path.match(/src\/([^/]+)/);
  return match ? match[1] : "unknown";
}

/**
 * Extract import path from import statement
 */
function extractImportPath(
  import_line: string,
  current_file: string,
): string | null {
  // Match: import ... from 'finvault/auth'
  const alias_match = import_line.match(/from ['"](finvault\/[^'"]+)['"]/);
  if (alias_match) {
    const alias = alias_match[1];
    // Convert alias to file path: finvault/auth -> src/auth/index.ts
    const module = alias.replace("finvault/", "");
    return `src/${module}/index.ts`;
  }

  // Match: import ... from '../../../auth/hooks/useAuth'
  const relative_match = import_line.match(/from ['"](\.\.*\/[^'"]+)['"]/);
  if (relative_match) {
    const relative_path = relative_match[1];
    // Resolve relative path
    const current_dir = current_file.substring(
      0,
      current_file.lastIndexOf("/"),
    );
    const resolved = resolvePath(current_dir, relative_path);

    // Add .ts or .tsx extension if missing
    if (!resolved.endsWith(".ts") && !resolved.endsWith(".tsx")) {
      return resolved + ".ts"; // Try .ts first
    }
    return resolved;
  }

  return null;
}

/**
 * Resolve relative path
 */
function resolvePath(base: string, relative: string): string {
  const parts = base.split("/");
  const relative_parts = relative.split("/");

  for (const part of relative_parts) {
    if (part === "..") {
      parts.pop();
    } else if (part !== ".") {
      parts.push(part);
    }
  }

  return parts.join("/");
}

/**
 * Generate incremental mode summary report
 */
export function generateIncrementalReport(scope: IncrementalScope): string {
  return `
# Incremental Validation Report

**Mode:** ${scope.mode}  
**Changed Files:** ${scope.changed_files.length}  
**Dependent Files:** ${scope.dependent_files.length}  
**Total Analysis Scope:** ${scope.analysis_files.length} files  
**Files Skipped:** ${scope.files_skipped}  
**Estimated Token Savings:** ~${Math.round(
    scope.estimated_token_savings / 1000,
  )}k tokens

---

## Changed Files

${scope.changed_files.map((f) => `- ${f}`).join("\n")}

---

## Dependent Files (Will Also Be Analyzed)

${
  scope.dependent_files.length > 0
    ? scope.dependent_files.map((f) => `- ${f}`).join("\n")
    : "_No dependent files found_"
}

---

## Analysis Strategy

Incremental mode analyzes only:
1. **Changed files** — directly modified in this branch
2. **Direct dependents** — files that import changed files
3. **Transitive dependents** — files that import direct dependents

Files outside this scope are assumed to be unchanged and pass their previous validation state.

**Token Efficiency:** ${
    scope.files_skipped > 0
      ? `${Math.round(
          (scope.files_skipped /
            (scope.analysis_files.length + scope.files_skipped)) *
            100,
        )}% reduction in analysis scope`
      : "No reduction (analyzing all files)"
  }

---

## Quality Gates Behavior

- **Lint/TypeCheck/Circular-Deps:** Only scan files in analysis scope
- **Framework Rules:** Validate only changed files against conventions
- **Import Boundary:** Check boundaries for changed files + dependents
- **Tests:** Run only tests for changed files
- **Coverage:** Calculate coverage for analysis scope only

---

**Generated:** ${new Date().toISOString()}
`;
}
