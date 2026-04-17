import { useRef, useState } from "react";
import { Trash2, Upload, X } from "lucide-react";
import { parseCsv, rowsToContacts, validateContact } from "../utils/csvParse";

// ── Contacts uploader (CSV drag & drop + preview table) ─────────────────────
export default function ContactsUploader({ contacts, onChange }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error,    setError]    = useState(null);

  const readFile = (file) => {
    setError(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Solo se admiten archivos .csv.");
      return;
    }
    const reader = new FileReader();
    reader.onload  = (e) => {
      try {
        const rows = parseCsv(e.target.result);
        const parsed = rowsToContacts(rows);
        if (!parsed.length) { setError("El archivo está vacío o no tiene datos."); return; }
        setFileName(file.name);
        onChange(parsed);
      } catch (err) {
        setError(`Error parseando CSV: ${err.message}`);
      }
    };
    reader.onerror = () => setError("Error leyendo el archivo.");
    reader.readAsText(file, "UTF-8");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    readFile(e.dataTransfer.files[0]);
  };

  const removeContact = (idx) => onChange(contacts.filter((_, i) => i !== idx));
  const clearAll      = () => { onChange([]); setFileName(null); setError(null); };

  const valid   = contacts.filter(c => validateContact(c).length === 0).length;
  const invalid = contacts.length - valid;

  // ── Empty state: drop zone ──────────────────────────────────────────────
  if (contacts.length === 0) {
    return (
      <div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          className={`border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-all ${
            dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
          }`}
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Upload size={16} className="text-indigo-500" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-0.5">Arrastra tu CSV aquí</p>
          <p className="text-xs text-gray-400">o haz clic para seleccionarlo</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={e => readFile(e.target.files[0])}
            className="hidden"
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
        <p className="text-xs text-gray-400 mt-3">
          Columnas aceptadas (case-insensitive): <span className="font-medium text-gray-500">nombre, apellidos, cargo, email, empresa, dominio, linkedin</span>
        </p>
      </div>
    );
  }

  // ── Loaded state: preview table ─────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {fileName && <span className="text-xs text-gray-500">📄 {fileName}</span>}
          <span className="text-xs text-emerald-600 font-medium">✓ {valid} válido{valid !== 1 ? "s" : ""}</span>
          {invalid > 0 && (
            <span className="text-xs text-amber-600 font-medium">⚠ {invalid} con errores</span>
          )}
        </div>
        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-all"
        >
          <X size={11} /> Quitar todo
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Nombre</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Apellidos</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Cargo</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Email</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Empresa</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Dominio</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, idx) => {
                const errs = validateContact(c);
                const isBad = (field) => errs.includes(field);
                return (
                  <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className={`px-3 py-2 ${isBad("nombre") ? "text-red-500 font-medium" : "text-gray-700"}`}>
                      {c.nombre || <span className="text-red-400 italic">falta</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{c.apellidos}</td>
                    <td className="px-3 py-2 text-gray-600">{c.cargo}</td>
                    <td className={`px-3 py-2 ${isBad("email") ? "text-red-500 font-medium" : "text-gray-700"}`}>
                      {c.email || <span className="text-red-400 italic">falta</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{c.empresa}</td>
                    <td className="px-3 py-2 text-gray-500">{c.dominio}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => removeContact(idx)}
                        title="Quitar"
                        className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
