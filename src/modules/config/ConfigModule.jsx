import { useState } from "react";
import { useApp } from "../../context/AppContext";
import PromptEditor from "../../components/PromptEditor";

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
        {[["campaigns", "📣 Campañas"], ["meetings", "🎙️ Reuniones"], ["emails", "✉️ Emails"], ["general", "⚙️ General"]].map(([id, lbl]) => (
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-2xl">⚙️</div>
          <p className="text-sm text-gray-400">Ajustes generales · próximamente.</p>
        </div>
      )}
    </div>
  );
}
