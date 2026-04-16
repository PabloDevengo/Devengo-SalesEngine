import { supabase } from '../lib/supabase'

export async function getCompetitors() {
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function saveCompetitor(competitor) {
  const { error } = await supabase.from('competitors').upsert(competitor)
  if (error) throw error
}

export async function deleteCompetitor(id) {
  await supabase.from('competitors').delete().eq('id', id)
}
