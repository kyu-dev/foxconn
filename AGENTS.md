# moltus

**Scope: bug → user story only.** Takes a bug report, checks it is really a bug
(decision model; a human decides when unsure), gathers context (code, logs, related tickets),
writes a structured user story, and waits for human validation before outputting it
(suspend/resume). Deterministic Mastra workflow; LLM agents only in judgment steps (bug
analysis, story writing). Nothing beyond this scope gets built until it runs on real bugs.

## Stack
TypeScript (strict), Mastra, Zod, pnpm, Vitest, ESLint, Docker.

## Commands
- `pnpm install`
- `pnpm dev`: Mastra dev server and playground (http://localhost:4111)
- `pnpm check`: lint + typecheck + unit tests (must pass before any commit; enforced by `.githooks/pre-commit`, enabled by `pnpm install`, and by CI)
- `pnpm test`, `pnpm lint`, `pnpm typecheck`
- `docker build -t moltus . && docker run --rm -p 4111:4111 --env-file .env moltus`
- Dev in a container: `docker compose up -d --build`, then `docker compose exec dev pnpm install`,
  `docker compose exec dev pnpm dev` (Studio on http://localhost:4111). `node_modules` lives in a volume.

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
  - `public/skills/`: agent skills (`SKILL.md`), passed to agents as `skills`; `public/` is the
    working directory under `mastra dev` and is copied into the build
  - `classifiers/`: typed decisions on a decision model (e.g. is it a bug?); the threshold
    policy lives in `domain/`
- Entry point for now: the `mastra dev` playground. A CLI comes later; other entry
  points (webhook…) are "Later".
- Tests are colocated: `foo.test.ts`, LLM mocked.

Introduce an interface (port) only when a second implementation actually exists.

## Models
Chosen with `MOLTUS_MODEL=provider/model` (default `ollama/qwen3.8:27b-mlx`), parsed and
validated at startup by `src/infrastructure/llm/` (`modelFromEnv`), including the API key
the chosen provider needs. Only `src/mastra/index.ts` reads `process.env`; agents are
factories (`createXxxAgent(model)`) that receive their model and never pick a provider.
Providers: `openai`, `anthropic`, `xai` (Mastra model router, API keys) and `ollama`
(`OLLAMA_BASE_URL`). All of them run tools, so agents use Mastra tools and skills directly.
Docker: pass API keys via `--env-file`, never in the image. See `.env.example`.

Classifiers use a decision model, not a language model: TypeSafe AI Jev
(`TYPESAFE_AI_API_KEY`), built by `decisionModelFromEnv` and injected like agents. Not wired in
`index.ts` until a workflow step uses a classifier.

## Rules
1. `pnpm check` passes before every commit.
2. No `any`, no `as` casts, no `@ts-ignore`/`eslint-disable`. Fix the type.
3. Every step input/output is a Zod schema in `src/domain/`.
4. Plain code over agents: an agent only where a step needs judgment.
5. No step writes or publishes anything without passing the human validation step.
6. Every behavior change comes with a Vitest test; LLM calls are mocked in unit tests.
7. Commits: one short line `<type>: <what>`, type is one of `feat`, `fix`, `refacto`,
   `setup`, `ci`. No body unless truly needed. No AI credit (no Co-authored-by, no tool mentions).
8. Scope is bug → user story only. New ideas go to `docs/decisions.md` under "Later".
9. A new rule is added here only when an AI repeats a mistake.
