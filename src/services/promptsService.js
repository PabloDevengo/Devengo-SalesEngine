import { supabase } from '../lib/supabase'

/** Returns { campaign, meeting, email } — null for any prompt not yet saved */
export async function getPrompts() {
  const { data } = await supabase.from('prompts').select('key, value')
  const result = { campaign: null, meeting: null, email: null }
  for (const row of data ?? []) {
    if (row.key in result) result[row.key] = row.value
  }
  return result
}

/** Upserts a prompt. Pass value=null to delete (reset to default). */
export async function setPrompt(key, value) {
  if (value === null) {
    await supabase.from('prompts').delete().eq('key', key)
  } else {
    await supabase.from('prompts').upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    })
  }
}
