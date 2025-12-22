const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

class TTSService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.voiceId = process.env.ELEVENLABS_VOICE_ID;
  }

  async synthesize(text) {
    if (!this.apiKey || !this.voiceId) {
      console.error('❌ Missing ElevenLabs configuration');
      return null;
    }

    try {
      const response = await axios({
        method: 'post',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}?output_format=pcm_8000`,
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/pcm',
        },
        data: {
          text,
          model_id: 'eleven_turbo_v2_5', // Much faster for real-time
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8, // Better for voice clarity
          },
        },
        responseType: 'arraybuffer',
      });

      console.log(`🔊 Generated ${response.data.byteLength} bytes of PCM audio`);
      return Buffer.from(response.data);
    } catch (err) {
      console.error('❌ TTS Error:', err.response?.data?.toString() || err.message);
      return null;
    }
  }
}

module.exports = TTSService;
