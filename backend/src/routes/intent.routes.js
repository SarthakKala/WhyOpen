const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const inferIntentAI = require("../service/inferIntentAI");

/* ---------------- SEARCH QUERY NORMALIZATION ---------------- */

function normalizeSearchQuery(query) {

  if (!query) return null;

  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-");

}

/* ---------------- ROUTE ---------------- */

router.post("/infer-intent", async (req, res) => {

  try {

    const { url, title, searchQuery } = req.body;

    if (!url || !title) {

      return res.status(400).json({
        error: "Invalid input",
        message: "url and title are required"
      });

    }

    const normalizedQuery = normalizeSearchQuery(searchQuery);

    const normalizedUrl = url;
    const titleHash = title;

    const cachedEntry = await prisma.intentCache.findUnique({

      where: {
        normalizedUrl_titleHash: {
          normalizedUrl,
          titleHash
        }
      }

    });

    if (cachedEntry) {

      if (cachedEntry.expiresAt > new Date()) {

        return res.json({
          intent: cachedEntry.inferredIntent,
          confidence: cachedEntry.confidence,
          cached: true,
          source: cachedEntry.source
        });

      }

    }

    /* ---------- AI INFERENCE ---------- */

    const aiResult = await inferIntentAI({
      url,
      title,
      searchQuery: normalizedQuery
    });

    const inferredIntent = aiResult.intent;
    const confidence = aiResult.confidence;

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.intentCache.upsert({

      where: {
        normalizedUrl_titleHash: {
          normalizedUrl,
          titleHash
        }
      },

      update: {
        inferredIntent,
        confidence,
        source: "ai",
        searchQuery: normalizedQuery,
        expiresAt
      },

      create: {
        normalizedUrl,
        titleHash,
        inferredIntent,
        confidence,
        source: "ai",
        searchQuery: normalizedQuery,
        expiresAt
      }

    });

    return res.json({
      intent: inferredIntent,
      confidence: confidence,
      cached: false,
      source: "ai"
    });

  }

  catch (error) {

    console.error("Error in infer-intent:", error);

    return res.status(500).json({
      error: "Internal Server Error"
    });

  }

});

module.exports = router;