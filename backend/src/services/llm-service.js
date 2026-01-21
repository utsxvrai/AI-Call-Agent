// const gemini = require('../config/gemini');
const openrouter = require('../config/openrouter');

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
- First turn: Greet them, briefly say why you called (Salesence branding), and ask if they are interested. This MUST be within 3-4 sentences.
- If they are INTERESTED: Say "Great, we will connect you on your email address." and stop.
- If they are NOT INTERESTED: Say "Thanks for talking with us." and stop.
- Never exceed 20 words per response after the greeting.
- Use simple, punchy sentences.
- Speak like a human, not a brochure.
        `.trim(),
      },
    ];
  }

  async classifyIntent(userText) {

    if (!userText) return "GREETING";
    const classificationPrompt = `
      Analyze the seller's response: "${userText}"
      Classify into ONE category based on the intent:
      - INTERESTED: Positive feedback, agreement, "yes", "go ahead", "tell me more", or general curiosity.
      - NOT_INTERESTED: Explicit "No", "not interested", "stop", "busy", "don't call", or "no thanks". Includes repeating "no" like "no, no".
      - UNSURE: Confused, neutral, or if the language is not English and intent is unclear.
      - GOODBYE: Hanging up, saying "bye", or "have a nice day".

      Return ONLY the category word.
    `;

    try {
      // const response = await gemini.generate([{ role: 'user', content: classificationPrompt }]);
      const response = await openrouter.generate([{ role: 'user', content: classificationPrompt }]);
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

    // Special case for initial greeting (if userText is empty or it's the first call)
    if (!userText || userText === "INIT_GREETING") {
      const greetingPrompt = "Greet the user as Utsav from Salesence, explain you're calling about helping them sell more, and ask if they would be interested in hearing more. Keep it to 3-4 sentences max.";
      this.messages.push({ role: 'user', content: greetingPrompt });
      // const response = await gemini.generate(this.messages);
      const response = await openrouter.generate(this.messages);
      const aiText = response.text.trim();
      this.messages.push({ role: 'assistant', content: aiText });
      return aiText;
    }

    const intent = await this.classifyIntent(userText);


    if (this.status === "Interested") {
      this.isFinished = true;
      return "Great, we will connect you on your email address. Have a wonderful day!";
    }

    // Phase 8: Call Termination Logic
    if (this.status === "Not Interested" || intent.includes("GOODBYE")) {
      this.isFinished = true;
      return "Thanks for talking with us. Have a great day!";
    }

    this.messages.push({ role: 'user', content: userText });
    // const response = await gemini.generate(this.messages);
    const response = await openrouter.generate(this.messages);
    const aiText = response.text.trim();

    this.messages.push({ role: 'assistant', content: aiText });
    return aiText;
  }
}

module.exports = LLMService;
