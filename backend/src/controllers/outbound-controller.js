const TwilioService = require('../services/twilio-service');

const OutboundController = {
  async initiateCall(req, res) {
    const { firstMessage, number } = req.body;
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
    
    if (!number) {
        return res.status(400).json({ error: 'Number is required' });
    }

    const twilio = require('twilio');
    const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    console.log("[CALL] Initiating outbound call to:", number);

    try {
      const baseUrl = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, "") : `https://${req.headers.host}`;
      
      const call = await twilioClient.calls.create({
        from: TWILIO_PHONE_NUMBER,
        to: number,
        url: `${baseUrl}/api/v1/outbound/outgoing-call-twiml?firstMessage=${encodeURIComponent(firstMessage || '')}`
      });
      
      console.log("[CALL] Call initiated successfully:", call.sid);
      res.json({ message: 'Call initiated', callSid: call.sid });
    } catch (error) {
      console.error("[ERROR] Failed to initiate call:", error.message);
      res.status(500).json({ error: 'Failed to initiate call' });
    }
  },

  async generateTwiML(req, res) {
    try {
        const data = req.method === 'POST' ? req.body : req.query;
        const callSid = data.CallSid || "unknown";
        const firstMessage = req.query.firstMessage || "";

        console.log(`[TWIML] Generating TwiML. Method: ${req.method}, CallSid: ${callSid}`);

        const baseUrl = process.env.BASE_URL;
        let wsHost;
        if (baseUrl) {
            try {
                wsHost = new URL(baseUrl).host;
            } catch (e) {
                wsHost = req.headers.host;
            }
        } else {
            wsHost = req.headers.host;
        }

        const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${wsHost}/outbound-media-stream?firstMessage=${encodeURIComponent(firstMessage)}&amp;callSid=${callSid}" />
  </Connect>
  <Pause length="40" />
</Response>`.trim();

        res.type("text/xml").send(twimlResponse);
    } catch (error) {
        console.error("❌ TwiML Error:", error.message);
        res.status(500).send("Error generating TwiML");
    }
  },

  async hangupCall(req, res) {
    const { callSid } = req.body;
    if (!callSid) {
      return res.status(400).json({ error: 'CallSid is required' });
    }

    const success = await TwilioService.endCall(callSid);
    if (success) {
      res.json({ message: 'Call ended', callSid });
    } else {
      res.status(500).json({ error: 'Failed to end call' });
    }
  }
};

module.exports = OutboundController;