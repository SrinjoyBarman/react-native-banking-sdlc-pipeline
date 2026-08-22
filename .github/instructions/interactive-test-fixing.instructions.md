---
description: >
  Use when: SDLC_G4_TESTING gate fails with test configuration issues. 
  Defines interactive user prompting and automatic test fixing workflow.
  Orchestrator MUST follow this when failure_action is 'ask_user_then_auto_fix'.
applyTo: .github/agents/sdlc-pipeline-orchestrator.agent.md
---

# Interactive Test Fixing — SDLC_G4_TESTING Failure Handling

## Overview

When SDLC_G4_TESTING fails, the pipeline offers **interactive remediation** instead of simply blocking. This prevents the pipeline from stopping due to test configuration issues (which are fixable) while maintaining quality standards.

---

## Trigger Conditions

This workflow activates when:

- ✅ SDLC_G4_TESTING gate status = `FAILED`
- ✅ Gate has `failure_action: 'ask_user_then_auto_fix'`
- ✅ Gate has `interactive_fix.enabled: true`

---

## Orchestrator Behavior (MANDATORY)

### Step 1: Detect Failure

When sdlc-g4-test-executor reports failure:

```json
{
  "gate_id": "SDLC_G4_TESTING",
  "status": "FAILED",
  "test_failures": 28,
  "coverage": {
    "statements": 49,
    "threshold": 80
  }
}
```

### Step 2: Analyze Root Cause

Determine if failures are **fixable configuration issues** vs **code bugs**:

**✅ Fixable (offer auto-fix):**

- Jest configuration errors (moduleNameMapper, test environment)
- Missing mock providers (Redux, Navigation, Context)
- Async/timer isolation issues
- Import resolution errors
- Test utility setup missing

**❌ Not auto-fixable (require manual intervention):**

- Logic bugs in implementation code
- API contract changes breaking tests
- Architecture violations requiring refactor
- Missing business logic

**Decision rule:** If ≥70% of failures are configuration issues → offer auto-fix

### Step 3: Prompt User

Use `vscode_askQuestions` tool to present the decision:

```typescript
vscode_askQuestions({
  questions: [
    {
      header: 'SDLC_G4_TESTING Failed — Auto-Fix Available',
      question: `
SDLC_G4_TESTING failed with ${testFailures} test failures and ${coverage}% coverage (target: 80%).

Root cause analysis: ${failureAnalysis}

Would you like the pipeline to automatically fix these issues?

Auto-fix will:
✅ Fix Jest configuration and test environment setup
✅ Create missing test utilities and mock providers
✅ Fix async/timer isolation issues
✅ Re-run tests until 80% coverage achieved
✅ Automatically continue to G5-G7 gates on success

Estimated time: 2-3 hours
Estimated cost: $0.40-0.60
    `,
      options: [
        {
          label: 'Yes, auto-fix and continue',
          value: 'yes',
          recommended: true
        },
        { label: "No, I'll fix manually", value: 'no' }
      ]
    }
  ]
});
```

### Step 4a: User Accepts Auto-Fix

If user selects "Yes":

1. **Invoke sdlc-g4-test-fixer** (max 3 iterations):

   ```typescript
   runSubagent({
     agentName: 'sdlc-g4-test-fixer',
     description: 'Fix all test configuration issues',
     prompt: `
       Fix all test failures from SDLC_G4_TESTING run.
       
       Current state:
       - Test failures: ${testFailures}
       - Coverage: ${coverage}%
       - Root causes: ${rootCauses}
       
       Target:
       - All tests passing (0 failures)
       - Coverage ≥80% on all metrics
       
       Apply fixes from TEST-REMEDIATION-GUIDE.md:
       1. Jest configuration (moduleNameMapper, test environment)
       2. Test utilities (test-providers.tsx with Redux/Navigation/Context)
       3. Mock providers for all tests
       4. Async/timer isolation fixes
       5. Coverage gap fixes
       
       After each iteration, re-run sdlc-g4-test-executor to validate.
       Max 3 iterations. If not resolved after 3 attempts, report blockers.
     `
   });
   ```

