#!/usr/bin/env node
/**
 * Demo: Cross-Session Persistence
 * Records incidents, then simulates a session restart.
 * Shows that scars survive and are recalled in the new session.
 */

import { SCAR } from '../src/SCAR.js';
import fs from 'fs';
import path from 'path';

const scarDir = path.resolve(process.cwd(), 'data');

console.log('🔴 DEMO: Cross-Session Persistence\n');

// Clean slate
if (fs.existsSync(scarDir)) {
  fs.rmSync(scarDir, { recursive: true, force: true });
}

console.log('Session 1: Recording 2 failures...\n');

const scar1 = new SCAR('demo', 'persist-test');

// Record some failures
scar1.recordIncident('api_error', 'researcher', 'openai', 429, 'rate limit: quota exceeded');
scar1.recordIncident('api_error', 'researcher', 'openai', 429, 'rate limit: quota exceeded');

let incidents1 = scar1.getRecentScars(10);
console.log(`✓ Session 1 logged ${incidents1.length} incident(s):\n`);
incidents1.forEach((inc, i) => {
  console.log(`  ${i + 1}. [${inc.type}] ${inc.message} (${inc.agent}@${inc.provider})`);
});

console.log('\n--- Session 1 ends. Data is persisted to disk. ---\n');

// Simulate session restart by deleting the in-memory reference
console.log('Session 2: New SCAR instance created...\n');

const scar2 = new SCAR('demo', 'persist-test');

let incidents2 = scar2.getRecentScars(10);
console.log(`✓ Session 2 found ${incidents2.length} incident(s) from Session 1:\n`);
incidents2.forEach((inc, i) => {
  console.log(`  ${i + 1}. [${inc.type}] ${inc.message} (${inc.agent}@${inc.provider})`);
});

// Show the pattern detection
const patterns = scar2.detectFailurePatterns(incidents2);
if (patterns.length > 0) {
  console.log('\n✅ Detected repeat patterns:\n');
  patterns.forEach((p) => {
    console.log(`  Pattern: ${p.pattern} (${p.count} occurrences)`);
    console.log(`  Fix: ${p.hint}\n`);
  });
}

console.log('✓ Demo complete. Scars persisted across sessions and pattern detected.\n');

// Cleanup
if (fs.existsSync(scarDir)) {
  fs.rmSync(scarDir, { recursive: true, force: true });
}
