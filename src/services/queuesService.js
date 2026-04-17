// ── queuesService ───────────────────────────────────────────────────────────
// Funciones puras para las colas de trabajo (verification / prospecting /
// instantly). Construyen payloads agregados, llaman al webhook con timeout,
// y distribuyen la respuesta por item.

// ── Dedup keys ──────────────────────────────────────────────────────────────
export function dedupKey(type, payload) {
  if (!payload) return "";
  if (type === "verification") return String(payload.email ?? "").toLowerCase();
  if (type === "prospecting")  return String(payload.domain ?? "").toLowerCase();
  if (type === "instantly")    return String(payload.contacto?.email ?? "").toLowerCase();
  return "";
}

// ── Payload builders por tipo de cola ──────────────────────────────────────
export function buildPayload(type, items, extraCfg = {}) {
  if (type === "verification") {
    return { emails: items.map(i => i.payload.email) };
  }
  if (type === "prospecting") {
    return {
      tipo: "contacto",
      companies: items.map(i => ({
        nombre: i.payload.nombre ?? "",
        domain: i.payload.domain,
      })),
      personas: extraCfg.personas ?? [],
      num_resultados: extraCfg.num_resultados ?? 20,
    };
  }
  if (type === "instantly") {
    return { contactos: items.map(i => i.payload) };
  }
  return {};
}

// ── POST al webhook con timeout ────────────────────────────────────────────
export async function postToWebhook(url, body, timeoutMs = 120_000) {
  if (!url) throw new Error("Webhook no configurado");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Timeout");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ── Mapea la respuesta a cada item por clave natural ──────────────────────
// Devuelve { [itemId]: resultParcial }
export function distributeResults(type, items, response) {
  const map = {};
  if (type === "verification") {
    const raw = Array.isArray(response) ? response : (response?.results ?? response?.data ?? []);
    const byEmail = new Map(raw.map(r => [String(r.email || "").toLowerCase(), r]));
    for (const it of items) {
      map[it.id] = byEmail.get(String(it.payload.email).toLowerCase()) ?? null;
    }
  } else if (type === "prospecting") {
    const raw = Array.isArray(response) ? response : (response?.contacts ?? response?.results ?? response?.data ?? []);
    const byDomain = raw.reduce((acc, c) => {
      const d = String(c.company_domain || c.domain || "").toLowerCase();
      if (!d) return acc;
      (acc[d] ??= []).push(c);
      return acc;
    }, {});
    for (const it of items) {
      map[it.id] = byDomain[String(it.payload.domain).toLowerCase()] ?? [];
    }
  } else if (type === "instantly") {
    for (const it of items) map[it.id] = response ?? { ok: true };
  }
  return map;
}
