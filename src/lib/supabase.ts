import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

let parsed: URL
try {
  parsed = new URL(url)
} catch {
  throw new Error('VITE_SUPABASE_URL inválida. Use https://<project-ref>.supabase.co')
}
if (!['http:', 'https:'].includes(parsed.protocol)) {
  throw new Error('VITE_SUPABASE_URL inválida. Use https://<project-ref>.supabase.co')
}

export const supabase = createClient(parsed.toString(), anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
