// ── CSV utilities ────────────────────────────────────────────────────────────
// Parser CSV minimalista: soporta comillas dobles, comas escapadas y \r\n/\n.
export function parseCsv(text) {
  const rows = [];
  let cur = [""], i = 0, inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur[cur.length - 1] += '"'; i += 2; continue; }
      if (c === '"') { inQuotes = false; i++; continue; }
      cur[cur.length - 1] += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { cur.push(""); i++; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      rows.push(cur); cur = [""]; i++; continue;
    }
    cur[cur.length - 1] += c; i++;
  }
  if (cur.length > 1 || cur[0] !== "") rows.push(cur);
  return rows;
}

// Alias de cabeceras admitidos (case-insensitive).
const ALIAS = {
  nombre:    ["nombre", "first name", "firstname", "name", "first_name"],
  apellidos: ["apellidos", "last name", "lastname", "surname", "last_name"],
  cargo:     ["cargo", "title", "puesto", "role", "job title", "job_title"],
  email:     ["email", "correo", "mail", "e-mail"],
  empresa:   ["empresa", "company", "organization", "org", "company_name"],
  dominio:   ["dominio", "domain", "website", "web"],
  linkedin:  ["linkedin", "linkedin_url", "li"],
};

// Mapea filas crudas → [{nombre, apellidos, cargo, email, empresa, dominio, linkedin}]
export function rowsToContacts(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(h => (h ?? "").trim().toLowerCase());
  const idx = Object.fromEntries(
    Object.entries(ALIAS).map(([k, list]) => [k, headers.findIndex(h => list.includes(h))])
  );
  return rows.slice(1)
    .filter(r => r.some(c => (c ?? "").trim()))
    .map(r => Object.fromEntries(
      Object.entries(idx).map(([k, i]) => [k, i >= 0 ? (r[i] ?? "").trim() : ""])
    ));
}

// Valida un contacto; devuelve array de nombres de campos con error.
export function validateContact(c) {
  const errs = [];
  if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errs.push("email");
  if (!c.nombre) errs.push("nombre");
  return errs;
}
