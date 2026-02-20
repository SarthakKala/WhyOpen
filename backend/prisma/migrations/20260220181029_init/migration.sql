-- CreateTable
CREATE TABLE "IntentCache" (
    "id" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "titleHash" TEXT NOT NULL,
    "inferredIntent" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntentCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntentCache_normalizedUrl_titleHash_key" ON "IntentCache"("normalizedUrl", "titleHash");
