import { useState, useRef, useEffect } from "react";
import { Upload, Zap, Copy, Download, X, CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";

// ── Status config ─────────────────────────────────────────
const STATUS_CFG = {
  deliverable:   { label: "Entregable",    bg: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", Icon: CheckCircle   },
  risky:         { label: "Arriesgado",    bg: "bg-amber-100 text-amber-700 border border-amber-200",       dot: "bg-amber-500",   Icon: AlertTriangle  },
  undeliverable: { label: "No entregable", bg: "bg-red-100 text-red-700 border border-red-200",             dot: "bg-red-500",     Icon: XCircle        },
  unknown:       { label: "Desconocido",   bg: "bg-gray-100 text-gray-500 border border-gray-200",          dot: "bg-gray-400",    Icon: HelpCircle     },
};

// ── CSV helpers ───────────────────────────────────────────
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const delim = [",", ";", "\t"].find(d => lines[0].includes(d)) || ",";
  const clean  = (s) => s.trim().replace(/^["']|["']$/g, "");
  const headers = lines[0].split(delim).map(clean);
  const rows    = lines.slice(1).map(line =>
    Object.fromEntries(headers.map((h, i) => [h, clean(line.split(delim)[i] ?? "")]))
  );
  return { headers, rows };
}

function detectEmailCol(headers) {
  return headers.find(h => /^(e?mail|correo)$/i.test(h.trim())) ?? null;
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s?.trim() ?? "");

// ── StatusBadge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.unknown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      {cfg.label}
    </span>
  );
}

// ═════════════════════════════════════════════════════════
export default function VerificationModule() {
  const { webhooks, setWebhook } = useApp();
  const fileRef = useRef();

  // ── Input mode ──
  const [inputTab,    setInputTab]    = useState("paste"); // "paste" | "csv"
  const [pasteText,   setPasteText]   = useState("");
  const [csvHeaders,  setCsvHeaders]  = useState([]);
  const [csvRows,     setCsvRows]     = useState([]);
  const [emailCol,    setEmailCol]    = useState("");
  const [csvFileName, setCsvFileName] = useState(null);
  const [emails,      setEmails]      = useState([]); // confirmed list

  // ── API config ──
  const [apiMode,     setApiMode]     = useState("bouncer"); // "bouncer" | "n8n"
  const [bouncerKey,  setBouncerKey]  = useState(import.meta.env.VITE_BOUNCER_API_KEY || "");
  const [webhookUrl,  setWebhookUrl]  = useState(import.meta.env.VITE_N8N_VERIFICATION_WEBHOOK || "");
  useEffect(() => { if (webhooks.verification) setWebhookUrl(webhooks.verification); }, [webhooks.verification]);

  // ── Verification state ──
  const [verifying,   setVerifying]   = useState(false);
  const [progress,    setProgress]    = useState(0); // 0–100
  const [results,     setResults]     = useState(null); // array of result objects
  const [error,       setError]       = useState(null);

  // ── Load emails from paste ────────────────────────────
  const loadFromPaste = () => {
    const list = pasteText
      .split(/[\n,;]+/)
      .map(s => s.trim().toLowerCase())
      .filter(isEmail);
    const unique = [...new Set(list)];
    setEmails(unique);
    setResults(null);
    setError(null);
  };

  // ── Load CSV ─────────────────────────────────────────
  const onCsvFile = (file) => {
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCsv(e.target.result);
      setCsvHeaders(headers);
      setCsvRows(rows);
      const detected = detectEmailCol(headers);
      setEmailCol(detected || headers[0] || "");
    };
    reader.readAsText(file, "UTF-8");
  };

  const loadFromCsv = () => {
    if (!emailCol || !csvRows.length) return;
    const list = csvRows
      .map(r => r[emailCol]?.trim().toLowerCase())
      .filter(isEmail);
    const unique = [...new Set(list)];
    setEmails(unique);
    setResults(null);
    setError(null);
  };

  // ── Verify via Bouncer direct ─────────────────────────
  const verifyBouncer = async () => {
    const results = [];
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      try {
        const res = await fetch(
          `https://api.usebouncer.com/v1.1/email/verify?email=${encodeURIComponent(email)}`,
          { headers: { "x-api-key": bouncerKey } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        results.push({
          email,
          status:   data.status   ?? "unknown",
          reason:   data.reason   ?? "—",
          score:    data.score    ?? null,
          toxic:    data.toxic    ?? false,
          provider: data.provider ?? "—",
        });
      } catch (e) {
        results.push({ email, status: "unknown", reason: e.message, score: null, toxic: false, provider: "—" });
      }
      setProgress(Math.round(((i + 1) / emails.length) * 100));
    }
    return results;
  };

  // ── Verify via N8N ────────────────────────────────────
  const verifyN8N = async () => {
    setProgress(30);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const res = await fetch(webhookUrl.trim(), {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails }),
    });
    clearTimeout(timeout);
    setProgress(90);
    if (!res.ok) throw new Error(`Error HTTP ${res.status} desde N8N.`);
    const data = await res.json();
    // Accept array of results or { results: [...] }
    const list = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
    setProgress(100);
    return list.map(item => ({
      email:    item.email    ?? "",
      status:   item.status   ?? "unknown",
      reason:   item.reason   ?? "—",
      score:    item.score    ?? null,
      toxic:    item.toxic    ?? false,
      provider: item.provider ?? "—",
    }));
  };

  // ── Main verify handler ───────────────────────────────
  const verificar = async () => {
    setVerifying(true); setError(null); setResults(null); setProgress(0);
    try {
      const res = apiMode === "bouncer" ? await verifyBouncer() : await verifyN8N();
      setResults(res);
    } catch (e) {
      setError(e.name === "AbortError" ? "Timeout: la verificación tardó más de 2 minutos." : `Error: ${e.message}`);
    } finally { setVerifying(false); setProgress(0); }
  };

  const canVerify = emails.length > 0 && (apiMode === "n8n" ? webhookUrl.trim() : bouncerKey.trim());

  // ── Summary counts ────────────────────────────────────
  const counts = results
    ? Object.fromEntries(
        ["deliverable", "risky", "undeliverable", "unknown"].map(s => [s, results.filter(r => r.status === s).length])
      )
    : null;

  // ── Exports ───────────────────────────────────────────
  const downloadCsv = () => {
    const header = "email,status,reason,score,toxic,provider";
    const rows   = results.map(r => `${r.email},${r.status},${r.reason},${r.score ?? ""},${r.toxic},${r.provider}`);
    const blob   = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url    = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "verificacion.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "verificacion.json"; a.click(); URL.revokeObjectURL(url);
  };

  const copyDeliverable = () => {
    const list = results.filter(r => r.status === "deliverable").map(r => r.email).join("\n");
    navigator.clipboard.writeText(list).catch(() => {});
  };

  // ─────────────────────────────────────────────────────
  return (
    <div className="px-8 py-6 max-w-3xl w-full space-y-5">

      {/* ── Carga de emails ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="text-base">📋</span>
          <h2 className="text-sm font-semibold text-gray-800">Emails a verificar</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { id: "paste", label: "✏️ Pegar emails" },
            { id: "csv",   label: "📂 Subir CSV"    },
          ].map(tab => (
            <button key={tab.id} onClick={() => setInputTab(tab.id)}
              className={`px-5 py-3 text-xs font-medium transition-all border-b-2 -mb-px ${
                inputTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* ── Pegar emails ── */}
          {inputTab === "paste" && (
            <>
              <p className="text-xs text-gray-400">Un email por línea, o separados por coma. Los duplicados se eliminan automáticamente.</p>
              <textarea
                value={pasteText} onChange={e => setPasteText(e.target.value)}
                rows={5} placeholder={"nombre@empresa.com\notro@empresa.com\n..."}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono resize-none" />
              <button onClick={loadFromPaste} disabled={!pasteText.trim()}
                className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-all ${
                  pasteText.trim() ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                Cargar emails
              </button>
            </>
          )}

          {/* ── Subir CSV ── */}
          {inputTab === "csv" && (
            <>
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-all border-gray-200 hover:border-indigo-300 hover:bg-gray-50">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Upload size={18} className="text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {csvFileName ? csvFileName : "Arrastra o haz clic para subir un CSV"}
                </p>
                <p className="text-xs text-gray-400">Formatos: .csv · Delimitadores: coma, punto y coma, tabulador</p>
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={e => onCsvFile(e.target.files[0])} className="hidden" />
              </div>

              {csvHeaders.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Columna de email:</label>
                  <select value={emailCol} onChange={e => setEmailCol(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white flex-1">
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <button onClick={loadFromCsv}
                    className="text-xs px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all whitespace-nowrap">
                    Cargar emails
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Lista cargada ── */}
          {emails.length > 0 && (
            <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-2.5">
              <span className="text-xs font-medium text-indigo-700">
                ✅ {emails.length} emails únicos cargados
              </span>
              <button onClick={() => { setEmails([]); setResults(null); }}
                className="text-xs text-indigo-400 hover:text-red-500 flex items-center gap-1">
                <X size={11} /> Limpiar
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Configuración API ── */}
      {emails.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">🔌</span>
            <h2 className="text-sm font-semibold text-gray-800">Configuración de verificación</h2>
          </div>
          <div className="px-6 py-5 space-y-4">

            {/* Mode selector */}
            <div className="flex gap-2">
              {[
                { id: "bouncer", label: "⚡ Bouncer directo", sub: "Llama a la API de Bouncer desde el navegador" },
                { id: "n8n",     label: "🔗 Via N8N",         sub: "Envía a tu workflow de N8N" },
              ].map(m => (
                <button key={m.id} onClick={() => setApiMode(m.id)}
                  className={`flex-1 text-left px-4 py-3 rounded-lg border text-xs transition-all ${
                    apiMode === m.id ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:border-indigo-200"}`}>
                  <span className="font-semibold block mb-0.5">{m.label}</span>
                  <span className={apiMode === m.id ? "text-indigo-400" : "text-gray-400"}>{m.sub}</span>
                </button>
              ))}
            </div>

            {/* API key / webhook */}
            {apiMode === "bouncer" ? (
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                  Bouncer API Key
                  <a href="https://app.usebouncer.com/api" target="_blank" rel="noreferrer"
                    className="ml-2 normal-case font-normal text-indigo-400 hover:text-indigo-600">
                    Obtener key →
                  </a>
                </label>
                <input value={bouncerKey} onChange={e => setBouncerKey(e.target.value)}
                  type="password" placeholder="tu-api-key-de-bouncer"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
                <p className="text-xs text-gray-400 mt-1.5">
                  ⚠️ Bouncer requiere CORS habilitado en tu cuenta para llamadas desde el navegador. Si no funciona, usa el modo N8N.
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                Webhook configurado en <strong>Configuración → Integraciones</strong>.
              </p>
            )}

            {/* Progress + button */}
            {verifying && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Verificando...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button onClick={verificar} disabled={!canVerify || verifying}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !canVerify || verifying
                  ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
              {verifying
                ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Verificando {emails.length} emails...</>
                : <><Zap size={13} />Verificar {emails.length} emails</>}
            </button>
          </div>
        </section>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-xs text-red-600 font-mono">{error}</div>
      )}

      {/* ── Resultados ── */}
      {results && (
        <>
          {/* Summary cards */}
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

          {/* Results table */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Detalle de resultados</h2>
              <div className="flex items-center gap-2">
                {counts.deliverable > 0 && (
                  <button onClick={copyDeliverable}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all">
                    <Copy size={11} /> Copiar entregables
                  </button>
                )}
                <button onClick={downloadCsv}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                  <Download size={11} /> CSV
                </button>
                <button onClick={downloadJson}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                  <Download size={11} /> JSON
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {/* Header */}
              <div className="px-6 py-2 grid grid-cols-12 gap-4 bg-gray-50">
                <span className="col-span-5 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</span>
                <span className="col-span-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</span>
                <span className="col-span-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Motivo</span>
                <span className="col-span-1 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Score</span>
              </div>

              {results.map((r) => {
                const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.unknown;
                return (
                  <div key={r.email} className="px-6 py-3 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                    <span className="col-span-5 text-sm font-mono text-gray-700 truncate">{r.email}</span>
                    <span className="col-span-3"><StatusBadge status={r.status} /></span>
                    <span className="col-span-3 text-xs text-gray-400 truncate">{r.reason}</span>
                    <span className={`col-span-1 text-xs font-semibold text-right ${
                      r.score >= 80 ? "text-emerald-600" : r.score >= 50 ? "text-amber-600" : r.score != null ? "text-red-500" : "text-gray-300"
                    }`}>
                      {r.score != null ? r.score : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
