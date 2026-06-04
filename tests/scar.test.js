#!/usr/bin/env node
/**
 * Basic unit tests for SCAR class.
 * Run with: npm test
 */

import { SCAR } from '../src/SCAR.js';
import fs from 'fs';
import path from 'path';

const scarDir = path.resolve(process.cwd(), 'data');

// Test utilities
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function cleanup() {
  if (fs.existsSync(scarDir)) {
    fs.rmSync(scarDir, { recursive: true, force: true });
  }
}

// Tests
console.log('Agent-Scars Test Suite\n');

cleanup();
const scar = new SCAR('test', 'unit');

console.log('Test 1: Record Incident');
const id = scar.recordIncident('test_error', 'test-agent', 'mock', 500, 'Test error message');
assert(id > 0, 'Incident recorded with positive ID');

console.log('\nTest 2: Get Recent Scars');
const scars = scar.getRecentScars(10);
assert(scars.length === 1, 'One incident retrieved');
assert(scars[0].message === 'Test error message', 'Incident message matches');

console.log('\nTest 3: Clear Incidents');
scar.clearIncidents();
const empty = scar.getRecentScars(10);
assert(empty.length === 0, 'Incidents cleared');

console.log('\nTest 4: Detect Failure Patterns');
cleanup();
const scar2 = new SCAR('test', 'patterns');

// Record same error twice
scar2.recordIncident('syntax_error', 'coder', 'openai', 400, 'syntax check failed: unexpected token');
scar2.recordIncident('syntax_error', 'coder', 'openai', 400, 'syntax check failed: unexpected token');

const recentScars = scar2.getRecentScars(10);
const patterns = scar2.detectFailurePatterns(recentScars);
assert(patterns.length > 0, 'Patterns detected');
assert(patterns[0].count >= 2, 'Pattern count >= 2 for repeated error');

console.log('\nTest 5: Inject Repeat Guard');
const originalPrompt = 'Write a valid JavaScript function.';
const guardedPrompt = scar2.injectRepeatGuard(originalPrompt, recentScars);
assert(guardedPrompt.includes('REPEAT FAILURE GUARD'), 'Guard block injected');
assert(guardedPrompt.includes('SYNTAX'), 'Pattern name in guard block');

console.log('\nTest 6: No Guard for New Errors');
cleanup();
const scar3 = new SCAR('test', 'no-guard');
scar3.recordIncident('unique_error_1', 'agent', 'mock', 500, 'One-time error A');
scar3.recordIncident('unique_error_2', 'agent', 'mock', 500, 'Different error B');

const uniqueScars = scar3.getRecentScars(10);
const noPatterns = scar3.detectFailurePatterns(uniqueScars);
assert(noPatterns.length === 0, 'No patterns for non-repeating errors');

const unguardedPrompt = scar3.injectRepeatGuard(originalPrompt, uniqueScars);
assert(unguardedPrompt === originalPrompt, 'No guard injected for new errors');

console.log('\nTest 7: Cross-Session Persistence');
cleanup();
const scar4 = new SCAR('test', 'persist');
scar4.recordIncident('api_error', 'researcher', 'openai', 429, 'rate limit exceeded');

// Simulate session restart
const scar5 = new SCAR('test', 'persist');
const persistedScars = scar5.getRecentScars(10);
assert(persistedScars.length === 1, 'Incident persisted across session restart');
assert(persistedScars[0].message === 'rate limit exceeded', 'Incident data intact');

cleanup();

// Summary
console.log(`\n${'─'.repeat(40)}`);
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log(`${'─'.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
