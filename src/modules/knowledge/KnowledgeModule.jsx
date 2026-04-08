import { useState } from "react";
import {
  Building2, Globe, MapPin, Tag, Plus, Edit3, Save, X,
  ChevronDown, ChevronRight, Package, Trash2, Check,
  Layers, Star, Quote, Target, Link,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useData } from "../../utils/dataLoader";
import Field from "../../components/ui/Field";
import Input from "../../components/ui/Input";
import Val from "../../components/ui/Val";
import Empty from "../../components/ui/Empty";

// ── Section wrapper ───────────────────────────────────────
function Section({ icon, title, count, action, children }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          {count > 0 && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{count}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function KnowledgeModule() {
  const { company, setCompany, productos, setProductos, clientes, setClientes, competidores, setCompetidores } = useApp();
  const { data: geografias = [] } = useData("geografias");

  // ── Company ───────────────────────────────────────────────
  const [editingInfo, setEditingInfo] = useState(false);
  const [draft, setDraft]             = useState(company);

  const saveInfo   = () => { setCompany({ ...draft }); setEditingInfo(false); };
  const cancelEdit = () => { setDraft({ ...company }); setEditingInfo(false); };
  const toggleGeo  = (geo) => setDraft(d => ({
    ...d,
    alcanceGeografico: d.alcanceGeografico.includes(geo)
      ? d.alcanceGeografico.filter(g => g !== geo)
      : [...d.alcanceGeografico, geo],
  }));

  // ── Products ──────────────────────────────────────────────
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct,    setNewProduct]    = useState({ nombre: "", descripcion: "", kvp: "", subproductos: [], isMain: false });
  const [expanded,      setExpanded]      = useState({});
  const [addingSub,     setAddingSub]     = useState(null);
  const [newSub,        setNewSub]        = useState({ nombre: "", descripcion: "" });

  const commitProduct = () => {
    if (!newProduct.nombre.trim()) return;
    const isFirst = productos.length === 0;
    setProductos(ps => [...ps, { ...newProduct, isMain: isFirst, id: Date.now() }]);
    setNewProduct({ nombre: "", descripcion: "", kvp: "", subproductos: [], isMain: false });
    setAddingProduct(false);
  };
  const removeProduct = (id) => setProductos(ps => ps.filter(p => p.id !== id));
  const setAsMain = (id) => setProductos(ps => ps.map(p => ({ ...p, isMain: p.id === id })));
  const commitSub = (pid) => {
    if (!newSub.nombre.trim()) return;
    setProductos(ps => ps.map(p => p.id === pid
      ? { ...p, subproductos: [...p.subproductos, { ...newSub, id: Date.now() }] } : p));
    setNewSub({ nombre: "", descripcion: "" });
    setAddingSub(null);
  };
  const removeSub = (pid, sid) => setProductos(ps => ps.map(p => p.id === pid
    ? { ...p, subproductos: p.subproductos.filter(s => s.id !== sid) } : p));

  // ── Clients ───────────────────────────────────────────────
  const [addingCliente,      setAddingCliente]      = useState(false);
  const [newCliente,         setNewCliente]         = useState({ nombre: "", web: "", industria: "", descripcion: "", productos: [], visibilidad: "publico", testimonial: null });
  const [editingTestimonial, setEditingTestimonial] = useState(null); // client id

  const toggleClienteProducto = (nombre) => setNewCliente(c => ({
    ...c,
    productos: c.productos.includes(nombre) ? c.productos.filter(p => p !== nombre) : [...c.productos, nombre],
  }));
  const commitCliente = () => {
    if (!newCliente.nombre.trim()) return;
    setClientes(cs => [...cs, { ...newCliente, id: Date.now() }]);
    setNewCliente({ nombre: "", industria: "", descripcion: "", productos: [], visibilidad: "publico", testimonial: null });
    setAddingCliente(false);
  };
  const removeCliente = (id) => setClientes(cs => cs.filter(c => c.id !== id));
  const saveTestimonial = (id, testimonial) => {
    setClientes(cs => cs.map(c => c.id === id ? { ...c, testimonial } : c));
    setEditingTestimonial(null);
  };
  const removeTestimonial = (id) => setClientes(cs => cs.map(c => c.id === id ? { ...c, testimonial: null } : c));

  // ── Competitors ───────────────────────────────────────────
  const [addingComp, setAddingComp] = useState(false);
  const [newComp,    setNewComp]    = useState({ web: "", producto: "", ventajas: "", desventajas: "", geografias: [] });
  const [expandedComp, setExpandedComp] = useState({});

  const openAddComp = () => {
    setNewComp({ web: "", producto: "", ventajas: "", desventajas: "", geografias: [...company.alcanceGeografico] });
    setAddingComp(true);
  };
  const commitComp = () => {
    if (!newComp.web.trim()) return;
    setCompetidores(cs => [...cs, { ...newComp, id: Date.now() }]);
    setNewComp({ web: "", producto: "", ventajas: "", desventajas: "", geografias: [] });
    setAddingComp(false);
  };
  const removeComp = (id) => setCompetidores(cs => cs.filter(c => c.id !== id));
  const toggleCompGeo = (geo) => setNewComp(c => ({
    ...c,
    geografias: c.geografias.includes(geo) ? c.geografias.filter(g => g !== geo) : [...c.geografias, geo],
  }));

  return (
    <div className="px-8 py-6 space-y-5 max-w-3xl w-full">

      {/* ── Datos empresa ── */}
      <Section
        icon={<Building2 size={15} className="text-indigo-500" />}
        title="Datos de la empresa"
        action={
          !editingInfo
            ? <button onClick={() => { setDraft({ ...company }); setEditingInfo(true); }} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all"><Edit3 size={11} /> Editar</button>
            : <div className="flex gap-2">
                <button onClick={cancelEdit} className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"><X size={11} /> Cancelar</button>
                <button onClick={saveInfo} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all"><Save size={11} /> Guardar</button>
              </div>
        }>
        <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-5">
          <Field label="Nombre">
            {editingInfo ? <Input value={draft.nombre} onChange={v => setDraft(d => ({ ...d, nombre: v }))} /> : <Val>{company.nombre}</Val>}
          </Field>
          <Field label="Web" icon={<Link size={10} />}>
            {editingInfo
              ? <Input value={draft.web} onChange={v => setDraft(d => ({ ...d, web: v }))} placeholder="https://" />
              : <a href={company.web} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">{company.web || <Empty />}</a>}
          </Field>
          <Field label="LinkedIn" icon={<Link size={10} />}>
            {editingInfo
              ? <Input value={draft.linkedin || ""} onChange={v => setDraft(d => ({ ...d, linkedin: v }))} placeholder="https://linkedin.com/company/..." />
              : <a href={company.linkedin} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">{company.linkedin || <Empty />}</a>}
          </Field>
          <Field label="Sede">
            {editingInfo ? <Input value={draft.sede} onChange={v => setDraft(d => ({ ...d, sede: v }))} /> : <Val icon={<MapPin size={11} className="text-gray-400" />}>{company.sede}</Val>}
          </Field>
          <Field label="Alcance geográfico" icon={<Globe size={10} />}>
            {editingInfo
              ? <div className="flex flex-wrap gap-1.5 mt-1">
                  {geografias.map(geo => (
                    <button key={geo} onClick={() => toggleGeo(geo)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${draft.alcanceGeografico.includes(geo) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                      {geo}
                    </button>
                  ))}
                </div>
              : <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {company.alcanceGeografico.map(g => <span key={g} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{g}</span>)}
                </div>
            }
          </Field>
          <div className="col-span-2">
            <Field label="Descripción básica">
              {editingInfo
                ? <textarea value={draft.descripcion} onChange={e => setDraft(d => ({ ...d, descripcion: e.target.value }))} rows={3}
                    placeholder="Describe brevemente qué hace la empresa..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none mt-1" />
                : <p className="text-sm text-gray-700 leading-relaxed">{company.descripcion || <span className="text-gray-300 italic text-xs">Sin descripción.</span>}</p>
              }
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Productos ── */}
      <Section
        icon={<Package size={15} className="text-indigo-500" />}
        title="Productos"
        count={productos.length}
        action={
          <button onClick={() => setAddingProduct(true)} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all">
            <Plus size={11} /> Añadir producto
          </button>
        }>

        {addingProduct && (
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 space-y-2.5">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Nuevo producto</p>
            <input autoFocus value={newProduct.nombre} onChange={e => setNewProduct(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Nombre del producto" onKeyDown={e => e.key === "Enter" && commitProduct()}
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white" />
            <textarea value={newProduct.descripcion} onChange={e => setNewProduct(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción…" rows={2}
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white resize-none" />
            <textarea value={newProduct.kvp} onChange={e => setNewProduct(p => ({ ...p, kvp: e.target.value }))}
              placeholder="Key Value Proposition — qué diferencia a este producto vs. la competencia…" rows={2}
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white resize-none" />
            <div className="flex gap-2 pt-1">
              <button onClick={commitProduct} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all"><Check size={11} /> Crear</button>
              <button onClick={() => { setAddingProduct(false); setNewProduct({ nombre: "", descripcion: "", kvp: "", subproductos: [], isMain: false }); }}
                className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">Cancelar</button>
            </div>
          </div>
        )}

        {productos.length === 0 && !addingProduct && (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Package size={20} className="text-gray-300" /></div>
            <p className="text-sm text-gray-400">No hay productos definidos aún.</p>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {productos.map(producto => (
            <div key={producto.id}>
              <div className="px-6 py-4 flex items-start gap-3">
                <button onClick={() => setExpanded(e => ({ ...e, [producto.id]: !e[producto.id] }))}
                  className="mt-0.5 text-gray-300 hover:text-gray-600 transition-colors shrink-0">
                  {expanded[producto.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{producto.nombre}</span>
                    {producto.isMain && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100">
                        <Star size={9} className="fill-amber-500 text-amber-500" /> Principal
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full border border-indigo-100"><Tag size={9} />{producto.nombre}</span>
                    {producto.subproductos.length > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Layers size={10} />{producto.subproductos.length} sub</span>}
                  </div>
                  {producto.descripcion && <p className="text-xs text-gray-500 mt-1">{producto.descripcion}</p>}
                  {producto.kvp && <p className="text-xs text-indigo-500 mt-1 italic">KVP: {producto.kvp}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  {!producto.isMain && (
                    <button onClick={() => setAsMain(producto.id)}
                      title="Establecer como producto principal"
                      className="text-gray-200 hover:text-amber-400 transition-colors px-1">
                      <Star size={13} />
                    </button>
                  )}
                  <button onClick={() => removeProduct(producto.id)} className="text-gray-200 hover:text-red-400 transition-colors px-1"><Trash2 size={13} /></button>
                </div>
              </div>

              {expanded[producto.id] && (
                <div className="pb-4 px-6 ml-7 space-y-2">
                  {producto.subproductos.map(sub => (
                    <div key={sub.id} className="flex items-start justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                      <div>
                        <p className="text-xs font-medium text-gray-700">{sub.nombre}</p>
                        {sub.descripcion && <p className="text-xs text-gray-400 mt-0.5">{sub.descripcion}</p>}
                      </div>
                      <button onClick={() => removeSub(producto.id, sub.id)} className="text-gray-200 hover:text-red-400 transition-colors ml-3"><X size={12} /></button>
                    </div>
                  ))}
                  {addingSub === producto.id ? (
                    <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2">
                      <input autoFocus value={newSub.nombre} onChange={e => setNewSub(s => ({ ...s, nombre: e.target.value }))}
                        placeholder="Nombre del subproducto" onKeyDown={e => e.key === "Enter" && commitSub(producto.id)}
                        className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white" />
                      <input value={newSub.descripcion} onChange={e => setNewSub(s => ({ ...s, descripcion: e.target.value }))}
                        placeholder="Descripción (opcional)"
                        className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white" />
                      <div className="flex gap-2">
                        <button onClick={() => commitSub(producto.id)} className="text-xs bg-gray-700 text-white px-2.5 py-1 rounded-md hover:bg-gray-800">Añadir</button>
                        <button onClick={() => { setAddingSub(null); setNewSub({ nombre: "", descripcion: "" }); }} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingSub(producto.id)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                      <Plus size={11} /> Añadir subproducto
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Clientes ── */}
      <Section
        icon={<span style={{ fontSize: 15 }}>👥</span>}
        title="Clientes"
        count={clientes.length}
        action={
          <button onClick={() => setAddingCliente(true)} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all">
            <Plus size={11} /> Añadir cliente
          </button>
        }>

        {addingCliente && (
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 space-y-3">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Nuevo cliente</p>
            <input autoFocus value={newCliente.nombre} onChange={e => setNewCliente(c => ({ ...c, nombre: e.target.value }))}
              placeholder="Nombre del cliente" onKeyDown={e => e.key === "Enter" && commitCliente()}
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white" />
            <input value={newCliente.web} onChange={e => setNewCliente(c => ({ ...c, web: e.target.value }))}
              placeholder="Web (ej. cliente.com)"
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white" />
            <input value={newCliente.industria} onChange={e => setNewCliente(c => ({ ...c, industria: e.target.value }))}
              placeholder="Industria"
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white" />
            <textarea value={newCliente.descripcion} onChange={e => setNewCliente(c => ({ ...c, descripcion: e.target.value }))}
              placeholder="Descripción (opcional)" rows={2}
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white resize-none" />
            {productos.length > 0 && (
              <div>
                <p className="text-xs text-indigo-500 font-medium mb-1.5">Productos asociados</p>
                <div className="flex flex-wrap gap-1.5">
                  {productos.map(p => (
                    <button key={p.id} onClick={() => toggleClienteProducto(p.nombre)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${newCliente.productos.includes(p.nombre) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                      {p.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-indigo-500 font-medium mb-1.5">Visibilidad en emails</p>
              <div className="flex gap-2">
                {[["publico", "🟢 Público"], ["privado", "🔒 Privado"]].map(([val, lbl]) => (
                  <button key={val} onClick={() => setNewCliente(c => ({ ...c, visibilidad: val }))}
                    className={`flex-1 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${newCliente.visibilidad === val ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={commitCliente} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all"><Check size={11} /> Añadir</button>
              <button onClick={() => { setAddingCliente(false); setNewCliente({ nombre: "", web: "", industria: "", descripcion: "", productos: [], visibilidad: "publico", testimonial: null }); }}
                className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">Cancelar</button>
            </div>
          </div>
        )}

        {clientes.length === 0 && !addingCliente && (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl">👥</div>
            <p className="text-sm text-gray-400">No hay clientes añadidos aún.</p>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {clientes.map(cliente => (
            <div key={cliente.id}>
              <div className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{cliente.nombre}</p>
                    {cliente.industria && <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium bg-violet-50 text-violet-700 border-violet-100">{cliente.industria}</span>}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cliente.visibilidad === "publico" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                      {cliente.visibilidad === "publico" ? "🟢 Público" : "🔒 Privado"}
                    </span>
                    {cliente.testimonial && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100">
                        <Quote size={9} /> Testimonial
                      </span>
                    )}
                  </div>
                  {cliente.web && <a href={cliente.web.startsWith("http") ? cliente.web : `https://${cliente.web}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-0.5 block">{cliente.web}</a>}
                  {cliente.descripcion && <p className="text-xs text-gray-500 mt-0.5">{cliente.descripcion}</p>}
                  {cliente.productos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {cliente.productos.map(p => (
                        <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full border border-indigo-100"><Tag size={9} />{p}</span>
                      ))}
                    </div>
                  )}
                  {/* Testimonial display */}
                  {cliente.testimonial && editingTestimonial !== cliente.id && (
                    <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                      <p className="text-xs text-blue-700 italic">"{cliente.testimonial.comentario}"</p>
                      <p className="text-xs text-blue-500 mt-1 font-medium">{cliente.testimonial.nombre}{cliente.testimonial.posicion ? ` · ${cliente.testimonial.posicion}` : ""}</p>
                    </div>
                  )}
                  {/* Testimonial editor */}
                  {editingTestimonial === cliente.id && (
                    <TestimonialEditor
                      initial={cliente.testimonial}
                      onSave={t => saveTestimonial(cliente.id, t)}
                      onCancel={() => setEditingTestimonial(null)}
                    />
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <button onClick={() => setEditingTestimonial(editingTestimonial === cliente.id ? null : cliente.id)}
                    title={cliente.testimonial ? "Editar testimonial" : "Añadir testimonial"}
                    className={`transition-colors px-1 ${cliente.testimonial ? "text-blue-400 hover:text-blue-600" : "text-gray-200 hover:text-blue-400"}`}>
                    <Quote size={13} />
                  </button>
                  {cliente.testimonial && (
                    <button onClick={() => removeTestimonial(cliente.id)} title="Quitar testimonial" className="text-gray-200 hover:text-red-400 transition-colors px-1">
                      <X size={12} />
                    </button>
                  )}
                  <button onClick={() => removeCliente(cliente.id)} className="text-gray-200 hover:text-red-400 transition-colors px-1"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Competidores ── */}
      <Section
        icon={<Target size={15} className="text-indigo-500" />}
        title="Competidores"
        count={competidores.length}
        action={
          <button onClick={openAddComp} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all">
            <Plus size={11} /> Añadir competidor
          </button>
        }>

        {addingComp && (
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 space-y-3">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Nuevo competidor</p>
            <input autoFocus value={newComp.web} onChange={e => setNewComp(c => ({ ...c, web: e.target.value }))}
              placeholder="Web del competidor (ej. competidor.com)"
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white" />
            <div>
              <p className="text-xs text-indigo-500 font-medium mb-1.5">Producto en el que compite</p>
              <div className="flex flex-wrap gap-1.5">
                {productos.length === 0
                  ? <p className="text-xs text-gray-400 italic">Añade productos primero.</p>
                  : productos.map(p => (
                    <button key={p.id} onClick={() => setNewComp(c => ({ ...c, producto: p.nombre }))}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${newComp.producto === p.nombre ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                      {p.nombre}
                    </button>
                  ))
                }
              </div>
            </div>
            <textarea value={newComp.ventajas} onChange={e => setNewComp(c => ({ ...c, ventajas: e.target.value }))}
              placeholder="Ventajas nuestras vs. este competidor…" rows={2}
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white resize-none" />
            <textarea value={newComp.desventajas} onChange={e => setNewComp(c => ({ ...c, desventajas: e.target.value }))}
              placeholder="Desventajas nuestras vs. este competidor…" rows={2}
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white resize-none" />
            <div>
              <p className="text-xs text-indigo-500 font-medium mb-1.5">Geografía</p>
              <div className="flex flex-wrap gap-1.5">
                {geografias.map(geo => (
                  <button key={geo} onClick={() => toggleCompGeo(geo)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${newComp.geografias.includes(geo) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                    {geo}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={commitComp} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all"><Check size={11} /> Guardar</button>
              <button onClick={() => setAddingComp(false)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">Cancelar</button>
            </div>
          </div>
        )}

        {competidores.length === 0 && !addingComp && (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Target size={20} className="text-gray-300" /></div>
            <p className="text-sm text-gray-400">No hay competidores añadidos aún.</p>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {competidores.map(comp => (
            <div key={comp.id}>
              <div className="px-6 py-4 flex items-start gap-3">
                <button onClick={() => setExpandedComp(e => ({ ...e, [comp.id]: !e[comp.id] }))}
                  className="mt-0.5 text-gray-300 hover:text-gray-600 transition-colors shrink-0">
                  {expandedComp[comp.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{comp.web}</p>
                    {comp.producto && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full border border-indigo-100"><Tag size={9} />{comp.producto}</span>}
                    {comp.geografias?.length > 0 && comp.geografias.map(g => (
                      <span key={g} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{g}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => removeComp(comp.id)} className="text-gray-200 hover:text-red-400 transition-colors shrink-0 mt-0.5"><Trash2 size={13} /></button>
              </div>
              {expandedComp[comp.id] && (comp.ventajas || comp.desventajas) && (
                <div className="pb-4 px-6 ml-7 grid grid-cols-2 gap-3">
                  {comp.ventajas && (
                    <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-600 mb-1">Ventajas</p>
                      <p className="text-xs text-emerald-700 whitespace-pre-wrap">{comp.ventajas}</p>
                    </div>
                  )}
                  {comp.desventajas && (
                    <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                      <p className="text-xs font-semibold text-red-500 mb-1">Desventajas</p>
                      <p className="text-xs text-red-600 whitespace-pre-wrap">{comp.desventajas}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Testimonial inline editor ─────────────────────────────
function TestimonialEditor({ initial, onSave, onCancel }) {
  const [t, setT] = useState(initial || { nombre: "", posicion: "", comentario: "" });
  return (
    <div className="mt-2 bg-blue-50 rounded-lg px-3 py-3 border border-blue-100 space-y-2">
      <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Testimonial</p>
      <input value={t.nombre} onChange={e => setT(v => ({ ...v, nombre: e.target.value }))}
        placeholder="Nombre" className="w-full text-xs border border-blue-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
      <input value={t.posicion} onChange={e => setT(v => ({ ...v, posicion: e.target.value }))}
        placeholder="Posición / cargo" className="w-full text-xs border border-blue-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
      <textarea value={t.comentario} onChange={e => setT(v => ({ ...v, comentario: e.target.value }))}
        placeholder="Comentario o cita…" rows={3}
        className="w-full text-xs border border-blue-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white resize-none" />
      <div className="flex gap-2">
        <button onClick={() => onSave(t)} className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-md hover:bg-blue-700"><Check size={10} /> Guardar</button>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
      </div>
    </div>
  );
}
