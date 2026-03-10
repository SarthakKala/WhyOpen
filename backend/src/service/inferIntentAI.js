const openai = require("../config/openai");
const genAI = require("../config/gemini");
const intentCategories = require("../config/intentCategories");

async function inferIntentAI({ url, title, searchQuery }) {

  const categoriesList = intentCategories
    .map((cat, i) => `${i + 1}. ${cat}`)
    .join("\n");

  const prompt = `
You classify the user's intent behind opening a webpage.

Allowed intent categories:
${categoriesList}

Title: ${title}
URL: ${url}
Search Query: ${searchQuery || "None"}

Return ONLY JSON:

{
  "intent": "category",
  "confidence": number between 0 and 1
}
`;

  /* ---------------- OPENAI ---------------- */

  // if (process.env.OPENAI_API_KEY) {

  //   const response = await openai.createChatCompletion({
  //     model: "gpt-4o-mini",
  //     messages: [
  //       { role: "system", content: "You classify browsing intent." },
  //       { role: "user", content: prompt }
  //     ],
  //     temperature: 0.2
  //   });

  //   const aiText = response.data.choices[0].message.content;

  //   return JSON.parse(aiText);
  // }

  /* ---------------- GEMINI ---------------- */

  if (process.env.GEMINI_API_KEY) {

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      temperature: 0.2
    });

    const result = await model.generateContent(prompt);

    const text = result.response.text();

    const cleaned = text.replace(/```json|```/g, "").trim();

    return JSON.parse(cleaned);
  }

  /* ---------------- FALLBACK ---------------- */

  return {
    intent: "Research",
    confidence: 0.5
  };

}

module.exports = inferIntentAI;