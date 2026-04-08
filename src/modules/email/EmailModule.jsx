import { useState } from "react";
import { Mail, Copy, Download } from "lucide-react";
import { normalize, buildCombinations } from "../../utils/emailUtils";

export default function EmailModule() {
  const [nombre,    setNombre]    = useState("");
  const [apellido1, setApellido1] = useState("");
  const [apellido2, setApellido2] = useState("");
  const [dominio,   setDominio]   = useState("");
  const [copied,    setCopied]    = useState(null);

  // combos already sorted by probability descending
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
    a.href = url; a.download = `emails_${normalize(nombre)}_${normalize(apellido1)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const data = combos.map((c, i) => ({
      orden: i + 1,
      email: c.email,
      formula: c.formula,
      probabilidad: c.prob,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `emails_${normalize(nombre)}_${normalize(apellido1)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="px-8 py-6 max-w-3xl w-full space-y-5">

      {/* ── Formulario ── */}
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

      {/* ── Lista de combinaciones ── */}
      {combos.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">Combinaciones</h2>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{combos.length}</span>
            </div>
            <div className="flex items-center gap-2">
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

      {/* ── Empty state ── */}
      {combos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4"><Mail size={22} className="text-indigo-300" /></div>
          <p className="text-sm text-gray-400">Introduce nombre, apellido y dominio para generar las combinaciones.</p>
        </div>
      )}
    </div>
  );
}
