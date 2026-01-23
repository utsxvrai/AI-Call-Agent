console.log('--- STARTING GLOBAL TEST ---');
const supabase = require('./src/services/supabase-service');
require('dotenv').config();

async function listAllLeads() {
  console.log(`🔍 Fetching first 5 leads...`);
  
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Supabase Error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} leads:`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('⚠️ No leads found in the table.');
    }
  } catch (err) {
    console.error('💥 Script Crash:', err.message);
  }
}

listAllLeads();
