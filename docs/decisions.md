# Decisions

Ideas that are out of the current scope (bug → user story). Note them here, do not build them.
Architecture choices already made live in [architecture.md](../architecture.md).

## Later
- One model per agent role (e.g. analysis vs story writing), falling back to `FOXCONN_MODEL`.
  Wait until there is more than one judgment agent.
- Return AI SDK models for every provider (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/xai`)
  instead of Mastra router strings, to stop depending on the Mastra router in `infrastructure/llm`.
  Only if leaving Mastra becomes a real option.
