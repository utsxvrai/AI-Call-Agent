const WebSocket = require('ws');
const {
  ELEVENLABS_STT_URL,
  ELEVENLABS_HEADERS,
} = require('../config/elevenlabs');
const transcriptService = require('./transcript-service');
class STTService {
  constructor(callSid) {
    this.callSid = callSid;
    this.ws = null;
  }

  connect() {
    this.ws = new WebSocket(ELEVENLABS_STT_URL, {
      headers: ELEVENLABS_HEADERS,
    });

    this.ws.on('open', () => {
      console.log('🧠 ElevenLabs STT connected');
    });

    this.ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString());

      if (data.type === 'partial_transcript') {
        transcriptService.handlePartial({
          callSid: this.callSid,
          text: data.text,
        });
      }

      if (data.type === 'final_transcript') {
        transcriptService.handleFinal({
          callSid: this.callSid,
          text: data.text,
        });
      }
    });

    this.ws.on('close', () => {
      console.log('🔴 ElevenLabs STT disconnected');
    });
  }

  sendAudio(pcmBuffer) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(pcmBuffer);
    }
  }

  close() {
    this.ws?.close();
  }
}

module.exports = STTService;
