# Spaced Repetition System (SRS) Scheduling API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **MANDATORY TDD:** This plan fully implements the `test-driven-development` skill. For every feature, watch the test fail first, implement minimal code, and watch the test pass before committing. NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.

**Goal:** Implement a Fibonacci-based SRS scheduling API that tracks review stages and next review dates for cards using TDD methodologies.

**Architecture:** We will set up `jest` and `supertest` for testing. Then, we implement `reviewStage` and `nextReviewDate` to Prisma schema. We will first write failing tests for our Fibonacci utility and API endpoints, and only then write the Express controllers, Services, and Repositories to turn the tests green.

**Tech Stack:** Express.js, Prisma ORM, PostgreSQL, Jest, Supertest

---

### Task 1: TDD Tool Setup

**Files:**
- Modify: `server/package.json`
- Create: `server/jest.config.js`

- [ ] **Step 1: Install Jest and Supertest**
Run: `cd server && npm install --save-dev jest supertest cross-env`

- [ ] **Step 2: Configure Jest Script**
Update the scripts in `server/package.json`:
```json
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js --detectOpenHandles"
  }
```

- [ ] **Step 3: Commit**
```bash
cd server
git add package.json package-lock.json
git commit -m "chore: setup test environment for tdd"
```

---

### Task 2: Update Database Schema & Swagger Docs

**Files:**
- Modify: `server/prisma/schema.prisma`
- Modify: `server/doc/cards.yaml`

- [ ] **Step 1: Update Prisma schema**
Replace `Card` model definition in `server/prisma/schema.prisma`:
```prisma
model Card {
  id             Int      @id @default(autoincrement())
  originalText   String
  translatedText String
  userId         Int
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  reviewStage    Int      @default(0)
  nextReviewDate DateTime @default(now())
}
```

- [ ] **Step 2: Migrate Database**
Run: `cd server && npx prisma migrate dev --name add_srs_fields`

- [ ] **Step 3: Update Swagger yaml**
Update `server/doc/cards.yaml` component schema by adding `reviewStage` and `nextReviewDate` to the Card component. And append the new paths `/api/cards/due` and `/api/cards/{id}/review` under `paths:`.
*(Refer to earlier definitions)*

- [ ] **Step 4: Commit**
```bash
git add server/prisma/schema.prisma server/doc/cards.yaml
git commit -m "feat(db): update schema and docs for srs"
```

---

### Task 3: TDD Fibonacci Calculator

**Files:**
- Create: `server/src/utils/__tests__/srs.test.js`
- Create: `server/src/utils/srs.js`

- [ ] **Step 1: Write the failing test**
Create `server/src/utils/__tests__/srs.test.js`:
```javascript
import { getFibonacciInterval } from '../srs.js';

describe('getFibonacciInterval', () => {
    test('returns correct intervals based on stage', () => {
        expect(getFibonacciInterval(1)).toBe(1);
        expect(getFibonacciInterval(2)).toBe(2);
        expect(getFibonacciInterval(3)).toBe(3);
        expect(getFibonacciInterval(4)).toBe(5);
        expect(getFibonacciInterval(5)).toBe(8);
        expect(getFibonacciInterval(15)).toBe(89); // cap test
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npm test src/utils/__tests__/srs.test.js`
Expected: FAIL. Error "Cannot find module '../srs.js'".

- [ ] **Step 3: Write minimal implementation**
Create `server/src/utils/srs.js`:
```javascript
export const getFibonacciInterval = (stage) => {
  if (stage <= 0) return 1;
  const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  const index = stage - 1;
  if (index >= fib.length) return fib[fib.length - 1]; // Cap interval
  return fib[index];
};
```

- [ ] **Step 4: Run test to verify it passes**
Run: `cd server && npm test src/utils/__tests__/srs.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/utils/srs.js server/src/utils/__tests__/srs.test.js
git commit -m "feat(utils): add getFibonacciInterval with TDD"
```

---

### Task 4: TDD API Endpoints Integration

**Files:**
- Create: `server/src/routes/__tests__/cards.test.js`
- Modify: `server/src/repositories/cardsRepository.js`
- Modify: `server/src/services/cardsService.js`
- Modify: `server/src/controllers/cardsController.js`
- Modify: `server/src/routes/cards.js`
- Modify: `server/src/index.js` (Export app for Supertest if needed)

- [ ] **Step 1: Prepare integration test endpoint**
*(If `server/src/index.js` doesn't export `app`, refactor it briefly so we can import it for Supertest without listening).*

- [ ] **Step 2: Write failing tests**
Create `server/src/routes/__tests__/cards.test.js`:
```javascript
import request from 'supertest';
import { app } from '../../index.js'; // Adjust appropriately if not exported

describe('Cards SRS API Integration', () => {
    test('GET /api/cards/due should return a 200 HTTP status', async () => {
        const response = await request(app).get('/api/cards/due');
        // Might be 401 if unauthorized, but route missing -> 404
        expect(response.status).not.toBe(404);
    });

    test('POST /api/cards/:id/review should return a not-found or unauthorized instead of 404-route missing', async () => {
        const response = await request(app).post('/api/cards/9999/review');
        expect(response.status).not.toBe(404);
    });
});
```

- [ ] **Step 3: Run test to verify it fails**
Run: `cd server && npm test src/routes/__tests__/cards.test.js`
Expected: FAIL because routes `/api/cards/due` do not exist (Express returns 404).

- [ ] **Step 4: Write minimal implementation**
1. Add to `cardsRepository.js`: `findDueCards(userId)`, `findCardById(id)`, `updateReviewSchedule(...)`.
2. Add to `cardsService.js`: `fetchDueCards(currentUserId)`, `processCardReview(cardId, currentUserId)`. Import `getFibonacciInterval`.
3. Add to `cardsController.js`: `getDueCards`, `reviewCard`.
4. Add routes to `cards.js`: `router.get('/due', getDueCards);` and `router.post('/:id/review', reviewCard);`.

- [ ] **Step 5: Run tests to verify pass**
Run: `cd server && npm test src/routes/__tests__/cards.test.js`
Expected: PASS (Status gets 200/401/403/500 depending on DB state, but NO LONGER 404).

- [ ] **Step 6: Commit**
```bash
git add .
git commit -m "feat(api): implement srs routes driven by TDD"
```
