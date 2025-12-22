const LLMService = require("./llm-service");

const conversations = new Map(); // callSid → LLMService
const lastSpeechTimes = new Map(); // callSid → timestamp
const bufferedTranscripts = new Map(); // callSid → string
const aiTriggerCallbacks = new Map(); // callSid → function
const processingStates = new Map(); // callSid → boolean

function getConversation(callSid) {
  if (!conversations.has(callSid)) {
    conversations.set(callSid, new LLMService(callSid));
  }
  return conversations.get(callSid);
}

function registerAiTrigger(callSid, callback) {
  aiTriggerCallbacks.set(callSid, callback);
}

function handlePartial({ callSid, text }) {
  lastSpeechTimes.set(callSid, Date.now());
  bufferedTranscripts.set(callSid, text); // Update the latest partial
  console.log(`📝 [${callSid}] Partial:`, text);
}

async function handleFinal({ callSid, text }) {
  if (processingStates.get(callSid)) return null; // Already talking/thinking
  processingStates.set(callSid, true);

  lastSpeechTimes.set(callSid, Date.now());
  bufferedTranscripts.delete(callSid);
  console.log(`✅ [${callSid}] STT Final:`, text);

  const llm = getConversation(callSid);

  try {
    const aiReply = await llm.generateReply(text);
    console.log(`🤖 [${callSid}] AI:`, aiReply);

    processingStates.set(callSid, false); // Done thinking, but TTS might still be playing
    return aiReply;
  } catch (err) {
    processingStates.set(callSid, false);
    console.error(`❌ [${callSid}] LLM error:`, err.message);
    return null;
  }
}

function detectPauses() {
  const now = Date.now();

  for (const [callSid, lastTime] of lastSpeechTimes.entries()) {
    if (now - lastTime > 800) {
      const text = bufferedTranscripts.get(callSid);
      if (text && text.trim().length > 0) {
        console.log(`Paused: "${text}". Triggering...`);
        bufferedTranscripts.delete(callSid);
        lastSpeechTimes.delete(callSid);
        
        const callback = aiTriggerCallbacks.get(callSid);
        if (callback) {
          callback(text);
        }
      } else {
        lastSpeechTimes.delete(callSid); // prevent spam for silence
      }
    }
  }
}

setInterval(detectPauses, 300);

function cleanupConversation(callSid) {
  conversations.delete(callSid);
  lastSpeechTimes.delete(callSid);
  bufferedTranscripts.delete(callSid);
  aiTriggerCallbacks.delete(callSid);
  processingStates.delete(callSid);
}

module.exports = {
  handlePartial,
  handleFinal,
  registerAiTrigger,
  cleanupConversation,
};
