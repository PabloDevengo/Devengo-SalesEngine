import { useState } from "react";
import { Zap, Copy } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useData } from "../../utils/dataLoader";

export default function CampaignModule() {
  const { campaignPrompt } = useApp();
  const { data: angulos = {} } = useData("angulos");

  const [vertical,   setVertical]   = useState("");
  const [persona,    setPersona]    = useState("");
  const [producto,   setProducto]   = useState("pagos");
  const [angulo,     setAngulo]     = useState("");
  const [clienteRef, setClienteRef] = useState("");
  const [numEmails,  setNumEmails]  = useState(2);
  const [useRandom,  setUseRandom]  = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(import.meta.env.VITE_N8N_CAMPAIGNS_WEBHOOK || "");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [resultado,  setResultado]  = useState(null);
  const [showJson,   setShowJson]   = useState(false);
  const [activeTab,  setActiveTab]  = useState(0);
  const [copied,     setCopied]     = useState(null);

  const angulosProducto = angulos[producto] || [];

  const handleProductoChange = (p) => {
    setProducto(p);
    setAngulo((angulos[p] || [])[0] || "");
  };

  // Set initial angulo once angulos.json loads
  const currentAngulo = angulo || angulosProducto[0] || "";

  const buildPayload = () => ({
    vertical: vertical.trim(),
    persona: persona.trim(),
    producto: producto === "pagos" ? "Pagos instantáneos" : "Verificación de titularidad",
    producto_key: producto,
    angulo: currentAngulo,
    num_emails: numEmails,
    cliente_referencia: clienteRef.trim() || null,
    formato_random: useRandom,
    system_prompt: campaignPrompt,
  });

  const enviar = async () => {
    if (!vertical.trim() || !persona.trim()) return;
    if (!webhookUrl.trim()) { setError("Pega la URL del webhook de N8N para continuar."); return; }
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
      setResultado(data); setActiveTab(0);
    } catch (e) {
      setError(e.name === "AbortError" ? "Timeout: N8N tardó más de 90 segundos." : `Error de red: ${e.message}`);
    } finally { setLoading(false); }
  };

  const payloadJson = JSON.stringify(buildPayload(), null, 2);
  const copyJson  = () => { navigator.clipboard.writeText(payloadJson).catch(() => {}); setCopied("json"); setTimeout(() => setCopied(null), 1500); };
  const copyEmail = (idx) => {
    const email = resultado.emails[idx];
    navigator.clipboard.writeText(`Asunto: ${email.asunto}\n\n${email.cuerpo}`).catch(() => {});
    setCopied(idx); setTimeout(() => setCopied(null), 1500);
  };
  const copyAll = () => {
    const text = resultado.emails.map((e, i) => `--- EMAIL ${i + 1} ---\nAsunto: ${e.asunto}\n\n${e.cuerpo}`).join("\n\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied("all"); setTimeout(() => setCopied(null), 1500);
  };

  const STEP_LABELS = ["Introducción", "Follow up", "Nuevo ángulo", "Closer"];
  const STEP_COLORS = [
    "bg-indigo-50 text-indigo-700 border-indigo-100",
    "bg-blue-50 text-blue-700 border-blue-100",
    "bg-violet-50 text-violet-700 border-violet-100",
    "bg-rose-50 text-rose-700 border-rose-100",
  ];
  const canSend = vertical.trim() && persona.trim();

  return (
    <div className="px-8 py-6 max-w-3xl w-full space-y-5">
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Zap size={15} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-800">Configurar secuencia</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Vertical / Industry</label>
              <input value={vertical} onChange={e => setVertical(e.target.value)} placeholder="ej. Insurtech, Microlending..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Persona</label>
              <input value={persona} onChange={e => setPersona(e.target.value)} placeholder="ej. COO, CFO, Head of Payments..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Producto</label>
              <div className="flex gap-2">
                {[["pagos", "Pagos"], ["verificacion", "Verificación"]].map(([val, lbl]) => (
                  <button key={val} onClick={() => handleProductoChange(val)}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-all font-medium ${producto === val ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Ángulo</label>
              <select value={currentAngulo} onChange={e => setAngulo(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                {angulosProducto.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Número de emails</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setNumEmails(n)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${numEmails === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"}`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {numEmails === 1 && "Solo introducción"}
                {numEmails === 2 && "Intro + follow up"}
                {numEmails === 3 && "Intro + follow up + nuevo ángulo"}
                {numEmails === 4 && "Secuencia completa"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                Cliente referencia <span className="text-gray-300 normal-case font-normal">(opcional)</span>
              </label>
              <input value={clienteRef} onChange={e => setClienteRef(e.target.value)} placeholder="ej. Barkibu, Mutualidad..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <div onClick={() => setUseRandom(r => !r)}
                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer ${useRandom ? "bg-indigo-600" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useRandom ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-600 cursor-pointer" onClick={() => setUseRandom(r => !r)}>
                Formato RANDOM <span className="text-xs text-gray-400">(Instantly)</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {canSend && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">JSON payload</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">listo para N8N</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowJson(s => !s)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
                {showJson ? "Ocultar" : "Ver JSON"}
              </button>
              <button onClick={copyJson} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Copy size={11} />{copied === "json" ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
          {showJson && <pre className="px-6 py-4 text-xs font-mono text-gray-600 bg-gray-50 overflow-x-auto leading-relaxed">{payloadJson}</pre>}
          <div className="px-6 py-4 border-t border-gray-100 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                Webhook URL <span className="text-gray-300 normal-case font-normal">(N8N)</span>
              </label>
              <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://tu-n8n.com/webhook/..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
            </div>
            <button onClick={enviar} disabled={loading || !webhookUrl.trim()}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                loading ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                : !webhookUrl.trim() ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
              {loading
                ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Enviando a N8N...</>
                : <><Zap size={13} />{webhookUrl.trim() ? "Enviar a N8N" : "Pega la URL del webhook para enviar"}</>}
            </button>
          </div>
        </section>
      )}

      {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-xs text-red-600 font-mono">{error}</div>}

      {resultado && resultado.emails && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Plantilla generada</p>
              <p className="text-sm font-semibold text-gray-800">{resultado.titulo}</p>
            </div>
            <button onClick={copyAll} className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
              <Copy size={11} />{copied === "all" ? "¡Copiado!" : "Copiar todo"}
            </button>
          </div>
          <div className="flex border-b border-gray-100">
            {resultado.emails.map((_, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`flex-1 px-4 py-3 text-xs font-medium transition-all border-b-2 ${activeTab === i ? "border-indigo-500 text-indigo-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                <span className={`inline-block px-2 py-0.5 rounded-full border text-xs mr-1.5 ${STEP_COLORS[i]}`}>{i + 1}</span>
                {STEP_LABELS[i]}
              </button>
            ))}
          </div>
          {resultado.emails[activeTab] && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Asunto</span>
                  <span className="text-sm font-semibold text-gray-800">{resultado.emails[activeTab].asunto}</span>
                </div>
                <button onClick={() => copyEmail(activeTab)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                  <Copy size={11} />{copied === activeTab ? "✓ Copiado" : "Copiar email"}
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 leading-relaxed whitespace-pre-wrap border border-gray-100 font-mono text-xs text-gray-700">
                {resultado.emails[activeTab].cuerpo}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
