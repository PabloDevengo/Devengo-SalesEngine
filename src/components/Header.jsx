import { Tag } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Header({ title, sub, activeModule }) {
  const { productos } = useApp();
  const tags = productos.map(p => p.nombre);

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>

      {tags.length > 0 && activeModule !== "config" && (
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs text-gray-400 mr-1">Tags activos:</span>
          {tags.map(t => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">
              <Tag size={9} />{t}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
