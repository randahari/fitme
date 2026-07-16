# FITME_ENGINEERING_WORKFLOW_v1.0

> Status: Draft v1.0\
> Purpose: Defines how FITME is designed, reviewed, implemented and
> maintained.

# 1. Purpose

This document is the engineering operating manual for FITME.

# 2. Team Roles

-   **Ran** --- Product Owner (final business decisions)
-   **ChatGPT** --- Product Lead, AI Architect, Specification Owner, QA
    & Documentation
-   **Claude** --- Lead Engineer (implementation only)

# 3. Source of Truth

Priority: 1. AI Constitution 2. Product Bible 3. Architecture 4.
Engineering Workflow 5. Task SPEC 6. Roadmap 7. Changelog

# 4. Standard Task Lifecycle

Architecture → SPEC → Engineering Review → READY → Implementation → Code
Review → Documentation Update → Commit → Task Closed

# 5. Responsibilities

## ChatGPT

-   Architecture
-   Product decisions
-   SPEC
-   Engineering Review
-   Code Review
-   Documentation
-   Prompt design

## Claude

-   Code implementation
-   Tests
-   Bug fixes
-   Refactoring only if approved

# 6. Engineering Rules

-   No implementation before READY.
-   No architecture changes without approval.
-   No scope expansion.
-   One task at a time.
-   Production-first thinking.

# 7. Documentation Rules

After every completed task update: - Roadmap - Changelog - Relevant
Architecture docs - Task SPEC (if required)

# 8. Git Rules

-   One logical task per commit.
-   Clean working tree before merge.
-   Version updated only after approval.

# 9. Review Policy

Before every answer: - Self-review. - Check against project documents. -
Return the best complete answer possible. - Avoid unnecessary
back-and-forth.

# 10. Communication Preferences

-   Short, focused answers.
-   Execute instead of explaining repeatedly.
-   Do not repeat project vision unless requested.
-   Always provide the next concrete step.
-   Recommend one best option unless comparison is requested.

# 11. Prompt Rules

-   ChatGPT creates prompts.
-   Prompts must be scoped.
-   Claude must not infer missing requirements.
-   If information is missing, stop and report.

# 12. Lessons Learned

-   Engineering Review before implementation.
-   Fix SPEC before coding.
-   Claude is for code.
-   ChatGPT owns documentation.
-   Keep documentation synchronized.

# 13. Anti-Patterns

-   Coding before READY.
-   Changing approved decisions.
-   Multiple active tasks.
-   Partial answers when a complete answer is possible.
-   Asking the user to perform work the AI can perform itself.

# 14. Definition of Done

A task is complete only when: - Architecture approved - SPEC approved -
Engineering Review = READY - Implementation complete - Tests passed -
Documentation updated - Commit created - Task marked closed

# 15. Continuous Improvement

After every task ask: "What did we learn that should become a permanent
rule?" If valuable, add it to this document.
