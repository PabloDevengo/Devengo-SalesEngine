import { useState, useRef } from "react";
import { Mail, Copy, Download, Zap } from "lucide-react";
import { normalize, buildCombinations } from "../../utils/emailUtils";

// ═══════════════════════════════════════════════════════════
// VERIFICATION helpers
// ═══════════════════════════════════════════════════════════
const STATUS_CFG = {
  deliverable:   { label: "Entregable",    bg: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  risky:         { label: "Arriesgado",    bg: "bg-amber-100 text-amber-700 border border-amber-200",       dot: "bg-amber-500"   },
  undeliverable: { label: "No entregable", bg: "bg-red-100 text-red-700 border border-red-200",             dot: "bg-red-500"     },
  unknown:       { label: "Desconocido",   bg: "bg-gray-100 text-gray-500 border border-gray-200",          dot: "bg-gray-400"    },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.unknown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      {cfg.label}
    </span>
  );
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s?.trim() ?? "");

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function EmailModule() {
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

  // Send generated emails to verificator (jumps to verificator tab)
  const sendToVerificator = () => {
    setActiveTab("verificator");
  };

  // ── Verificator state ─────────────────────────────────────
  const verInputRef = useRef();
  const [verWebhook,   setVerWebhook]   = useState(import.meta.env.VITE_N8N_VERIFICATION_WEBHOOK || "");
  const [manualEmails, setManualEmails] = useState("");
  const [csvEmails,    setCsvEmails]    = useState([]);
  const [csvFileName,  setCsvFileName]  = useState(null);
  const [verLoading,   setVerLoading]   = useState(false);
  const [results,      setResults]      = useState(null);
  const [verError,     setVerError]     = useState(null);
  const [verSent,      setVerSent]      = useState(false);
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
    if (!emails.length)      { setVerError("No hay emails para verificar."); return; }
    if (!verWebhook.trim())  { setVerError("Pega la URL del webhook de N8N."); return; }
    setVerLoading(true); setVerError(null); setVerSent(false); setResults(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const res = await fetch(verWebhook.trim(), {
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
      if (!res.ok) { setVerError(`Error HTTP ${res.status} desde N8N.`); return; }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
      if (list.length > 0) {
        setResults(list.map(item => ({
          email: item.email ?? "", status: item.status ?? "unknown",
          reason: item.reason ?? "—", score: item.score ?? null,
          toxic: item.toxic ?? false, provider: item.provider ?? "—",
        })));
      }
      setVerSent(true);
    } catch(e) {
      setVerError(e.name === "AbortError" ? "Timeout: N8N tardó más de 2 minutos." : `Error: ${e.message}`);
    } finally { setVerLoading(false); }
  };

  const dlVerCsv = () => {
    const blob = new Blob([["email,status,reason,score,toxic,provider", ...results.map(r => `${r.email},${r.status},${r.reason},${r.score ?? ""},${r.toxic},${r.provider}`)].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "verificacion.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const dlVerJson = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "verificacion.json"; a.click(); URL.revokeObjectURL(url);
  };
  const copyDeliverable = () => {
    navigator.clipboard.writeText(results.filter(r => r.status === "deliverable").map(r => r.email).join("\n")).catch(() => {});
    setVerCopied("del"); setTimeout(() => setVerCopied(null), 1500);
  };

  const counts = results
    ? Object.fromEntries(["deliverable", "risky", "undeliverable", "unknown"].map(s => [s, results.filter(r => r.status === s).length]))
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

              {/* Webhook + botón */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Webhook N8N</label>
                <input value={verWebhook} onChange={e => setVerWebhook(e.target.value)}
                  placeholder="https://tu-n8n.com/webhook/..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono mb-3" />
                <button onClick={enviarVerificacion}
                  disabled={verLoading || !verWebhook.trim() || allVerEmails().length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    verLoading || !verWebhook.trim() || allVerEmails().length === 0
                      ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                  {verLoading
                    ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Verificando...</>
                    : verSent && !results
                    ? <>✓ Enviado — {allVerEmails().length} emails en verificación</>
                    : <><Zap size={13} />Verificar {allVerEmails().length > 0 ? `${allVerEmails().length} emails` : "emails"}</>}
                </button>
              </div>

              {verError && <p className="text-xs text-red-500 font-mono">{verError}</p>}
            </div>
          </section>

          {/* Results */}
          {results && (() => {
            return (
              <>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: "deliverable",   label: "Entregables",    color: "border-emerald-200 bg-emerald-50", text: "text-emerald-700" },
                    { key: "risky",         label: "Arriesgados",    color: "border-amber-200 bg-amber-50",     text: "text-amber-700"   },
                    { key: "undeliverable", label: "No entregables", color: "border-red-200 bg-red-50",         text: "text-red-700"     },
                    { key: "unknown",       label: "Desconocidos",   color: "border-gray-200 bg-gray-50",       text: "text-gray-600"    },
                  ].map(({ key, label, color, text }) => (
                    <div key={key} className={`rounded-xl border px-4 py-3 ${color}`}>
                      <p className={`text-2xl font-bold ${text}`}>{counts[key]}</p>
                      <p className={`text-xs mt-0.5 font-medium ${text} opacity-80`}>{label}</p>
                    </div>
                  ))}
                </div>
                <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-800">Detalle de resultados</h2>
                    <div className="flex items-center gap-2">
                      {counts.deliverable > 0 && (
                        <button onClick={copyDeliverable}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all">
                          <Copy size={11} />{verCopied === "del" ? "¡Copiado!" : "Copiar entregables"}
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
                      <span className="col-span-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Motivo</span>
                      <span className="col-span-1 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Score</span>
                    </div>
                    {results.map((r) => (
                      <div key={r.email} className="px-6 py-3 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                        <span className="col-span-5 text-sm font-mono text-gray-700 truncate">{r.email}</span>
                        <span className="col-span-3"><StatusBadge status={r.status} /></span>
                        <span className="col-span-3 text-xs text-gray-400 truncate">{r.reason}</span>
                        <span className={`col-span-1 text-xs font-semibold text-right ${r.score >= 80 ? "text-emerald-600" : r.score >= 50 ? "text-amber-600" : r.score != null ? "text-red-500" : "text-gray-300"}`}>
                          {r.score != null ? r.score : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
