# Supabase Setup for Reader App

This document provides instructions for setting up Supabase for the Reader App.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project

## Setup Instructions

1. **Set Environment Variables**

   Copy the `.env.local.example` file to `.env.local` and fill in your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

2. **Run SQL Migrations**

   Navigate to the SQL Editor in your Supabase dashboard and run the following SQL scripts in order:

   1. `supabase/migrations/01_create_tables.sql`
   2. `supabase/migrations/02_security_policies.sql`
   3. `supabase/migrations/03_create_indexes.sql`

3. **Configure Authentication**

   In your Supabase dashboard:

   1. Go to Authentication > Settings
   2. Set the Site URL to your application URL (e.g., `http://localhost:3000` for development)
   3. Enable Email/Password sign-in method
   4. Configure email templates if desired

4. **Set up Storage Buckets (Optional)**

   If you plan to allow users to upload profile images:

   1. Go to Storage in your Supabase dashboard
   2. Create a new bucket called `avatars`
   3. Set the bucket to public or configure appropriate access policies

## Verification

To verify your setup:

1. Run the application locally
2. Try to sign up a new user
3. Confirm the user appears in the Authentication > Users section of your Supabase dashboard
4. Verify that the user can create and access their own data according to the RLS policies 