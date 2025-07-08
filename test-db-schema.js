#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...\n');

  try {
    // Test 1: Check if ai_conversations table exists and can be queried
    console.log('1. Testing ai_conversations table access...');
    
    const { data: conversations, error: conversationsError } = await supabase
      .from('ai_conversations')
      .select('*')
      .limit(1);

    if (conversationsError) {
      console.error('❌ Error accessing ai_conversations table:', conversationsError);
      
      // Try to get more details about the error
      if (conversationsError.code === '42703') {
        console.log('💡 This suggests missing columns. You need to run the migration SQL.');
      }
    } else {
      console.log('✅ ai_conversations table is accessible');
      if (conversations && conversations.length > 0) {
        console.log('✅ Sample conversation columns:');
        Object.keys(conversations[0]).forEach(col => {
          console.log(`   - ${col}`);
        });
      } else {
        console.log('   (No conversations found)');
      }
    }

    // Test 2: Check if articles table is accessible
    console.log('\n2. Testing articles table access...');
    
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, user_id')
      .limit(1);

    if (articlesError) {
      console.error('❌ Error accessing articles table:', articlesError);
    } else {
      console.log('✅ Articles table is accessible');
      console.log(`   Found ${articles?.length || 0} articles`);
      if (articles && articles.length > 0) {
        console.log('   Sample article:', {
          id: articles[0].id,
          title: articles[0].title?.substring(0, 50) + '...',
          user_id: articles[0].user_id
        });
      }
    }

    // Test 3: Try to create a test conversation to see what columns are available
    console.log('\n3. Testing conversation creation...');
    
    const testConversation = {
      user_id: articles?.[0]?.user_id || 'test-user-id',
      article_id: articles?.[0]?.id || 'test-article-id',
      title: 'Test conversation',
      total_tokens: 0,
      conversation_length: 0
    };

    const { data: newConversation, error: createError } = await supabase
      .from('ai_conversations')
      .insert(testConversation)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test conversation:', createError);
      
      if (createError.code === '42703') {
        console.log('💡 This confirms missing columns. Run the migration SQL in Supabase dashboard.');
      }
    } else {
      console.log('✅ Test conversation created successfully');
      console.log('✅ Available columns in ai_conversations:');
      Object.keys(newConversation).forEach(col => {
        console.log(`   - ${col}`);
      });
      
      // Clean up the test conversation
      await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', newConversation.id);
      console.log('✅ Test conversation cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDatabaseSchema(); 