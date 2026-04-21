// ── Payload helpers ─────────────────────────────────────────────────────────
// Utilidades para construir payloads que viajan a N8N / APIs externas.

/**
 * Devuelve true si el valor es "vacío" en el sentido de payload:
 * - null / undefined
 * - string vacío o solo whitespace
 * - array sin elementos
 * - objeto plano sin keys
 * Los 0, false y otros primitivos se consideran NO vacíos.
 */
export function isEmptyValue(v) {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}

/**
 * Devuelve una copia del objeto sin las keys cuyo valor es "vacío".
 *
 * Motivo: en JS `[] || x` devuelve `[]` (array vacío es truthy), así que si
 * mandamos `cliente_referencia.geografias = []` al workflow de N8N, el
 * `ref.geografias || filtros_secundarios.geografias` nunca cae al fallback.
 * Al omitir las keys vacías, el `||` sí funciona como se espera.
 *
 * @param {object} obj
 * @param {object} [options]
 * @param {string[]} [options.keep] claves que siempre se mantienen aunque
 *   parezcan vacías (p.ej. `num_resultados: 0` si alguna vez fuera válido).
 * @returns {object}
 */
export function pruneEmpty(obj, { keep = [] } = {}) {
  if (!obj || typeof obj !== "object") return obj;
  const keepSet = new Set(keep);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (keepSet.has(k) || !isEmptyValue(v)) out[k] = v;
  }
  return out;
}
