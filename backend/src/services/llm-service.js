const gemini = require('../config/gemini');

class LLMService {
  constructor(callSid) {
    this.callSid = callSid;
    this.isFinished = false;
    this.hasExplained = false; // Tracks if we have provided the one-line pitch
    this.status = 'Unsure';

    this.messages = [
      {
        role: 'system',
        content: `
You are Utsav from Salesence. You are on a PHONE CALL.
STRICT CONVERSATION FLOW:
1. GREETING: "Hi, I'm Utsav from Salesence. We help businesses scale their sales automatically. Would you like to know more?"
2. IF INTERESTED (Step 1): Give a ONE-LINE explanation and ask: "Is this something you'd like to try?"
3. IF INTERESTED (Step 2): Say "Great, we will connect you on your email address. Have a wonderful day!" and stop.
4. IF UNSURE: Ask a short clarifying question like "I'm sorry, did you want to hear more about that?"
5. IF NOT INTERESTED: Say "Thanks for talking with us. Have a great day!" and stop.

RULES:
- Maximum 2-3 sentences.
- Be punchy and human.
        `.trim(),
      },
    ];
  }

  async classifyIntent(userText) {
    if (!userText) return "GREETING";
    
    const classificationPrompt = `
      Analyze the seller's response: "${userText}"
      Classify into ONE category:
      - INTERESTED: Positive, "yes", "sure", "okay", "tell me".
      - NOT_INTERESTED: "No", "busy", "stop", "not now".
      - GOODBYE: "Bye", "hang up".
      - UNSURE: If the response is vague, a question, or unclear.

      Return ONLY the word.
    `;

    try {
      const response = await gemini.generate([{ role: 'user', content: classificationPrompt }]);
      return response.text.trim().toUpperCase();
    } catch (e) {
      return "UNSURE";
    }
  }

  async generateReply(userText) {
    if (this.isFinished) return null;

    // 1. Initial Greeting
    if (!userText || userText === "INIT_GREETING") {
      const greeting = "Hi, I'm Utsav from Salesence. We help businesses scale their sales automatically. Would you be interested in hearing how?";
      this.messages.push({ role: 'assistant', content: greeting });
      return greeting;
    }

    const intent = await this.classifyIntent(userText);

    // 2. Handle Rejection or Goodbye
    if (intent === "NOT_INTERESTED" || intent === "GOODBYE") {
      this.isFinished = true;
      return "Thanks for talking with us. Have a great day!";
    }

    // 3. Handle Uncertainty (New Logic)
    if (intent === "UNSURE") {
      return "I'm sorry, I didn't quite catch that. Would you like to hear a bit more about how we help with your sales?";
    }

    // 4. Handle Interest
    if (intent === "INTERESTED") {
      if (!this.hasExplained) {
        // First "Yes" -> The one-line explanation
        this.hasExplained = true;
        const explanation = "We use AI to find high-quality leads and book meetings for you automatically. Is this something you'd like to try out?";
        this.messages.push({ role: 'user', content: userText });
        this.messages.push({ role: 'assistant', content: explanation });
        return explanation;
      } else {
        // Second "Yes" -> The Email Close
        this.isFinished = true;
        return "Great, we will connect you on your email address. Have a wonderful day!";
      }
    }

    // Fallback
    return "I'm sorry, I missed that. Are you interested in hearing more?";
  }
}

module.exports = LLMService;