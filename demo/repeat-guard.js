#!/usr/bin/env node
/**
 * Demo: Repeat Failure Guard
 * Simulates the same error happening 3 times.
 * Watch the guard block appear in the prompt on the 3rd failure.
 */

import { SCAR } from '../src/SCAR.js';

const scar = new SCAR('demo', 'repeat-guard');
scar.clearIncidents();

console.log('🔴 DEMO: Repeat Failure Guard\n');
console.log('Simulating the same error 3 times...\n');

// Simulate 3 identical failures
const errorMessage = 'SYNTAX COMPLIANCE ERROR: unexpected token at line 42';

for (let i = 1; i <= 3; i++) {
  console.log(`─ Failure ${i}:`);

  // Record the incident
  scar.recordIncident('syntax_error', 'code-generator', 'openai', 400, errorMessage);

  // Fetch scars and show them
  const scars = scar.getRecentScars(10);
  console.log(`  Incidents logged: ${scars.length}`);

  if (i < 3) {
    console.log(`  Guard block: none (first ${i} occurrence)\n`);
  } else {
    // On the 3rd occurrence, inject the guard
    const originalPrompt = 'Generate a valid JavaScript function that calculates factorial.';
    const guardedPrompt = scar.injectRepeatGuard(originalPrompt, scars);

    console.log(`  ✅ Guard block INJECTED on 3rd failure:\n`);
    console.log('  ' + guardedPrompt.split('\n').slice(0, 5).join('\n  '));
    console.log('  ...\n');
  }
}

console.log('✓ Demo complete. The guard block appeared on the 3rd identical failure.');
console.log('✓ Next iteration of the agent would see this warning and avoid the error.\n');
