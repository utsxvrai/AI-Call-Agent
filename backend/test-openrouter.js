require('dotenv').config();
const openrouter = require('./src/config/openrouter');

async function test() {
  try {
    console.log('Testing OpenRouter...');
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' },
    ];
    const response = await openrouter.generate(messages);
    console.log('✅ Response:', response);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

test();
