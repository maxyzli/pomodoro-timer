# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to be provisioned

## 2. Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the SQL to create tables and policies

**Important**: Make sure to run the **complete** schema.sql file. The todos table requires these columns:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users)
- `text` (TEXT, NOT NULL)
- `completed` (BOOLEAN, default false)
- `category` (TEXT, must be 'do', 'schedule', 'delegate', or 'eliminate')
- `date` (DATE, NOT NULL) ⚠️ **Critical - often missing**
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

If your todos are not saving, check that your table has the `date` column!

## 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your project credentials from Supabase:
   - Go to Settings → API
   - Copy the Project URL → `VITE_SUPABASE_URL`
   - Copy the anon/public key → `VITE_SUPABASE_ANON_KEY`

3. Update `.env` with your credentials

## 4. Enable Anonymous Authentication (Optional)

If you want users to use the app without signing up:

1. Go to Authentication → Settings
2. Enable Anonymous Sign-Ins

## 5. Update Your Code

Replace the import in your components:

```typescript
// Old
import { useDailyData } from './hooks/useDailyData'

// New
import { useSupabaseDailyData as useDailyData } from './hooks/useSupabaseDailyData'
```

Or update the hook file directly to use Supabase.

## 6. Run Migration (Optional)

To migrate existing localStorage data to Supabase:

```typescript
import { migrateLocalStorageToSupabase } from './utils/migrationHelper'

// Run once in your app
migrateLocalStorageToSupabase()
```

## Troubleshooting

### Todos Not Saving
If you see "Todo saved successfully" in console logs but todos don't appear in the database:

1. **Check table schema**: Go to Table Editor → todos and verify the `date` column exists
2. **Re-run schema**: If missing columns, go to SQL Editor and run the complete `supabase/schema.sql`
3. **Check RLS policies**: Ensure Row Level Security policies allow your user to insert
4. **Verify user authentication**: Check that `user_id` matches your authenticated user ID

### Authentication Issues
If you get "User not authenticated" errors:

1. **Magic link setup**: Ensure email authentication is enabled in Auth → Settings
2. **Check URL configuration**: Verify your Supabase URL and anon key in `.env`
3. **Domain whitelist**: Add your domain to Auth → URL Configuration

## Features

- **Real-time sync**: Changes sync across devices in real-time
- **Offline support**: Works offline, syncs when back online
- **Data persistence**: Data stored securely in PostgreSQL
- **Automatic backups**: Supabase handles backups automatically

## Security Notes

- The schema includes Row Level Security (RLS) policies
- Users can only access their own data
- Anonymous users get a unique session ID
- Consider implementing proper authentication for production use