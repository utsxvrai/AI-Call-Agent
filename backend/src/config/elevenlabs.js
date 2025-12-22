const ELEVENLABS_STT_URL =
  'wss://api.elevenlabs.io/v1/speech-to-text/stream';

module.exports = {
  ELEVENLABS_STT_URL,
  ELEVENLABS_HEADERS: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
  },
};
