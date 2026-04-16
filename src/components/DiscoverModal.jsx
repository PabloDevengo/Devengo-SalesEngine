import { useState, useEffect } from "react";
import { X, Search, ChevronDown, ChevronRight, Plus, Check, AlertCircle, Loader2 } from "lucide-react";
import { saveCompanies } from "../services/prospectsService";

// ── Results table ────────────────────────────────────────────────────────────
function CompanyRow({ company, tipo, added, onAdd }) {
  const domain = company.domain ?? company.web ?? "";
  const name   = company.name  ?? company.nombre ?? domain;
  const industries = Array.isArray(company.industries)
    ? company.industries.join(", ")
    : (company.industries ?? "");
  const country = Array.isArray(company.countries)
    ? company.countries[0]
    : (company.countries ?? "");
  const isAdded = added.has(domain || name);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800">{name}</span>
          {domain && (
            <a
              href={domain.startsWith("http") ? domain : `https://${domain}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-500 hover:underline truncate max-w-[200px]"
            >
              {domain}
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px]">
        <span className="line-clamp-2">{industries}</span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{country}</td>
      <td className="px-4 py-3 text-right">
        {tipo === "competidor" ? (
          <button
            onClick={() => onAdd(company)}
            disabled={isAdded}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
              isAdded
                ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
                : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {isAdded ? <Check size={10} /> : <Plus size={10} />}
            {isAdded ? "Añadido" : "Añadir competidor"}
          </button>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
    </tr>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────
export default function DiscoverModal({ seed, onClose, onAddCompetidor }) {
  const { tipo, data } = seed;
  const seedName = data.nombre ?? data.name ?? "";

  const [webhookUrl,  setWebhookUrl]  = useState(import.meta.env.VITE_N8N_LOOKALIKE_WEBHOOK || "");
  const [numResults,  setNumResults]  = useState(20);
  const [loading,     setLoading]     = useState(false);
  const [results,     setResults]     = useState(null);
  const [error,       setError]       = useState(null);
  const [added,       setAdded]       = useState(new Set());
  const [showConfig,  setShowConfig]  = useState(false);

  // ── Auto-launch on open ───────────────────────────────────────────────────
  useEffect(() => {
    buscar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build payload ─────────────────────────────────────────────────────────
  function buildPayload() {
    if (tipo === "cliente") {
      return {
        tipo: "lookalike_cliente",
        seed: {
          nombre:     data.nombre     ?? "",
          web:        data.web        ?? "",
          industria:  data.industria  ?? "",
          productos:  data.productos  ?? [],
        },
        num_resultados: numResults,
      };
    }
    return {
      tipo: "lookalike_competidor",
      seed: {
        nombre:     data.nombre    ?? "",
        web:        data.web       ?? "",
        producto:   data.producto  ?? "",
        geografias: data.geografias ?? [],
      },
      num_resultados: numResults,
    };
  }

  // ── Search ────────────────────────────────────────────────────────────────
  async function buscar() {
    if (!webhookUrl) {
      setError("Configura la URL del webhook en la sección avanzada.");
      setShowConfig(true);
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    setAdded(new Set());

    try {
      const payload = buildPayload();
      const res = await fetch(webhookUrl, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
        signal:  AbortSignal.timeout(90_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const root = Array.isArray(raw) ? raw[0] : raw;
      const companies = root?.companies ?? root?.results ?? [];
      setResults(companies);
      // Auto-save to Supabase in background
      if (companies.length) saveCompanies(companies).catch(console.error);
    } catch (e) {
      setError(e.name === "TimeoutError" ? "La búsqueda tardó demasiado. Inténtalo de nuevo." : e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Add competitor handler ────────────────────────────────────────────────
  function handleAdd(company) {
    const key = company.domain ?? company.web ?? company.name ?? company.nombre;
    setAdded(prev => new Set([...prev, key]));
    onAddCompetidor(company);
  }

  // ── Backdrop close ────────────────────────────────────────────────────────
  function onBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const label = tipo === "cliente" ? "cliente" : "competidor";
  const accentColor = tipo === "cliente" ? "indigo" : "violet";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-${accentColor}-50`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl bg-${accentColor}-600 flex items-center justify-center`}>
              <Search size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Empresas similares a <span className={`text-${accentColor}-600`}>{seedName}</span>
              </p>
              <p className="text-xs text-gray-400">
                Búsqueda lookalike basada en {label}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-white">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className={`text-${accentColor}-500 animate-spin`} />
              <p className="text-sm text-gray-400">Buscando empresas similares…</p>
              <p className="text-xs text-gray-300">Puede tardar hasta 30 segundos</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Error en la búsqueda</p>
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {!loading && results && (
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {results.length} empresa{results.length !== 1 ? "s" : ""} encontrada{results.length !== 1 ? "s" : ""}
                </p>
                {tipo === "cliente" && (
                  <button
                    disabled
                    title="Próximamente"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed"
                  >
                    🚀 Generar campaña
                  </button>
                )}
              </div>

              {results.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-gray-400">No se encontraron empresas similares.</p>
                  <p className="text-xs text-gray-300 mt-1">Prueba a cambiar los parámetros en Configuración avanzada.</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Empresa</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Industria</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">País</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 text-right">
                          {tipo === "competidor" ? "Acción" : ""}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((company, i) => (
                        <CompanyRow
                          key={company.domain ?? company.web ?? i}
                          company={company}
                          tipo={tipo}
                          added={added}
                          onAdd={handleAdd}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Advanced config (collapsible) */}
        <div className="border-t border-gray-100 px-6 py-3">
          <button
            onClick={() => setShowConfig(v => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfig ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Configuración avanzada
          </button>

          {showConfig && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">URL del webhook (N8N)</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://n8n.tudominio.com/webhook/..."
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Número de resultados</label>
                <div className="flex gap-1.5">
                  {[10, 20, 50, 100].map(n => (
                    <button
                      key={n}
                      onClick={() => setNumResults(n)}
                      className={`text-xs px-3 py-1 rounded-lg border transition-all ${
                        numResults === n
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={buscar}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                <Search size={11} /> Relanzar búsqueda
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
