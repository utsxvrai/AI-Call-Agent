const supabase = require('./src/services/supabase-service');

async function testFetch() {
  console.log("🔍 Fetching a sample lead ID from database...");
  const { data: lead, error: findError } = await supabase
    .from('leads')
    .select('id, name')
    .limit(1)
    .single();

  if (findError || !lead) {
    console.error("❌ No leads found in database to test with.", findError);
    return;
  }

  const testLeadId = lead.id;
  console.log(`✅ Testing with Lead ID: ${testLeadId} (Expected Name: ${lead.name})`);

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('name')
      .eq('id', testLeadId)
      .single();

    if (error) throw error;

    if (data) {
      console.log(`✨ Success! Fetched Name: "${data.name}"`);
    } else {
      console.log("⚠️ Lead found but returned no data.");
    }
  } catch (err) {
    console.error("❌ Fetch failed:", err.message);
  }
}

testFetch();
