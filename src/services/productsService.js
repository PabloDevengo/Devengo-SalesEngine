import { supabase } from '../lib/supabase'

function dbToProduct(row) {
  if (!row) return null
  const { key_personas, is_main, subproducts, ...rest } = row
  return {
    ...rest,
    keyPersonas: key_personas ?? [],
    isMain: is_main ?? false,
    subproductos: (subproducts ?? []).map(({ id, nombre, descripcion }) => ({
      id,
      nombre,
      descripcion,
    })),
  }
}

function productToDb(product) {
  // Exclude both naming variants of subproducts so they don't get sent to the products table
  const { keyPersonas, isMain, subproductos: _subs, subproducts: _subs2, ...rest } = product
  return {
    ...rest,
    key_personas: keyPersonas ?? [],
    is_main: isMain ?? false,
  }
}

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, subproducts(*)')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(dbToProduct)
}

export async function saveProduct(product) {
  const dbRow = productToDb(product)
  const { error } = await supabase.from('products').upsert(dbRow)
  if (error) throw error

  // Sync subproducts: delete all then reinsert
  await supabase.from('subproducts').delete().eq('product_id', product.id)
  const subs = product.subproductos ?? []
  if (subs.length > 0) {
    await supabase
      .from('subproducts')
      .insert(subs.map(s => ({
        nombre:      s.nombre      ?? '',
        descripcion: s.descripcion ?? '',
        product_id:  product.id,
      })))
  }
}

export async function deleteProduct(id) {
  await supabase.from('products').delete().eq('id', id)
  // subproducts are deleted automatically via ON DELETE CASCADE
}
