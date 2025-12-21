const { createCall } = require("./twilio-service");
const dotenv = require('dotenv');
dotenv.config();

async function startOutboundCall({to}) {
    const call = await createCall({
        to,
        twimlUrl: `${process.env.BASE_URL}/api/v1/call/twiml`,
    });
    return call;
}


async function getGreetingTwiML(){
    const {twiml} = require('twilio');
    const response = new twiml.VoiceResponse();
    response.say(
    { voice: 'alice', language: 'en-US' },
    'Hello! This is a test call from your AI call agent.'
  );

  return response.toString();
}

module.exports = {
    startOutboundCall,
    getGreetingTwiML
}
