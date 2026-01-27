const WebSocket = require('ws');
const TwilioService = require('../services/twilio-service');
const supabase = require('../services/supabase-service');
const socketService = require('../services/socket-service');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔴 Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("🔴 Uncaught Exception thrown:", err);
});

function setupOutboundMediaWS(server) {
  // Initialize WebSocket server without a standalone port
  const wss = new WebSocket.Server({ noServer: true });

  console.log(`🔌 Outbound Media WebSocket handler initialized`);

  // Handle server upgrade event
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/outbound-media-stream') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (connection, req) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    
    // Extract parameters directly from the URL
    let leadId = url.searchParams.get('leadId');
    let callSid = url.searchParams.get('callSid');
    let leadName = url.searchParams.get('name') || "there";

    console.log(`🔌 [STREAM] Connected. CallSid: ${callSid}, LeadId: ${leadId}, Name: ${leadName}`);

    let streamSid = null;
    let interestCaptured = false;
    let conversationId = null;
    let elevenLabsWs = null;
    let elevenLabsReady = false;
    const { ELEVENLABS_AGENT_ID, ELEVENLABS_API_KEY } = process.env;

    // Final Sync Helper
    const syncFinalAnalysis = async (cId, lId, sid) => {
      if (!cId) return;
      
      console.log(`🕒 [SYNC] Scheduled analysis for ${cId} in 10s...`);
      await new Promise(r => setTimeout(r, 10000)); 

      try {
        const response = await axios.get(
          `https://api.elevenlabs.io/v1/convai/conversations/${cId}`,
          { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
        );

        const analysis = response.data.analysis || {};
        const isInterested = analysis.data_collection_results?.user_interest?.value === true ||
                             analysis.data_collection_results?.end_call_goal?.value === true ||
                             analysis.data_collection_results?.user_interest?.value === "Success";

        console.log(`📊 [SYNC] ${cId} Interest Result: ${isInterested}`);

        let targetId = lId;
        if (!targetId && sid) {
          const { data } = await supabase.from('leads').select('id').eq('twilio_call_sid', sid).single();
          if (data) targetId = data.id;
        }

        if (targetId) {
          await supabase.from('leads').update({ is_interested: isInterested, call_status: 'called' }).eq('id', targetId);
          console.log(`✅ [SYNC] Supabase updated for ${targetId}`);
        }
      } catch (err) {
        console.error(`❌ [SYNC] Analysis fetch failed:`, err.message);
      } finally {
        socketService.emit('syncComplete', { leadId: lId || sid });
      }
    };

    const handleElevenLabsMessage = (data) => {
      try {
        const message = JSON.parse(data);

        if (message.type === "conversation_initiation_metadata") {
          conversationId = message.conversation_initiation_metadata_event?.conversation_id;
          console.log(`🆔 [ELEVENLABS] ConvID: ${conversationId}`);
        }

        // Handle Audio
        if (message.type === "audio" && message.audio_event?.audio_base_64) {
          connection.send(JSON.stringify({
            event: "media",
            streamSid,
            media: { payload: message.audio_event.audio_base_64 },
          }));
        }

        // Handle Interruptions
        if (message.type === "interruption") {
          connection.send(JSON.stringify({ event: "clear", streamSid }));
        }

        // Handle Transcript
        if (message.type === "agent_response") {
          const text = message.agent_response_event?.agent_response || "";
          console.log(`🤖 Agent: ${text}`);
          socketService.emit('transcript', { role: 'agent', text });

          // Auto-Hangup detection
          const lower = text.toLowerCase();
          if (lower.includes("goodbye") || lower.includes("have a great day") || lower.includes("have a nice day")) {
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

        // Real-time interest events
        if (message.type === "user_interest" || message.type === "json_data") {
           const val = message.interest_event?.interested || message.data?.user_interest;
           if (val === true || val === "Success") {
              console.log("🎯 Interest detected!");
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

          // 🔥 NOW open ElevenLabs (NOT BEFORE)
          console.log("Connecting to ElevenLabs WS...");

          elevenLabsWs = new WebSocket(
            `wss://api-global-preview.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}&user_id=${leadId || 'unknown'}`,
            { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
          );

          elevenLabsWs.on("open", async () => {
            elevenLabsReady = true;
            console.log("🟢 [ELEVENLABS] Handshake successful");

            // Update local DB status if we know the lead
            if (leadId) {
              await supabase.from('leads').update({ call_status: 'calling' }).eq('id', leadId);
            }

            // Minimal initiation message
            const initiationMessage = {
              type: "conversation_initiation_client_data",
              conversation_config_override: {
                asr: { user_input_audio_format: "ulaw_8000" },
                tts: { agent_output_audio_format: "ulaw_8000" }
              }
            };
            
            elevenLabsWs.send(JSON.stringify(initiationMessage));
          });

          elevenLabsWs.on("error", (err) => {
            console.error("🔴 [ELEVENLABS] WebSocket Error:", err.message);
          });

          elevenLabsWs.on("close", (code, reason) => {
            console.log(`⚠️ [ELEVENLABS] WS closed: ${code} ${reason?.toString()}`);
            elevenLabsReady = false;
          });

          elevenLabsWs.on("message", handleElevenLabsMessage);

        } else if (data.event === "media") {
          if (elevenLabsWs && elevenLabsReady && elevenLabsWs.readyState === WebSocket.OPEN) {
            elevenLabsWs.send(JSON.stringify({
              user_audio_chunk: data.media.payload,
            }));
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

      // Trigger sync if we have a conversation
      if (conversationId) syncFinalAnalysis(conversationId, leadId, callSid);

      // Early hangup safeguard
      if (leadId && !interestCaptured) {
        await supabase.from('leads').update({ call_status: 'hanged up', is_interested: false }).eq('id', leadId);
        socketService.emit('syncComplete', { leadId });
      }
    });
  });
}

module.exports = setupOutboundMediaWS;