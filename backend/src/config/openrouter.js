const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'liquid/lfm-2.5-1.2b-instruct:free';

async function generate(messages) {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL,
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : m.role === 'system' ? 'system' : 'assistant',
          content: m.content,
        })),
        temperature: 0.1,
        max_tokens: 50,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/OpenRouterTeam/openrouter-runner', // Optional, for OpenRouter rankings
          'X-Title': 'AI Call Agent', // Optional, for OpenRouter rankings
        },
      }
    );

    const aiText = response.data.choices[0].message.content;
    return { text: aiText };
  } catch (error) {
    console.error('❌ OpenRouter Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { generate };
