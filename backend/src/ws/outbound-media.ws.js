const WebSocket = require('ws');
const TwilioService = require('../services/twilio-service');
const supabase = require('../services/supabase-service');
require('dotenv').config();

function setupOutboundMediaWS(server) {
  // Use noServer: true to prevent conflict with Socket.io on the same port
  const wss = new WebSocket.Server({ noServer: true });

  console.log(`🔌 Outbound Media WebSocket handler initialized`);

  // Handle manual upgrade to delegate between Twilio and Socket.io
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);

    if (pathname === '/outbound-media-stream') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Socket.io handles its own upgrades automatically, so we just ignore others
  });

  wss.on('connection', (connection, req) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let leadId = url.searchParams.get('leadId');
    let callSid = url.searchParams.get('callSid');

    console.log(`🔌 [STREAM] New Connection. URL: ${req.url}`);
    console.log(`🔌 [STREAM] Params - CallSid: ${callSid}, LeadId: ${leadId}`);

    let streamSid = null;
    let interestCaptured = false;
    let conversationId = null;
    const { ELEVENLABS_AGENT_ID, ELEVENLABS_API_KEY } = process.env;

    // Passing user_id in the URL is what populates the "User ID" field in the dashboard
    const elevenLabsWs = new WebSocket(
      `wss://api-global-preview.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}&user_id=${leadId || 'unknown'}`,
      {
        headers: { "xi-api-key": ELEVENLABS_API_KEY }
      }
    );

    // Sync the final analysis from ElevenLabs REST API after the call ends
    const syncFinalAnalysis = async (cId, lId, sid) => {
      // We need at least the Conversation ID and either a Lead ID or a Call SID
      if (!cId || (!lId && !sid)) {
        console.log(`⚠️ [SYNC] Missing identifiers. CId: ${cId}, LId: ${lId}, Sid: ${sid}`);
        return;
      }

      console.log(`🕒 [SYNC] Waiting 10s for ElevenLabs analysis for ${cId}...`);
      await new Promise(r => setTimeout(r, 10000)); 

      try {
        const axios = require('axios');
        const response = await axios.get(
          `https://api.elevenlabs.io/v1/convai/conversations/${cId}`,
          { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
        );

        const analysis = response.data.analysis || {};
        const results = analysis.data_collection_results || {};
        const userInterest = results.user_interest?.value;
        const endGoal = results.end_call_goal?.value;

        const isInterested = userInterest === true || userInterest === "Success" || 
                             endGoal === true || endGoal === "Success";

        console.log(`📊 [SYNC] Result: Interest=${isInterested}`);

        let targetLeadId = lId;
        if (!targetLeadId && sid) {
          const { data } = await supabase.from('leads').select('id').eq('twilio_call_sid', sid).single();
          if (data) targetLeadId = data.id;
        }

        if (targetLeadId) {
          await supabase.from('leads').update({ is_interested: isInterested, call_status: 'called' }).eq('id', targetLeadId);
          console.log(`✅ [SYNC] Supabase updated for Lead: ${targetLeadId}`);
        }
      } catch (err) {
        console.error(`❌ [SYNC] Analysis fetch failed:`, err.message);
      } finally {
        const { emit: emitSocket } = require('../services/socket-service');
        const finalId = lId || sid || 'unknown';
        emitSocket('syncComplete', { leadId: finalId });
        console.log(`📡 [SOCKET] syncComplete emitted (Safety) for ${finalId}`);
      }
    };

    // Fallback: If leadId is null, try to find it by CallSid once it becomes available
    const findLeadByCallSid = async (sid) => {
      if (!sid || sid === "unknown") return null;
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id, name')
          .eq('twilio_call_sid', sid)
          .single();
        if (data) {
          console.log(`✅ [BACKUP] Found Lead ${data.name} (ID: ${data.id}) for CallSid ${sid}`);
          return data;
        }
      } catch (err) {
        console.error("❌ [BACKUP] Lead lookup failed:", err.message);
      }
      return null;
    };

    elevenLabsWs.on("open", async () => {
      console.log("[ELEVENLABS] Connection established");

      let leadName = "there";

      // Fetch lead details if we have an ID
      if (leadId) {
        const { data } = await supabase.from('leads').select('name').eq('id', leadId).single();
        if (data) leadName = data.name;
        await supabase.from('leads').update({ call_status: 'calling' }).eq('id', leadId);
      }

      const initiationMessage = {
        type: "conversation_initiation_client_data",
        conversation_config_override: {
          asr: { user_input_audio_format: "ulaw_8000" },
          tts: { agent_output_audio_format: "ulaw_8000" },
        },
        dynamic_variables: {
          user_id: leadId || 'unknown',
          name: leadName
        }
      };
      elevenLabsWs.send(JSON.stringify(initiationMessage));
    });

    elevenLabsWs.on("close", async () => {
      console.log(`[ELEVENLABS] Connection closed for ${callSid}`);

      const { emit: emitSocket } = require('../services/socket-service');

      // Trigger the background sync with all IDs as safety
      if (conversationId) {
        syncFinalAnalysis(conversationId, leadId, callSid);
      } else if (leadId) {
        // SAFETY: If we have a LeadId but no ConversationId, it means the call ended 
        // before Sophie really started or analysis could happen. 
        // Tell the frontend it's safe to move on.
        console.log(`⚠️ [ELEVENLABS] Closing without conversation. Signaling skip for lead: ${leadId}`);
        emitSocket('syncComplete', { leadId, status: 'ended_early' });
      }

      if (leadId && !interestCaptured) {
        await supabase.from('leads').update({ call_status: 'called' }).eq('id', leadId);
      }
    });

    elevenLabsWs.on("message", (data) => {
      try {
        const message = JSON.parse(data);

        // Capture Conversation ID from initiation metadata
        if (message.type === "conversation_initiation_metadata") {
          conversationId = message.conversation_initiation_metadata_event?.conversation_id;
          console.log(`🆔 [ELEVENLABS] Conversation ID: ${conversationId}`);
        }

        // DEBUG: Write all JSON messages to a log file to see exactly what we get
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] ${JSON.stringify(message)}\n`;
        fs.appendFileSync('elevenlabs_ws.log', logMsg);

        handleElevenLabsMessage(message, connection);
      } catch (error) {
        console.error("[ERROR] ElevenLabs message processing failed:", error.message);
      }
    });

    const handleElevenLabsMessage = async (message, connection) => {
      switch (message.type) {
        case "audio":
          if (message.audio_event?.audio_base_64) {
            const audioData = {
              event: "media",
              streamSid,
              media: { payload: message.audio_event.audio_base_64 },
            };
            connection.send(JSON.stringify(audioData));
          }
          break;

        case "interruption":
          connection.send(JSON.stringify({ event: "clear", streamSid }));
          break;

        case "agent_response":
          const responseText = message.agent_response_event?.agent_response || "";
          console.log(`🤖 Agent: ${responseText}`);

          // Notify UI
          const { emit: emitSocket } = require('../services/socket-service');
          emitSocket('transcript', { role: 'agent', text: responseText });

          // IMMEDIATE AUTOMATION: If agent says goodbye, hang up immediately 
          const lowerResponse = responseText.toLowerCase();
          if (lowerResponse.includes("goodbye") ||
            lowerResponse.includes("have a great day") ||
            lowerResponse.includes("have a nice day")) {

            const wordCount = responseText.split(' ').length;
            const dynamicDelay = (wordCount * 350) + 3000;

            console.log(`👋 Closing detected. Delaying hangup for ${dynamicDelay}ms...`);

            setTimeout(async () => {
              if (elevenLabsWs.readyState === WebSocket.OPEN) {
                elevenLabsWs.close();
              }
              await TwilioService.endCall(callSid);
            }, dynamicDelay);
          }
          break;

        case "user_transcription":
          const userText = message.user_transcription_event?.user_transcript || "";
          console.log(`👤 User: ${userText}`);
          const { emit: emitUserSocket } = require('../services/socket-service');
          emitUserSocket('transcript', { role: 'user', text: userText });
          break;

        case "user_interest":
          console.log(`🎯 [DATA] user_interest event:`, JSON.stringify(message.interest_event));
          if (message.interest_event?.interest_id === "end_call_goal" || message.interest_event?.interest_id === "user_interest") {
            const isInterested = message.interest_event?.interested === true ||
              message.interest_event?.value === "Success" ||
              message.interest_event?.value === "true";

            console.log(`✨ Interest Evaluated: ${isInterested}`);
            interestCaptured = true;

            if (leadId) {
              supabase
                .from('leads')
                .update({ is_interested: isInterested, call_status: 'called' })
                .eq('id', leadId)
                .then(() => console.log("✅ Supabase interest updated"));
            }
          }
          break;

        case "json_data":
          console.log(`📊 [DATA] json_data extracted:`, JSON.stringify(message.data));
          const extractedValue = message.data?.user_interest ?? message.data?.end_call_goal;
          if (typeof extractedValue !== 'undefined') {
            const isInterested = extractedValue === "Success" || extractedValue === true || extractedValue === "true";
            console.log(`✨ JSON Interest Evaluated: ${isInterested}`);
            interestCaptured = true;

            if (leadId) {
              supabase
                .from('leads')
                .update({ is_interested: isInterested, call_status: 'called' })
                .eq('id', leadId)
                .then(() => console.log("✅ Supabase JSON interest updated"));
            }
          }
          break;

        case "ping":
          if (message.ping_event?.event_id) {
            elevenLabsWs.send(JSON.stringify({ type: "pong", event_id: message.ping_event.event_id }));
          }
          break;
      }
    };

    connection.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        switch (data.event) {
          case "start":
            streamSid = data.start.streamSid;
            if (!callSid || callSid === "unknown" || callSid === "null") {
              callSid = data.start.callSid;
            }
            console.log(`[STREAM] Started. StreamSid: ${streamSid}, CallSid: ${callSid}`);
            break;
          case "media":
            if (elevenLabsWs.readyState === WebSocket.OPEN) {
              elevenLabsWs.send(JSON.stringify({
                user_audio_chunk: Buffer.from(data.media.payload, "base64").toString("base64"),
              }));
            }
            break;
          case "stop":
            elevenLabsWs.close();
            break;
        }
      } catch (error) {
        console.error("[ERROR] Stream processing failed:", error.message);
      }
    });

    connection.on("close", async () => {
      console.log(`⚠️ [STREAM] Connection closed for CallSid: ${callSid}`);
      if (elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();

      // FINAL SAFEGUARD: If the user hung up early and we haven't captured interest,
      // mark as not interested and "hanged up" immediately to unblock the dialer.
      if (leadId && !interestCaptured) {
        console.log(`⚠️ Early cut detected. Marking lead ${leadId} as 'hanged up'.`);
        const { emit: emitSocket } = require('../services/socket-service');
        
        // Update Supabase immediately
        await supabase.from('leads')
          .update({ 
            call_status: 'hanged up',
            is_interested: false 
          })
          .eq('id', leadId);

        // Tell frontend it's safe to move on right now
        emitSocket('syncComplete', { leadId, status: 'hanged up' });
      }
    });
  });
}

module.exports = setupOutboundMediaWS;