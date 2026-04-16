import { supabase } from '../lib/supabase'

function dbToCompany(row) {
  if (!row) return null
  const { alcance_geografico, ...rest } = row
  return { ...rest, alcanceGeografico: alcance_geografico ?? [] }
}

function companyToDb(company) {
  const { alcanceGeografico, id: _id, ...rest } = company
  return { id: 1, ...rest, alcance_geografico: alcanceGeografico ?? [] }
}

export async function getCompany() {
  const { data } = await supabase
    .from('company')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  return dbToCompany(data)
}

export async function updateCompany(company) {
  await supabase.from('company').upsert(companyToDb(company))
}
