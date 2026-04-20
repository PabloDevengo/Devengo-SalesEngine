// ── Email utility functions ───────────────────────────────

/** Lowercase + remove accents + keep only alphanumeric */
export function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Strip protocol and path, return clean domain */
export function parseDomain(raw) {
  return raw
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();
}

/**
 * Generate email combinations ordered by probability.
 * Probabilities are based on real-world frequency data from Hunter.io, Apollo and Snov.
 *
 * Signature retrocompatible: el 2º nombre es opcional vía options.
 *   buildCombinations(nombre, apellido1, apellido2, dominio, { nombre2 })
 *
 * Cuando se pasa `nombre2` (p.ej. "Antonio" en "Jose Antonio"), añade variantes
 * con ambos nombres combinados con apellido1 y, si procede, con ambos apellidos.
 */
export function buildCombinations(nombre, apellido1, apellido2, dominio, options = {}) {
  const { nombre2 = "" } = options;

  const n   = normalize(nombre);
  const n2  = normalize(nombre2);
  const a1  = normalize(apellido1);
  const a2  = normalize(apellido2);
  const ni  = n[0]  || "";
  const n2i = n2[0] || "";
  const a1i = a1[0] || "";
  const a2i = a2[0] || "";
  const nn  = n.slice(0, 2);
  const n2n = n2.slice(0, 2);
  const d   = parseDomain(dominio);

  if (!n || !a1 || !d) return [];

  // ── Variantes base (sin segundo nombre) ─────────────────────────────────
  const base = [
    { formula: "nombre.apellido@",   email: `${n}.${a1}@${d}`,            prob: 95 },
    { formula: "nombre@",            email: `${n}@${d}`,                  prob: 72 },
    { formula: "n.apellido@",        email: `${ni}.${a1}@${d}`,           prob: 68 },
    { formula: "napellido@",         email: `${ni}${a1}@${d}`,            prob: 61 },
    { formula: "apellido.nombre@",   email: `${a1}.${n}@${d}`,            prob: 38 },
    { formula: "nombreapellido@",    email: `${n}${a1}@${d}`,             prob: 35 },
    { formula: "apellido@",          email: `${a1}@${d}`,                 prob: 30 },
    { formula: "nombre-apellido@",   email: `${n}-${a1}@${d}`,            prob: 27 },
    { formula: "nombre.a@",          email: `${n}.${a1i}@${d}`,           prob: 24 },
    { formula: "apellido.n@",        email: `${a1}.${ni}@${d}`,           prob: 21 },
    { formula: "a.nombre@",          email: `${a1i}.${n}@${d}`,           prob: 14 },
    { formula: "apellido-nombre@",   email: `${a1}-${n}@${d}`,            prob: 13 },
    { formula: "nombre_apellido@",   email: `${n}_${a1}@${d}`,            prob: 11 },
    { formula: "apellido_nombre@",   email: `${a1}_${n}@${d}`,            prob:  9 },
    { formula: "na@",                email: `${ni}${a1i}@${d}`,           prob:  8 },
    { formula: "nn.apellido@",       email: `${nn}.${a1}@${d}`,           prob:  7 },
    { formula: "nnapellido@",        email: `${nn}${a1}@${d}`,            prob:  7 },
  ];

  // ── Variantes con 2º apellido ───────────────────────────────────────────
  const withA2 = a2 ? [
    { formula: "nombre.ap1ap2@",     email: `${n}.${a1}${a2}@${d}`,       prob: 42 },
    { formula: "nombre.ap1.ap2@",    email: `${n}.${a1}.${a2}@${d}`,      prob: 31 },
    { formula: "ap1ap2@",            email: `${a1}${a2}@${d}`,            prob: 22 },
    { formula: "ap1.ap2@",           email: `${a1}.${a2}@${d}`,           prob: 19 },
    { formula: "n.ap1ap2@",          email: `${ni}.${a1}${a2}@${d}`,      prob: 18 },
    { formula: "naa@",               email: `${ni}${a1i}${a2i}@${d}`,     prob:  7 },
  ] : [];

  // ── Variantes con 2º nombre (opcional, ej. "Jose Antonio") ──────────────
  // Probabilidades calibradas algo más bajas: patrones menos comunes.
  const withN2 = n2 ? [
    // nombre1 completo + nombre2 completo + apellido
    { formula: "n1.n2.apellido@",    email: `${n}.${n2}.${a1}@${d}`,      prob: 40 },
    { formula: "n1n2.apellido@",     email: `${n}${n2}.${a1}@${d}`,       prob: 34 },
    { formula: "n1n2apellido@",      email: `${n}${n2}${a1}@${d}`,        prob: 22 },
    { formula: "n1.n2@",             email: `${n}.${n2}@${d}`,            prob: 20 },
    { formula: "n1n2@",              email: `${n}${n2}@${d}`,             prob: 16 },
    // inicial nombre1 + nombre2 completo + apellido
    { formula: "n1i.n2.apellido@",   email: `${ni}.${n2}.${a1}@${d}`,     prob: 28 },
    { formula: "n1in2.apellido@",    email: `${ni}${n2}.${a1}@${d}`,      prob: 20 },
    // nombre1 completo + inicial nombre2 + apellido
    { formula: "n1.n2i.apellido@",   email: `${n}.${n2i}.${a1}@${d}`,     prob: 26 },
    { formula: "n1n2i.apellido@",    email: `${n}${n2i}.${a1}@${d}`,      prob: 18 },
    // iniciales de ambos nombres + apellido
    { formula: "n1i.n2i.apellido@",  email: `${ni}.${n2i}.${a1}@${d}`,    prob: 17 },
    { formula: "n1in2i.apellido@",   email: `${ni}${n2i}.${a1}@${d}`,     prob: 15 },
    { formula: "n1in2iapellido@",    email: `${ni}${n2i}${a1}@${d}`,      prob: 12 },
    { formula: "n1in2i@",            email: `${ni}${n2i}@${d}`,           prob:  8 },
    // dos letras nombre1 + dos letras nombre2 + apellido
    { formula: "nnn2n2.apellido@",   email: `${nn}${n2n}.${a1}@${d}`,     prob: 10 },
    { formula: "nnn2n2apellido@",    email: `${nn}${n2n}${a1}@${d}`,      prob:  8 },
  ] : [];

  // ── Combinación de 2º nombre y 2º apellido ──────────────────────────────
  const withN2A2 = (n2 && a2) ? [
    { formula: "n1.n2.ap1ap2@",      email: `${n}.${n2}.${a1}${a2}@${d}`, prob: 16 },
    { formula: "n1.n2.ap1.ap2@",     email: `${n}.${n2}.${a1}.${a2}@${d}`,prob: 12 },
    { formula: "n1in2i.ap1ap2@",     email: `${ni}${n2i}.${a1}${a2}@${d}`,prob:  9 },
    { formula: "n1in2iaa@",          email: `${ni}${n2i}${a1i}${a2i}@${d}`, prob: 5 },
  ] : [];

  // Dedupe por email (por si alguna combinación degenerada coincide con otra).
  const all = [...base, ...withA2, ...withN2, ...withN2A2];
  const seen = new Set();
  const unique = [];
  for (const c of all) {
    if (seen.has(c.email)) continue;
    seen.add(c.email);
    unique.push(c);
  }
  return unique.sort((a, b) => b.prob - a.prob);
}
