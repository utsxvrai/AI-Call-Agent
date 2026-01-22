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
          'HTTP-Referer': 'https://github.com/OpenRouterTeam/openrouter-runner',
          'X-Title': 'AI Call Agent',
        },
        timeout: 10000, // 10s timeout
      }
    );

    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      console.error('❌ OpenRouter unexpected response format:', JSON.stringify(response.data));
      throw new Error('Invalid response format from OpenRouter');
    }

    const aiText = response.data.choices[0].message.content;
    return { text: aiText };
  } catch (error) {
    if (error.response) {
      console.error('❌ OpenRouter API Error:', error.response.status, JSON.stringify(error.response.data));
    } else {
      console.error('❌ OpenRouter Request Error:', error.message);
    }
    throw error;
  }
}

module.exports = { generate };
