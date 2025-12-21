const twilioClient = require('../config/twilio');
const dotenv = require('dotenv');
dotenv.config();

async function createCall({ to, twimlUrl }) {
    const call = await twilioClient.calls.create({
        to,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: twimlUrl,
        method: 'POST',
    });

    return call;
}


module.exports = {
    createCall
}
