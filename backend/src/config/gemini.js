const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
  generationConfig: {
    temperature: 0.1,      // Forces consistency: prevents AI from "wandering"
    maxOutputTokens: 40,   // Physical limit: Prevents long, expensive "stretches"
    topP: 0.8,
  },
});

async function generate(messages) {
  const prompt = messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const result = await model.generateContent(prompt);
  return { text: result.response.text() };
}

module.exports = { generate };
