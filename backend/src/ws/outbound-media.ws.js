const WebSocket = require('ws');
const TwilioService = require('../services/twilio-service');
const supabase = require('../services/supabase-service');
const socketService = require('../services/socket-service');
const notificationService = require('../services/notification-service');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

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
    const { ELEVENLABS_AGENT_ID, ELEVENLABS_API_KEY } = process.env;

    // Connect to ElevenLabs ConvAI
    const elevenLabsWs = new WebSocket(
      `wss://api-global-preview.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}&user_id=${leadId || 'unknown'}`,
      { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
    );

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
        console.log(`📊 [SYNC] Raw Analysis Data for ${cId}:`, JSON.stringify(analysis, null, 2));

        const dr = analysis.data_collection_results || {};
        
        // Robust interest check: handle booleans, strings, and different possible keys
        let isInterested = false;
        
        // 1. Check specific known keys
        if (dr.user_interest?.value === true || dr.user_interest?.value === "true" || dr.user_interest?.value === "Success") isInterested = true;
        if (dr.end_call_goal?.value === true || dr.end_call_goal?.value === "true") isInterested = true;
        if (dr.interest?.value === true || dr.interested?.value === true) isInterested = true;

        // 2. Fallback: Search all keys for "interest" or "goal" that have truthy values
        if (!isInterested) {
          Object.keys(dr).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('interest') || lowerKey.includes('goal')) {
              const val = dr[key]?.value;
              if (val === true || val === "true" || val === "Success" || val === "Interested") {
                console.log(`🎯 Found interest in dynamic key: ${key}`);
                isInterested = true;
              }
            }
          });
        }

        console.log(`🎯 [SYNC] ${cId} Final Interest Result: ${isInterested}`);

        let targetId = lId;
        if (!targetId && sid) {
          const { data } = await supabase.from('leads').select('id').eq('twilio_call_sid', sid).single();
          if (data) targetId = data.id;
        }

        if (targetId) {
          const updateData = { 
            is_interested: isInterested, 
            call_status: 'called' 
          };
          
          await supabase.from('leads').update(updateData).eq('id', targetId);
          console.log(`✅ [SYNC] Supabase updated for ${targetId} with is_interested: ${isInterested}`);

          // Trigger automated follow-ups in the background
          notificationService.triggerCallSync(targetId, isInterested);
        }
      } catch (err) {
        console.error(`❌ [SYNC] Analysis fetch failed:`, err.message);
      } finally {
        socketService.emit('syncComplete', { leadId: lId || sid });
      }
    };

    elevenLabsWs.on("open", async () => {
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

    elevenLabsWs.on("message", (data) => {
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
               if (elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
               await TwilioService.endCall(callSid);
             }, 3000);
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
    });

    connection.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        if (data.event === "start") {
          streamSid = data.start.streamSid;
          if (!callSid) callSid = data.start.callSid;
          console.log(`🚀 [STREAM] Start. StreamSID: ${streamSid}`);
        } else if (data.event === "media") {
          if (elevenLabsWs.readyState === WebSocket.OPEN) {
            elevenLabsWs.send(JSON.stringify({
              user_audio_chunk: Buffer.from(data.media.payload, "base64").toString("base64"),
            }));
          }
        } else if (data.event === "stop") {
          elevenLabsWs.close();
        }
      } catch (error) {
        console.error("🔴 [TWILIO] Connection message error:", error.message);
      }
    });

    connection.on("close", async () => {
      console.log(`⚠️ [STREAM] Disconnected: ${callSid}`);
      if (elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();

      // Trigger sync if we have a conversation
      if (conversationId) {
        syncFinalAnalysis(conversationId, leadId, callSid);
      } else if (leadId && !interestCaptured) {
        // Early hangup safeguard - only if no conversation was established
        console.log(`⚠️ [STREAM] Early hangup for ${leadId}. No conversationId to sync.`);
        await supabase.from('leads').update({ call_status: 'hanged up', is_interested: false }).eq('id', leadId);
        socketService.emit('syncComplete', { leadId });
      }
    });
  });
}

module.exports = setupOutboundMediaWS;