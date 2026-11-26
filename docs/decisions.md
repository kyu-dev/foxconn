# Decisions

Ideas that are out of the current scope (bug → user story). Note them here, do not build them.
Architecture choices already made live in [architecture.md](../architecture.md).

## Later
- One model per agent role (e.g. analysis vs story writing), falling back to `MOLTUS_MODEL`.
  Wait until there is more than one judgment agent.
- Return AI SDK models for every provider (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/xai`)
  instead of Mastra router strings, to stop depending on the Mastra router in `infrastructure/llm`.
  Only if leaving Mastra becomes a real option.
- Ticket source `audit` (cron audit run) next to the direct request and Jira.
- Jira Cloud (email + API token, description in ADF). Only Data Center is supported for now.
- `expected`, `actual`, `stepsToReproduce`, `logs` in the ticket. Free text covers them for now.
- Target repo path given per ticket. It will be fixed config, read in `src/mastra/index.ts`.
- Jira attachment content (screenshots, logs). Only metadata is read: images need a vision model.
- Writing back to Jira (comment, update or linked story). For now the story is markdown, copied by hand.
- Evals of the judgment agents on a small set of real bugs (Mastra datasets and scorers), instead of
  integration tests: LLM answers vary, so a test either flakes or proves nothing. Once the workflow runs.
