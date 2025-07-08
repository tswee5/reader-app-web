#!/usr/bin/env node

/**
 * Script to run the enhanced AI chat migration
 * This adds stateful features to the AI conversation system
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting enhanced AI chat migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../lib/supabase/migrations/1000_enhance_ai_chat_stateful.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration: 1000_enhance_ai_chat_stateful.sql');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Enhanced features added:');
    console.log('   • Article summary storage');
    console.log('   • Web search snippets storage');
    console.log('   • Memory summary for long conversations');
    console.log('   • Token usage tracking');
    console.log('   • Web search rate limiting');
    console.log('   • Conversation length tracking');
    console.log('   • Analytics view for conversation insights');

    // Verify the changes
    console.log('\n🔍 Verifying migration...');
    
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'ai_conversations')
      .in('column_name', [
        'article_summary',
        'web_snippets', 
        'memory_summary',
        'total_tokens',
        'last_web_search_at',
        'conversation_length'
      ]);

    if (columnError) {
      console.error('❌ Error verifying migration:', columnError);
    } else {
      console.log('✅ Verified new columns:', columns.map(c => c.column_name).join(', '));
    }

    console.log('\n🎉 Enhanced AI chat system is ready!');
    console.log('\nNext steps:');
    console.log('1. Restart your development server');
    console.log('2. Test the new stateful conversation features');
    console.log('3. Monitor token usage in the conversation state indicator');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 