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

function sendMuLawToTwilio(ws, muLawAudio, streamSid) {
    if (!ws || ws.readyState !== 1) return;

    // Twilio prefers small 20ms chunks (160 bytes for mu-law)
    const CHUNK_SIZE = 160;
    for (let i = 0; i < muLawAudio.length; i += CHUNK_SIZE) {
        const chunk = muLawAudio.slice(i, i + CHUNK_SIZE);
        const message = {
            event: 'media',
            streamSid: streamSid,
            media: {
                payload: chunk.toString('base64'),
            },
        };
        ws.send(JSON.stringify(message));
    }
}

module.exports = {
    createCall,
    sendMuLawToTwilio
}
