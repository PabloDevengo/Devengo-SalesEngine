import { supabase } from '../lib/supabase'

function dbToClient(row) {
  if (!row) return null
  const { testimonials, ...rest } = row
  return {
    ...rest,
    testimonial: testimonials?.[0]
      ? {
          nombre: testimonials[0].nombre,
          posicion: testimonials[0].posicion,
          comentario: testimonials[0].comentario,
        }
      : null,
  }
}

export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*, testimonials(*)')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(dbToClient)
}

export async function saveClient(client) {
  const { testimonial, ...clientData } = client
  const { error } = await supabase.from('clients').upsert(clientData)
  if (error) throw error

  // Replace testimonial
  await supabase.from('testimonials').delete().eq('client_id', client.id)
  if (testimonial && (testimonial.nombre || testimonial.comentario)) {
    await supabase.from('testimonials').insert({
      ...testimonial,
      client_id: client.id,
    })
  }
}

export async function deleteClient(id) {
  await supabase.from('clients').delete().eq('id', id)
  // testimonials deleted via CASCADE
}
