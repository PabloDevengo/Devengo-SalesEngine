import { useState } from "react";
import {
  Trash2, Zap, CheckCircle, XCircle, Loader2, Clock,
  Inbox, Mail, Building2, Send, ChevronRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { buildPayload, postToWebhook, distributeResults } from "../../services/queuesService";

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `hace ${s}s`;
  if (s < 3600) return `hace ${Math.floor(s / 60)}m`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`;
  return `hace ${Math.floor(s / 86400)}d`;
}

const STATUS_CFG = {
  pending: { label: "Pendiente", cls: "bg-gray-100 text-gray-600 border-gray-200", Icon: Clock },
  running: { label: "En curso",  cls: "bg-indigo-50 text-indigo-600 border-indigo-200", Icon: Loader2 },
  done:    { label: "Hecho",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle },
  error:   { label: "Error",     cls: "bg-red-50 text-red-600 border-red-200", Icon: XCircle },
};

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
      <Icon size={10} className={status === "running" ? "animate-spin" : ""} />
      {cfg.label}
    </span>
  );
}

// ── Shared queue header ──────────────────────────────────────────────────────
function QueueToolbar({ counts, filter, onFilterChange, onClearProcessed, onClearAll }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
        {[
          { id: "all",       label: `Todos (${counts.total})` },
          { id: "pending",   label: `Pendientes (${counts.pending})` },
          { id: "processed", label: `Procesados (${counts.done + counts.error})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filter === f.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onClearProcessed}
          disabled={counts.done + counts.error === 0}
          className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Limpiar procesados
        </button>
        <button
          onClick={onClearAll}
          disabled={counts.total === 0}
          className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-md hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Limpiar todo
        </button>
      </div>
    </div>
  );
}

