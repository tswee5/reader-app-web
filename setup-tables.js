const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials missing. Check your .env.local file.');
  process.exit(1);
}

async function setupTables() {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`Connecting to Supabase at ${supabaseUrl}...`);
    
    // Read the schema SQL file
    const schemaSQL = fs.readFileSync('schema.sql', 'utf8');
    
    // Split the SQL by semicolon to get individual statements
    const statements = schemaSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each SQL statement
    for (const statement of statements) {
      if (statement.includes('CREATE TABLE highlights') ||
          statement.includes('CREATE TABLE notes') ||
          statement.includes('CREATE TABLE tags') ||
          statement.includes('CREATE TABLE article_tags') ||
          statement.includes('CREATE TABLE collections') ||
          statement.includes('CREATE TABLE collection_articles') ||
          statement.includes('CREATE TABLE summaries') ||
          statement.includes('CREATE POLICY') && 
          (statement.includes('highlights') || 
           statement.includes('notes') || 
           statement.includes('tags') || 
           statement.includes('article_tags') || 
           statement.includes('collections') || 
           statement.includes('collection_articles') ||
           statement.includes('summaries'))) {
        
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        
        const { error } = await supabase.rpc('pgfunction', { query: statement });
        
        if (error) {
          console.error(`Error executing statement:`, error.message);
        } else {
          console.log('Statement executed successfully');
        }
      }
    }
    
    console.log('Database setup complete!');
    
  } catch (error) {
    console.error('Error setting up tables:', error.message);
  }
}

setupTables(); 