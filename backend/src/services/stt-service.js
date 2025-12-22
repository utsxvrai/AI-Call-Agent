const WebSocket = require('ws');
const {
  ELEVENLABS_STT_URL,
} = require('../config/elevenlabs');
const transcriptService = require('./transcript-service');
require('dotenv').config();
class STTService {
  constructor(callSid, onFinalTranscript) {
    this.callSid = callSid;
    this.onFinalTranscript = onFinalTranscript;
    this.ws = null;
    this.sessionStarted = false;
    this.audioBuffer = [];
    this.currentBufferSize = 0;
    this.modelId = 'scribe_v2_realtime'; // Default model ID
  }

  connect() {
    // Reverting to ulaw_8000 as it was successfully producing transcripts in previous logs
    const url = `${ELEVENLABS_STT_URL}?model_id=scribe_v2_realtime&audio_format=ulaw_8000&commit_strategy=vad`;
    console.log(`🔗 [${this.callSid}] Connecting to ElevenLabs STT (ulaw_8000):`, url);

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('❌ Missing ELEVENLABS_API_KEY');
      return;
    }

    this.ws = new WebSocket(url, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    this.ws.on('open', () => {
      console.log('🧠 ElevenLabs STT connection opened');
      // No initial message needed if config is in URL
    });

    this.ws.on('message', (msg) => {
      const rawMsg = msg.toString();
      console.log(`📥 [${this.callSid}] STT Raw:`, rawMsg);

      let data;
      try {
        data = JSON.parse(rawMsg);
      } catch (e) {
        console.log(`⚠️ [${this.callSid}] STT Non-JSON:`, rawMsg);
        return;
      }

      const type = data.message_type || data.type || data.event;
      
      if (type === 'session_started' || type === 'sessionStarted') {
        console.log(`✅ [${this.callSid}] STT Session Started`);
        this.sessionStarted = true;
        return;
      }

      const text = data.text || (data.transcript && data.transcript.text);

      if (type === 'partialTranscript' || type === 'partial_transcript') {
        if (!text) return;
        transcriptService.handlePartial({
          callSid: this.callSid,
          text,
        });
      }

      if (type === 'committedTranscript' || type === 'final_transcript' || type === 'committed_transcript') {
        console.log(`🎤 [${this.callSid}] STT Final: ${text}`);
        this.onFinalTranscript(text);
      }
      
      if (type === 'error' || type === 'resource_exhausted' || data.error === 'The service is currently at capacity. Please try again in a few moments.') {
        console.error(`❌ [${this.callSid}] ElevenLabs Resource Error:`, rawMsg);
      }
    });

    this.ws.on('close', (code, reason) => {
      console.log(`🔴 [${this.callSid}] ElevenLabs STT closed: ${code} - ${reason}`);
      this.sessionStarted = false;
    });
  }

  sendAudio(audioChunk) {
    // Buffering chunks to send larger blocks (reduces message overhead)
    this.audioBuffer.push(audioChunk);
    this.currentBufferSize += audioChunk.length;

    // Send every ~100ms (ulaw at 8kHz is 8000 bytes/sec, so 800 bytes = 100ms)
    // This reduces the message overhead and matches your working "Optimized format"
    if (this.currentBufferSize >= 800) {
      const fullBuffer = Buffer.concat(this.audioBuffer);
      const isWsOpen = this.ws?.readyState === WebSocket.OPEN;

      if (isWsOpen && this.sessionStarted) {
        console.log(`📤 [${this.callSid}] Sending audio block (${fullBuffer.length} bytes)`);
        this.ws.send(JSON.stringify({
          message_type: 'input_audio_chunk',
          audio_base_64: fullBuffer.toString('base64'),
        }));
      } else if (isWsOpen && !this.sessionStarted) {
        // Dropping audio while waiting for session_started
      } else {
        console.warn(`⚠️ [${this.callSid}] Cannot send audio: WS state ${this.ws?.readyState}, Session started: ${this.sessionStarted}`);
      }

      // Reset buffer
      this.audioBuffer = [];
      this.currentBufferSize = 0;
    }
  }

  close() {
    console.log(`🔌 [${this.callSid}] Terminating ElevenLabs STT session`);
    this.ws?.terminate(); // Force close to free resources
    this.ws = null;
    this.sessionStarted = false;
  }
}

module.exports = STTService;