2. **Validation loop** (up to 3 iterations):

   ```typescript
   for (let i = 0; i < 3; i++) {
     const fixResult = await testFixerAgent.fix();
     const testResult = await testExecutor.run();

     if (testResult.failures === 0 && testResult.coverage >= 80) {
       // SUCCESS - break loop
       break;
     }

     if (i === 2) {
       // Failed after 3 iterations - report blocking issues
       return {
         status: 'FAILED',
         reason: 'Auto-fix could not resolve all issues after 3 attempts',
         recommendation: 'Manual intervention required'
       };
     }
   }
   ```

3. **Update pipeline state**:

   ```json
   {
     "gate_id": "SDLC_G4_TESTING",
     "status": "PASSED",
     "resolution": "auto_fix",
     "iterations": 2,
     "final_coverage": 82,
     "auto_fix_applied": true
   }
   ```

4. **Auto-continue to blocked gates**:

   ```typescript
   const blockedGates = [
     'SDLC_G5_PERFORMANCE',
     'SDLC_G6_ACCESSIBILITY',
     'SDLC_G7_DEPENDENCIES'
   ];

   for (const gateId of blockedGates) {
     await executeGate(gateId);
   }
   ```

5. **Report success**:

   ```
   ✅ SDLC_G4_TESTING auto-fix completed successfully!

   - 28 test failures → 0 failures
   - 49% coverage → 82% coverage
   - 2 fix iterations applied

   Continuing to downstream gates:
   - SDLC_G5_PERFORMANCE...
   - SDLC_G6_ACCESSIBILITY...
   - SDLC_G7_DEPENDENCIES...
   ```

### Step 4b: User Declines Auto-Fix

If user selects "No":

1. **Stop pipeline**:

   ```json
   {
     "gate_id": "SDLC_G4_TESTING",
     "status": "FAILED",
     "resolution": "user_declined_auto_fix",
     "pipeline_status": "STOPPED"
   }
   ```

2. **Provide manual remediation guidance**:

   ```
   ⏸️ Pipeline stopped at SDLC_G4_TESTING.

   To fix tests manually:
   1. Review: pipeline-output/06-testing/TEST-REMEDIATION-GUIDE.md
   2. Apply fixes (estimated 2-3 hours)
   3. Run: npm test -- --coverage
   4. When passing, resume pipeline: @sdlc-pipeline-orchestrator resume

   Detailed test failures: pipeline-output/06-testing/test-execution-report.md
   ```

3. **Update checkpoint**:
   ```json
   {
     "last_successful_gate": "SDLC_G3_REVIEW",
     "failed_gate": "SDLC_G4_TESTING",
     "resume_from": "SDLC_G4_TESTING",
     "user_action_required": "fix_tests_manually"
   }
   ```

---

## sdlc-g4-test-fixer Responsibilities

The sdlc-g4-test-fixer is a specialized agent that:

1. **Analyzes test failures** from test-execution-report.md
2. **Categorizes issues** (Jest config, mocks, async, coverage)
3. **Applies fixes** in priority order:

   - P0: Jest configuration (blocks all tests)
   - P1: Test utilities and providers (blocks component/hook tests)
   - P2: Mock setup (blocks individual test suites)
   - P3: Async/timer isolation (blocks specific tests)
   - P4: Coverage gaps (add missing test cases)

4. **Validates each fix** by re-running tests
5. **Reports progress** after each iteration
6. **Escalates blockers** if unresolvable after 3 iterations

### Example Fix Iteration

**Iteration 1:**

```
Analyzing 28 test failures...

Root causes identified:
- Jest moduleNameMapper missing (affects 15 tests)
- Test providers not configured (affects 8 tests)
- Timer mocks not isolated (affects 5 tests)

Applying fixes:
✅ Updated jest.config.js with moduleNameMapper
✅ Created test-utils/test-providers.tsx
✅ Fixed timer isolation in 3 test suites

Re-running tests...
Result: 10 failures remaining, 65% coverage

Proceeding to iteration 2...
```

**Iteration 2:**

```
Analyzing 10 remaining failures...

Root causes:
- Missing Context providers (affects 6 tests)
- Async act() warnings (affects 4 tests)

Applying fixes:
✅ Added MPINFlowProvider wrapper to 6 hook tests
✅ Wrapped state updates in act() for 4 tests

Re-running tests...
Result: 0 failures, 82% coverage ✅

SUCCESS - All tests passing, coverage above threshold.
```

---

## Configuration Reference

