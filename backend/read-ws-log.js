const fs = require('fs');

function checkLog() {
  console.log('📖 Reading elevenlabs_ws.log for interest data...');
  
  if (!fs.existsSync('elevenlabs_ws.log')) {
    console.log('⚠️ No log file found yet. Make a call first!');
    return;
  }

  const lines = fs.readFileSync('elevenlabs_ws.log', 'utf8').split('\n');
  let found = false;

  lines.forEach(line => {
    if (line.includes('user_interest') || line.includes('json_data') || line.includes('end_call_goal')) {
      console.log('\n✅ FOUND DATA PACKET:');
      console.log(line);
      found = true;
    }
  });

  if (!found) {
    console.log('❌ No interest data found in the logs yet.');
  }
}

checkLog();
