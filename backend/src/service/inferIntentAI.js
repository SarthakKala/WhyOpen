const openai = require("../config/openai");
const intentCategories = require("../config/intentCategories");

async function inferIntentAI({ url, title, searchQuery }) {
  const categoriesList = intentCategories
    .map((cat, i) => `${i + 1}. ${cat}`)
    .join("\n");

  const prompt = `
You classify the user's intent behind opening a webpage.

Allowed intent categories:
${categoriesList}

Use the following information:

Title: ${title}
URL: ${url}
Search Query: ${searchQuery || "None"}

Return ONLY valid JSON in this format:

{
  "intent": "category from list",
  "confidence": number between 0 and 1
}
`;

  const response = await openai.createChatCompletion({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an intent classification system." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  const aiText = response.data.choices[0].message.content;

  let parsed;

  try {
    parsed = JSON.parse(aiText);
  } catch (err) {
    throw new Error("AI returned invalid JSON");
  }

  return {
    intent: parsed.intent,
    confidence: parsed.confidence,
  };
}

module.exports = inferIntentAI;
