import { supabase } from '../lib/supabase'

// Keys stored in the `settings` table
const WEBHOOK_KEYS = [
  'webhook_prospect',
  'webhook_contacts',
  'webhook_lookalike',
  'webhook_emailgen',
  'webhook_instantly',
  'webhook_meetings',
  'webhook_verification',
]

/**
 * Returns { prospect, contacts, lookalike, emailgen, instantly, meetings, verification }
 * Empty string for any webhook not yet saved.
 */
export async function getWebhooks() {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', WEBHOOK_KEYS)

  const result = Object.fromEntries(
    WEBHOOK_KEYS.map(k => [k.replace('webhook_', ''), ''])
  )
  for (const row of data ?? []) {
    const shortKey = row.key.replace('webhook_', '')
    result[shortKey] = row.value ?? ''
  }
  return result
}

/**
 * Saves a single webhook URL.
 * @param {string} key  — short key e.g. 'prospect', 'emailgen'
 * @param {string} value — URL
 */
export async function saveWebhook(key, value) {
  const fullKey = `webhook_${key}`
  if (!value) {
    await supabase.from('settings').delete().eq('key', fullKey)
  } else {
    await supabase.from('settings').upsert(
      { key: fullKey, value },
      { onConflict: 'key' }
    )
  }
}
