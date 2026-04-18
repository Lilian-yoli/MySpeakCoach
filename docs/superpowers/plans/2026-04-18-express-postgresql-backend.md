# Express + PostgreSQL Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a separate Express.js backend integrating with PostgreSQL via Prisma ORM for the MySpeak project.

**Architecture:** A standalone `server/` folder containing its own Fast/Express APIs, connected to a local PostgreSQL instance, enabling clear frontend-backend separation within this monorepo.

**Tech Stack:** Node.js, Express.js, PostgreSQL, Prisma, CORS

---

### Task 1: Server Initialization & Dependencies

**Files:**
- Create: `server/package.json`

- [ ] **Step 1: Create server directory and initialize package.json**

```bash
mkdir -p server
cd server
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
cd server
npm install express cors dotenv
npm install --save-dev nodemon
```
Expected: `package.json` updated with dependencies.

- [ ] **Step 3: Update `server/package.json` with start scripts**

Modify `server/package.json` to include:
```json
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
```

- [ ] **Step 4: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "build: init express server project and dependencies"
```

### Task 2: Express Server Setup

**Files:**
- Create: `server/src/index.js`
- Create: `server/src/routes/health.js`
- Create: `server/.gitignore`

- [ ] **Step 1: Create .gitignore for server**

```text
node_modules
.env
```

- [ ] **Step 2: Write basic health route**

```javascript
// server/src/routes/health.js
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

export default router;
```

- [ ] **Step 3: Implement main Express entry point**

```javascript
// server/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoute from './routes/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoute);

export const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 4: Run server to verify it works**

Run: `cd server && npm run dev` (in background/separate terminal)
Then Run: `curl http://localhost:3001/api/health`
Expected output: `{"status":"ok","message":"Backend is running"}`

- [ ] **Step 5: Commit**

```bash
git add server/src/ server/.gitignore
git commit -m "feat: scaffold express application and health check route"
```

### Task 3: Prisma & PostgreSQL Integration

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/.env`
- Create: `server/src/lib/prisma.js`

- [ ] **Step 1: Install Prisma**

```bash
cd server
npm install --save-dev prisma
npm install @prisma/client
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Define .env variables**

(Note: Actual deployment/secure passwords should not be checked into git, but placeholder provided for local dev).
In `server/.env`:
```text
PORT=3001
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/myspeakdb?schema=public"
```

- [ ] **Step 3: Export shared Prisma Client**

```javascript
// server/src/lib/prisma.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

- [ ] **Step 4: Add Simple Demo Schema in schema.prisma**

Open `server/prisma/schema.prisma` and append:

```prisma
model MemoryCard {
  id        Int      @id @default(autoincrement())
  term      String
  meaning   String
  createdAt DateTime @default(now())
}
```

- [ ] **Step 5: Run Prisma DB Push (Optional to test schema if DB is ready)**
*If no PostgreSQL is running locally, we can skip DB push until later DB installation.*

```bash
# Optional sanity check step
# cd server && npx prisma db push 
```

- [ ] **Step 6: Commit**

```bash
git add server/prisma/ server/src/lib/prisma.js
git commit -m "feat: add prisma postgresql schema and db client"
```
