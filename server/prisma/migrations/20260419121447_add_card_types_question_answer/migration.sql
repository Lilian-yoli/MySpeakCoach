/*
  Warnings:

  - You are about to drop the column `translatedText` on the `Card` table. All the data in the column will be lost.
  - Added the required column `answer` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cardType` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('CLOZE', 'L1_PROMPT', 'CONTEXT');

-- AlterTable
ALTER TABLE "Card" DROP COLUMN "translatedText",
ADD COLUMN     "answer" TEXT NOT NULL,
ADD COLUMN     "cardType" "CardType" NOT NULL,
ADD COLUMN     "nextReviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "question" TEXT NOT NULL,
ADD COLUMN     "reviewStage" INTEGER NOT NULL DEFAULT 0;
