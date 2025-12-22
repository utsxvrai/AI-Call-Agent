const gemini = require('../config/gemini');

const MAX_RESPONSE_WORDS = 30;

class LLMService {
  constructor(callSid) {
    this.callSid = callSid;

    this.messages = [
      {
        role: 'system',
        content: `
You are a polite, professional AI sales assistant calling a seller.

Rules:
- Keep responses under ${MAX_RESPONSE_WORDS} words
- Be conversational, not robotic
- Ask at most ONE question per response
- Never mention AI, bots, or automation
- If seller seems uninterested, politely end the call
        `.trim(),
      },
    ];
  }

  async generateReply(userText) {
    this.messages.push({
      role: 'user',
      content: userText,
    });

    const response = await gemini.generate(this.messages);

    const aiText = response.text.trim();

    this.messages.push({
      role: 'assistant',
      content: aiText,
    });

    return aiText;
  }
}

module.exports = LLMService;
