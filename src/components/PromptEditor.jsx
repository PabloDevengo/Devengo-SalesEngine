import { useState } from "react";
import { Save } from "lucide-react";

export default function PromptEditor({ title, description, value, onChange, defaultValue }) {
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);

  const save  = () => { onChange(draft); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const reset = () => setDraft(defaultValue);

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
            Resetear
          </button>
          <button
            onClick={save}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${saved ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
            <Save size={11} />{saved ? "¡Guardado!" : "Guardar"}
          </button>
        </div>
      </div>
      <div className="px-6 py-5">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={20}
          className="w-full text-xs font-mono border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none leading-relaxed text-gray-700"
        />
        <p className="text-xs text-gray-400 mt-2">
          {draft.length} caracteres · Los cambios no guardados no afectan a las ejecuciones.
        </p>
      </div>
    </section>
  );
}
