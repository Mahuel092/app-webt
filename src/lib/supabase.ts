import { createClient } from '@supabase/supabase-js';

// ... existing code ... <no existing code, creating new file>

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
);
