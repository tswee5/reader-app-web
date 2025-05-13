const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials missing. Check your .env.local file.');
  process.exit(1);
}

async function checkTables() {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`Connecting to Supabase at ${supabaseUrl}...`);
    
    // Check if the tables exist by querying them
    const expectedTables = [
      'users',
      'articles',
      'highlights',
      'notes',
      'tags',
      'article_tags',
      'collections',
      'collection_articles'
    ];
    
    for (const table of expectedTables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table ${table} issue:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists`);
      }
    }
    
  } catch (error) {
    console.error('Error checking tables:', error.message);
  }
}

checkTables(); 