const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

async function run() {
  try {
    const listResponse = await axios.get(
      `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=1`,
      { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
    );
    const lastCallId = listResponse.data.conversations[0].conversation_id;
    const detailResponse = await axios.get(
      `https://api.elevenlabs.io/v1/convai/conversations/${lastCallId}`,
      { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
    );
    fs.writeFileSync('last_call_analysis.txt', JSON.stringify(detailResponse.data.analysis, null, 2));
    console.log('Done');
  } catch (e) {
    fs.writeFileSync('last_call_analysis.txt', 'ERROR: ' + e.message);
  }
}
run();
