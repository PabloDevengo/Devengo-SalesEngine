import { useState } from "react";
import { Zap, Copy, Download, ExternalLink } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useData } from "../../utils/dataLoader";

const REVENUES = ["0-1M", "1-10M", "10-50M", "50-100M", "100-500M", "500M+"];

export default function ProspectModule() {
  const { clientes } = useApp();
  const { data: geografias = [] } = useData("geografias");
  const { data: tamanos    = [] } = useData("tamanos");

  const [industries,     setIndustries]     = useState([]);
  const [industriaInput, setIndustriaInput] = useState("");
  const [geos,           setGeos]           = useState(["España"]);
  const [tamanosSel,     setTamanosSel]     = useState([]);
  const [revenues,       setRevenues]       = useState([]);
  const [lookalike,      setLookalike]      = useState("");
  const [numResults,     setNumResults]     = useState(20);
  const [webhookUrl,     setWebhookUrl]     = useState(import.meta.env.VITE_N8N_PROSPECT_WEBHOOK || "");
  const [showJson,       setShowJson]       = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [copied,         setCopied]         = useState(false);
  const [resultado,      setResultado]      = useState(null);

  const toggleGeo     = (g) => setGeos(gs => gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]);
  const toggleTamano  = (t) => setTamanosSel(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);
  const toggleRevenue = (r) => setRevenues(rs => rs.includes(r) ? rs.filter(x => x !== r) : [...rs, r]);
  const clientesPublicos = clientes.filter(c => c.visibilidad === "publico");

  const addIndustria = () => {
    const val = industriaInput.trim();
    if (val && !industries.includes(val)) setIndustries(prev => [...prev, val]);
    setIndustriaInput("");
  };
  const removeIndustria = (ind) => setIndustries(prev => prev.filter(x => x !== ind));
  const handleIndustriaKey = (e) => { if (e.key === "Enter") { e.preventDefault(); addIndustria(); } };

  const buildPayload = () => ({
    tipo: "empresa",
    industries,
    geografias: geos,
    tamanos: tamanosSel,
    revenues,
    lookalike: lookalike || null,
    lookalike_data: lookalike ? clientes.find(c => c.nombre === lookalike) || null : null,
    num_resultados: numResults,
  });

  const payloadJson = JSON.stringify(buildPayload(), null, 2);
  const canSend = industries.length > 0 || lookalike;

  const copyJson = () => { navigator.clipboard.writeText(payloadJson).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const enviar = async () => {
    if (!webhookUrl.trim()) { setError("Pega la URL del webhook de N8N."); return; }
    setLoading(true); setError(null); setResultado(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const res = await fetch(webhookUrl.trim(), {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      clearTimeout(timeout);
      if (!res.ok) { setError(`Error HTTP ${res.status} desde N8N.`); return; }
      const data = await res.json();
      // Parse response: expects [{ companies: { domains: [...] }, limit: N }]
      const domains = Array.isArray(data)
        ? (data[0]?.companies?.domains ?? [])
        : (data?.companies?.domains ?? []);
      setResultado({ domains, raw: data });
    } catch (e) {
      setError(e.name === "AbortError" ? "Timeout: N8N tardó más de 90s." : `Error de red: ${e.message}`);
    } finally { setLoading(false); }
  };

  // ── Result helpers ────────────────────────────────────────
  const domains = resultado?.domains ?? [];

  const copyDomain = (d, idx) => {
    navigator.clipboard.writeText(d).catch(() => {});
    setCopied(idx); setTimeout(() => setCopied(null), 1500);
  };
  const copyAllDomains = () => {
    navigator.clipboard.writeText(domains.join("\n")).catch(() => {});
    setCopied("all"); setTimeout(() => setCopied(null), 1500);
  };
  const downloadCsv = () => {
    const csv = ["#,dominio", ...domains.map((d, i) => `${i + 1},${d}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "prospectos.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(resultado.raw, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "prospectos.json"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="px-8 py-6 max-w-3xl w-full space-y-5">

      {/* ── Formulario ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="text-base">🔍</span>
          <h2 className="text-sm font-semibold text-gray-800">Búsqueda de empresas</h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Industrias</label>
            <div className="flex gap-2 mb-2">
              <input
                value={industriaInput}
                onChange={e => setIndustriaInput(e.target.value)}
                onKeyDown={handleIndustriaKey}
                placeholder="ej. Fintech · Enter para añadir"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button onClick={addIndustria} disabled={!industriaInput.trim()}
                className="px-3 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all font-medium">
                + Añadir
              </button>
            </div>
            {industries.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {industries.map(ind => (
                  <span key={ind} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                    {ind}
                    <button onClick={() => removeIndustria(ind)} className="ml-0.5 text-indigo-400 hover:text-indigo-700 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Revenue</label>
            <div className="flex flex-wrap gap-1.5">
              {REVENUES.map(r => (
                <button key={r} onClick={() => toggleRevenue(r)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${revenues.includes(r) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Tamaño</label>
            <div className="flex gap-2">
              {tamanos.map(({ key, label, sub }) => (
                <button key={key} onClick={() => toggleTamano(key)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${tamanosSel.includes(key) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                  <span className="block">{label}</span>
                  <span className={`text-xs font-normal ${tamanosSel.includes(key) ? "text-indigo-200" : "text-gray-400"}`}>{sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Geografía</label>
            <div className="flex flex-wrap gap-1.5">
              {geografias.map(geo => (
                <button key={geo} onClick={() => toggleGeo(geo)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${geos.includes(geo) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                  {geo}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Similar a (lookalike)</label>
              <select value={lookalike} onChange={e => setLookalike(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="">Sin referencia</option>
                {clientesPublicos.map(c => <option key={c.id} value={c.nombre}>{c.nombre}{c.industria ? ` · ${c.industria}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Nº de resultados</label>
              <div className="flex gap-1.5">
                {[10, 20, 50, 100].map(n => (
                  <button key={n} onClick={() => setNumResults(n)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${numResults === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Payload + envío ── */}
      {canSend && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">JSON payload</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">listo para N8N</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowJson(s => !s)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">{showJson ? "Ocultar" : "Ver JSON"}</button>
              <button onClick={copyJson} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Copy size={11} />{copied === true ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
          {showJson && <pre className="px-6 py-4 text-xs font-mono text-gray-600 bg-gray-50 overflow-x-auto">{payloadJson}</pre>}
          <div className="px-6 py-4 border-t border-gray-100 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Webhook URL</label>
              <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://tu-n8n.com/webhook/..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
            </div>
            <button onClick={enviar} disabled={loading || !webhookUrl.trim()}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                loading ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                : !webhookUrl.trim() ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
              {loading
                ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Buscando empresas...</>
                : <><Zap size={13} />{webhookUrl.trim() ? "Enviar a N8N" : "Pega la URL para enviar"}</>}
            </button>
          </div>
        </section>
      )}

      {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-xs text-red-600 font-mono">{error}</div>}

      {/* ── Resultados ── */}
      {resultado && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">Resultados</h2>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{domains.length} empresas</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={downloadJson} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Download size={11} /> JSON
              </button>
              <button onClick={downloadCsv} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Download size={11} /> CSV
              </button>
              <button onClick={copyAllDomains} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Copy size={11} />{copied === "all" ? "¡Copiado!" : "Copiar todos"}
              </button>
            </div>
          </div>

          {domains.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-400">N8N respondió pero no devolvió dominios.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {domains.map((domain, idx) => (
                <div key={domain} className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-gray-300 font-mono w-5 shrink-0 text-right">{idx + 1}</span>
                    <p className="text-sm font-medium text-gray-800 truncate">{domain}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <a href={`https://${domain}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">
                      <ExternalLink size={11} />
                    </a>
                    <button onClick={() => copyDomain(domain, idx)}
                      className="flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">
                      <Copy size={11} />{copied === idx ? "✓" : "Copiar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
