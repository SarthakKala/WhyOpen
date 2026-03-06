/*
  Warnings:

  - Added the required column `source` to the `IntentCache` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IntentCache" ADD COLUMN     "aiRawResponse" TEXT,
ADD COLUMN     "searchQuery" TEXT,
ADD COLUMN     "source" TEXT NOT NULL;
