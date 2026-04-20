import { useState, useRef } from "react";
import { Mail, Copy, Download, Zap, Settings } from "lucide-react";
import { normalize, buildCombinations } from "../../utils/emailUtils";
import { useApp } from "../../context/AppContext";

// ═══════════════════════════════════════════════════════════
// VERIFICATION helpers — adaptado a Clearout (estado / sub_estado)
// ═══════════════════════════════════════════════════════════

// Clearout devuelve 'estado' en español; también soportamos variantes en inglés.
// Normalizamos a 4 categorías UI: valid · risky · invalid · unknown.
const STATUS_MAP = {
  "valido":       "valid",
  "válido":       "valid",
  "valida":       "valid",
  "safe":         "valid",
  "entregable":   "valid",
  "deliverable":  "valid",
  "valid":        "valid",

  "dudoso":       "risky",
  "arriesgado":   "risky",
  "risky":        "risky",
  "catch_all":    "risky",
  "catch-all":    "risky",
  "catchall":     "risky",
  "accept_all":   "risky",
  "acceptable":   "risky",

  "invalido":       "invalid",
  "inválido":       "invalid",
  "invalida":       "invalid",
  "invalid":        "invalid",
  "no_entregable":  "invalid",
  "undeliverable":  "invalid",
  "disposable":     "invalid",
  "bounce":         "invalid",

  "desconocido": "unknown",
  "unknown":     "unknown",
  "error":       "unknown",
  "timeout":     "unknown",
};

const STATUS_CFG = {
  valid:   { label: "Válido",      bg: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  risky:   { label: "Dudoso",      bg: "bg-amber-100 text-amber-700 border border-amber-200",       dot: "bg-amber-500"   },
  invalid: { label: "Inválido",    bg: "bg-red-100 text-red-700 border border-red-200",             dot: "bg-red-500"     },
  unknown: { label: "Desconocido", bg: "bg-gray-100 text-gray-500 border border-gray-200",          dot: "bg-gray-400"    },
};

function normalizeStatus(raw) {
  if (raw == null) return "unknown";
  const key = String(raw).trim().toLowerCase().replace(/\s+/g, "_");
  return STATUS_MAP[key] ?? "unknown";
}

// Acepta: array directo, {results|data|emails|verifications|items},
// wrappers N8N (output|json|data|body), heurística: primer array con email/estado.
function looksLikeResult(obj) {
  return obj && typeof obj === "object" &&
    ("email" in obj || "estado" in obj || "status" in obj || "sub_estado" in obj || "result" in obj);
}
function unwrapVerificationList(data, depth = 0) {
  if (!data || depth > 5) return [];
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    const first = data[0];
    if (Array.isArray(first)) return unwrapVerificationList(first, depth + 1);
    if (first && typeof first === "object") {
      if (looksLikeResult(first)) return data;
      if (Array.isArray(first.results))       return first.results;
      if (Array.isArray(first.data))          return first.data;
      if (Array.isArray(first.emails))        return first.emails;
      if (Array.isArray(first.verifications)) return first.verifications;
      if (Array.isArray(first.items))         return first.items;
      if (first.output !== undefined) return unwrapVerificationList(first.output, depth + 1);
      if (first.json   !== undefined) return unwrapVerificationList(first.json,   depth + 1);
      if (first.data   !== undefined) return unwrapVerificationList(first.data,   depth + 1);
      if (first.body   !== undefined) return unwrapVerificationList(first.body,   depth + 1);
      for (const v of Object.values(first)) {
        if (Array.isArray(v) && v.length > 0 && looksLikeResult(v[0])) return v;
      }
    }
    return [];
  }
  if (typeof data === "object") {
    if (Array.isArray(data.results))       return data.results;
    if (Array.isArray(data.data))          return data.data;
    if (Array.isArray(data.emails))        return data.emails;
    if (Array.isArray(data.verifications)) return data.verifications;
    if (Array.isArray(data.items))         return data.items;
    if (data.output !== undefined) return unwrapVerificationList(data.output, depth + 1);
    if (data.json   !== undefined) return unwrapVerificationList(data.json,   depth + 1);
    if (data.body   !== undefined) return unwrapVerificationList(data.body,   depth + 1);
    for (const v of Object.values(data)) {
      if (Array.isArray(v) && v.length > 0 && looksLikeResult(v[0])) return v;
    }
  }
  return [];
}

