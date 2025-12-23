const gemini = require('../config/gemini');

const MAX_RESPONSE_WORDS = 30;

class LLMService {
  constructor(callSid) {
    this.callSid = callSid;
    this.isFinished = false;
    this.status = 'Unsure'; // Tracks: Interested, Not Interested, or Unsure
    
    this.messages = [
      {
        role: 'system',
        content: `
You are Utsav from Salesence. You are on a PHONE CALL.
STRICT RULES:
- Never exceed 20 words.
- Use simple, punchy sentences. No bullet points or long lists.
- If they are interested, do NOT explain everything. Just say: "That's great! Should I send the signup link to your email, or would you like a quick 5-minute demo first?"
- One thought per turn. Do not "double-barrel" questions.
- Speak like a human, not a brochure.
        `.trim(),
      },
    ];
  }

  async classifyIntent(userText) {
    const classificationPrompt = `
      Analyze the seller's response: "${userText}"
      Classify into ONE category:
      - INTERESTED: Positive feedback, asking for links, asking about price, or agreeing to try it.
      - NOT_INTERESTED: Explicit "No", "Stop calling", "I'm busy", or hanging up.
      - UNSURE: Confused, neutral, or asking "Who is this?".
      - GOODBYE: Closing the conversation.

      Return ONLY the category word.
    `;

    try {
      const response = await gemini.generate([{ role: 'user', content: classificationPrompt }]);
      const intent = response.text.trim().toUpperCase();
      
      // Update internal status
      if (intent.includes("INTERESTED") && !intent.includes("NOT")) this.status = "Interested";
      if (intent.includes("NOT_INTERESTED")) this.status = "Not Interested";
      
      console.log(`🎯 [${this.callSid}] Classification: ${this.status}`);
      return intent;
    } catch (e) {
      return "UNSURE";
    }
  }

  async generateReply(userText) {
    if (this.isFinished) return null;

    const intent = await this.classifyIntent(userText);

    if (intent === "INTERESTED") {
    // Force a short, specific closing question instead of a general generation
    return "Awesome! I can get your first free analysis started right now. Is this the best email to send the results to?";
  }

    // Phase 8: Call Termination Logic
    if (this.status === "Not Interested" || intent.includes("GOODBYE")) {
      this.isFinished = true;
      return "I understand. Thanks for your time! Check us out at gosalesence.com if you change your mind. Have a great day!";
    }

    this.messages.push({ role: 'user', content: userText });
    const response = await gemini.generate(this.messages);
    const aiText = response.text.trim();

    this.messages.push({ role: 'assistant', content: aiText });
    return aiText;
  }
}

module.exports = LLMService;
