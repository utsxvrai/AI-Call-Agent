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
  

  response.connect().stream({
    url: `wss://${process.env.BASE_URL.replace('https://', '')}/ws/media`
  })

  response.pause({length: 60 }); //it keeps the call open for 60 seconds 

  return response.toString();
}

module.exports = {
    startOutboundCall,
    getGreetingTwiML
}
