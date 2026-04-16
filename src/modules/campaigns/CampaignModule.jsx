import { useState, useEffect } from "react";
import { Zap, Copy, Send, RefreshCw, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function CampaignModule() {
  const { productos, clientes, campaignPrompt, webhooks, setWebhook } = useApp();
  const clientesPublicos = clientes.filter(c => c.visibilidad === "publico");

  // ── Form state ────────────────────────────────────────────
  const [productoId,    setProductoId]    = useState("");
  const [personas,      setPersonas]      = useState([]);
  const [personaInput,  setPersonaInput]  = useState("");
  const [dominio,       setDominio]       = useState("");
  const [angulo,        setAngulo]        = useState("");
  const [clientesRef,   setClientesRef]   = useState([]);
  const [numEmails,     setNumEmails]     = useState(3);

  // ── Send state ────────────────────────────────────────────
  const [webhookUrl,    setWebhookUrl]    = useState(import.meta.env.VITE_N8N_EMAILGEN_WEBHOOK || "");
  const [loading,       setLoading]       = useState(false);
  useEffect(() => { if (webhooks.emailgen) setWebhookUrl(webhooks.emailgen); }, [webhooks.emailgen]);
  const [error,         setError]         = useState(null);
  const [showJson,      setShowJson]      = useState(false);
  const [copied,        setCopied]        = useState(null);

  // ── Generated emails (editable) ──────────────────────────
  const [emails,        setEmails]        = useState(null); // null = not yet generated

  // ── Instantly state ───────────────────────────────────────
  const [instantlyUrl,  setInstantlyUrl]  = useState(import.meta.env.VITE_N8N_INSTANTLY_WEBHOOK || "");
  useEffect(() => { if (webhooks.instantly) setInstantlyUrl(webhooks.instantly); }, [webhooks.instantly]);
  const [uploading,     setUploading]     = useState(false);
  const [uploadResult,  setUploadResult]  = useState(null); // { ok, message }
  const [uploadError,   setUploadError]   = useState(null);

  // ── Personas multi-input ──────────────────────────────────
  const addPersona = () => {
    const val = personaInput.trim();
    if (val && !personas.includes(val)) setPersonas(p => [...p, val]);
    setPersonaInput("");
  };
  const removePersona = (p) => setPersonas(ps => ps.filter(x => x !== p));
  const handlePersonaKey = (e) => { if (e.key === "Enter") { e.preventDefault(); addPersona(); } };

  // ── Clientes referencia toggle ────────────────────────────
  const toggleCliente = (nombre) => setClientesRef(cs =>
    cs.includes(nombre) ? cs.filter(x => x !== nombre) : [...cs, nombre]
  );

  // ── Payload builder ───────────────────────────────────────
  const productoObj = productos.find(p => String(p.id) === String(productoId)) || null;

  const buildPayload = () => ({
    producto: productoObj
      ? { nombre: productoObj.nombre, descripcion: productoObj.descripcion || "", kvp: productoObj.kvp || [] }
      : null,
    personas,
    dominio: dominio.trim(),
    angulo: angulo.trim(),
    clientes_referencia: clientesPublicos
      .filter(c => clientesRef.includes(c.nombre))
      .map(c => ({ nombre: c.nombre, descripcion: c.descripcion || "", testimonial: c.testimonial || "" })),
    num_emails: numEmails,
    system_prompt: campaignPrompt,
  });

  const payloadJson = JSON.stringify(buildPayload(), null, 2);
  const canSend     = productoObj && dominio.trim() && personas.length > 0;

  const copyJson = () => {
    navigator.clipboard.writeText(payloadJson).catch(() => {});
    setCopied("json"); setTimeout(() => setCopied(null), 1500);
  };

  // ── Send to N8N ───────────────────────────────────────────
  const enviar = async () => {
    if (!webhookUrl.trim()) { setError("Añade la URL del webhook de N8N."); return; }
    setLoading(true); setError(null); setEmails(null); setUploadResult(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const res = await fetch(webhookUrl.trim(), {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      clearTimeout(timeout);
      if (!res.ok) { setError(`Error HTTP ${res.status} desde N8N.`); return; }
      const data = await res.json();

      // Normalise response: accept array or { emails: [...] }
      const raw = Array.isArray(data) ? data : (data.emails ?? data.data ?? []);
      const normalised = raw.map((item, i) => ({
        step:    item.step    ?? i + 1,
        subject: item.subject ?? item.asunto ?? "",
        body:    item.body    ?? item.cuerpo  ?? "",
      }));
      setEmails(normalised);
    } catch (e) {
      setError(e.name === "AbortError" ? "Timeout: N8N tardó más de 2 minutos." : `Error de red: ${e.message}`);
    } finally { setLoading(false); }
  };

  // ── Edit email inline ─────────────────────────────────────
  const updateEmail = (idx, field, value) =>
    setEmails(es => es.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  // ── Copy helpers ──────────────────────────────────────────
  const copyEmail = (idx) => {
    const e = emails[idx];
    navigator.clipboard.writeText(`Asunto: ${e.subject}\n\n${e.body}`).catch(() => {});
    setCopied(idx); setTimeout(() => setCopied(null), 1500);
  };
  const copyAll = () => {
    const text = emails.map((e, i) => `--- EMAIL ${e.step} ---\nAsunto: ${e.subject}\n\n${e.body}`).join("\n\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied("all"); setTimeout(() => setCopied(null), 1500);
  };

  // ── Upload to Instantly ───────────────────────────────────
  const subirInstantly = async () => {
    if (!instantlyUrl.trim()) { setUploadError("Añade la URL del webhook de Instantly."); return; }
    setUploading(true); setUploadError(null); setUploadResult(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch(instantlyUrl.trim(), {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dominio:  dominio.trim(),
          personas,
          producto: productoObj?.nombre ?? "",
          emails:   emails.map(e => ({ step: e.step, subject: e.subject, body: e.body })),
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) { setUploadError(`Error HTTP ${res.status} desde N8N/Instantly.`); return; }
      setUploadResult({ ok: true, message: "¡Campaña creada en Instantly!" });
    } catch (e) {
      setUploadError(e.name === "AbortError" ? "Timeout al conectar con Instantly." : `Error: ${e.message}`);
    } finally { setUploading(false); }
  };

  // ═══════════════════════════════════════════════════════════
  return (
    <div className="px-8 py-6 max-w-3xl w-full space-y-5">

      {/* ── Section 1: Form ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Zap size={15} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-800">Configurar campaña</h2>
        </div>
        <div className="px-6 py-5 space-y-5">

          {/* Producto */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Producto</label>
            {productos.length === 0 ? (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5">
                No hay productos en el Playbook. <span className="text-indigo-500 cursor-pointer hover:underline">Añade uno primero →</span>
              </p>
            ) : (
              <select value={productoId} onChange={e => setProductoId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="">Selecciona un producto...</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}{p.isMain ? " ⭐" : ""}</option>
                ))}
              </select>
            )}
          </div>

          {/* Dominio */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Dominio de la empresa</label>
            <input value={dominio} onChange={e => setDominio(e.target.value)}
              placeholder="ej. empresa.com"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>

          {/* Personas */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Personas destinatarias</label>
            <div className="flex gap-2 mb-2">
              <input
                value={personaInput}
                onChange={e => setPersonaInput(e.target.value)}
                onKeyDown={handlePersonaKey}
                placeholder="ej. CFO, Head of Finance · Enter para añadir"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button onClick={addPersona} disabled={!personaInput.trim()}
                className="px-3 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all font-medium">
                + Añadir
              </button>
            </div>
            {personas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {personas.map(p => (
                  <span key={p} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                    {p}
                    <button onClick={() => removePersona(p)} className="ml-0.5 text-indigo-400 hover:text-indigo-700 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Ángulo */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
              Ángulo <span className="text-gray-300 normal-case font-normal">(texto libre)</span>
            </label>
            <textarea value={angulo} onChange={e => setAngulo(e.target.value)}
              rows={3} placeholder="ej. Están creciendo rápido y necesitan automatizar pagos instantáneos para no perder clientes..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
          </div>

          {/* Clientes de referencia */}
          {clientesPublicos.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                Clientes de referencia <span className="text-gray-300 normal-case font-normal">(opcional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {clientesPublicos.map(c => (
                  <button key={c.nombre} onClick={() => toggleCliente(c.nombre)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      clientesRef.includes(c.nombre)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nº de emails */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Número de emails</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setNumEmails(n)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    numEmails === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 2: Payload + send (always visible) ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">JSON payload</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">listo para N8N</span>
          </div>
          {canSend && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowJson(s => !s)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
                {showJson ? "Ocultar" : "Ver JSON"}
              </button>
              <button onClick={copyJson} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Copy size={11} />{copied === "json" ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          )}
        </div>
        {showJson && canSend && <pre className="px-6 py-4 text-xs font-mono text-gray-600 bg-gray-50 overflow-x-auto leading-relaxed">{payloadJson}</pre>}
        <div className="px-6 py-4 border-t border-gray-100 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Webhook URL <span className="text-gray-300 normal-case font-normal">(N8N)</span></label>
            <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} onBlur={e => setWebhook('emailgen', e.target.value)} placeholder="https://tu-n8n.com/webhook/email-generator"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
          </div>
          {!canSend && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Faltan campos: {[!productoObj && "producto", !dominio.trim() && "dominio", personas.length === 0 && "personas"].filter(Boolean).join(", ")}
            </p>
          )}
          <button onClick={enviar} disabled={loading || !canSend}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              loading ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
              : !canSend ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
            {loading
              ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Generando emails...</>
              : <><Zap size={13} />{`Generar ${numEmails} email${numEmails > 1 ? "s" : ""}`}</>}
          </button>
        </div>
      </section>

      {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-xs text-red-600 font-mono">{error}</div>}

      {/* ── Section 3: Generated emails (editable) ── */}
      {emails && emails.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">Emails generados</h2>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{emails.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyAll}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Copy size={11} />{copied === "all" ? "¡Copiado!" : "Copiar todos"}
              </button>
              <button onClick={() => { setEmails(null); setUploadResult(null); enviar(); }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <RefreshCw size={11} /> Regenerar
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {emails.map((email, idx) => (
              <div key={idx} className="px-6 py-5 space-y-3">
                {/* Email header */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                    Email {email.step}
                  </span>
                  <button onClick={() => copyEmail(idx)}
                    className="flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-all">
                    <Copy size={11} />{copied === idx ? "✓" : "Copiar"}
                  </button>
                </div>
                {/* Subject editable */}
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">Asunto</label>
                  <input
                    value={email.subject}
                    onChange={e => updateEmail(idx, "subject", e.target.value)}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                {/* Body editable */}
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">Cuerpo</label>
                  <textarea
                    value={email.body}
                    onChange={e => updateEmail(idx, "body", e.target.value)}
                    rows={8}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono leading-relaxed resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 4: Instantly ── */}
      {emails && emails.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">📤</span>
            <h2 className="text-sm font-semibold text-gray-800">Subir a Instantly</h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            <p className="text-xs text-gray-400">
              Envía los emails editados a N8N para que cree la campaña en Instantly con el dominio <strong className="text-gray-600">{dominio}</strong> y {personas.length} persona{personas.length !== 1 ? "s" : ""}.
            </p>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Webhook N8N → Instantly</label>
              <input value={instantlyUrl} onChange={e => setInstantlyUrl(e.target.value)} onBlur={e => setWebhook('instantly', e.target.value)} placeholder="https://tu-n8n.com/webhook/instantly"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
            </div>

            {uploadResult?.ok && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-xs text-emerald-700 font-medium">
                ✅ {uploadResult.message}
              </div>
            )}
            {uploadError && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-xs text-red-600 font-mono">{uploadError}</div>
            )}

            <button onClick={subirInstantly} disabled={uploading || !instantlyUrl.trim()}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                uploading ? "bg-emerald-100 text-emerald-400 cursor-not-allowed"
                : !instantlyUrl.trim() ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
              {uploading
                ? <><span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />Subiendo a Instantly...</>
                : <><Send size={13} />Subir a Instantly</>}
            </button>
          </div>
        </section>
      )}

    </div>
  );
}
