import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Only warn in dev to prevent crashing if environment variables aren't set yet during build
  console.warn('Missing Supabase URL or Anon Key')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
