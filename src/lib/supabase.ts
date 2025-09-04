import { createClient } from '@supabase/supabase-js';

// ↓ Supabase 프로젝트의 URL / anon key로 교체
export const supabase = createClient(
  'https://vwmzxvjduuitmeehzeup.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bXp4dmpkdXVpdG1lZWh6ZXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNDcwNjgsImV4cCI6MjA2NjYyMzA2OH0.tbtBQ11PgPwyYh_ASoPPGcqYQTUpQKQ0h3BdIFCcfxY'
);
