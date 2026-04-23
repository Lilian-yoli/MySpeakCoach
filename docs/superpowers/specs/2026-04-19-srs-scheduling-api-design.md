# Spaced Repetition System (SRS) Scheduling API Design

## 目標 (Objective)
在現有的 Batch Translation `Card` 系統之上，加入基於「費氏數列 (Fibonacci Sequence)」的間隔重複演算法 (SRS) 排程機制，讓使用者可以複習這些卡片。此設計堅持以「簡單」為首要原則：不加入答對與答錯的權重計算，只要完成複習，即推進天數。就算使用者遲於排定時間複習，系統也只會自然地依據「實際複習時間」來向後推延，無任何額外的懲罰或追趕機制。

## 1. 資料庫設計 (Prisma Schema 更新)

我們將在 `/server/prisma/schema.prisma` 中的 `Card` 模型加入兩個欄位：

```prisma
model Card {
  id             Int      @id @default(autoincrement())
  originalText   String
  translatedText String
  userId         Int
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // --- 新增 SRS 相關欄位 ---
  reviewStage    Int      @default(0)
  nextReviewDate DateTime @default(now()) // 建立卡片後，可以在建立時或第一次複習時給定。
}
```

## 2. 核心邏輯與邊界處理 (Core Logic & Edge Cases)

### 演算法：費氏數列天數 (Fibonacci Intervals)
根據卡片的 `reviewStage` 推算下次應該間隔的天數：
- Stage 1: 1 天
- Stage 2: 2 天
- Stage 3: 3 天
- Stage 4: 5 天
- Stage 5: 8 天
- Stage 6: 13 天
- Stage N: fibonacci(N) 天

*(實務建議：因為超過一定的天數後，數字會暴增。實作上後端可以透過陣列映射前幾十階段的結果，若超過上限可設定為一個最大循環期如每 3 個月複習一次)*

### 邊界處理：遲延複習 (Overdue Reviews)
如果使用者數天未登入複習（比如卡片原訂昨日需複習，但用戶今日才處理）：
1. 取出待複習清單時條件應為 `nextReviewDate <= now()`，這代表過期的卡片必定優先被取出來提醒。
2. 計算新的 `nextReviewDate` 時，強制以**「使用者真正按下完成的實際當下時間 (now)」**加上費氏數列天數，而非自昨天的應定時間往後算。這避免了邏輯緊縮及過度複習的問題。

## 3. API 路由與規格 (API Endpoints)

### `GET /api/cards/due`
取得目前登入使用者「尚未完成且已到期」的待複習字卡。
- **Authorization**: Bearer Token
- **Query / Logic**: 
  - 條件: `userId = currentUser` 且 `nextReviewDate <= now()`。
  - 排序: `orderBy: { nextReviewDate: 'asc' }` 優先顯示過期最久的卡片。
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
         "id": 12,
         "originalText": "Hello",
         "translatedText": "你好",
         "reviewStage": 0,
         "nextReviewDate": "2026-04-18T10:00:00.000Z"
      }
    ]
  }
  ```

### `POST /api/cards/:id/review`
前端點擊「完成複習」後呼叫此 API，觸發進度推進。
- **Authorization**: Bearer Token
- **Param**: `:id` (字卡 ID)
- **Logic**:
  1. 依照 ID 取得該字卡並驗證是否由於此 `userId` 所擁有。
  2. 將 `reviewStage = currentStage + 1`。
  3. 執行費波那契計算器取得天數 X。
  4. 即時計算 `nextReviewDate = now() + (X \u00d7 24小時)`。
  5. 儲存更動回資料庫。
- **Response**:
  ```json
  {
    "success": true,
    "card": {
      "id": 12,
      "reviewStage": 1,
      "nextReviewDate": "2026-04-20T10:00:00.000Z"
    }
  }
  ```
