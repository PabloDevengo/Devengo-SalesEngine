import { supabase } from '../lib/supabase'

async function hashPin(pin) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(String(pin))
  )
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Returns 'set' | 'unset' */
export async function getPinStatus() {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'pin_hash')
    .maybeSingle()
  return data ? 'set' : 'unset'
}

/** Returns true if the PIN matches */
export async function verifyPin(pin) {
  const hash = await hashPin(pin)
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'pin_hash')
    .maybeSingle()
  return data?.value === hash
}

/** Creates or replaces the PIN */
export async function createPin(pin) {
  const hash = await hashPin(pin)
  await supabase.from('settings').upsert({
    key: 'pin_hash',
    value: hash,
    updated_at: new Date().toISOString(),
  })
}

/** Changes PIN after verifying the current one. Returns true on success. */
export async function changePin(currentPin, newPin) {
  const valid = await verifyPin(currentPin)
  if (!valid) return false
  await createPin(newPin)
  return true
}
