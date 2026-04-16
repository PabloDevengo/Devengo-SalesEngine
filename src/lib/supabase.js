import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key || url.includes('xxxx')) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set. ' +
    'Add them to .env.local and restart the dev server.'
  )
}

export const supabase = createClient(
  url  || 'https://placeholder.supabase.co',
  key  || 'placeholder-key'
)
