import { useState, useEffect } from "react";
import { Zap, Copy, Send, RefreshCw, Users, List, Inbox } from "lucide-react";
import { useApp } from "../../context/AppContext";
import ContactsUploader from "../../components/ContactsUploader";
import { validateContact } from "../../utils/csvParse";

// ── Editable email card (reused by both modes) ──────────────────────────────
function EmailCard({ email, onChange, onCopy, copied }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
          Email {email.step}
        </span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-all"
        >
          <Copy size={11} />{copied ? "✓" : "Copiar"}
        </button>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">Asunto</label>
        <input
          value={email.subject}
          onChange={e => onChange("subject", e.target.value)}
          className="w-full text-sm font-medium border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">Cuerpo</label>
        <textarea
          value={email.body}
          onChange={e => onChange("body", e.target.value)}
          rows={8}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono leading-relaxed resize-none"
        />
      </div>
    </div>
  );
}

// ── Main module ─────────────────────────────────────────────────────────────
export default function CampaignModule() {
  const { productos, clientes, campaignPrompt, webhooks, addToQueue } = useApp();
  const clientesPublicos = clientes.filter(c => c.visibilidad === "publico");

  // ── Mode (rol vs lista) ──────────────────────────────────────
  const [modo,       setModo]       = useState("rol"); // "rol" | "lista"

  // ── Shared form state ─────────────────────────────────────────
  const [productoId,  setProductoId]  = useState("");
  const [angulo,      setAngulo]      = useState("");
  const [clientesRef, setClientesRef] = useState([]);
  const [numEmails,   setNumEmails]   = useState(3);

  // ── Modo "rol" state ──────────────────────────────────────────
  const [personas,     setPersonas]     = useState([]);
  const [personaInput, setPersonaInput] = useState("");
  const [dominio,      setDominio]      = useState("");

  // ── Modo "lista" state ────────────────────────────────────────
  const [contactos, setContactos] = useState([]);
  const [industria, setIndustria] = useState("");

  // ── Send state ────────────────────────────────────────────────
  const [webhookUrl, setWebhookUrl] = useState(import.meta.env.VITE_N8N_EMAILGEN_WEBHOOK || "");
  const [loading,    setLoading]    = useState(false);
  useEffect(() => { if (webhooks.emailgen) setWebhookUrl(webhooks.emailgen); }, [webhooks.emailgen]);
  const [error,    setError]    = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [copied,   setCopied]   = useState(null);

  // ── Generated output ─────────────────────────────────────────
  const [emails,          setEmails]          = useState(null); // modo rol
  const [emailsByContact, setEmailsByContact] = useState(null); // modo lista

  // ── Instantly state ──────────────────────────────────────────
  const [instantlyUrl,  setInstantlyUrl]  = useState(import.meta.env.VITE_N8N_INSTANTLY_WEBHOOK || "");
  useEffect(() => { if (webhooks.instantly) setInstantlyUrl(webhooks.instantly); }, [webhooks.instantly]);
  const [uploading,    setUploading]    = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError,  setUploadError]  = useState(null);
  const [queueToast,   setQueueToast]   = useState(null);
  const showToast = (msg) => { setQueueToast(msg); setTimeout(() => setQueueToast(null), 2200); };

  const addListaToInstantlyQueue = () => {
    if (!emailsByContact || emailsByContact.length === 0) return;
    const payloads = emailsByContact
      .filter(g => g.contacto?.email)
      .map(g => ({
        contacto: {
          nombre:    g.contacto.nombre    ?? "",
          apellidos: g.contacto.apellidos ?? "",
          email:     g.contacto.email,
          empresa:   g.contacto.empresa   ?? "",
          dominio:   g.contacto.dominio   ?? "",
          cargo:     g.contacto.cargo     ?? "",
        },
        emails: g.emails.map(e => ({ step: e.step, subject: e.subject, body: e.body })),
        __source: "campaign",
      }));
    if (payloads.length === 0) return;
    const { added, duplicates } = addToQueue("instantly", payloads);
    showToast(`✓ ${added} añadidos · ${duplicates} duplicados · Instantly`);
  };

  // ── Personas multi-input (modo rol) ──────────────────────────
  const addPersona    = () => {
    const val = personaInput.trim();
    if (val && !personas.includes(val)) setPersonas(p => [...p, val]);
    setPersonaInput("");
  };
  const removePersona = (p) => setPersonas(ps => ps.filter(x => x !== p));
  const handlePersonaKey = (e) => { if (e.key === "Enter") { e.preventDefault(); addPersona(); } };

  // ── Clientes referencia toggle ────────────────────────────────
  const toggleCliente = (nombre) => setClientesRef(cs =>
    cs.includes(nombre) ? cs.filter(x => x !== nombre) : [...cs, nombre]
  );

  // ── Payload builder ──────────────────────────────────────────
  const productoObj = productos.find(p => String(p.id) === String(productoId)) || null;

  const buildPayload = () => {
    const base = {
      producto: productoObj
        ? { nombre: productoObj.nombre, descripcion: productoObj.descripcion || "", kvp: productoObj.kvp || [] }
        : null,
      angulo: angulo.trim(),
      clientes_referencia: clientesPublicos
        .filter(c => clientesRef.includes(c.nombre))
        .map(c => ({ nombre: c.nombre, descripcion: c.descripcion || "", testimonial: c.testimonial || "" })),
      num_emails: numEmails,
      system_prompt: campaignPrompt,
    };
    if (modo === "rol") {
      return { ...base, dominio: dominio.trim(), personas };
    }
    return {
      ...base,
      industria: industria.trim(),
      contactos: contactos.map(c => ({
        nombre:    c.nombre,
        apellidos: c.apellidos,
        cargo:     c.cargo,
        email:     c.email,
        empresa:   c.empresa,
        dominio:   c.dominio,
        linkedin:  c.linkedin,
      })),
    };
  };

  const payloadJson = JSON.stringify(buildPayload(), null, 2);

  const validContacts = contactos.filter(c => validateContact(c).length === 0).length;
  const canSend = modo === "rol"
    ? Boolean(productoObj && dominio.trim() && personas.length > 0)
    : Boolean(productoObj && validContacts > 0 && industria.trim());

  const copyJson = () => {
    navigator.clipboard.writeText(payloadJson).catch(() => {});
    setCopied("json"); setTimeout(() => setCopied(null), 1500);
  };

  // ── Send to N8N ─────────────────────────────────────────────
  const enviar = async () => {
    if (!webhookUrl.trim()) { setError("Webhook no configurado. Añade la URL en Configuración."); return; }
    setLoading(true); setError(null);
    setEmails(null); setEmailsByContact(null);
    setUploadResult(null);
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

      // Unwrap common envelopes
      const raw = Array.isArray(data) ? data : (data.contactos ?? data.emails ?? data.data ?? []);

      // Modo lista: esperamos [{contacto, emails: [...]}]
      if (modo === "lista" && raw.length && raw[0]?.emails) {
        setEmailsByContact(raw.map(g => ({
          contacto: g.contacto ?? g.contact ?? {},
          emails:   g.emails.map((item, i) => ({
            step:    item.step    ?? i + 1,
            subject: item.subject ?? item.asunto ?? "",
            body:    item.body    ?? item.cuerpo  ?? "",
          })),
        })));
      } else {
        // Modo rol (o fallback): array plano de emails
        setEmails(raw.map((item, i) => ({
          step:    item.step    ?? i + 1,
          subject: item.subject ?? item.asunto ?? "",
          body:    item.body    ?? item.cuerpo  ?? "",
        })));
      }
    } catch (e) {
      setError(e.name === "AbortError" ? "Timeout: N8N tardó más de 2 minutos." : `Error de red: ${e.message}`);
    } finally { setLoading(false); }
  };

  // ── Edit helpers ────────────────────────────────────────────
  const updateEmail = (idx, field, value) =>
    setEmails(es => es.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  const updateGroupedEmail = (groupIdx, emailIdx, field, value) =>
    setEmailsByContact(gs => gs.map((g, i) =>
      i === groupIdx ? { ...g, emails: g.emails.map((e, j) => j === emailIdx ? { ...e, [field]: value } : e) } : g
    ));

  // ── Copy helpers ────────────────────────────────────────────
  const copyEmail = (idx) => {
    const e = emails[idx];
    navigator.clipboard.writeText(`Asunto: ${e.subject}\n\n${e.body}`).catch(() => {});
    setCopied(`r-${idx}`); setTimeout(() => setCopied(null), 1500);
  };
  const copyGroupedEmail = (gIdx, eIdx) => {
    const e = emailsByContact[gIdx].emails[eIdx];
    navigator.clipboard.writeText(`Asunto: ${e.subject}\n\n${e.body}`).catch(() => {});
    setCopied(`g-${gIdx}-${eIdx}`); setTimeout(() => setCopied(null), 1500);
  };
  const copyAll = () => {
    let text;
    if (emails) {
      text = emails.map(e => `--- EMAIL ${e.step} ---\nAsunto: ${e.subject}\n\n${e.body}`).join("\n\n");
    } else if (emailsByContact) {
      text = emailsByContact.map(g => {
        const who = [g.contacto.nombre, g.contacto.apellidos].filter(Boolean).join(" ") || g.contacto.email || "Contacto";
        const block = g.emails.map(e => `--- EMAIL ${e.step} ---\nAsunto: ${e.subject}\n\n${e.body}`).join("\n\n");
        return `════════════════\n${who} · ${g.contacto.email ?? ""}\n════════════════\n\n${block}`;
      }).join("\n\n\n");
    }
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied("all"); setTimeout(() => setCopied(null), 1500);
  };

  // ── Upload to Instantly ─────────────────────────────────────
  const subirInstantly = async () => {
    if (!instantlyUrl.trim()) { setUploadError("Webhook de Instantly no configurado."); return; }
    setUploading(true); setUploadError(null); setUploadResult(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const body = modo === "rol"
        ? {
            dominio:  dominio.trim(),
            personas,
            producto: productoObj?.nombre ?? "",
            emails:   emails.map(e => ({ step: e.step, subject: e.subject, body: e.body })),
          }
        : {
            industria: industria.trim(),
            producto:  productoObj?.nombre ?? "",
            contactos: emailsByContact.map(g => ({ contacto: g.contacto, emails: g.emails })),
          };

      const res = await fetch(instantlyUrl.trim(), {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      clearTimeout(timeout);
      if (!res.ok) { setUploadError(`Error HTTP ${res.status} desde N8N/Instantly.`); return; }
      setUploadResult({ ok: true, message: "¡Campaña creada en Instantly!" });
    } catch (e) {
      setUploadError(e.name === "AbortError" ? "Timeout al conectar con Instantly." : `Error: ${e.message}`);
    } finally { setUploading(false); }
  };

  // ── Helpers ─────────────────────────────────────────────────
  const missingFields = modo === "rol"
    ? [!productoObj && "producto", !dominio.trim() && "dominio", personas.length === 0 && "personas"].filter(Boolean)
    : [!productoObj && "producto", !industria.trim() && "industria", validContacts === 0 && "contactos válidos"].filter(Boolean);

  const hasResults = (emails && emails.length > 0) || (emailsByContact && emailsByContact.length > 0);

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

          {/* Mode toggle */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Modo</label>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                onClick={() => setModo("rol")}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  modo === "rol" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Users size={11} /> Por rol
              </button>
              <button
                onClick={() => setModo("lista")}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  modo === "lista" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List size={11} /> Por lista de contactos
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {modo === "rol"
                ? "Una secuencia única para un dominio + roles de destinatario."
                : "Una secuencia personalizada por cada contacto del CSV."}
            </p>
          </div>

          {/* Producto (shared) */}
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

          {/* ── Modo "rol" fields ── */}
          {modo === "rol" && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Dominio de la empresa</label>
                <input value={dominio} onChange={e => setDominio(e.target.value)}
                  placeholder="ej. empresa.com"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>

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
            </>
          )}

          {/* ── Modo "lista" fields ── */}
          {modo === "lista" && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Industria</label>
                <input
                  value={industria}
                  onChange={e => setIndustria(e.target.value)}
                  placeholder="ej. SaaS B2B · Fintech · Marketplaces"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                  Contactos <span className="text-gray-300 normal-case font-normal">(CSV)</span>
                </label>
                <ContactsUploader contacts={contactos} onChange={setContactos} />
              </div>
            </>
          )}

          {/* Ángulo (shared) */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
              Ángulo <span className="text-gray-300 normal-case font-normal">(texto libre)</span>
            </label>
            <textarea value={angulo} onChange={e => setAngulo(e.target.value)}
              rows={3}
              placeholder={modo === "rol"
                ? "ej. Están creciendo rápido y necesitan automatizar pagos instantáneos..."
                : "ej. Ayudamos a empresas de su industria a automatizar pagos instantáneos..."}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
          </div>

          {/* Clientes de referencia (shared) */}
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

          {/* Nº de emails (shared) */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Número de emails por secuencia</label>
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

      {/* ── Section 2: Payload + send ── */}
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
          {!canSend && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Faltan campos: {missingFields.join(", ")}
            </p>
          )}
          <button onClick={enviar} disabled={loading || !canSend}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              loading ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
              : !canSend ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
            {loading
              ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  {modo === "lista" ? `Generando secuencias para ${validContacts} contacto${validContacts !== 1 ? "s" : ""}...` : "Generando emails..."}
                </>
              : <><Zap size={13} />
                  {modo === "lista"
                    ? `Generar ${numEmails} email${numEmails > 1 ? "s" : ""} × ${validContacts} contacto${validContacts !== 1 ? "s" : ""}`
                    : `Generar ${numEmails} email${numEmails > 1 ? "s" : ""}`}
                </>}
          </button>
        </div>
      </section>

      {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-xs text-red-600 font-mono">{error}</div>}

      {/* ── Section 3a: Generated emails (modo rol) ── */}
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
              <div key={idx} className="px-6 py-5">
                <EmailCard
                  email={email}
                  onChange={(field, value) => updateEmail(idx, field, value)}
                  onCopy={() => copyEmail(idx)}
                  copied={copied === `r-${idx}`}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 3b: Generated emails (modo lista, grouped) ── */}
      {emailsByContact && emailsByContact.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">Secuencias generadas</h2>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                {emailsByContact.length} contacto{emailsByContact.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyAll}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Copy size={11} />{copied === "all" ? "¡Copiado!" : "Copiar todos"}
              </button>
              <button onClick={() => { setEmailsByContact(null); setUploadResult(null); enviar(); }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <RefreshCw size={11} /> Regenerar
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {emailsByContact.map((group, gIdx) => {
              const who = [group.contacto.nombre, group.contacto.apellidos].filter(Boolean).join(" ") || group.contacto.email || "Contacto";
              return (
                <details key={gIdx} className="group" open={gIdx === 0}>
                  <summary className="px-6 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-300 group-open:rotate-90 transition-transform">▶</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{who}</p>
                        <p className="text-xs text-gray-400">
                          {group.contacto.email}
                          {group.contacto.empresa && ` · ${group.contacto.empresa}`}
                          {group.contacto.cargo && ` · ${group.contacto.cargo}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                      {group.emails.length} email{group.emails.length !== 1 ? "s" : ""}
                    </span>
                  </summary>
                  <div className="px-6 pb-5 pt-1 space-y-5 bg-gray-50/50">
                    {group.emails.map((email, eIdx) => (
                      <div key={eIdx} className="bg-white rounded-lg border border-gray-100 p-4">
                        <EmailCard
                          email={email}
                          onChange={(field, value) => updateGroupedEmail(gIdx, eIdx, field, value)}
                          onCopy={() => copyGroupedEmail(gIdx, eIdx)}
                          copied={copied === `g-${gIdx}-${eIdx}`}
                        />
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Section 4: Instantly ── */}
      {hasResults && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">📤</span>
            <h2 className="text-sm font-semibold text-gray-800">Subir a Instantly</h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            <p className="text-xs text-gray-400">
              {modo === "rol"
                ? <>Envía los emails editados a N8N para crear la campaña con el dominio <strong className="text-gray-600">{dominio}</strong> y {personas.length} persona{personas.length !== 1 ? "s" : ""}.</>
                : <>Envía las {emailsByContact?.length} secuencia{emailsByContact?.length !== 1 ? "s" : ""} personalizada{emailsByContact?.length !== 1 ? "s" : ""} a N8N para crear la campaña en Instantly con la industria <strong className="text-gray-600">{industria}</strong>.</>}
            </p>
            {uploadResult?.ok && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-xs text-emerald-700 font-medium">
                ✅ {uploadResult.message}
              </div>
            )}
            {uploadError && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-xs text-red-600 font-mono">{uploadError}</div>
            )}
            <div className="flex gap-2">
              <button onClick={subirInstantly} disabled={uploading || !instantlyUrl.trim()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  uploading ? "bg-emerald-100 text-emerald-400 cursor-not-allowed"
                  : !instantlyUrl.trim() ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
                {uploading
                  ? <><span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />Subiendo a Instantly...</>
                  : <><Send size={13} />Subir a Instantly</>}
              </button>
              {modo === "lista" && emailsByContact && emailsByContact.length > 0 && (
                <button onClick={addListaToInstantlyQueue} disabled={uploading}
                  title="Añadir estas secuencias a la cola de Instantly para subirlas más tarde en lote"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Inbox size={13} />
                  + Cola
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {queueToast && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg z-50">
          {queueToast}
        </div>
      )}

    </div>
  );
}
