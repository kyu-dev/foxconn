# Architecture

Light clean architecture: three layers, dependencies point inward only.
No ports/interfaces until a second implementation actually exists.

## Workflow

One box per workflow step, named as in `src/mastra/workflows/`. Dashed: not built yet.

```mermaid
flowchart TD
  report["Bug report<br/>(a ticket reported as a bug)"]
  classify{"classify-bug<br/>Jev: is it a bug?"}
  human{{"Human: is it a bug?<br/>(workflow paused)"}}
  analyze["analyze-bug<br/>the agent reads the code<br/>and tries to reproduce the bug"]
  proved{"Bug proved?"}:::later
  write["write-story<br/>the agent writes the user story"]:::later
  validate{{"Human validates the story"}}:::later
  story(["User story"]):::later
  stop(["Stop: the ticket goes back to its author"])

  report --> classify
  classify -- sure --> analyze
  classify -- not sure --> human
  human -- yes --> analyze
  human -- no --> stop
  analyze --> proved
  proved -- yes --> write
  proved -- no --> stop
  write --> validate
  validate -- ok --> story
  validate -- to fix --> write

  classDef later stroke-dasharray: 5 5
```

Today the workflow ends after `analyze-bug`, and the agent has no tool yet: it analyzes the
bug report alone.

## Schemas

One schema per moment of the workflow, in `src/domain/`. A tracker's own format (Jira today)
never leaves `src/infrastructure/<tracker>/`: it is translated at the edges.

```
Jira issue ─fetchJiraBugReport─► BugReport ─analyze-bug─► BugAnalysis ─write-story─► UserStory ─postJiraStory─► Jira story
 (infrastructure/jira)                                                   (later)                  (later, after human validation)
```

| Schema | Answers | Written by |
|---|---|---|
| `BugReport` | What is reported? | the reporter, through a tracker or typed by hand |
| `BugAnalysis` | Is it real, and why? | the analysis agent |
| `UserStory` | What must be built? | the story agent, validated by a human |

- `BugReport` is tracker-neutral. Its `source` only says where the report comes from
  (`direct`, or `jira` + issue key): to cite it and, later, to post the story back there.
- A new tracker: one `fetch<Tracker>BugReport` in `src/infrastructure/<tracker>/` and one `kind`
  in `source`. Nothing else changes.
- A tracker's custom field ids (e.g. Jira's steps to reproduce) are config, not schema.

## Dependency rule

```
mastra/ ──► infrastructure/ ──► domain/
   └──────────────────────────► domain/
```

| Layer | May import | Must not import |
|---|---|---|
| `domain/` | `zod`, sibling `domain/` files (`./`) only | anything else (Node built-ins, npm packages, other layers) |
| `infrastructure/` | `domain/`, external SDKs, Mastra **types** | `src/mastra/` |
| `mastra/` | everything above | — |

Enforced by `no-restricted-imports` in [eslint.config.js](eslint.config.js): a violation fails `pnpm check`.

`infrastructure/llm` imports `MastraModelConfig` (a type) on purpose: its job is to produce a
model Mastra accepts, and router strings like `"openai/gpt-5"` only mean something to Mastra.

## Configuration flow

```
.env ──► process.env ──► mastra/index.ts ──► modelFromEnv(env) ──► createXxxAgent(model)
                          (only reader)       (validates at startup)  (receives, never reads env)
                                         └──► decisionModelFromEnv(env) ──► createBugClassifier(model)
```

- Only `src/mastra/index.ts` reads `process.env`. Everything else receives values as arguments.
- Invalid config fails at startup, not at the first LLM call (unknown provider, empty model,
missing API key for `openai` / `anthropic` / `xai`, missing `TYPESAFE_AI_API_KEY`).

## Adding things

**A judgment agent**: `src/mastra/agents/<name>-agent.ts` exports `create<Name>Agent(model)`.
Register it in `src/mastra/index.ts` with the model built there. The prompt holds no business rule.

**An input source** (bug tracker, logs, repo): a plain function in `src/infrastructure/<source>/`
that returns a domain type (e.g. `BugReport`). Its config (URL, token) is read in
`src/mastra/index.ts` and passed as an argument, like the model.

**A workflow step**: one file in `src/mastra/workflows/`, input/output schemas in `src/domain/`.

**A new export**: only when another file uses it.
