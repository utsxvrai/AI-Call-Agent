const WebSocket = require('ws');
const STTService = require('../services/stt-service');
const { muLawDecode, pcm16ToMuLaw } = require('../utils/audio');
const transcriptService = require('../services/transcript-service');
const TTSService = require('../services/tts-service');
const { sendMuLawToTwilio } = require('../services/twilio-service');

const tts = new TTSService();

function setupTwilioMediaWS(server) {
  const wss = new WebSocket.Server({
    server,
    path: '/ws/media',
  });

  wss.on('connection', (ws) => {
    console.log('🟢 Twilio media connected');

    let stt = null;
    let callSid = null;
    let streamSid = null;

    ws.on('message', (msg) => {
      let data;

      try {
        data = JSON.parse(msg.toString());
        if (data.event !== 'media') {
          console.log(`📥 [${callSid || 'unknown'}] Twilio event: ${data.event}`);
        }
      } catch (err) {
        console.error('❌ Invalid WS message:', err.message);
        return;
      }

      switch (data.event) {
        case 'start': {
          callSid = data.start.callSid;
          streamSid = data.start.streamSid;
          console.log(`📞 Call started: ${callSid} (Stream: ${streamSid})`);

          const triggerAI = async (text) => {
            const aiReply = await transcriptService.handleFinal({
              callSid,
              text: text,
            });

            if (!aiReply) return;

            const pcmAudio = await tts.synthesize(aiReply);
            if (pcmAudio) {
              const muLawAudio = pcm16ToMuLaw(pcmAudio);
              console.log(`📤 [${callSid}] Sending ${muLawAudio.length} bytes of mu-law audio to Twilio`);
              sendMuLawToTwilio(ws, muLawAudio, streamSid);
            }

            // If the agent said goodbye, wait for audio to play then hang up
            const llm = transcriptService.getConversation(callSid);
            if (llm.isFinished) {
              console.log(`📴 [${callSid}] Status detected as: ${llm.status}. Ending call in 4s...`);
              // 4-second delay allows the "Goodbye" TTS to play to the user
              setTimeout(() => {
                const { endCall } = require('../services/twilio-service');
                endCall(callSid);
              }, 4000);
            }
          };

          stt = new STTService(callSid, triggerAI);
          transcriptService.registerAiTrigger(callSid, triggerAI);

          stt.connect();
          break;
        }

        case 'media': {
          if (!stt) return;

          const muLaw = Buffer.from(data.media.payload, 'base64');

          if (!ws.packetCount) ws.packetCount = 0;
          ws.packetCount++;
          if (ws.packetCount % 50 === 0) {
            console.log(`📦 [${callSid}] Received 50 media packets (raw mu-law)`);
          }

          stt.sendAudio(muLaw);
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
