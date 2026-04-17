import { supabase } from '../lib/supabase'
import { INDUSTRIES_DEVENGO_SEED } from '../data/industriesDevengoSeed'

// ── Mappers ──────────────────────────────────────────────────────────────────
function dbToIndustry(row) {
  if (!row) return null
  const { surfe_industries, serper_keywords, ...rest } = row
  return {
    ...rest,
    surfe_industries: surfe_industries ?? [],
    serper_keywords:  serper_keywords  ?? [],
  }
}

function industryToDb(ind) {
  const {
    id, label, category, descripcion,
    surfe_industries, serper_keywords,
  } = ind
  return {
    id,
    label:       label       ?? '',
    category:    category    ?? 'Other',
    descripcion: descripcion ?? '',
    surfe_industries: surfe_industries ?? [],
    serper_keywords:  serper_keywords  ?? [],
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────────────
export async function getIndustriesDevengo() {
  const { data, error } = await supabase
    .from('industries_devengo')
    .select('*')
    .order('category', { ascending: true })
    .order('label',    { ascending: true })
  if (error) throw error
  return (data ?? []).map(dbToIndustry)
}

export async function saveIndustryDevengo(industry) {
  const { error } = await supabase
    .from('industries_devengo')
    .upsert(industryToDb(industry))
  if (error) throw error
}

export async function deleteIndustryDevengo(id) {
  const { error } = await supabase
    .from('industries_devengo')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Seed on empty ────────────────────────────────────────────────────────────
// Si la tabla está vacía, volcamos la semilla. Devuelve el array final.
export async function ensureSeedLoaded() {
  const current = await getIndustriesDevengo()
  if (current.length > 0) return current
  const rows = INDUSTRIES_DEVENGO_SEED.map(industryToDb)
  const { error } = await supabase.from('industries_devengo').insert(rows)
  if (error) {
    console.error('[industries_devengo] seed insert failed:', error)
    // Devuelve la semilla en memoria igualmente para no bloquear la UI.
    return INDUSTRIES_DEVENGO_SEED.map(dbToIndustry)
  }
  return await getIndustriesDevengo()
}
