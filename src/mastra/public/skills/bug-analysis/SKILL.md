---
name: bug-analysis
description: Use when analyzing a reported bug against the target repository, to find where it comes from and reproduce it.
---

# Bug analysis

Your job: find out whether the reported behavior comes from a defect in the code, where it
comes from, and prove it by reproducing it. You do not fix the bug and you do not write the
user story. The wording of the bug report can be wrong: a reported bug may be a missing feature or
behavior that works as designed. If the code does what it was built to do, say so.

## What you get

- The bug report: a free-text description and, when the reporter gave them, steps to reproduce,
  environment, affected versions, components, comments, linked issues and attachment names.
- A copy of the target repository's `main` in the sandbox. It is yours: you may run, test and
  break it. The original repository is never touched.
- A sandbox where you can run commands (install, tests, scripts, the app, screenshots).

## Method

1. **Restate the problem.** Expected behavior and actual behavior, one or two sentences each.
   If the report does not say what is expected, write that it is missing. Do not invent it.
2. **Locate the code.** Start from what the report names (screen, endpoint, error message,
   field) and search the repository for it. Follow the path from the entry point to where the
   behavior goes wrong. Read the code before drawing conclusions.
3. **List hypotheses.** Possible causes, most likely first, each tied to a file and line.
4. **Reproduce in the sandbox.** Prefer the smallest proof: an existing test, a new minimal
   failing test, or a command. Run it and keep the exact command and its output. Run the app
   and take a screenshot only when a test cannot show it (a visual or flow problem).
5. **Conclude.** Confirm or drop each hypothesis with what you saw.

## Rules

- Back every claim with a file and line, or with a command and its output.
- Write only inside the sandbox copy. Never commit or push.
- If you have no tool to read the repository or run commands, say so once in the summary and
  analyze from the report alone: no locations, no reproduction.
- Never claim a reproduction you did not run. If you could not reproduce the bug, say what you
  tried in the summary.
- Never copy secrets, credentials, personal or customer data into your answer, including values
  read from `.env` files or logs. Describe them instead (for example "an API key in .env").
- Stay on this bug. Mention other problems you notice in one line, without analyzing them.

## Answer

Fill these fields, nothing else:

- `summary`: what actually happens and its root cause, or your best hypothesis, in two or three
  sentences, with your confidence: confirmed (reproduced and explained), likely (the code points
  to it, not reproduced) or unknown.
- `expected`: the expected behavior, or `null` if neither the report nor the code tells.
- `actual`: the observed behavior, or `null` if you could not tell.
- `locations`: files and lines involved, as `path/to/file.ts:42`.
- `reproduction`: the command you ran and its output, or `null` if nothing was reproduced.
- `openQuestions`: what a human must answer to go further.
- `media`: each screenshot or recording you took: its file path in the sandbox or its URL, and a
  caption saying what it shows.
- `links`: URLs that support the analysis (docs, pipelines), copied exactly as you saw them.
  Never build or guess a URL. Linked tickets are already in the bug report: do not
  repeat them here. Code goes in `locations`.
