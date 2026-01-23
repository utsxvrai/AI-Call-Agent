const TwilioService = require('../services/twilio-service');

const OutboundController = {
  async initiateCall(req, res) {
    const { number, leadId } = req.body;
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

    if (!number) {
      return res.status(400).json({ error: 'Number is required' });
    }

    const twilio = require('twilio');
    const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    console.log("[CALL] Initiating outbound call to:", number, "LeadId:", leadId);

    try {
      const baseUrl = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, "") : `https://${req.headers.host}`;

      const call = await twilioClient.calls.create({
        from: TWILIO_PHONE_NUMBER,
        to: number,
        url: `${baseUrl}/api/v1/outbound/outgoing-call-twiml?leadId=${leadId || ''}`,
        statusCallback: `${baseUrl}/api/v1/outbound/status-callback${leadId ? `?leadId=${leadId}` : ''}`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      });

      // NEW: Store the Call SID in Supabase for reliable lead identification
      if (leadId) {
        const supabase = require('../services/supabase-service');
        await supabase
          .from('leads')
          .update({ twilio_call_sid: call.sid })
          .eq('id', leadId);
      }

      console.log("[CALL] Call initiated successfully:", call.sid);
      res.json({ message: 'Call initiated', callSid: call.sid });
    } catch (error) {
      console.error("[ERROR] Failed to initiate call:", error.message);
      res.status(500).json({ error: 'Failed to initiate call' });
    }
  },

  async handleStatusCallback(req, res) {
    const { CallStatus, CallSid } = req.body;
    const leadId = req.query.leadId;

    console.log(`[CALLBACK] CallSid: ${CallSid}, LeadId: ${leadId}, Status: ${CallStatus}`);

    if (leadId) {
      const supabase = require('../services/supabase-service');
      const { emit: emitSocket } = require('../services/socket-service');

      // Map Twilio statuses to your application statuses
      let appStatus = 'pending';
      const failedStatuses = ['busy', 'no-answer', 'canceled', 'failed'];
      if (CallStatus === 'in-progress' || CallStatus === 'answered') appStatus = 'calling';
      if (['completed', ...failedStatuses].includes(CallStatus)) appStatus = 'called';

      await supabase
        .from('leads')
        .update({ call_status: appStatus })
        .eq('id', leadId);

      // Notify UI via Socket.io
      emitSocket('callStatus', { status: CallStatus, leadId });
      console.log(`📡 [SOCKET] Emitted callStatus: ${CallStatus}`);

      // If call failed/was not picked up, tell the frontend to move to next lead immediately
      if (failedStatuses.includes(CallStatus)) {
        console.log(`📡 [SOCKET] Call not picked up (${CallStatus}). Signaling syncComplete.`);
        emitSocket('syncComplete', { leadId, status: CallStatus });
      }
    }

    res.sendStatus(200);
  },

  async generateTwiML(req, res) {
    try {
      const data = req.method === 'POST' ? req.body : req.query;
      const callSid = data.CallSid || "unknown";
      // ALWAYS use query for leadId as we specifically passed it in the URL
      const leadId = req.query.leadId || "";

      console.log(`[TWIML] Generating TwiML. CallSid: ${callSid}, LeadId: ${leadId}`);

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
    <Stream url="wss://${wsHost}/outbound-media-stream?callSid=${callSid}&amp;leadId=${leadId}" />
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