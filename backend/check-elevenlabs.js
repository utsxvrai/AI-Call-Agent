const axios = require('axios');
require('dotenv').config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

async function checkElevenLabsConversations() {
  console.log('🔍 Fetching latest conversations from ElevenLabs...');
  
  try {
    const response = await axios.get(
      `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=5`,
      {
        headers: { 'xi-api-key': ELEVENLABS_API_KEY }
      }
    );

    const conversations = response.data.conversations;
    
    if (!conversations || conversations.length === 0) {
      console.log('⚠️ No conversations found for this agent.');
      return;
    }

    for (const conv of conversations) {
      console.log(`\n-----------------------------------------`);
      console.log(`📞 Call ID: ${conv.conversation_id}`);
      console.log(`📅 Date: ${new Date(conv.start_time_unix_ms).toLocaleString()}`);
      console.log(`👤 User ID (Metadata): ${conv.metadata?.user_id || 'Not Set'}`);
      console.log(`⏱️ Duration: ${conv.duration_seconds}s`);
      
      // Fetch detailed analysis for this specific call
      try {
        const details = await axios.get(
          `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`,
          {
            headers: { 'xi-api-key': ELEVENLABS_API_KEY }
          }
        );

        const analysis = details.data.analysis;
        console.log(`📊 Analysis Results:`);
        if (analysis) {
          console.log(`   - Data:`, JSON.stringify(analysis.data_collection_results || {}, null, 2));
          console.log(`   - Call Goal: ${analysis.call_goal_status || 'Unknown'}`);
        } else {
          console.log(`   - No analysis found yet (Call might still be processing).`);
        }
      } catch (e) {
        console.log(`   - Failed to fetch details: ${e.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkElevenLabsConversations();
