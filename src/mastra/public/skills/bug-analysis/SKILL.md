---
name: bug-analysis
description: Use when analyzing a reported bug against the target repository, to find where it comes from and reproduce it.
---

# Bug analysis

Your job: find out whether the reported behavior comes from a defect in the code, where it
comes from, and how to reproduce it. You do not fix the bug and you do not write the user story.

## What you get

- The bug report: a free-text description and its source (for Jira: comments, linked issues,
  attachment names).
- Read-only access to the target repository.
- A sandbox where you can run commands (install, tests, scripts).

## Method

1. **Restate the problem.** Expected behavior and actual behavior, one or two sentences each.
   If the report does not say what is expected, write that it is missing. Do not invent it.
2. **Locate the code.** Start from what the report names (screen, endpoint, error message,
   field) and search the repository for it. Follow the path from the entry point to where the
   behavior goes wrong. Read the code before drawing conclusions.
3. **List hypotheses.** Possible causes, most likely first, each tied to a file and line.
4. **Reproduce in the sandbox.** Find the smallest thing that shows the actual behavior: an
   existing test, a new minimal failing test, or a command. Run it and keep the exact command
   and its output.
5. **Conclude.** Confirm or drop each hypothesis with what you saw.

## Rules

- Back every claim with a file and line, or with a command and its output.
- The repository is read-only: never modify, commit or push. Write only inside the sandbox.
- If you have no tool to read the repository or run commands, say so once and analyze from the
  report alone: hypotheses only, confidence `likely` or `unknown`.
- If you could not reproduce the bug, say so and list what you tried. Never claim a
  reproduction you did not run.
- Never copy secrets, credentials, personal or customer data into your answer. Describe them
  instead (for example "an API key in config/prod.yml").
- Stay on this bug. Mention other problems you notice in one line, without analyzing them.

## Answer

- **Summary**: one sentence.
- **Expected / actual**: from step 1.
- **Cause**: the root cause, or your best hypothesis, with a confidence:
  `confirmed` (reproduced and explained), `likely` (code points to it, not reproduced) or
  `unknown`.
- **Location**: files and lines involved.
- **Reproduction**: commands and observed output, or `not reproduced` and what you tried.
- **Open questions**: what a human must answer to go further.
