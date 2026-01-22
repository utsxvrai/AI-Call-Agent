const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('⚠️ Supabase credentials not found in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = supabase;
