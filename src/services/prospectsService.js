import { supabase } from '../lib/supabase'

// ── Companies ──────────────────────────────────────────────────────────────

export async function saveCompanies(companies) {
  if (!companies?.length) return
  const rows = companies.map(c => ({
    nombre:         c.name         ?? '',
    domain:         c.domain       ?? '',
    industries:     c.industries   ?? [],
    revenue:        c.revenue      ?? '',
    employee_count: c.employeeCount ?? null,
    countries:      c.countries    ?? [],
  })).filter(r => r.domain) // domain required for upsert key
  if (!rows.length) return
  const { error } = await supabase
    .from('prospect_companies')
    .upsert(rows, { onConflict: 'domain', ignoreDuplicates: true })
  if (error) throw error
}

export async function getCompanies() {
  const { data, error } = await supabase
    .from('prospect_companies')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function deleteCompany(id) {
  await supabase.from('prospect_companies').delete().eq('id', id)
}

// ── Contacts ───────────────────────────────────────────────────────────────

export async function saveContacts(contacts) {
  if (!contacts?.length) return
  const rows = contacts.map(c => ({
    nombre:         c.nombre         ?? '',
    apellidos:      c.apellidos      ?? '',
    cargo:          c.cargo          ?? '',
    email:          c.email          ?? '',
    telefono:       c.telefono       ?? '',
    linkedin:       c.linkedin       ?? '',
    company_nombre: c.company_nombre ?? '',
    company_domain: c.company_domain ?? '',
  }))
  const { error } = await supabase.from('prospect_contacts').insert(rows)
  if (error) throw error
}

export async function getContacts() {
  const { data, error } = await supabase
    .from('prospect_contacts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function deleteContact(id) {
  await supabase.from('prospect_contacts').delete().eq('id', id)
}
