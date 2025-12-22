const WebSocket = require('ws');
const STTService = require('../services/stt.service');
const { muLawDecode } = require('../utils/audio');
const transcriptService = require('../services/transcript-service');

function setupTwilioMediaWS(server) {
  const wss = new WebSocket.Server({
    server,
    path: '/ws/twilio',
  });

  wss.on('connection', (ws) => {
    console.log('🟢 Twilio media connected');

    let stt = null;
    let callSid = null;

    ws.on('message', (msg) => {
      let data;

      try {
        data = JSON.parse(msg.toString());
      } catch (err) {
        console.error('❌ Invalid WS message:', err.message);
        return;
      }

      switch (data.event) {
        case 'start': {
          callSid = data.start.callSid;
          console.log(`📞 Call started: ${callSid}`);

          stt = new STTService(callSid);
          stt.connect();
          break;
        }

        case 'media': {
          if (!stt) return;

          const muLaw = Buffer.from(data.media.payload, 'base64');
          const pcm = muLawDecode(muLaw);

          stt.sendAudio(pcm);
          break;
        }

        case 'stop': {
          console.log(`📴 Call ended: ${callSid}`);

          stt?.close();
          transcriptService.cleanupConversation(callSid);

          stt = null;
          callSid = null;
          break;
        }

        default:
          // ignore keepalive / unknown events
          break;
      }
    });

    ws.on('close', () => {
      console.log('🔴 Twilio media disconnected');

      stt?.close();
      if (callSid) {
        transcriptService.cleanupConversation(callSid);
      }
    });
  });
}

module.exports = setupTwilioMediaWS;
