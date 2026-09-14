// CCC-001 (docs/specs/CCC_001_SPEC_v1.0.md §6) — firestore.rules coachConversation static
// structural verification. This repository has no Firestore emulator in its test setup; every
// existing Firestore-adjacent behavior in this suite (tests/errorTelemetry.test.js's own §I
// precedent) is likewise verified against the rule TEXT, never a live emulator.
// Run with: node --test tests/ccc001FirestoreRules.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rules = fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8');
const blockStart = rules.indexOf('match /coachConversation/{turnId}');
const blockEnd = rules.indexOf('\n      }', blockStart);
const block = rules.slice(blockStart, blockEnd);

test('the coachConversation match block exists', () => {
  assert.notEqual(blockStart, -1);
});

// V — cross-user ownership: read/create/update/delete all require request.auth.uid == uid
test('V: read/create/update/delete are all owner-scoped (request.auth.uid == uid)', () => {
  const ownerChecks = (block.match(/request\.auth\.uid == uid/g) || []).length;
  assert.equal(ownerChecks, 4, 'expected exactly one owner check per rule (read, create, update, delete)');
  assert.match(block, /allow read: if isSignedIn\(\) && request\.auth\.uid == uid;/);
});

// B/W — constrained completion update
test('B/W: update is permitted ONLY from an existing PENDING document, into COMPLETED or SILENCE', () => {
  assert.match(block, /allow update: if isSignedIn\(\) && request\.auth\.uid == uid[\s\S]*?resource\.data\.status == 'PENDING'/);
  assert.match(block, /request\.resource\.data\.status in \['COMPLETED', 'SILENCE'\]/);
});

// C — PENDING -> COMPLETED allowed, D — PENDING -> SILENCE allowed (both are the same `in [...]`
// target set — proven together, since the rule does not and must not distinguish WHY the
// client chose one over the other, only that it is one of the two permitted values)
test('C/D: both COMPLETED and SILENCE are members of the permitted update-target set', () => {
  const match = block.match(/request\.resource\.data\.status in \[([^\]]+)\]/);
  assert.ok(match);
  const targets = match[1].split(',').map((s) => s.trim().replace(/'/g, ''));
  assert.deepEqual(targets.sort(), ['COMPLETED', 'SILENCE']);
});

// E — a COMPLETED/SILENCE document can never be updated again: the precondition
// resource.data.status == 'PENDING' on the SAME rule that performs the transition means no
// document whose status has already left PENDING can ever match this rule a second time.
test('E: no COMPLETED/SILENCE document can be rewritten — the update rule\'s own precondition requires the CURRENT (pre-write) status to still be PENDING', () => {
  const allowUpdateIdx = block.indexOf('allow update:');
  const allowDeleteIdx = block.indexOf('allow delete:');
  assert.notEqual(allowUpdateIdx, -1);
  const updateSection = block.slice(allowUpdateIdx, allowDeleteIdx);
  // Distinguishes the EXISTING-document check (`resource.data.status`, no `request.` prefix —
  // the pre-write state) from the create rule's own `request.resource.data.status` (the
  // new-document-being-written check) — only the former, present on THIS rule, guarantees a
  // document that has already left PENDING can never match this rule again.
  assert.match(updateSection, /(?<!request\.)resource\.data\.status == 'PENDING'/);
});

// F — immutable userText/submittedAt/createdAt across the update
test('F: userText, submittedAt, and createdAt are each proven unchanged (request.resource.data.X == resource.data.X) on every permitted update', () => {
  ['userText', 'submittedAt', 'createdAt'].forEach((field) => {
    const re = new RegExp('request\\.resource\\.data\\.' + field + ' == resource\\.data\\.' + field);
    assert.match(block, re, field + ' must be proven immutable across the update');
  });
});

test('create: closed field allowlist, PENDING-only status, null assistantText/completedAt, server-authoritative createdAt', () => {
  assert.match(block, /request\.resource\.data\.keys\(\)\.hasOnly\(\['userText', 'assistantText', 'status', 'submittedAt', 'completedAt', 'createdAt'\]\)/);
  assert.match(block, /request\.resource\.data\.status == 'PENDING'/);
  assert.match(block, /request\.resource\.data\.assistantText == null/);
  assert.match(block, /request\.resource\.data\.completedAt == null/);
  assert.match(block, /request\.resource\.data\.createdAt == request\.time/);
});

test('update: closed field allowlist matches create\'s own, and assistantText/completedAt are the only content fields allowed to actually change', () => {
  const updateSection = block.slice(block.indexOf('allow update:'), block.indexOf('allow delete:'));
  assert.match(updateSection, /request\.resource\.data\.keys\(\)\.hasOnly\(\['userText', 'assistantText', 'status', 'submittedAt', 'completedAt', 'createdAt'\]\)/);
  assert.match(updateSection, /request\.resource\.data\.completedAt == request\.time/);
});

test('read: owner-only (unlike errorLog, this content belongs to the user and may be read back)', () => {
  assert.match(block, /allow read: if isSignedIn\(\) && request\.auth\.uid == uid;/);
});

test('delete: owner-only, reserved for the explicit reset flow (documented, never invoked by the reporting/completion path itself)', () => {
  assert.match(block, /allow delete: if isSignedIn\(\) && request\.auth\.uid == uid;/);
});

test('no pre-existing rule block (users/{uid}, days/{day}, memories/{memoryId}, usage/{uid}, errorLog/{entryId}) was weakened', () => {
  assert.match(rules, /match \/users\/\{uid\} \{[\s\S]*?allow write: if isSignedIn\(\) && request\.auth\.uid == uid;/);
  assert.match(rules, /match \/days\/\{day\} \{[\s\S]*?allow write: if isSignedIn\(\) && request\.auth\.uid == uid;/);
  assert.match(rules, /match \/memories\/\{memoryId\} \{[\s\S]*?allow read: if isSignedIn\(\) && request\.auth\.uid == uid;/);
  assert.match(rules, /match \/usage\/\{uid\} \{[\s\S]*?allow write: if false;/);
  assert.match(rules, /match \/errorLog\/\{entryId\} \{[\s\S]*?allow read: if false;/);
});