// Sanitizador de placeholders LLM ("string", "null", "—"…)
const PLACEHOLDERS = new Set(["", "string", "null", "undefined", "n/a", "na", "none", "-", "—"]);
function cleanStr(v) {
  if (v == null) return "";
  const s = String(v).trim();
  if (PLACEHOLDERS.has(s.toLowerCase())) return "";
  return s;
}

function normalizeResult(item) {
  const email     = cleanStr(item.email);
  const estadoRaw = cleanStr(item.estado ?? item.status ?? item.result);
  const subEstado = cleanStr(item.sub_estado ?? item.sub_status ?? item.reason ?? item.sub_state);
  return {
    email,
    estado:     estadoRaw || "desconocido",
    sub_estado: subEstado,
    status:     normalizeStatus(estadoRaw),
  };
}

function StatusBadge({ status, estadoLabel }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.unknown;
  const label = estadoLabel || cfg.label;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      {label}
    </span>
  );
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s?.trim() ?? "");

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function EmailModule() {
  const { webhooks } = useApp();
  const [activeTab, setActiveTab] = useState("generator"); // "generator" | "verificator"

  // ── Generator state ──────────────────────────────────────
  const [nombre,    setNombre]    = useState("");
  const [apellido1, setApellido1] = useState("");
  const [apellido2, setApellido2] = useState("");
  const [dominio,   setDominio]   = useState("");
  const [copied,    setCopied]    = useState(null);

  const combos = buildCombinations(nombre, apellido1, apellido2, dominio);

  const copyAll = () => {
    navigator.clipboard.writeText(combos.map(c => c.email).join("\n")).catch(() => {});
    setCopied("all"); setTimeout(() => setCopied(null), 1500);
  };
  const copySingle = (email, idx) => {
    navigator.clipboard.writeText(email).catch(() => {});
    setCopied(idx); setTimeout(() => setCopied(null), 1500);
  };
  const downloadCsv = () => {
    const rows = [["#", "email", "formula", "probabilidad"]];
    combos.forEach((c, i) => rows.push([i + 1, c.email, c.formula, c.prob + "%"]));
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `emails_${normalize(nombre)}_${normalize(apellido1)}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const downloadJson = () => {
    const data = combos.map((c, i) => ({ orden: i + 1, email: c.email, formula: c.formula, probabilidad: c.prob }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `emails_${normalize(nombre)}_${normalize(apellido1)}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const sendToVerificator = () => setActiveTab("verificator");

  // ── Verificator state ─────────────────────────────────────
  const verInputRef = useRef();
  const [manualEmails, setManualEmails] = useState("");
  const [csvEmails,    setCsvEmails]    = useState([]);
  const [csvFileName,  setCsvFileName]  = useState(null);
  const [verLoading,   setVerLoading]   = useState(false);
  const [results,      setResults]      = useState(null);
  const [rawResponse,  setRawResponse]  = useState(null);
  const [verError,     setVerError]     = useState(null);
  const [verCopied,    setVerCopied]    = useState(null);

  const readCsv = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const emails = e.target.result
        .split(/\r?\n/)
        .flatMap(l => l.split(",").map(s => s.trim()))
        .filter(s => isEmail(s));
      setCsvEmails([...new Set(emails)]);
      setCsvFileName(file.name);
    };
    reader.readAsText(file, "UTF-8");
  };

  const allVerEmails = () => {
    const generated = combos.map(c => c.email);
    const manual    = manualEmails.split(/[\n,;]+/).map(s => s.trim()).filter(isEmail);
    return [...new Set([...generated, ...csvEmails, ...manual])];
  };

  const enviarVerificacion = async () => {
    const emails = allVerEmails();
    if (!emails.length) { setVerError("No hay emails para verificar."); return; }
    if (!webhooks.verification) {
      setVerError("No hay webhook de verificación configurado. Ve a Configuración → Integraciones.");
      return;
    }
    setVerLoading(true);
    setVerError(null);
    setResults(null);
    setRawResponse(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000); // 3 min
      const res = await fetch(webhooks.verification.trim(), {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "verificacion_emails",
          emails,
          total: emails.length,
          contacto: { nombre: nombre.trim(), apellido1: apellido1.trim(), dominio: dominio.trim() },
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) { setVerError(`Error HTTP ${res.status} desde el webhook.`); return; }

      const data = await res.json();
      console.log("[verification] webhook raw response →", data);
      setRawResponse(data);

      const list = unwrapVerificationList(data);
      const normalized = list.map(normalizeResult).filter(r => r.email);
      setResults(normalized);
    } catch (e) {
      setVerError(e.name === "AbortError" ? "Timeout: el webhook tardó más de 3 minutos." : `Error: ${e.message}`);
    } finally {
      setVerLoading(false);
    }
  };

  const dlVerCsv = () => {
    const blob = new Blob([["email,estado,sub_estado", ...results.map(r => `${r.email},${r.estado},${r.sub_estado}`)].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "verificacion.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const dlVerJson = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "verificacion.json"; a.click(); URL.revokeObjectURL(url);
  };
  const copyValid = () => {
    navigator.clipboard.writeText(results.filter(r => r.status === "valid").map(r => r.email).join("\n")).catch(() => {});
    setVerCopied("val"); setTimeout(() => setVerCopied(null), 1500);
  };

  const counts = results
    ? Object.fromEntries(["valid", "risky", "invalid", "unknown"].map(s => [s, results.filter(r => r.status === s).length]))
    : null;

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="px-8 py-6 max-w-3xl w-full space-y-5">

      {/* ── Module tabs ── */}
      <div className="flex border-b border-gray-200">
        {[
          { id: "generator",   label: "✉️ Generador"   },
          { id: "verificator", label: "✅ Verificador"  },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: GENERATOR
      ══════════════════════════════════════════════════════ */}
      {activeTab === "generator" && (
        <>
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Mail size={15} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-800">Datos del contacto</h2>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: "Nombre",           val: nombre,    set: setNombre,    ph: "ej. María"       },
                { label: "Primer apellido",  val: apellido1, set: setApellido1, ph: "ej. García"      },
                { label: "Segundo apellido", val: apellido2, set: setApellido2, ph: "ej. López", opt: true },
                { label: "Dominio",          val: dominio,   set: setDominio,   ph: "ej. empresa.com" },
              ].map(({ label, val, set, ph, opt }) => (
                <div key={label}>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                    {label}{opt && <span className="text-gray-300 normal-case font-normal ml-1">(opcional)</span>}
                  </label>
                  <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
              ))}
            </div>
          </section>

          {combos.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800">Combinaciones</h2>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{combos.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={sendToVerificator}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg font-medium transition-all">
                    ✅ Verificar estos emails
                  </button>
                  <button onClick={downloadJson} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                    <Download size={11} /> JSON
                  </button>
                  <button onClick={downloadCsv} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                    <Download size={11} /> CSV
                  </button>
                  <button onClick={copyAll} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                    <Copy size={11} />{copied === "all" ? "¡Copiado!" : "Copiar todos"}
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {combos.map((combo, idx) => (
                  <div key={combo.formula} className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-gray-300 font-mono w-4 shrink-0 text-right">{idx + 1}</span>
                      <p className="text-sm font-medium text-gray-800 truncate">{combo.email}</p>
                    </div>
                    <button onClick={() => copySingle(combo.email, idx)}
                      className="shrink-0 flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all px-2 py-1 rounded hover:bg-indigo-50">
                      <Copy size={11} />{copied === idx ? "✓" : "Copiar"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {combos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4"><Mail size={22} className="text-indigo-300" /></div>
              <p className="text-sm text-gray-400">Introduce nombre, apellido y dominio para generar las combinaciones.</p>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: VERIFICATOR
      ══════════════════════════════════════════════════════ */}
      {activeTab === "verificator" && (
        <>
          {/* Webhook guard */}
          {!webhooks.verification && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <Settings size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Webhook de verificación no configurado</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Configura la URL del webhook de Clearout en <strong>Configuración → Integraciones</strong> antes de verificar.
                </p>
              </div>
            </div>
          )}

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-indigo-500" />
                <h2 className="text-sm font-semibold text-gray-800">Verificar emails</h2>
                {allVerEmails().length > 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                    {allVerEmails().length} emails
                  </span>
                )}
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* Fuente 1: combos generados */}
              {combos.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <span className="text-indigo-500 text-xs">✓</span>
                  <p className="text-xs text-indigo-700">{combos.length} emails generados automáticamente incluidos</p>
                </div>
              )}

              {/* Fuente 2: CSV */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                  Subir CSV <span className="text-gray-300 normal-case font-normal">(opcional)</span>
                </label>
                <div onClick={() => verInputRef.current.click()}
                  className="border border-dashed border-gray-200 rounded-lg px-4 py-3 text-center cursor-pointer hover:border-indigo-300 hover:bg-gray-50 transition-all">
                  {csvFileName
                    ? <p className="text-xs text-indigo-600 font-medium">{csvFileName} · {csvEmails.length} emails</p>
                    : <p className="text-xs text-gray-400">Haz clic para subir un .csv con emails</p>
                  }
                  <input ref={verInputRef} type="file" accept=".csv,.txt" onChange={e => readCsv(e.target.files[0])} className="hidden" />
                </div>
                {csvFileName && (
                  <button onClick={() => { setCsvEmails([]); setCsvFileName(null); }}
                    className="text-xs text-gray-400 hover:text-red-500 mt-1.5 transition-all">
                    Quitar archivo
                  </button>
                )}
              </div>

              {/* Fuente 3: manual */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                  Añadir manualmente <span className="text-gray-300 normal-case font-normal">(separados por coma)</span>
                </label>
                <textarea value={manualEmails} onChange={e => setManualEmails(e.target.value)}
                  placeholder="email1@empresa.com, email2@empresa.com, ..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
              </div>

              {/* Webhook info + botón */}
              <div>
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed mb-3">
                  Envía al webhook configurado (Clearout vía N8N). La URL se gestiona en <strong>Configuración → Integraciones</strong>.
                </p>
                <button onClick={enviarVerificacion}
                  disabled={verLoading || !webhooks.verification || allVerEmails().length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    verLoading || !webhooks.verification || allVerEmails().length === 0
                      ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                  {verLoading
                    ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Verificando...</>
                    : <><Zap size={13} />Verificar {allVerEmails().length > 0 ? `${allVerEmails().length} emails` : "emails"}</>}
                </button>
              </div>

              {verError && <p className="text-xs text-red-500 font-mono">{verError}</p>}
            </div>
          </section>

          {/* Diagnóstico: webhook respondió 200 pero no se reconoció resultado */}
          {!verError && rawResponse && results && results.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-xs text-amber-800 space-y-2">
              <p className="font-medium">El webhook respondió 200 OK pero no se reconocieron resultados.</p>
              <p className="text-amber-700">
                Esperamos una lista de objetos con al menos <code className="bg-amber-100 px-1 rounded">email</code> y
                <code className="bg-amber-100 px-1 rounded ml-1">estado</code> (opcionalmente <code className="bg-amber-100 px-1 rounded">sub_estado</code>).
              </p>
              <details>
                <summary className="cursor-pointer hover:text-amber-900">Ver respuesta cruda</summary>
                <pre className="mt-2 bg-white border border-amber-200 rounded-lg p-3 overflow-auto max-h-64 text-[11px] text-gray-700 font-mono">
                  {JSON.stringify(rawResponse, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Results */}
          {results && results.length > 0 && (
            <>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { key: "valid",   label: "Válidos",      color: "border-emerald-200 bg-emerald-50", text: "text-emerald-700" },
                  { key: "risky",   label: "Dudosos",      color: "border-amber-200 bg-amber-50",     text: "text-amber-700"   },
                  { key: "invalid", label: "Inválidos",    color: "border-red-200 bg-red-50",         text: "text-red-700"     },
                  { key: "unknown", label: "Desconocidos", color: "border-gray-200 bg-gray-50",       text: "text-gray-600"    },
                ].map(({ key, label, color, text }) => (
                  <div key={key} className={`rounded-xl border px-4 py-3 ${color}`}>
                    <p className={`text-2xl font-bold ${text}`}>{counts[key]}</p>
                    <p className={`text-xs mt-0.5 font-medium ${text} opacity-80`}>{label}</p>
                  </div>
                ))}
              </div>
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Detalle de resultados <span className="text-gray-400 font-normal">({results.length})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    {counts.valid > 0 && (
                      <button onClick={copyValid}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all">
                        <Copy size={11} />{verCopied === "val" ? "¡Copiado!" : "Copiar válidos"}
                      </button>
                    )}
                    <button onClick={dlVerCsv} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                      <Download size={11} /> CSV
                    </button>
                    <button onClick={dlVerJson} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                      <Download size={11} /> JSON
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  <div className="px-6 py-2 grid grid-cols-12 gap-4 bg-gray-50">
                    <span className="col-span-5 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</span>
                    <span className="col-span-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</span>
                    <span className="col-span-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Sub-estado</span>
                  </div>
                  {results.map((r, i) => (
                    <div key={`${r.email}-${i}`} className="px-6 py-3 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                      <span className="col-span-5 text-sm font-mono text-gray-700 truncate" title={r.email}>{r.email}</span>
                      <span className="col-span-3"><StatusBadge status={r.status} estadoLabel={r.estado} /></span>
                      <span className="col-span-4 text-xs text-gray-500 truncate" title={r.sub_estado}>
                        {r.sub_estado || <span className="text-gray-300">—</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
