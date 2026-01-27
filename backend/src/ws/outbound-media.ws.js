const WebSocket = require('ws');
const TwilioService = require('../services/twilio-service');
const supabase = require('../services/supabase-service');
const socketService = require('../services/socket-service');
const axios = require('axios');
require('dotenv').config();

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔴 Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("🔴 Uncaught Exception thrown:", err);
});

function setupOutboundMediaWS(server) {
  const wss = new WebSocket.Server({ noServer: true });

  console.log(`🔌 Outbound Media WebSocket handler initialized`);

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);
    if (pathname === '/outbound-media-stream') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (connection, req) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let leadId = url.searchParams.get('leadId');
    let callSid = url.searchParams.get('callSid');

    console.log(`🔌 [STREAM] Connected. CallSid: ${callSid}, LeadId: ${leadId}`);

    let streamSid = null;
    let interestCaptured = false;
    let conversationId = null;
    let elevenLabsWs = null;
    let elevenLabsReady = false;
    let hasSynced = false;
    const { ELEVENLABS_AGENT_ID, ELEVENLABS_API_KEY } = process.env;

    // Helper to signal frontend to move to next lead
    const finishAndSync = async (cId) => {
      if (hasSynced) return;
      hasSynced = true;

      console.log(`🕒 [SYNC] Starting post-call sync for Lead: ${leadId || 'unknown'}...`);

      if (cId) {
        try {
          // Wait briefly for ElevenLabs to process analysis
          await new Promise(r => setTimeout(r, 4000));
          
          const response = await axios.get(
            `https://api.elevenlabs.io/v1/convai/conversations/${cId}`,
            { headers: { 'xi-api-key': ELEVENLABS_API_KEY }, timeout: 5000 }
          );

          const analysis = response.data.analysis || {};
          const isInterested = analysis.data_collection_results?.user_interest?.value === true ||
                               analysis.data_collection_results?.end_call_goal?.value === true ||
                               analysis.data_collection_results?.user_interest?.value === "Success";

          console.log(`📊 [SYNC] Analysis complete. Interested: ${isInterested}`);

          if (leadId) {
            await supabase.from('leads').update({ 
              is_interested: isInterested, 
              call_status: 'called' 
            }).eq('id', leadId);
          }
        } catch (err) {
          console.error(`❌ [SYNC] Analysis failed:`, err.message);
        }
      } else if (leadId) {
        // Fallback: No conversation happened
        await supabase.from('leads').update({ call_status: 'hanged up' }).eq('id', leadId);
      }

      // ALWAYS emit syncComplete to unblock the frontend
      socketService.emit('syncComplete', { leadId: leadId || callSid || 'unknown' });
      console.log(`📡 [SOCKET] syncComplete emitted for ${leadId || callSid}`);
    };

    const handleElevenLabsMessage = (data) => {
      try {
        const message = JSON.parse(data);

        if (message.type === "conversation_initiation_metadata") {
          conversationId = message.conversation_initiation_metadata_event?.conversation_id;
          console.log(`🆔 [ELEVENLABS] ConvID: ${conversationId}`);
        }

        if (message.type === "audio" && message.audio_event?.audio_base_64) {
          connection.send(JSON.stringify({
            event: "media",
            streamSid,
            media: { payload: message.audio_event.audio_base_64 },
          }));
        }

        if (message.type === "interruption") {
          connection.send(JSON.stringify({ event: "clear", streamSid }));
        }

        if (message.type === "agent_response") {
          const text = message.agent_response_event?.agent_response || "";
          console.log(`🤖 Agent: ${text}`);
          socketService.emit('transcript', { role: 'agent', text });

          if (text.toLowerCase().includes("goodbye") || text.toLowerCase().includes("have a great day")) {
             setTimeout(async () => {
               if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
               await TwilioService.endCall(callSid);
             }, 3500);
          }
        }

        if (message.type === "user_transcription") {
          const text = message.user_transcription_event?.user_transcript || "";
          console.log(`👤 User: ${text}`);
          socketService.emit('transcript', { role: 'user', text });
        }

        if (message.type === "user_interest" || message.type === "json_data") {
           const val = message.interest_event?.interested || message.data?.user_interest;
           if (val === true || val === "Success") {
              console.log("🎯 Interest captured in real-time!");
              interestCaptured = true;
              if (leadId) supabase.from('leads').update({ is_interested: true, call_status: 'called' }).eq('id', leadId).then(() => {});
           }
        }
      } catch (error) {
        console.error("🔴 [ELEVENLABS] Message error:", error.message);
      }
    };

    connection.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        if (data.event === "start") {
          streamSid = data.start.streamSid;
          if (!callSid) callSid = data.start.callSid;
          console.log(`🚀 [STREAM] Start. StreamSID: ${streamSid}`);

          // Initialize ElevenLabs on start to avoid premature timeout
          elevenLabsWs = new WebSocket(
            `wss://api-global-preview.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}&user_id=${leadId || 'unknown'}`,
            { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
          );

          elevenLabsWs.on("open", () => {
            elevenLabsReady = true;
            console.log("🟢 [ELEVENLABS] Connected");
            const initMsg = {
              type: "conversation_initiation_client_data",
              conversation_config_override: {
                asr: { user_input_audio_format: "ulaw_8000" },
                tts: { agent_output_audio_format: "ulaw_8000" }
              }
            };
            elevenLabsWs.send(JSON.stringify(initMsg));
          });

          elevenLabsWs.on("message", handleElevenLabsMessage);
          elevenLabsWs.on("error", (e) => console.error("🔴 [ELEVENLABS] WS Error:", e.message));
          elevenLabsWs.on("close", () => {
            console.log("⚠️ [ELEVENLABS] WS Closed");
            elevenLabsReady = false;
          });

        } else if (data.event === "media") {
          if (elevenLabsWs && elevenLabsReady && elevenLabsWs.readyState === WebSocket.OPEN) {
            elevenLabsWs.send(JSON.stringify({ user_audio_chunk: data.media.payload }));
          }
        } else if (data.event === "stop") {
          if (elevenLabsWs) elevenLabsWs.close();
        }
      } catch (error) {
        console.error("🔴 [TWILIO] Connection message error:", error.message);
      }
    });

    connection.on("close", async () => {
      console.log(`⚠️ [STREAM] Disconnected: ${callSid}`);
      if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
      
      // Trigger final sync
      finishAndSync(conversationId);
    });
  });
}

module.exports = setupOutboundMediaWS;