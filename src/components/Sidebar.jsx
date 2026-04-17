import { NAV_ITEMS } from "../constants";
import { useApp } from "../context/AppContext";

export default function Sidebar({ activeModule, setActiveModule }) {
  const { queues } = useApp();
  const pendingTotal =
    (queues?.verification?.filter(i => i.status === "pending").length ?? 0) +
    (queues?.prospecting?.filter(i => i.status === "pending").length  ?? 0) +
    (queues?.instantly?.filter(i => i.status === "pending").length    ?? 0);

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">SE</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-none">Sales Engine</p>
          <p className="text-xs text-gray-400 mt-0.5">by Devengo</p>
        </div>
      </div>

      {/* Main nav (all items except config) */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.filter(i => i.id !== "config").map(item => {
          const showBadge = item.id === "colas" && pendingTotal > 0;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                activeModule === item.id
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {showBadge && (
                <span className="ml-auto text-xs font-medium bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                  {pendingTotal}
                </span>
              )}
              {!showBadge && activeModule === item.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Config pinned to bottom */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={() => setActiveModule("config")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
            activeModule === "config"
              ? "bg-indigo-50 text-indigo-700 font-medium"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          }`}>
          <span>⚙️</span>
          <span>Configuración</span>
          {activeModule === "config" && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
          )}
        </button>
      </div>
    </aside>
  );
}