// ── Verification tab ─────────────────────────────────────────────────────────
function VerificationTab() {
  const { queues, webhooks, removeFromQueue, updateQueueItems, clearQueue } = useApp();
  const items = queues.verification ?? [];
  const [filter, setFilter] = useState("all");
  const [launchError, setLaunchError] = useState(null);
  const [launching, setLaunching] = useState(false);

  const filtered = items.filter(it =>
    filter === "all" ? true
    : filter === "pending" ? it.status === "pending"
    : filter === "processed" ? (it.status === "done" || it.status === "error")
    : true
  );
  const counts = {
    total:   items.length,
    pending: items.filter(i => i.status === "pending").length,
    done:    items.filter(i => i.status === "done").length,
    error:   items.filter(i => i.status === "error").length,
  };

  const launch = async () => {
    const pending = items.filter(i => i.status === "pending");
    if (!pending.length) return;
    if (!webhooks.verification) {
      setLaunchError("No hay webhook de verificación. Configúralo en Configuración → Integraciones.");
      return;
    }
    setLaunching(true); setLaunchError(null);

    const now = Date.now();
    updateQueueItems("verification",
      Object.fromEntries(pending.map(it => [it.id, { status: "running", launchedAt: now }]))
    );

    try {
      const payload = buildPayload("verification", pending);
      const res = await postToWebhook(webhooks.verification, payload);
      const map = distributeResults("verification", pending, res);
      const done = Date.now();
      updateQueueItems("verification",
        Object.fromEntries(pending.map(it => {
          const r = map[it.id];
          return [it.id, { status: "done", completedAt: done, result: r, error: null }];
        }))
      );
    } catch (e) {
      const done = Date.now();
      updateQueueItems("verification",
        Object.fromEntries(pending.map(it => [it.id, { status: "error", completedAt: done, error: e.message }]))
      );
      setLaunchError(`Error al lanzar: ${e.message}`);
    } finally { setLaunching(false); }
  };

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Mail size={15} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-800">Cola de verificación de emails</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <QueueToolbar
            counts={counts}
            filter={filter}
            onFilterChange={setFilter}
            onClearProcessed={() => clearQueue("verification", "processed")}
            onClearAll={() => { if (confirm("¿Vaciar la cola entera?")) clearQueue("verification", "all"); }}
          />
          <button
            onClick={launch}
            disabled={launching || counts.pending === 0}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              launching || counts.pending === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {launching
              ? <><Loader2 size={13} className="animate-spin" /> Verificando {counts.pending} email{counts.pending !== 1 ? "s" : ""}...</>
              : <><Zap size={13} /> Lanzar verificación ({counts.pending} pendiente{counts.pending !== 1 ? "s" : ""})</>}
          </button>
          {launchError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">{launchError}</p>}
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyQueue type="verification" />
      ) : (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Email</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Contacto</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Source</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Status</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Resultado</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Añadido</th>
                  <th className="px-4 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(it => (
                  <tr key={it.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 text-xs text-gray-700 font-mono">{it.payload.email}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {[it.payload.nombre, it.payload.apellidos].filter(Boolean).join(" ") || "—"}
                      {it.payload.empresa && <div className="text-xs text-gray-400">{it.payload.empresa}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 capitalize">{it.source}</td>
                    <td className="px-4 py-3"><StatusPill status={it.status} /></td>
                    <td className="px-4 py-3 text-xs">
                      {it.status === "done" && it.result ? (
                        <div>
                          <span className="font-medium text-gray-700">{it.result.status ?? "—"}</span>
                          {it.result.score != null && <span className="ml-2 text-gray-400">{it.result.score}</span>}
                        </div>
                      ) : it.status === "error" ? (
                        <span className="text-red-500">{it.error}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{timeAgo(it.addedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeFromQueue("verification", it.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Prospecting tab ──────────────────────────────────────────────────────────
function ProspectingTab() {
  const { queues, webhooks, removeFromQueue, updateQueueItems, clearQueue, addToQueue } = useApp();
  const items = queues.prospecting ?? [];
  const [filter, setFilter] = useState("all");
  const [personas, setPersonas] = useState([]);
  const [personaInput, setPersonaInput] = useState("");
  const [numResultados, setNumResultados] = useState(20);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState(null);

  const counts = {
    total:   items.length,
    pending: items.filter(i => i.status === "pending").length,
    done:    items.filter(i => i.status === "done").length,
    error:   items.filter(i => i.status === "error").length,
  };
  const filtered = items.filter(it =>
    filter === "all" ? true
    : filter === "pending" ? it.status === "pending"
    : filter === "processed" ? (it.status === "done" || it.status === "error")
    : true
  );

  const addPersona = () => {
    const v = personaInput.trim();
    if (v && !personas.includes(v)) setPersonas(p => [...p, v]);
    setPersonaInput("");
  };
  const removePersona = (p) => setPersonas(ps => ps.filter(x => x !== p));

  const launch = async () => {
    const pending = items.filter(i => i.status === "pending");
    if (!pending.length) return;
    if (!personas.length) { setLaunchError("Añade al menos un rol en 'Personas' antes de lanzar."); return; }
    if (!webhooks.contacts) { setLaunchError("No hay webhook de contactos. Configúralo en Configuración → Integraciones."); return; }
    setLaunching(true); setLaunchError(null);

    const now = Date.now();
    updateQueueItems("prospecting",
      Object.fromEntries(pending.map(it => [it.id, { status: "running", launchedAt: now }]))
    );

    try {
      const payload = buildPayload("prospecting", pending, { personas, num_resultados: numResultados });
      const res = await postToWebhook(webhooks.contacts, payload);
      const map = distributeResults("prospecting", pending, res);
      const done = Date.now();
      updateQueueItems("prospecting",
        Object.fromEntries(pending.map(it => {
          const r = map[it.id] ?? [];
          return [it.id, { status: "done", completedAt: done, result: r, error: null }];
        }))
      );
    } catch (e) {
      const done = Date.now();
      updateQueueItems("prospecting",
        Object.fromEntries(pending.map(it => [it.id, { status: "error", completedAt: done, error: e.message }]))
      );
      setLaunchError(`Error al lanzar: ${e.message}`);
    } finally { setLaunching(false); }
  };

  // Collect all contacts found across done items → push to verification queue
  const pushAllToVerification = () => {
    const contacts = items
      .filter(it => it.status === "done" && Array.isArray(it.result))
      .flatMap(it => it.result.filter(c => c.email).map(c => ({
        email: c.email,
        nombre: c.nombre, apellidos: c.apellidos, cargo: c.cargo,
        empresa: c.company_nombre, dominio: c.company_domain,
        __source: "queue:prospecting",
      })));
    if (!contacts.length) return;
    const { added, duplicates } = addToQueue("verification", contacts);
    alert(`Añadidos ${added} emails a cola de Verificación${duplicates ? ` (${duplicates} duplicados ignorados)` : ""}.`);
  };

  const totalFoundContacts = items
    .filter(it => it.status === "done" && Array.isArray(it.result))
    .reduce((acc, it) => acc + it.result.length, 0);

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={15} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-800">Cola de búsqueda de contactos por empresa</h2>
        </div>
        <div className="px-6 py-4 space-y-4">

          <QueueToolbar
            counts={counts}
            filter={filter}
            onFilterChange={setFilter}
            onClearProcessed={() => clearQueue("prospecting", "processed")}
            onClearAll={() => { if (confirm("¿Vaciar la cola entera?")) clearQueue("prospecting", "all"); }}
          />

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
              Personas / Roles a buscar <span className="text-gray-300 normal-case font-normal">(se aplica a todas las empresas de la cola)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={personaInput}
                onChange={e => setPersonaInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPersona(); } }}
                placeholder="ej. CFO, Head of Finance · Enter para añadir"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                onClick={addPersona}
                disabled={!personaInput.trim()}
                className="px-3 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all font-medium"
              >+ Añadir</button>
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

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Nº resultados por empresa</label>
            <div className="flex gap-1.5 max-w-xs">
              {[10, 20, 50, 100].map(n => (
                <button key={n} onClick={() => setNumResultados(n)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                    numResultados === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={launch}
            disabled={launching || counts.pending === 0}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              launching || counts.pending === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {launching
              ? <><Loader2 size={13} className="animate-spin" /> Buscando contactos en {counts.pending} empresa{counts.pending !== 1 ? "s" : ""}...</>
              : <><Zap size={13} /> Buscar contactos ({counts.pending} empresa{counts.pending !== 1 ? "s" : ""} pendiente{counts.pending !== 1 ? "s" : ""})</>}
          </button>
          {launchError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">{launchError}</p>}

          {totalFoundContacts > 0 && (
            <button
              onClick={pushAllToVerification}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
            >
              <ChevronRight size={13} /> Enviar los {totalFoundContacts} contactos encontrados a cola de Verificación
            </button>
          )}
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyQueue type="prospecting" />
      ) : (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Empresa</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Dominio</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Source</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Status</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Contactos encontrados</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Añadido</th>
                  <th className="px-4 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(it => (
                  <tr key={it.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 text-sm text-gray-700">{it.payload.nombre || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{it.payload.domain}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 capitalize">{it.source}</td>
                    <td className="px-4 py-3"><StatusPill status={it.status} /></td>
                    <td className="px-4 py-3 text-xs">
                      {it.status === "done" && Array.isArray(it.result)
                        ? <span className="font-medium text-gray-700">{it.result.length} contacto{it.result.length !== 1 ? "s" : ""}</span>
                        : it.status === "error"
                          ? <span className="text-red-500">{it.error}</span>
                          : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{timeAgo(it.addedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeFromQueue("prospecting", it.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Instantly tab ────────────────────────────────────────────────────────────
function InstantlyTab() {
  const { queues, webhooks, removeFromQueue, updateQueueItems, clearQueue } = useApp();
  const items = queues.instantly ?? [];
  const [filter, setFilter] = useState("all");
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState(null);
  const [expanded, setExpanded] = useState(null); // item id

  const counts = {
    total:   items.length,
    pending: items.filter(i => i.status === "pending").length,
    done:    items.filter(i => i.status === "done").length,
    error:   items.filter(i => i.status === "error").length,
  };
  const filtered = items.filter(it =>
    filter === "all" ? true
    : filter === "pending" ? it.status === "pending"
    : filter === "processed" ? (it.status === "done" || it.status === "error")
    : true
  );

  const launch = async () => {
    const pending = items.filter(i => i.status === "pending");
    if (!pending.length) return;
    if (!webhooks.instantly) {
      setLaunchError("No hay webhook de Instantly. Configúralo en Configuración → Integraciones.");
      return;
    }
    setLaunching(true); setLaunchError(null);

    const now = Date.now();
    updateQueueItems("instantly",
      Object.fromEntries(pending.map(it => [it.id, { status: "running", launchedAt: now }]))
    );

    try {
      const payload = buildPayload("instantly", pending);
      const res = await postToWebhook(webhooks.instantly, payload);
      const done = Date.now();
      updateQueueItems("instantly",
        Object.fromEntries(pending.map(it => [it.id, { status: "done", completedAt: done, result: res, error: null }]))
      );
    } catch (e) {
      const done = Date.now();
      updateQueueItems("instantly",
        Object.fromEntries(pending.map(it => [it.id, { status: "error", completedAt: done, error: e.message }]))
      );
      setLaunchError(`Error al lanzar: ${e.message}`);
    } finally { setLaunching(false); }
  };

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Send size={15} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-800">Cola de subida a Instantly</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <QueueToolbar
            counts={counts}
            filter={filter}
            onFilterChange={setFilter}
            onClearProcessed={() => clearQueue("instantly", "processed")}
            onClearAll={() => { if (confirm("¿Vaciar la cola entera?")) clearQueue("instantly", "all"); }}
          />
          <button
            onClick={launch}
            disabled={launching || counts.pending === 0}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              launching || counts.pending === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {launching
              ? <><Loader2 size={13} className="animate-spin" /> Subiendo {counts.pending} contacto{counts.pending !== 1 ? "s" : ""}...</>
              : <><Send size={13} /> Subir a Instantly ({counts.pending} pendiente{counts.pending !== 1 ? "s" : ""})</>}
          </button>
          {launchError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">{launchError}</p>}
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyQueue type="instantly" />
      ) : (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
          {filtered.map(it => {
            const c = it.payload.contacto ?? {};
            const who = [c.nombre, c.apellidos].filter(Boolean).join(" ") || c.email || "Contacto";
            const isOpen = expanded === it.id;
            return (
              <div key={it.id} className="group">
                <div className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpanded(isOpen ? null : it.id)}
                      className="text-xs text-gray-300 hover:text-gray-600"
                    >
                      <ChevronRight size={14} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{who}</p>
                      <p className="text-xs text-gray-400">
                        {c.email}
                        {c.empresa && ` · ${c.empresa}`}
                        {c.cargo && ` · ${c.cargo}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{(it.payload.emails ?? []).length} email{(it.payload.emails ?? []).length !== 1 ? "s" : ""}</span>
                    <StatusPill status={it.status} />
                    <span className="text-xs text-gray-400 capitalize hidden sm:inline">{it.source}</span>
                    <span className="text-xs text-gray-400 hidden md:inline">{timeAgo(it.addedAt)}</span>
                    <button
                      onClick={() => removeFromQueue("instantly", it.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-6 pb-4 bg-gray-50/50 space-y-3">
                    {it.status === "error" && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{it.error}</p>
                    )}
                    {(it.payload.emails ?? []).map((em, i) => (
                      <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 text-sm">
                        <div className="text-xs font-semibold text-indigo-600 mb-1">Email {em.step ?? i + 1}</div>
                        <div className="font-medium text-gray-800 mb-2">{em.subject}</div>
                        <div className="text-xs font-mono text-gray-600 whitespace-pre-wrap leading-relaxed">{em.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function EmptyQueue({ type }) {
  const hints = {
    verification: "Desde Prospección → Contactos, o desde Email Verificator, usa '+ A cola' para acumular emails aquí.",
    prospecting:  "Desde Prospección → Empresas, selecciona empresas y añádelas a la cola de búsqueda de contactos.",
    instantly:    "Desde Email Generator (modo 'Por lista'), añade las secuencias generadas a esta cola.",
  };
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
      <Inbox size={24} className="mx-auto text-gray-300 mb-2" />
      <p className="text-sm text-gray-500 font-medium">La cola está vacía</p>
      <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">{hints[type]}</p>
    </div>
  );
}

// ── Main module ──────────────────────────────────────────────────────────────
export default function ColasModule() {
  const { queues } = useApp();
  const [tab, setTab] = useState("verification");

  const tabs = [
    { id: "verification", label: "✉️ Verificación",  count: queues.verification?.filter(i => i.status === "pending").length ?? 0 },
    { id: "prospecting",  label: "🏢 Prospección",   count: queues.prospecting?.filter(i => i.status === "pending").length  ?? 0 },
    { id: "instantly",    label: "📤 Instantly",     count: queues.instantly?.filter(i => i.status === "pending").length    ?? 0 },
  ];

  return (
    <div className="px-8 py-6 max-w-6xl w-full space-y-5">
      <div className="flex border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px flex items-center gap-2 ${
              tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                tab === t.id ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "verification" && <VerificationTab />}
      {tab === "prospecting"  && <ProspectingTab />}
      {tab === "instantly"    && <InstantlyTab />}
    </div>
  );
}
