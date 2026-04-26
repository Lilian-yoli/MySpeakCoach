# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 語言設定

所有回覆請以**繁體中文**為主。程式碼、指令、變數名稱、檔案路徑維持英文原樣；說明文字、分析與建議一律使用繁體中文。

## Project Overview

MySpeak is a language learning app with two modes:
1. **Live Speaking** — real-time voice conversation with Gemini Live (WebSocket, browser mic → AI audio response)
2. **Memory Cards** — SRS flashcard review system with AI-generated cards from user sentences

## Commands

### Frontend (root)
```bash
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # Production build to dist/
npm run lint       # ESLint
npx vitest         # Run all frontend tests (jsdom environment)
npx vitest src/components/ImmersiveOrb.test.jsx  # Run a single test file
```

### Backend (`server/`)
```bash
cd server
npm run dev        # nodemon on http://localhost:3001
npm test           # Jest with --experimental-vm-modules (ESM)

# Prisma
npx prisma db push          # Push schema changes to DB
npx prisma generate         # Regenerate Prisma client
npx prisma studio           # Open DB browser GUI
```

### Environment Variables
- **Frontend** (`.env.local` at root): `VITE_GEMINI_API_KEY`
- **Backend** (`server/.env`): `DATABASE_URL`, `GEMINI_API_KEY`

## Architecture

### Frontend (`src/`)
Single-page app with view-state routing (`currentView` in `App.jsx`): `landing` → `live-speak` → `dashboard`, or `landing` → `memory-cards`.

- **`GeminiLiveClient.js`** — WebSocket client for Gemini Live API (`wss://generativelanguage.googleapis.com/ws/...`). Streams 16kHz PCM audio chunks to the API; receives 24kHz PCM audio back. Lifecycle: `connect(systemInstruction)` → `sendAudio(base64Pcm)` / `sendText(text)` → `disconnect()`.
- **`useAudioStreamer`** — captures mic input, encodes to base64 PCM, calls back `onAudioData` per chunk.
- **`useSessionManager`** — tracks session active state and transcript array.
- **`useReviewSession`** — manages the full SRS review lifecycle: fetch due cards → reveal → mark reviewed → advance. Talks to `http://localhost:3001/api`.
- **`ReviewSessionPage`** — renders cards with type-specific question rendering (CLOZE blanks as `<span class="blank">`, L1_PROMPT/CONTEXT as plain text). Shows progress bar and stage dots.
- **`RefinementDashboard`** — displays transcript after Live Speaking session; native-speaker refinement flow is not yet wired up (Phase 2).

### Backend (`server/src/`)
Express + Prisma layered as: `routes/` → `controllers/` → `services/` → `repositories/` → Prisma.

**API Endpoints (all under `/api`):**
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/cards/batch` | Submit sentences → Gemini generates 3 cards each (CLOZE, L1_PROMPT, CONTEXT) |
| `GET` | `/cards/due` | Fetch cards where `nextReviewDate <= now()` |
| `POST` | `/cards/:id/review` | Mark reviewed; advance `reviewStage`, compute next date via Fibonacci SRS |

**SRS Scheduling (`utils/srs.js`):** Fibonacci sequence `[1, 2, 3, 5, 8, 13, 21, 34, 55, 89]` days — `reviewStage` (1-indexed) maps to that index. Stage beyond 10 is capped at 89 days.

**AI card generation (`cardsService.processBatchTranslation`):** Uses `gemini-2.5-flash` with structured JSON output schema. Each input sentence produces exactly 3 cards. Target language for L1_PROMPT and CONTEXT prompts is Traditional Chinese (zh-TW).

**Auth:** No real auth yet. `userRepository.upsertTestUser()` creates/reuses a dev user when no `userId` is passed. JWT auth is planned (Phase 3).

### Database
PostgreSQL via Prisma. Two models: `User` (account/password) and `Card` (originalText, question, answer, `CardType` enum, `reviewStage`, `nextReviewDate`). Schema at `server/prisma/schema.prisma`. Prisma client targets `["native", "darwin-arm64"]` for Apple Silicon.

## Testing

- **Frontend tests**: Vitest + jsdom + `@testing-library/react`. Config in `vite.config.js` (`test.environment: 'jsdom'`).
- **Backend tests**: Jest with `--experimental-vm-modules` (required for ESM). Tests live in `server/tests/`.
- Run a single backend test: `cd server && node --experimental-vm-modules node_modules/jest/bin/jest.js tests/utils/srs.test.js`

## API Docs
Swagger UI at `http://localhost:3001/api-docs` when server is running. Source YAML files in `server/doc/`.

## Roadmap State
See `roadmap-and-function-map.md` for detailed phase breakdown. Key pending items:
- `POST /api/cards/refine` (Live → native refinement → SRS)
- RefinementDashboard save behavior
- JWT auth
- CSV import UI
