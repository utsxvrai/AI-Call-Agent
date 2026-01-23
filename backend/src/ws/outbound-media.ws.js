const WebSocket = require('ws');
const TwilioService = require('../services/twilio-service');
require('dotenv').config();

function setupOutboundMediaWS(server) {
  const wss = new WebSocket.Server({
    server,
    path: '/outbound-media-stream',
  });

  console.log(`🔌 Outbound Media WebSocket server listening on /outbound-media-stream`);

  wss.on('connection', (connection, req) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const firstMessage = url.searchParams.get('firstMessage');
    let callSid = url.searchParams.get('callSid'); 

    console.log(`[STREAM] Connection established. CallSid: ${callSid}`);
    
    let streamSid = null;
    const { ELEVENLABS_AGENT_ID, ELEVENLABS_API_KEY } = process.env;

    const elevenLabsWs = new WebSocket(
      `wss://api-global-preview.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}`,
      {
        headers: { "xi-api-key": ELEVENLABS_API_KEY }
      }
    );

    elevenLabsWs.on("open", () => {
      console.log("[ELEVENLABS] Connection established");

      const initiationMessage = {
        type: "conversation_initiation_client_data",
        conversation_config_override: {
          agent: {
            first_message: firstMessage || undefined,
          },
          asr: { user_input_audio_format: "ulaw_8000" },
          tts: { agent_output_audio_format: "ulaw_8000" },
        },
      };
      elevenLabsWs.send(JSON.stringify(initiationMessage));
    });

    elevenLabsWs.on("close", () => {
      console.log(`[ELEVENLABS] Connection closed for ${callSid}`);
      if (callSid) {
          TwilioService.endCall(callSid);
      }
    });

    elevenLabsWs.on("message", (data) => {
      try {
        const message = JSON.parse(data);
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
          
          // IMMEDIATE AUTOMATION: If agent says goodbye, hang up immediately 
          // to prevent "Are you still there?" prompts.
          const lowerResponse = responseText.toLowerCase();
          if (lowerResponse.includes("goodbye") || 
              lowerResponse.includes("have a great day") || 
              lowerResponse.includes("have a nice day")) {
            console.log(`👋 Closing phrase detected in agent response. Hanging up in 1.5s...`);
            setTimeout(async () => {
              await TwilioService.endCall(callSid);
            }, 1500);
          }
          break;

        case "user_interest":
          if (message.interest_event?.interest_id === "end_call_goal" && (message.interest_event?.interested || message.interest_event?.value === "Success")) {
            console.log(`🎯 Closing phrase detected for ${callSid}. Hanging up back in 2s...`);
            setTimeout(async () => {
              await TwilioService.endCall(callSid);
            }, 2000);
          }
          break;

        case "json_data":
          console.log(`📊 [ELEVENLABS] Data extracted:`, JSON.stringify(message.data));
          if (message.data?.end_call_goal === "Success" || message.data?.end_call_goal === true) {
            console.log(`🎯 'end_call_goal' matched. Hanging up back in 2s...`);
            setTimeout(async () => {
              await TwilioService.endCall(callSid);
            }, 2000);
          }
          break;

        case "ping":
          if (message.ping_event?.event_id) {
            elevenLabsWs.send(JSON.stringify({
              type: "pong",
              event_id: message.ping_event.event_id
            }));
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

    connection.on("close", () => {
      if (elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
    });
  });
}

module.exports = setupOutboundMediaWS;