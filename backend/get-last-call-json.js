const axios = require('axios');
require('dotenv').config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

async function getLastCallJson() {
    try {
        // 1. Get the list of conversations to find the ID of the most recent one
        const listResponse = await axios.get(
            `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=1`,
            { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
        );

        const conversations = listResponse.data.conversations;
        if (!conversations || conversations.length === 0) {
            console.log('No conversations found.');
            return;
        }

        const lastCallId = conversations[0].conversation_id;
        console.log(`🔍 Fetching full JSON for last call: ${lastCallId}`);

        // 2. Fetch the full detailed JSON for that conversation
        const detailResponse = await axios.get(
            `https://api.elevenlabs.io/v1/convai/conversations/${lastCallId}`,
            { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
        );

        // 3. Print the full JSON
        console.log(JSON.stringify(detailResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

getLastCallJson();
