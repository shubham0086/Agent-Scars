# Agent-Scars

**An agent that remembers its own failures so it never makes the same mistake twice.**

AI agents get stuck in loops: same error, same response, same failure, repeat. Agent-Scars breaks that cycle by tracking failures and injecting a guard block into the prompt on the next turn, forcing the agent to acknowledge and fix the error instead of repeating it.

This is the **memory + consistency** claim made runnable. Extracted from 18 months of production Agency OS.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 18+](https://img.shields.io/badge/Node-18%2B-brightgreen.svg)](package.json)
[![Zero cost mode](https://img.shields.io/badge/runs-offline%20by%20default-orange.svg)]()

---

## What It Does

1. **Records incidents** to SQLite (or JSON fallback if better-sqlite3 isn't installed)
2. **Detects failure patterns** — watches for the same error repeated multiple times
3. **Injects a guard block** into the next prompt: "You made this mistake 2 times. Here's how to fix it."

The agent reads the guard and changes its behavior. No more loops.

---

## Quick Start

```bash
npm install
npm run demo:guard     # See the guard block appear on 3rd failure
npm run demo:persist  # See incidents survive across sessions
```

**No API key needed.** Runs fully offline in mock mode.

---

## How It Works

### The Three-Beat System

1. **Record** — agent fails, we log it: `scar.recordIncident('syntax_error', 'coder', 'openai', 400, message)`
2. **Detect** — fetch scars and find patterns: `scar.detectFailurePatterns(scars)` finds "SYNTAX ERROR repeated 2x"
3. **Guard** — inject into next prompt: `scar.injectRepeatGuard(prompt, scars)` prepends warning block

### The Guard Block

```
### !!! REPEAT FAILURE GUARD — DO NOT REPEAT THESE ERRORS !!!
The following errors have occurred MULTIPLE times in this session. Prioritize fixing them:

▶ Pattern: SYNTAX COMPLIANCE ERROR (Failed 2 times)
  Fix Instruction: Output must be valid syntax. Verify braces, brackets, parentheses, and commas. Never truncate output mid-block.

### !!! END REPEAT FAILURE GUARD !!!
```

The agent sees this and stops repeating the error.

---

## API

### `new SCAR(workspaceId, projectId)`

Create a SCAR instance tied to a workspace and project. Incidents are stored by this key, allowing multi-tenant tracking.

```js
import { SCAR } from 'agent-scars';

const scar = new SCAR('my-workspace', 'my-project');
```

### `recordIncident(type, agent, provider, statusCode, message, goalId)`

Log a failure.

```js
scar.recordIncident('api_error', 'researcher', 'openai', 429, 'rate limit exceeded');
```

### `getRecentScars(limit)`

Fetch recent failures for this workspace/project.

```js
const scars = scar.getRecentScars(10);
// Returns: [{ type, agent, provider, status_code, message, timestamp }, ...]
```

### `detectFailurePatterns(scars)`

Scan failures and find repeating patterns (using regex matching against known fixes).

```js
const patterns = scar.detectFailurePatterns(scars);
// Returns: [{ pattern: 'SYNTAX ERROR', count: 2, hint: '...' }, ...]
```

### `injectRepeatGuard(prompt, scars)`

Prepend a guard block to the prompt if patterns are detected.

```js
const guardedPrompt = scar.injectRepeatGuard(originalPrompt, scars);
// Returns: '### !!! REPEAT FAILURE GUARD ... !!!\n' + originalPrompt
```

---

## Storage

### SQLite (Preferred)

If `better-sqlite3` is installed, incidents go to `./data/scars.db` with full ACID guarantees.

### JSON Fallback

If `better-sqlite3` isn't available, SCAR falls back to `./data/incidents.json`. Same behavior, same API. Works offline without any external dependencies.

```
[SCAR] SQLite database unavailable (Error: ...). Falling back to JSON incident logs.
```

---

## Why It Works

Most agents loop because they have no memory of failure. An agent that tries the same syntactically invalid code three times in a row isn't dumb — it's forgotten the first two tries.

By persistently logging failures and injecting them back into the prompt, we close that gap. The agent *sees* what it did wrong and has explicit instructions on how to fix it.

---

## Real-World Use Cases

- **Code generation agents** that keep producing the same syntax errors
- **Research agents** that retry failed API calls without backoff
- **Multi-step workflows** where one agent's mistake cascades into the next agent's failure
- **Long-running jobs** where an agent drifts and repeats earlier mistakes

---

## Known Fixes (Built-in Patterns)

The SCAR database ships with patterns for common agent mistakes:

- **ROUTE FACTORY EXPORT** — Express route files must export a factory function
- **BANNED CALL EXHAUSTION** — eval() and exec() are forbidden
- **PATH TRAVERSAL ATTEMPT** — no `..` or absolute paths
- **INVALID SEARCH/REPLACE DIFF** — search blocks must match exactly
- **SYNTAX COMPLIANCE ERROR** — invalid JavaScript/Python syntax
- **ESM IMPORT IN COMMONJS** — file runs in CommonJS, no `import` keyword
- **API RATE LIMIT TRIGGER** — provider is rate-limited
- **REQUEST TIMEOUT EXPIRED** — inference took too long

Add your own patterns by extending `knownFixes` in the constructor.

---

## Zero Setup

Node 18+, no external API keys, no required dependencies (better-sqlite3 is optional).

```bash
git clone https://github.com/shubham0086/Agent-Scars
cd Agent-Scars
npm install
npm run demo:guard
```

---

## Where This Fits

This is the **memory + consistency** proof from the autonomy ladder:

```
AI-systems-evolution   ← start here (rung 03: agent, rung 02: memory)
    |
    └─► agentic-patterns  ← Pattern 03 (reality-first memory) + Pattern 07 (anti-drift)
            |
            └─► Agent-Scars  ← THIS REPO (the production failure memory engine)
```

For the full orchestration stack that uses SCAR in production: see [agentkernel](https://github.com/shubham0086/agentkernel).

**Theory companions:** [Pattern 03: Reality-First Memory](https://github.com/shubham0086/agentic-patterns/blob/main/docs/03-reality-first-memory.md) · [Pattern 07: Anti-Drift](https://github.com/shubham0086/agentic-patterns/blob/main/docs/07-anti-drift.md)

---

<div align="center">

Built by [Shubham Prajapati](https://github.com/shubham0086) ·
[Portfolio](https://shubham0086.github.io/MyPortfolio.github.io/)
· MIT (code) · CC BY 4.0 (docs)

Extracted from 18 months of production Agency OS.

</div>
