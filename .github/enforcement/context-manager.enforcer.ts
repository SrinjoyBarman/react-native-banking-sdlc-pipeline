/**
 * Context Manager — Shared Context Pool for Pipeline Agents
 *
 * Optimizes token usage by loading copilot-instructions.md once
 * and extracting relevant sections for each agent type.
 *
 * Reduces token usage from ~42k to ~17k (59% savings).
 */

export interface ContextExtract {
  agent: string;
  required_sections: string[];
  tokens_saved: number;
  context: string;
}

export interface SharedContext {
  full_instructions: string;
  instructions_tokens: number;
  extracts: Record<string, ContextExtract>;
  loaded_at: string;
}

/**
 * Load and parse copilot-instructions.md once for the entire pipeline run
 */
export async function loadSharedContext(
  read_file: (path: string) => Promise<string>
): Promise<SharedContext> {
  const full_instructions = await read_file('.github/copilot-instructions.md');
  const instructions_tokens = Math.ceil(full_instructions.length / 4);

  return {
    full_instructions,
    instructions_tokens,
    extracts: {},
    loaded_at: new Date().toISOString()
  };
}

/**
 * Extract relevant context for a specific agent
 */
export function extractContextForAgent(
  shared_context: SharedContext,
  agent_name: string
): ContextExtract {
  // Check cache first
  if (shared_context.extracts[agent_name]) {
    return shared_context.extracts[agent_name];
  }

  const agent_needs = getAgentContextNeeds(agent_name);

  if (agent_needs.needs_full_context) {
    // Only sdlc-g2.3-framework-rules and sdlc-g2.5-security-specialist need full context
    const extract: ContextExtract = {
      agent: agent_name,
      required_sections: ['all'],
      tokens_saved: 0,
      context: shared_context.full_instructions
    };
    shared_context.extracts[agent_name] = extract;
    return extract;
  }

  // Extract only relevant sections for other agents
  const sections = extractSections(
    shared_context.full_instructions,
    agent_needs.sections
  );

  const context = sections.join('\n\n---\n\n');
  const context_tokens = Math.ceil(context.length / 4);
  const tokens_saved = shared_context.instructions_tokens - context_tokens;

  const extract: ContextExtract = {
    agent: agent_name,
    required_sections: agent_needs.sections,
    tokens_saved,
    context
  };

  shared_context.extracts[agent_name] = extract;
  return extract;
}

/**
 * Define context needs for each agent type
 */
function getAgentContextNeeds(agent_name: string): {
  needs_full_context: boolean;
  sections: string[];
} {
  const needs_map: Record<
    string,
    { needs_full_context: boolean; sections: string[] }
  > = {
    'sdlc-g2.3-framework-rules': {
      needs_full_context: true,
      sections: []
    },
    'sdlc-g2.5-security-specialist': {
      needs_full_context: true,
      sections: []
    },
    'sdlc-g3-senior-reviewer': {
      needs_full_context: false,
      sections: [
        'Module Boundaries',
        'Component Standards',
        'State Management',
        'API Call Chain',
        'TypeScript Standards'
      ]
    },
    'sdlc-g3-code-reviewer': {
      needs_full_context: false,
      sections: [
        'Component Standards',
        'Naming Conventions',
        'TypeScript Standards',
        'Code Quality'
      ]
    },
    'sdlc-g2-rn-developer': {
      needs_full_context: false,
      sections: [
        'Module Boundaries',
        'Component Standards',
        'Component Folder Structure',
        'State Management',
        'API Call Chain',
        'Import Aliases',
        'TypeScript Standards'
      ]
    },
    'sdlc-g4-test-planner': {
      needs_full_context: false,
      sections: ['Testing Standards']
    },
    'sdlc-g4-unit-test-developer': {
      needs_full_context: false,
      sections: ['Testing Standards', 'State Management']
    },
    'sdlc-g4-integration-test-developer': {
      needs_full_context: false,
      sections: ['Testing Standards', 'Component Standards']
    },
    'sdlc-g4-e2e-test-developer': {
      needs_full_context: false,
      sections: ['Testing Standards', 'Project Structure']
    },
    'sdlc-g4-test-executor': {
      needs_full_context: false,
      sections: ['Testing Standards'] // Only needs coverage thresholds
    },
    'sdlc-g0-requirements-analyst': {
      needs_full_context: false,
      sections: ['Module Boundaries', 'Project Structure']
    },
    'sdlc-g1-feature-planner': {
      needs_full_context: false,
      sections: ['Module Boundaries', 'Project Structure', 'Tech Stack']
    },
    'sdlc-g1-change-area-mapper': {
      needs_full_context: false,
      sections: ['Module Boundaries', 'Project Structure']
    },
    // Haiku agents that need minimal context
    'sdlc-g2.1-lint': {
      needs_full_context: false,
      sections: [] // No context needed - just parses ESLint output
    },
    'sdlc-g2.2-typecheck': {
      needs_full_context: false,
      sections: [] // No context needed - just parses tsc output
    },
    'sdlc-g2.4-circular-deps': {
      needs_full_context: false,
      sections: [] // No context needed - just parses madge output
    },
    'sdlc-g2.6-import-boundary': {
      needs_full_context: false,
      sections: ['Module Boundaries', 'Import Aliases']
    },
    'sdlc-g7-dependency-auditor': {
      needs_full_context: false,
      sections: ['Security Essentials']
    },
    'sdlc-g5-performance-auditor': {
      needs_full_context: false,
      sections: ['UI Rules']
    },
    'sdlc-g6-accessibility-auditor': {
      needs_full_context: false,
      sections: ['UI Rules']
    }
  };

  return (
    needs_map[agent_name] || {
      needs_full_context: false,
      sections: []
    }
  );
}

