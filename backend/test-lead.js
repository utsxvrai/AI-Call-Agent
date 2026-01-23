console.log('--- STARTING TEST ---');
const supabase = require('./src/services/supabase-service');
require('dotenv').config();

async function testLeadFetch(leadId) {
  console.log(`🔍 Testing fetch for Lead ID: ${leadId}`);
  
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) {
      console.error('❌ Supabase Error:', error.message);
      console.error('Full Error:', JSON.stringify(error, null, 2));
      return;
    }

    if (data) {
      console.log('✅ Lead Found (All Fields):');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('⚠️ No lead found with that ID.');
    }
  } catch (err) {
    console.error('💥 Script Crash:', err.message);
  }
}

// Using the Lead ID from your recent logs/screenshot
const testId = '4b2ea930-96f8-4cfd-a3c8-b9afac3f9639';
testLeadFetch(testId);
