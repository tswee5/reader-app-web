const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials missing. Check your .env.local file.');
  process.exit(1);
}

async function diagnoseHighlightIssue() {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`Connecting to Supabase at ${supabaseUrl}...`);
    
    // Try to query the highlights table
    const { data: highlightData, error: highlightError } = await supabase
      .from('highlights')
      .select('count');
    
    if (highlightError) {
      console.error('Highlights table error:', highlightError.message);
      console.log('\nThe highlights table is missing in your database.');
      console.log('Please follow these steps to fix the issue:');
      console.log('1. Log in to your Supabase Dashboard: https://app.supabase.com');
      console.log('2. Select your project: brducmfdyegwjdpdmnfb');
      console.log('3. Go to the SQL Editor');
      console.log('4. Create a new query with the SQL in the schema.sql file');
      console.log('5. Execute the SQL to create the highlights table and other missing tables');
      console.log('6. Restart your application');
    } else {
      console.log('✅ Highlights table exists');
    }
    
    // Try to query the other tables
    const tables = ['notes', 'tags', 'article_tags', 'collections', 'collection_articles'];
    let missingTables = [];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count');
      if (error) {
        missingTables.push(table);
      } else {
        console.log(`✅ ${table} table exists`);
      }
    }
    
    if (missingTables.length > 0) {
      console.log(`\nMissing tables: ${missingTables.join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error diagnosing issue:', error.message);
  }
}

diagnoseHighlightIssue(); 