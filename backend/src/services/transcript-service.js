const LLMService = require("./llm-service");

const conversations = new Map(); // callSid → LLMService
const lastSpeechTimes = new Map(); // callSid → timestamp

function getConversation(callSid) {
  if (!conversations.has(callSid)) {
    conversations.set(callSid, new LLMService(callSid));
  }
  return conversations.get(callSid);
}

function handlePartial({ callSid, text }) {
  lastSpeechTimes.set(callSid, Date.now());
  console.log(`📝 [${callSid}] Partial:`, text);
}

async function handleFinal({ callSid, text }) {
  lastSpeechTimes.set(callSid, Date.now());
  console.log(`✅ [${callSid}] Seller:`, text);

  const llm = getConversation(callSid);

  try {
    const aiReply = await llm.generateReply(text);
    console.log(`🤖 [${callSid}] AI:`, aiReply);

    // Phase 6 will send this text to TTS
  } catch (err) {
    console.error(`❌ [${callSid}] LLM error:`, err.message);
  }
}

function detectPauses() {
  const now = Date.now();

  for (const [callSid, lastTime] of lastSpeechTimes.entries()) {
    if (now - lastTime > 800) {
      console.log(`⏸️ [${callSid}] Speaker paused`);
      lastSpeechTimes.delete(callSid); // prevent spam
    }
  }
}

setInterval(detectPauses, 300);

function cleanupConversation(callSid) {
  conversations.delete(callSid);
  lastSpeechTimes.delete(callSid);
}

module.exports = {
  handlePartial,
  handleFinal,
  cleanupConversation,
};
