# foxconn

Long-term goal: a software factory harness (ticket → plan → code → review → PR).

**Current scope (MVP): bug → user story only.** Takes a bug report, gathers context
(code, logs, related tickets), writes a structured user story, and waits for human
validation before outputting it (suspend/resume). Deterministic Mastra workflow;
LLM agents only in judgment steps (bug analysis, story writing). Nothing beyond this
scope gets built until it runs on real bugs.

## Stack
TypeScript (strict), Mastra, Zod, pnpm, Vitest, ESLint, Docker.

## Commands
- `pnpm install`
- `pnpm dev`: Mastra dev server and playground (http://localhost:4111)
- `pnpm check`: lint + typecheck + unit tests (must pass before any commit; enforced by `.githooks/pre-commit`, enabled by `pnpm install`, and by CI)
- `pnpm test:unit`, `pnpm lint`, `pnpm typecheck`
- `pnpm test:integration`: real LLM calls with the configured model (not part of `check`)
- `docker build -t foxconn . && docker run --rm -p 4111:4111 --env-file .env foxconn`

## Architecture
Light clean architecture. Not hexagonal: no ports/interfaces yet.

Dependencies point inward only: `mastra/` and `infrastructure/` may import `domain/`;
`domain/` imports nothing from the project or from Mastra.

- `src/domain/`: business types, Zod schemas (bug report, user story) and pure rules.
  No I/O, no Mastra, no LLM calls.
- `src/infrastructure/`: talking to the outside world (LLM providers, bug sources, repo, logs).
  Plain functions that return domain types.
- `src/mastra/`: application layer. Composes domain and infrastructure.
  - `index.ts`: Mastra instance (entry point required by the CLI)
  - `workflows/`: the bug → story workflow, one file per step
  - `agents/`: judgment agents only; prompts hold no business rules
- Entry point for now: the `mastra dev` playground. A CLI comes later; other entry
  points (webhook…) are "Later".
- Tests are colocated: `foo.test.ts` (unit, LLM mocked), `foo.integration.test.ts`.

Introduce an interface (port) only when a second implementation actually exists.

## Models
Chosen with `FOXCONN_MODEL=provider/model` (default `claude-code/sonnet`), parsed and
validated at startup by `src/infrastructure/llm/` (`modelFromEnv`), including the API key
the chosen provider needs. Only `src/mastra/index.ts` reads `process.env`; agents are
factories (`createXxxAgent(model)`) that receive their model and never pick a provider. Providers: `openai`, `anthropic`, `xai` (Mastra model router,
API keys), `ollama` (`OLLAMA_BASE_URL`), `claude-code` and `codex` (local CLIs, used
without tools). Docker: pass `CLAUDE_CODE_OAUTH_TOKEN` (`claude setup-token`) via
`--env-file`, never in the image. See `.env.example`.

## Rules
1. `pnpm check` passes before every commit.
2. No `any`, no `as` casts, no `@ts-ignore`/`eslint-disable`. Fix the type.
3. Every step input/output is a Zod schema in `src/domain/`.
4. Plain code over agents: an agent only where a step needs judgment.
5. No step writes or publishes anything without passing the human validation step.
6. Every behavior change comes with a Vitest test; LLM calls are mocked in unit tests.
7. No client code or data in fixtures, prompts or logs sent to a cloud service.
8. Commits: one short line `<type>: <what>`, type is one of `feat`, `fix`, `refacto`,
   `setup`, `ci`. No body unless truly needed. No AI credit (no Co-authored-by, no tool mentions).
9. Scope is bug → user story only. New ideas go to `docs/decisions.md` under "Later".
10. A new rule is added here only when an AI repeats a mistake.