In `pipeline-config.yaml`:

```yaml
- id: 'SDLC_G4_TESTING'
  failure_action: 'ask_user_then_auto_fix'
  interactive_fix:
    enabled: true
    prompt_user: true
    user_prompt: '...'
    on_user_accept:
      action: 'invoke_test_fixer'
      agents: ['sdlc-g4-test-fixer', 'sdlc-g4-test-executor']
      target_coverage: 80
      auto_continue_on_success: true
      continue_to_gates:
        ['SDLC_G5_PERFORMANCE', 'SDLC_G6_ACCESSIBILITY', 'SDLC_G7_DEPENDENCIES']
    on_user_decline:
      action: 'stop'
      message: '...'
```

In `execution_flow`:

```yaml
- gate: 'SDLC_G4_TESTING'
  next_on_success: 'SDLC_PARALLEL_AUDIT_GATES'
  next_on_failure: 'ASK_USER_FIX_TESTS'
  interactive_decision:
    enabled: true
    on_user_accept: 'AUTO_FIX_TESTS_THEN_CONTINUE'
    on_user_decline: 'STOP_PIPELINE'
    auto_continue_gates:
      ['SDLC_G5_PERFORMANCE', 'SDLC_G6_ACCESSIBILITY', 'SDLC_G7_DEPENDENCIES']
```

---

## Success Metrics

After auto-fix completes:

- ✅ All tests passing (0 failures)
- ✅ Coverage ≥80% on all metrics (statements, branches, functions, lines)
- ✅ G5-G7 gates automatically executed
- ✅ Pipeline reaches SDLC_G8_COMPLETION
- ✅ Total pipeline runtime: original + 2-3 hours for test fixes

---

## Error Handling

### Auto-fix fails after 3 iterations

```
⚠️ Auto-fix could not resolve all test issues after 3 iterations.

Remaining issues:
- 5 test failures (logic bugs in implementation)
- 72% coverage (edge cases not covered)

These issues require manual intervention:
1. Review remaining failures in test-execution-report.md
2. Fix implementation logic bugs
3. Add missing test cases for edge cases
4. Re-run: npm test -- --coverage
5. Resume pipeline when passing
```

### User changes mind mid-execution

Pipeline must complete current fix iteration before stopping. User can manually abort via Ctrl+C.

---

## Benefits of Interactive Fixing

1. **Unblocks pipeline** — Doesn't stop on fixable configuration issues
2. **Saves time** — Auto-fix is faster than manual remediation
3. **Maintains quality** — Still enforces 80% coverage threshold
4. **User control** — User decides whether to auto-fix or manual-fix
5. **Complete workflow** — Automatically continues to downstream gates

---

## Future Enhancements

Potential improvements:

- [ ] Add "Preview fixes" option before applying
- [ ] Support partial auto-fix (fix config only, skip coverage)
- [ ] Estimate cost before prompting user
- [ ] Generate test fix PR automatically

---

## Agent Invocation Reference

When the orchestrator invokes `sdlc-g4-test-fixer`, pass the following prompt shape:

```typescript
runSubagent({
  agentName: 'sdlc-g4-test-fixer',
  description: 'Auto-fix G4 test failures',
  prompt: `
    Fix all test failures from SDLC_G4_TESTING run.

    Current state:
    - Test failures: ${testFailures}
    - Coverage: ${coverage}%
    - Root causes: ${rootCauses}

    Target:
    - 0 test failures
    - ≥80% coverage on all metrics

    Apply fixes in priority order (P0 → P4). Max 3 iterations.
    Report progress after each iteration.
    After success, pipeline will auto-continue to G5–G7 gates.
  `
});
```

## Iteration Strategy

| Iteration | Focus             | Priority levels                   | Goal                            |
| --------- | ----------------- | --------------------------------- | ------------------------------- |
| 1         | Infrastructure    | P0 (Jest config) + P1 (providers) | Unblock majority of test suites |
| 2         | Test fixes        | P2 (mocks) + P3 (async/act)       | Reduce failures to near zero    |
| 3         | Coverage & polish | P4 (coverage gaps)                | Reach ≥80% on all metrics       |

If any iteration ends with 0 failures and ≥80% coverage, stop early and report success.

---

_Last Updated: 2026-06-03_  
_Pipeline Version: 2.1.1_
