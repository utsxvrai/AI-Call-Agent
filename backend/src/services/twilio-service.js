const twilio = require('twilio');
require('dotenv').config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const TwilioService = {
  async endCall(callSid) {
    if (!callSid || callSid === 'unknown') {
      console.warn("⚠️ Attempted to end call with invalid CallSid");
      return;
    }

    try {
      await twilioClient.calls(callSid).update({ status: 'completed' });
      console.log(`✅ [${callSid}] Call terminated successfully.`);
      return true;
    } catch (error) {
      console.error(`❌ [${callSid}] Failed to terminate call:`, error.message);
      return false;
    }
  }
};

module.exports = TwilioService;
