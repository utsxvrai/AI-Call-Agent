const axios = require('axios');
require('dotenv').config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

async function analyzeLastCall() {
  try {
    const listResponse = await axios.get(
      `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=1`,
      { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
    );

    if (!listResponse.data.conversations?.length) {
      console.log('No conversations found.');
      return;
    }

    const lastCallId = listResponse.data.conversations[0].conversation_id;
    console.log(`🔍 Analyzing call: ${lastCallId}`);

    const detailResponse = await axios.get(
      `https://api.elevenlabs.io/v1/convai/conversations/${lastCallId}`,
      { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
    );

    const data = detailResponse.data;
    const analysis = data.analysis || {};
    const results = analysis.data_collection_results || {};

    console.log('--- ELEVENLABS ANALYSIS RESULTS ---');
    console.log('Conversation ID:', lastCallId);
    console.log('User ID (Metadata):', data.metadata?.user_id || data.user_id || 'NOT SET');
    
    if (results.user_interest) {
      console.log('Target: user_interest');
      console.log('Value:', results.user_interest.value);
      console.log('Rationale:', results.user_interest.rationale);
    } else {
      console.log('Target: user_interest NOT FOUND');
    }

    if (results.end_call_goal) {
      console.log('Target: end_call_goal');
      console.log('Value:', results.end_call_goal.value);
      console.log('Rationale:', results.end_call_goal.rationale);
    } else {
      console.log('Target: end_call_goal NOT FOUND');
    }
    
    console.log('------------------------------------');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeLastCall();