/**
 * Extract specific sections from copilot-instructions.md
 */
function extractSections(
  full_instructions: string,
  section_names: string[]
): string[] {
  if (section_names.length === 0) {
    return [
      '# Context (minimal)\n\nNo specific sections required for this agent.'
    ];
  }

  const sections: string[] = [];
  const lines = full_instructions.split('\n');

  for (const section_name of section_names) {
    let in_section = false;
    let section_content: string[] = [];
    let section_level = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is the section header we're looking for
      if (line.match(new RegExp(`^#{1,3}\\s+${section_name}`, 'i'))) {
        in_section = true;
        section_level = line.match(/^#+/)?.[0].length ?? 0;
        section_content.push(line);
        continue;
      }

      if (in_section) {
        // Check if we've hit a new section at the same or higher level
        const current_level = line.match(/^#+/)?.[0].length ?? 0;
        if (current_level > 0 && current_level <= section_level) {
          // End of this section
          break;
        }
        section_content.push(line);
      }
    }

    if (section_content.length > 0) {
      sections.push(section_content.join('\n'));
    }
  }

  return sections;
}

/**
 * Generate context summary for agent prompt
 */
export function generateContextPrompt(extract: ContextExtract): string {
  if (extract.required_sections.includes('all')) {
    return `
## Framework Context (Full)

${extract.context}
`;
  }

  if (extract.required_sections.length === 0) {
    return '## Framework Context\n\nMinimal context - refer to tool outputs and change manifest.';
  }

  return `
## Framework Context (Relevant Sections)

The following sections from copilot-instructions.md are relevant to your task:

${extract.context}

**Note**: This is an optimized context extract. Only sections relevant to your role are included to reduce token usage.
`;
}

/**
 * Calculate total token savings for a pipeline run
 */
export function calculateTokenSavings(shared_context: SharedContext): {
  total_tokens_without_optimization: number;
  total_tokens_with_optimization: number;
  tokens_saved: number;
  percentage_saved: number;
} {
  const agents_count = Object.keys(shared_context.extracts).length;
  const total_tokens_without_optimization =
    shared_context.instructions_tokens * agents_count;

  const total_tokens_with_optimization =
    shared_context.instructions_tokens + // loaded once
    Object.values(shared_context.extracts).reduce(
      (sum, extract) => sum + extract.context.length / 4,
      0
    );

  const tokens_saved =
    total_tokens_without_optimization - total_tokens_with_optimization;

  const percentage_saved =
    (tokens_saved / total_tokens_without_optimization) * 100;

  return {
    total_tokens_without_optimization,
    total_tokens_with_optimization,
    tokens_saved,
    percentage_saved
  };
}
