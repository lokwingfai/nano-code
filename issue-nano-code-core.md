# Issue 1: nano-code-core — LLM API Abstraction Layer

Status: **Complete**

## Overview

Built a provider-agnostic LLM API abstraction layer in TypeScript. The core runs inside a DevContainer (Bun 1.3.0) and currently works with two backends: DeepSeek (cloud) and Ollama (local, `gemma4:31b-cloud`).

## Architecture

```
src/
├── types.ts                  # Shared type definitions
├── core/generate-text.ts     # Main entry point: generateText()
├── providers/
│   ├── openai.ts             # DeepSeek provider (OpenAI SDK)
│   └── ollamacloud.ts        # Local Ollama provider (OpenAI SDK)
└── utils/retry.ts            # Exponential backoff retry helper

chapters/
├── 02-simple-call.ts         # Minimal fetch-based API call example
└── 03-multi-provider.ts      # Multi-provider test harness
```

## Key Components

### `src/types.ts`
- **`Message`** — Union type: `user | system | assistant | tool` roles
- **`Tool` / `ToolCall` / `ToolResult`** — Tool/function calling types
- **`GenerateParams`** — Input: messages, tools, temperature, maxTokens, signal
- **`GenerateTextResult`** — Output: text, finishReason, toolCalls, usage
- **`StreamChunk`** — Streaming chunks (delta | event | done)
- **`LanguageModel`** — Interface with `doGenerate()` and `doStream()`
- **`Provider`** — Factory: `(modelId: string) => LanguageModel`
- **`LLMApiError`** — Unified error with status, provider name, code, raw, headers

### `src/providers/openai.ts`
- Uses `openai` npm SDK pointed at DeepSeek (`api.deepseek.com/v1`)
- Auth via `DEEPSEEK_API_KEY` env var (configured in `.env`)
- Default model: `deepseek-chat`
- Implements full `LanguageModel` interface (generate + stream)
- Handles function/tool calling with argument parsing
- Error wrapping in `LLMApiError`
- Minor: error message on line 84 says `OPENAI_API_KEY` but reads `DEEPSEEK_API_KEY`

### `src/providers/ollamacloud.ts`
- Same pattern as `openai.ts` using OpenAI SDK
- Targets local Ollama at `http://host.docker.internal:11434/v1`
  - Uses `host.docker.internal` because code runs in DevContainer, Ollama runs on host Mac
- Auth: dummy key `'ollama'` (Ollama has no auth)
- Default model: set via `OLLAMA_MODEL_ID` env var, falls back to `gemma4:31b-cloud`

### `src/core/generate-text.ts`
- Thin wrapper: calls `model.doGenerate()` with retry via `retryWithExponentialBackoff`
- Default max 2 retries, configurable

### `src/utils/retry.ts`
- Exponential backoff with jitter
- Only retries on rate-limit (429) and server errors (500+)
- Respects `Retry-After` / `Retry-After-Ms` headers
- Max backoff cap at 60s

### `chapters/02-simple-call.ts`
- Minimal `fetch`-based DeepSeek API call (no SDK)
- Used as a learning example — contains the fixes: correct env var, valid model, error handling

### `chapters/03-multi-provider.ts`
- Test harness that calls both DeepSeek and Ollama providers
- Each wrapped in try/catch with labeled console output

## What Works
- DeepSeek provider: generate + stream with tool calling
- Ollama provider: generate + stream with tool calling (via DevContainer → host)
- Retry logic with exponential backoff
- Multi-provider test harness runs successfully

## Configuration
- `.env` at project root (auto-loaded by Bun):
  - `DEEPSEEK_API_KEY=sk-...`
  - `DEEPSEEK_MODEL_ID` (optional, defaults to `deepseek-chat`)
  - `OLLAMA_MODEL_ID` (optional, defaults to `gemma4:31b-cloud`)
- DevContainer: `.devcontainer/devcontainer.json` + `Dockerfile`
  - Mounts project dir at `/nano-code`
  - Uses `oven/bun:1.3.0` image

## Next: Issue 2 — nano-code-cli

The CLI will build on this abstraction layer to add:
- **2.1 Toolset** — tools the agent can call
- **2.2 Thought loop** — the agent's reasoning/execution cycle
- **2.3 Agent class** — the main Agent implementation
