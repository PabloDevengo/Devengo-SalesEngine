import { useState } from "react";
import { useApp } from "../../context/AppContext";
import PromptEditor from "../../components/PromptEditor";
import { changePin, createPin } from "../../services/authService";

// ── Change PIN section ──────────────────────────────────────────────────────
function PinSection() {
  const [current, setCurrent]   = useState("");
  const [next1,   setNext1]     = useState("");
  const [next2,   setNext2]     = useState("");
  const [msg,     setMsg]       = useState(null); // { ok, text }
  const [saving,  setSaving]    = useState(false);

  async function handleSave() {
    if (!next1 || next1.length < 4) {
      setMsg({ ok: false, text: "El nuevo PIN debe tener al menos 4 dígitos." });
      return;
    }
    if (next1 !== next2) {
      setMsg({ ok: false, text: "Los PINs nuevos no coinciden." });
      return;
    }
    setSaving(true);
    setMsg(null);
    const ok = await changePin(current, next1);
    setSaving(false);
    if (ok) {
      setMsg({ ok: true, text: "PIN actualizado correctamente." });
      setCurrent(""); setNext1(""); setNext2("");
    } else {
      setMsg({ ok: false, text: "PIN actual incorrecto." });
    }
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 font-mono tracking-widest";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4 max-w-sm">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Cambiar PIN de acceso</h3>
        <p className="text-xs text-gray-400 mt-0.5">El PIN es compartido por todo el equipo.</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">PIN actual</label>
          <input
            type="password" inputMode="numeric" maxLength={10}
            value={current} onChange={e => setCurrent(e.target.value.replace(/\D/g, ""))}
            placeholder="••••" className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">Nuevo PIN</label>
          <input
            type="password" inputMode="numeric" maxLength={10}
            value={next1} onChange={e => setNext1(e.target.value.replace(/\D/g, ""))}
            placeholder="••••" className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">Confirmar nuevo PIN</label>
          <input
            type="password" inputMode="numeric" maxLength={10}
            value={next2} onChange={e => setNext2(e.target.value.replace(/\D/g, ""))}
            placeholder="••••" className={inputCls} />
        </div>
      </div>

      {msg && (
        <p className={`text-xs font-medium ${msg.ok ? "text-green-600" : "text-red-500"}`}>
          {msg.text}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !current || !next1 || !next2}
        className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors">
        {saving ? "Guardando…" : "Guardar nuevo PIN"}
      </button>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ConfigModule() {
  const {
    campaignPrompt, setCampaignPrompt,
    meetingPrompt,  setMeetingPrompt,
    emailPrompt,    setEmailPrompt,
    defaultCampaignPrompt,
    defaultMeetingPrompt,
    defaultEmailPrompt,
  } = useApp();

  const [activeTab, setActiveTab] = useState("campaigns");

  return (
    <div className="px-8 py-6 max-w-3xl w-full space-y-5">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          ["campaigns", "📣 Campañas"],
          ["meetings",  "🎙️ Reuniones"],
          ["emails",    "✉️ Emails"],
          ["general",   "⚙️ General"],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`text-xs px-4 py-1.5 rounded-md font-medium transition-all ${activeTab === id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {lbl}
          </button>
        ))}
      </div>

      {activeTab === "campaigns" && (
        <PromptEditor
          title="Prompt de generación de secuencias"
          description="Se envía como system message al generar cualquier campaña."
          value={campaignPrompt}
          onChange={setCampaignPrompt}
          defaultValue={defaultCampaignPrompt}
        />
      )}

      {activeTab === "meetings" && (
        <PromptEditor
          title="Prompt de análisis de reuniones"
          description="Procesa la transcripción al pulsar Analizar en el módulo de Reuniones."
          value={meetingPrompt}
          onChange={setMeetingPrompt}
          defaultValue={defaultMeetingPrompt}
        />
      )}

      {activeTab === "emails" && (
        <PromptEditor
          title="Formato de emails"
          description="Estructura y plantilla base para el Email Generator."
          value={emailPrompt}
          onChange={setEmailPrompt}
          defaultValue={defaultEmailPrompt}
        />
      )}

      {activeTab === "general" && (
        <div className="space-y-6">
          <PinSection />
        </div>
      )}
    </div>
  );
}
