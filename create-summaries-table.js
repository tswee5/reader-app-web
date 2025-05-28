const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials missing. Check your .env.local file.');
  process.exit(1);
}

async function createSummariesTable() {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`Connecting to Supabase at ${supabaseUrl}...`);
    
    // Create summaries table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS summaries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        dot_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `;
    
    console.log('Creating summaries table...');
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('Error creating table:', createError.message);
    } else {
      console.log('Summaries table created successfully');
    }
    
    // Enable RLS
    const enableRLSSQL = `ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;`;
    console.log('Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL });
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError.message);
    } else {
      console.log('RLS enabled successfully');
    }
    
    // Create policies
    const policies = [
      `CREATE POLICY "Users can view their own summaries" ON summaries FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can create their own summaries" ON summaries FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update their own summaries" ON summaries FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete their own summaries" ON summaries FOR DELETE USING (auth.uid() = user_id);`
    ];
    
    for (const policy of policies) {
      console.log('Creating policy...');
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy });
      
      if (policyError) {
        console.error('Error creating policy:', policyError.message);
      } else {
        console.log('Policy created successfully');
      }
    }
    
    console.log('Summaries table setup complete!');
    
  } catch (error) {
    console.error('Error setting up summaries table:', error.message);
  }
}

createSummariesTable(); 