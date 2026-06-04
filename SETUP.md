# Agent-Scars Setup Guide

## Prerequisites

- Node 18+
- `npm` or `yarn`

## Installation

### Option 1: Install Dependencies (Recommended)

```bash
npm install
```

This installs `better-sqlite3` for persistent, ACID-guaranteed incident logging.

### Option 2: Zero Dependencies (Fallback Mode)

If you can't install native modules, skip the dependency step:

```bash
# Don't run npm install, or...
npm install --no-optional
```

SCAR will auto-detect and fall back to JSON-based incident logging. Same API, same behavior, just less performant on large datasets.

---

## Quick Start

### Run the Demos

```bash
# Demo 1: Watch the repeat-failure guard appear on the 3rd identical error
npm run demo:guard

# Demo 2: Record incidents, restart the session, see scars persisted
npm run demo:persist
```

### Use in Your Code

```js
import { SCAR } from 'agent-scars';

const scar = new SCAR('my-workspace', 'my-project');

// Record a failure
scar.recordIncident('api_error', 'researcher', 'openai', 429, 'rate limit: quota exceeded');

// Get recent scars
const scars = scar.getRecentScars(10);

// Detect repeating patterns
const patterns = scar.detectFailurePatterns(scars);

// Guard the next prompt
const guardedPrompt = scar.injectRepeatGuard(originalPrompt, scars);
```

---

## Configuration

### Workspace and Project IDs

All incidents are scoped to a `workspaceId` and `projectId`. Use these to separate concerns:

```js
// Different projects track incidents separately
const scarProduction = new SCAR('acme-corp', 'production-pipeline');
const scarDev = new SCAR('acme-corp', 'dev-pipeline');

// Different workspaces track separately
const scarAlice = new SCAR('alice', 'project-x');
const scarBob = new SCAR('bob', 'project-x');
```

### Custom Patterns

Extend the known fixes with domain-specific patterns:

```js
const scar = new SCAR('workspace', 'project');

// Add a custom pattern
scar.knownFixes.push({
  regex: /custom error pattern/i,
  label: 'MY CUSTOM ERROR',
  hint: 'Here is how to fix it: ...'
});
```

---

## Storage

### With better-sqlite3

Incidents are persisted to `./data/scars.db`:

```
project-root/
└── data/
    └── scars.db  ← SQLite database with ACID guarantees
```

### Fallback (JSON)

If better-sqlite3 isn't installed, incidents go to `./data/incidents.json`:

```
project-root/
└── data/
    └── incidents.json  ← JSON array of incidents
```

Both modes support the same API and both survive session restarts.

---

## Testing

```bash
npm test
```

This runs basic unit tests for the SCAR class.

---

## Integration with Agents

### With OpenAI, Anthropic, or Local LLMs

```js
import { SCAR } from 'agent-scars';

const scar = new SCAR('workspace', 'project');

async function agentStep(goal) {
  let prompt = `You are a helpful assistant. Achieve this goal: ${goal}`;

  // Guard the prompt with scars from prior failures
  const priorScars = scar.getRecentScars(5);
  if (priorScars.length > 0) {
    prompt = scar.injectRepeatGuard(prompt, priorScars);
  }

  try {
    // Call your LLM here
    const response = await llm.call(prompt);
    return response;
  } catch (error) {
    // Log the failure for next iteration
    scar.recordIncident('llm_error', 'agent', 'openai', error.code, error.message);
    throw error;
  }
}
```

---

## Troubleshooting

### "SQLite database unavailable"

This is normal. SCAR detected that `better-sqlite3` couldn't be installed (maybe you're on Windows without build tools). It automatically fell back to JSON mode. Both modes work identically; JSON mode is just slower on large datasets.

### Data Not Persisting

Make sure the `./data/` directory exists and is writable:

```bash
mkdir -p ./data
chmod 755 ./data
```

Or let SCAR create it (it does automatically).

### Tests Failing

Run individual tests to debug:

```bash
node tests/scar.test.js
```

Check that `./data/` is clean before testing.

---

## Performance Notes

- **SQLite mode:** ~1ms per recordIncident, supports millions of incidents
- **JSON mode:** ~5-10ms per recordIncident, fine for <10k incidents
- **Pattern detection:** O(n * m) where n = scars, m = knownFixes (typically <50ms)

For long-running agents, periodically call `getRecentScars(limit)` with a small limit to keep the pattern detection fast.

---

## License

MIT
