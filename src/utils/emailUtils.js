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
 * Generate up to 24 email combinations ordered by probability.
 * Probabilities are based on real-world frequency data from Hunter.io, Apollo and Snov.
 */
export function buildCombinations(nombre, apellido1, apellido2, dominio) {
  const n   = normalize(nombre);
  const a1  = normalize(apellido1);
  const a2  = normalize(apellido2);
  const ni  = n[0]  || "";
  const a1i = a1[0] || "";
  const a2i = a2[0] || "";
  const d   = parseDomain(dominio);

  if (!n || !a1 || !d) return [];

  const all = [
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
    { formula: "nn.apellido@",       email: `${n.slice(0, 2)}.${a1}@${d}`,prob:  7 },
    { formula: "nnapellido@",        email: `${n.slice(0, 2)}${a1}@${d}`, prob:  7 },
    ...(a2 ? [
      { formula: "nombre.ap1ap2@",   email: `${n}.${a1}${a2}@${d}`,       prob: 42 },
      { formula: "nombre.ap1.ap2@",  email: `${n}.${a1}.${a2}@${d}`,      prob: 31 },
      { formula: "ap1ap2@",          email: `${a1}${a2}@${d}`,            prob: 22 },
      { formula: "ap1.ap2@",         email: `${a1}.${a2}@${d}`,           prob: 19 },
      { formula: "n.ap1ap2@",        email: `${ni}.${a1}${a2}@${d}`,      prob: 18 },
      { formula: "naa@",             email: `${ni}${a1i}${a2i}@${d}`,     prob:  7 },
    ] : []),
  ];

  return all.sort((a, b) => b.prob - a.prob);
}
