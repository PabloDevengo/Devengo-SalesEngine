import { useState, useEffect } from "react";
import { Zap, Copy, Download, ExternalLink, Trash2, Search, Users, Building2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useData } from "../../utils/dataLoader";
import {
  saveCompanies, getCompanies, deleteCompany,
  saveContacts,  getContacts,  deleteContact,
} from "../../services/prospectsService";

// ── Constants ──────────────────────────────────────────────────────────────
const REVENUES = ["0-1M", "1-10M", "10-50M", "50-100M", "100-500M", "500-1000M", ">1000M"];

const KEY_PERSONAS = [
  "CEO", "CFO", "COO", "CTO", "Head of Finance", "Head of Treasury",
  "Head of Operations", "Head of Accounting", "Compliance Director",
  "VP Finance", "Finance Director", "Controller",
];

const SURFE_INDUSTRIES = [
  "3D Printing","3D Technology","Accounting","Ad Network","Adult","Advanced Materials",
  "Adventure Travel","Advertising","Advertising Platforms","Advice","Aerospace",
  "Affiliate Marketing","Agriculture","AgTech","Air Transportation","Alternative Medicine",
  "American Football","Amusement Park and Arcade","Analytics","Android","Angel Investment",
  "Animal Feed","Animation","Application Performance Management","App Marketing","Apps",
  "Aquaculture","Architecture","Art","Artificial Intelligence","Asset Management",
  "Assisted Living","Association","Auctions","Audio","Audiobooks","Augmented Reality",
  "Auto Insurance","Automotive","Autonomous Vehicles","B2B","B2C","Baby","Bakery",
  "Banking","Baseball","Basketball","Battery","Beauty","Big Data","Billing","Biofuel",
  "Bioinformatics","Biomass Energy","Biometrics","Biopharma","Biotechnology","Bitcoin",
  "Blockchain","Blogging Platforms","Boating","Brand Marketing","Brewing","Broadcasting",
  "Building Maintenance","Building Material","Business Development",
  "Business Information Systems","Business Intelligence","Business Travel","CAD",
  "Call Center","Cannabis","Career Planning","Car Sharing","Casino","Casual Games",
  "Catering","Charity","Charter Schools","Chemical","Chemical Engineering","Child Care",
  "Children","Civil Engineering","Clean Energy","CleanTech","Clinical Trials",
  "Cloud Computing","Cloud Data Services","Cloud Infrastructure","Cloud Management",
  "Cloud Security","Cloud Storage","CMS","Coffee","Collaboration","Collection Agency",
  "Comics","Commercial","Commercial Insurance","Commercial Lending","Commercial Real Estate",
  "Communication Hardware","Communications Infrastructure","Communities","Compliance",
  "Computer","Computer Vision","Concerts","Confectionery","Console Games","Construction",
  "Consulting","Consumer","Consumer Electronics","Consumer Goods","Consumer Lending",
  "Consumer Research","Consumer Reviews","Consumer Software","Contact Management",
  "Content","Content Creators","Content Delivery Network","Content Marketing",
  "Continuing Education","Cooking","Corporate Training","Cosmetics","Cosmetic Surgery",
  "Coupons","Courier Service","Coworking","Craft Beer","Creative Agency","Credit",
  "Credit Bureau","Credit Cards","CRM","Crowdfunding","Cryptocurrency","Customer Service",
  "Cyber Security","Cycling","Database","Data Center","Data Center Automation",
  "Data Integration","Data Mining","Data Storage","Data Visualization","Dating",
  "Debit Cards","Debt Collections","Delivery","Delivery Service","Dental","Developer APIs",
  "Developer Platform","Developer Tools","Diabetes","Dietary Supplements",
  "Digital Entertainment","Digital Marketing","Digital Media","Digital Signage",
  "Direct Marketing","Direct Sales","Distillery","Diving","Document Management",
  "Document Preparation","Domain Registrar","Drone Management","Drones","EBooks",
  "E-Commerce","E-Commerce Platforms","EdTech","Education","Edutainment","Elder Care",
  "Elderly","E-Learning","Electrical Distribution","Electric Vehicle",
  "Electronic Design Automation (EDA)","Electronic Health Record (EHR)","Electronics",
  "Email","Email Marketing","Embedded Systems","Emergency Medicine","Employee Benefits",
  "Employment","Energy","Energy Efficiency","Energy Management","Energy Storage",
  "Enterprise","Enterprise Applications","Enterprise Resource Planning (ERP)",
  "Enterprise Software","Environmental Consulting","Environmental Engineering","eSports",
  "Ethereum","Event Management","Event Promotion","Events","Extermination Service",
  "Eyewear","Facilities Support Services","Facility Management","Family","Fantasy Sports",
  "Farmers Market","Farming","Fashion","Fast-Moving Consumer Goods","Fertility",
  "Field Support","File Sharing","Film","Film Distribution","Film Production","Finance",
  "Financial Exchanges","Financial Services","FinTech","First Aid","Fitness",
  "Fleet Management","Flowers","Food and Beverage","Food Delivery","Food Processing",
  "Food Trucks","Forestry","Foundries","Fraud Detection","Freelance","Freight Service",
  "Fruit","Fuel","Funding Platform","Funerals","Furniture","Gambling","Gamification",
  "Gaming","Genetics","Geospatial","Gift","Gift Card","Golf","Government","GovTech","GPS",
  "Graphic Design","Green Building","GreenTech","Grocery","Guides","Handmade","Hardware",
  "Health Care","Health Diagnostics","Health Insurance","Hedge Funds","Higher Education",
  "Hockey","Home and Garden","Home Decor","Home Health Care","Home Improvement",
  "Homeland Security","Homeless Shelter","Home Renovation","Home Services","Horticulture",
  "Hospital","Hospitality","Hotel","Housekeeping Service","Human Computer Interaction",
  "Humanitarian","Human Resources","Hunting","IaaS","Identity Management",
  "Image Recognition","Impact Investing","Incubators","Independent Music","Industrial",
  "Industrial Automation","Industrial Design","Industrial Engineering",
  "Industrial Manufacturing","Information and Communications Technology (ICT)",
  "Information Services","Information Technology","Infrastructure","Innovation Management",
  "Insurance","InsurTech","Intellectual Property","Intelligent Systems","Interior Design",
  "Internet","Internet of Things","Internet Radio","iOS","ISP","IT Infrastructure",
  "IT Management","Janitorial Service","Jewelry","Journalism","Knowledge Management",
  "Landscaping","Language Learning","Laser","Last Mile Transportation",
  "Laundry and Dry-cleaning","Law Enforcement","Lead Generation","Lead Management",
  "Leasing","Legal","Legal Tech","Leisure","Lending","Life Insurance","Life Science",
  "Lifestyle","Lighting","Limousine Service","Lingerie","Livestock","Local",
  "Local Business","Location Based Services","Logistics","Loyalty Programs",
  "Machine Learning","Machinery Manufacturing","Management Consulting",
  "Management Information Systems","Manufacturing","Mapping Services","Marine Technology",
  "Marine Transportation","Marketing","Marketing Automation","Marketplace","Market Research",
  "Mechanical Design","Mechanical Engineering","Media and Entertainment","Medical",
  "Medical Device","Meeting Software","Men's","Messaging","mHealth","Military","Mineral",
  "Mining","Mining Technology","Mobile","Mobile Advertising","Mobile Apps","Mobile Devices",
  "Mobile Payments","Motion Capture","Museums and Historical Sites","Music",
  "Musical Instruments","Music Education","Music Label","Music Streaming","Music Venues",
  "Nanotechnology","National Security","Natural Language Processing","Natural Resources",
  "Navigation","Network Hardware","Network Security","Neuroscience","News","Non Profit",
  "Nuclear","Nursing and Residential Care","Nutrition","Office Administration","Oil and Gas",
  "Online Games","Online Portals","Open Source","Optical Communication","Organic",
  "Organic Food","Outdoor Advertising","Outdoors","Outpatient Care","Outsourcing","PaaS",
  "Packaging Services","Paper Manufacturing","Parenting","Parking","Parks","Payments",
  "PC Games","Penetration Testing","Performing Arts","Personal Branding",
  "Personal Development","Personal Finance","Personal Health","Personalization","Pet",
  "Pharmaceutical","Photo Editing","Photography","Photo Sharing","Physical Security",
  "Plastics and Rubber Manufacturing","Podcast","Point of Sale","Politics",
  "Pollution Control","Ports and Harbors","Power Grid","Precious Metals",
  "Predictive Analytics","Price Comparison","Primary Education","Printing","Privacy",
  "Private Cloud","Procurement","Product Design","Productivity Tools","Product Management",
  "Product Research","Professional Networking","Professional Services","Project Management",
  "Property Development","Property Insurance","Property Management","Psychology",
  "Public Relations","Public Safety","Public Transportation","Publishing",
  "Quality Assurance","Quantum Computing","Racing","Railroad","Real Estate",
  "Real Estate Investment","Real Time","Recipes","Recreation","Recreational Vehicles",
  "Recruiting","Recycling","Rehabilitation","Religion","Renewable Energy","Rental",
  "Rental Property","Reputation","Reservations","Residential","Resorts","Restaurants",
  "Retail","Retail Technology","Retirement","Ride Sharing","Risk Management","Robotics",
  "SaaS","Sailing","Sales","Sales Automation","Same Day Delivery","Satellite Communication",
  "Scheduling","Seafood","Search Engine","Secondary Education","Security","Self-Storage",
  "SEM","Semantic Search","Semiconductor","Sensor","SEO","Serious Games","Service Industry",
  "Sharing Economy","Shipping","Shoes","Shopping","Shopping Mall","Simulation","Skiing",
  "Skill Assessment","Small and Medium Businesses","Smart Building","Smart Cities",
  "Smart Home","SMS","Snack Food","Soccer","Social","Social Assistance",
  "Social Entrepreneurship","Social Impact","Social Media","Social Media Advertising",
  "Social Media Management","Social Media Marketing","Social Network","Social News",
  "Social Recruiting","Software","Software Engineering","Solar","Space Travel",
  "Speech Recognition","Sporting Goods","Sports","Staffing Agency","STEM Education",
  "Stock Exchanges","Subscription Service","Supply Chain Management","Surfing",
  "Sustainability","Swimming","Task Management","Taxi Service","Tea","Technical Support",
  "Telecommunications","Tennis","Test and Measurement","Text Analytics","Textiles",
  "Theatre","Therapeutics","Ticketing","Timber","Tobacco","Tourism","Tour Operator",
  "Toys","Trade Shows","Trading Platform","Training","Transaction Processing",
  "Translation Service","Transportation","Travel","Travel Accommodations","Travel Agency",
  "Tutoring","TV","TV Production","Underserved Children","Unified Communications",
  "Universities","Usability Testing","UX Design","Vacation Rental","Venture Capital",
  "Veterinary","Video","Video Advertising","Video Chat","Video Conferencing","Video Editing",
  "Video Games","Video on Demand","Video Streaming","Virtual Assistant","Virtual Currency",
  "Virtualization","Virtual Reality","Virtual Workforce","Vocational Education","VoIP",
  "Warehousing","Waste Management","Water","Water Purification","Water Transportation",
  "Wealth Management","Wearables","Web Apps","Web Design","Web Development","Web Hosting",
  "Wedding","Wellness","Wholesale","Wind Energy","Windows","Wine And Spirits","Winery",
  "Wired Telecommunications","Wireless","Women's","Wood Processing","Young Adults",
];

// ── ContactTable — defined OUTSIDE main component to avoid remount bug ─────
function ContactTable({ contacts, onDelete }) {
  if (!contacts.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Nombre</th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Cargo</th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Email</th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Teléfono</th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Empresa</th>
            <th className="px-4 py-2.5 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {contacts.map((c, idx) => (
            <tr key={c.id ?? idx} className="hover:bg-gray-50 transition-colors group">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-800 text-sm">{c.nombre} {c.apellidos}</p>
                {c.linkedin && (
                  <a href={c.linkedin} target="_blank" rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-600">LinkedIn →</a>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-gray-600">{c.cargo || "—"}</td>
              <td className="px-4 py-3">
                {c.email
                  ? <a href={`mailto:${c.email}`} className="text-xs text-indigo-600 hover:underline font-mono">{c.email}</a>
                  : <span className="text-xs text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3 text-xs text-gray-600 font-mono">{c.telefono || "—"}</td>
              <td className="px-4 py-3">
                <p className="text-xs font-medium text-gray-700">{c.company_nombre || "—"}</p>
                {c.company_domain && (
                  <a href={`https://${c.company_domain}`} target="_blank" rel="noreferrer"
                    className="text-xs text-gray-400 hover:text-indigo-600 font-mono">{c.company_domain}</a>
                )}
              </td>
              <td className="px-4 py-3">
                {onDelete && (
                  <button onClick={() => onDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-all p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={13} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ProspectModule() {
  const { clientes, webhooks, setWebhook } = useApp();
  const { data: geografias = [] } = useData("geografias");
  const { data: tamanos    = [] } = useData("tamanos");

  const [activeTab, setActiveTab] = useState("empresas");

  // ── Empresas state ────────────────────────────────────────
  const [industries,     setIndustries]     = useState([]);
  const [industriaInput, setIndustriaInput] = useState("");
  const [showIndustrySuggestions, setShowIndustrySuggestions] = useState(false);
  const [geos,           setGeos]           = useState(["España"]);
  const [tamanosSel,     setTamanosSel]     = useState([]);
  const [revenues,       setRevenues]       = useState([]);
  const [lookalike,      setLookalike]      = useState("");
  const [numResults,     setNumResults]     = useState(20);
  const [webhookUrl,     setWebhookUrl]     = useState(import.meta.env.VITE_N8N_PROSPECT_WEBHOOK || "");
  useEffect(() => { if (webhooks.prospect) setWebhookUrl(webhooks.prospect); }, [webhooks.prospect]);
  const [showJson,       setShowJson]       = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [copied,         setCopied]         = useState(null);
  const [resultado,      setResultado]      = useState(null);
  const [selectedDomains, setSelectedDomains] = useState(new Set());
  const [savedCompanies,  setSavedCompanies]  = useState([]);

  // ── Contactos state ───────────────────────────────────────
  const [contactPersonas,      setContactPersonas]      = useState([]);
  const [contactPersonaInput,  setContactPersonaInput]  = useState("");
  const [preselectedCompanies, setPreselectedCompanies] = useState([]);
  const [contactNumResults,    setContactNumResults]    = useState(20);
  const [contactWebhookUrl,    setContactWebhookUrl]    = useState(import.meta.env.VITE_N8N_CONTACTS_WEBHOOK || "");
  useEffect(() => { if (webhooks.contacts) setContactWebhookUrl(webhooks.contacts); }, [webhooks.contacts]);
  const [contactLoading,       setContactLoading]       = useState(false);
  const [contactError,         setContactError]         = useState(null);
  const [contactResults,       setContactResults]       = useState(null);
  const [savedContacts,        setSavedContacts]        = useState([]);
  const [contactSearch,        setContactSearch]        = useState("");

  // ── Load from Supabase on mount ───────────────────────────
  useEffect(() => {
    getCompanies().then(setSavedCompanies).catch(console.error);
    getContacts().then(setSavedContacts).catch(console.error);
  }, []);

  // ══════════════════════════════════════════════════════════
  // EMPRESAS handlers
  // ══════════════════════════════════════════════════════════
  const toggleGeo     = (g) => setGeos(gs => gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]);
  const toggleTamano  = (t) => setTamanosSel(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);
  const toggleRevenue = (r) => setRevenues(rs => rs.includes(r) ? rs.filter(x => x !== r) : [...rs, r]);
  const clientesPublicos = clientes.filter(c => c.visibilidad === "publico");

  const addIndustria = (val) => {
    const v = (val || industriaInput).trim();
    if (v && !industries.includes(v)) setIndustries(prev => [...prev, v]);
    setIndustriaInput(""); setShowIndustrySuggestions(false);
  };
  const removeIndustria = (ind) => setIndustries(prev => prev.filter(x => x !== ind));
  const handleIndustriaKey = (e) => {
    if (e.key === "Escape") { setShowIndustrySuggestions(false); return; }
    const sugs = SURFE_INDUSTRIES.filter(i => i.toLowerCase().includes(industriaInput.toLowerCase()) && !industries.includes(i));
    if (e.key === "Enter") { e.preventDefault(); if (sugs.length > 0) addIndustria(sugs[0]); }
  };
  const industrySuggestions = industriaInput.length >= 1
    ? SURFE_INDUSTRIES.filter(i => i.toLowerCase().includes(industriaInput.toLowerCase()) && !industries.includes(i)).slice(0, 8)
    : [];

  const toggleDomain = (domain) => setSelectedDomains(prev => {
    const next = new Set(prev);
    next.has(domain) ? next.delete(domain) : next.add(domain);
    return next;
  });
  const toggleAllDomains = () => {
    const all = (resultado?.companies ?? []).map(c => c.domain).filter(Boolean);
    setSelectedDomains(selectedDomains.size === all.length ? new Set() : new Set(all));
  };

  const buildPayload = () => {
    const payload = { tipo: "empresa", industries, geografias: geos, tamanos: tamanosSel, revenues, num_resultados: numResults };
    if (lookalike) { payload.lookalike = lookalike; payload.lookalike_data = clientes.find(c => c.nombre === lookalike) || null; }
    return payload;
  };
  const payloadJson = JSON.stringify(buildPayload(), null, 2);
  const canSend = industries.length > 0 || lookalike;

  const enviar = async () => {
    if (!webhookUrl.trim()) { setError("Pega la URL del webhook de N8N."); return; }
    setLoading(true); setError(null); setResultado(null); setSelectedDomains(new Set());
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const res = await fetch(webhookUrl.trim(), { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload()) });
      clearTimeout(timeout);
      if (!res.ok) { setError(`Error HTTP ${res.status} desde N8N.`); return; }
      const data = await res.json();
      const root = Array.isArray(data) ? data[0] : data;
      const companies      = root?.companies      ?? [];
      const companyDomains = root?.companyDomains ?? companies.map(c => c.domain).filter(Boolean);
      setResultado({ companies, companyDomains, raw: data });
      if (companies.length > 0) {
        saveCompanies(companies).then(() => getCompanies().then(setSavedCompanies)).catch(console.error);
      }
    } catch (e) {
      setError(e.name === "AbortError" ? "Timeout: N8N tardó más de 90s." : `Error de red: ${e.message}`);
    } finally { setLoading(false); }
  };

  const companies      = resultado?.companies      ?? [];
  const companyDomains = resultado?.companyDomains ?? [];

  const copyDomain = (d, idx) => { navigator.clipboard.writeText(d).catch(() => {}); setCopied(idx); setTimeout(() => setCopied(null), 1500); };
  const copyAllDomains = () => { navigator.clipboard.writeText(companyDomains.join("\n")).catch(() => {}); setCopied("all"); setTimeout(() => setCopied(null), 1500); };
  const downloadCsv = () => {
    const headers = "#,nombre,dominio,industrias,revenue,empleados,paises";
    const rows = companies.length > 0
      ? companies.map((c, i) => [i+1, `"${c.name??""}"`, c.domain??"", `"${(c.industries??[]).join("; ")}"`, c.revenue??"", c.employeeCount??"", `"${(c.countries??[]).join("; ")}"`].join(","))
      : companyDomains.map((d, i) => `${i+1},,${d},,,,`);
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "prospectos.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(resultado.raw, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "prospectos.json"; a.click(); URL.revokeObjectURL(url);
  };

  const irAContactos = () => {
    const toSearch = selectedDomains.size > 0
      ? companies.filter(c => selectedDomains.has(c.domain))
      : companies;
    setPreselectedCompanies(toSearch);
    setActiveTab("contactos");
  };

  const handleDeleteCompany = async (id) => {
    await deleteCompany(id).catch(console.error);
    setSavedCompanies(prev => prev.filter(c => c.id !== id));
  };

  // ══════════════════════════════════════════════════════════
  // CONTACTOS handlers
  // ══════════════════════════════════════════════════════════
  const addPersona = (val) => {
    const v = (val || contactPersonaInput).trim();
    if (v && !contactPersonas.includes(v)) setContactPersonas(prev => [...prev, v]);
    setContactPersonaInput("");
  };
  const removePersona = (p) => setContactPersonas(prev => prev.filter(x => x !== p));
  const removePreselected = (domain) => setPreselectedCompanies(prev => prev.filter(c => c.domain !== domain));

  const enviarContactos = async () => {
    if (!contactWebhookUrl.trim()) { setContactError("Pega la URL del webhook de N8N."); return; }
    setContactLoading(true); setContactError(null); setContactResults(null);
    try {
      const payload = {
        tipo: "contacto",
        companies: preselectedCompanies.map(c => ({ nombre: c.name ?? c.nombre ?? "", domain: c.domain })),
        personas: contactPersonas,
        num_resultados: contactNumResults,
      };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const res = await fetch(contactWebhookUrl.trim(), { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      clearTimeout(timeout);
      if (!res.ok) { setContactError(`Error HTTP ${res.status} desde N8N.`); return; }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.contacts ?? data.results ?? []);
      setContactResults(list);
      if (list.length > 0) {
        saveContacts(list).then(() => getContacts().then(setSavedContacts)).catch(console.error);
      }
    } catch (e) {
      setContactError(e.name === "AbortError" ? "Timeout: N8N tardó más de 90s." : `Error de red: ${e.message}`);
    } finally { setContactLoading(false); }
  };

  const handleDeleteContact = async (id) => {
    await deleteContact(id).catch(console.error);
    setSavedContacts(prev => prev.filter(c => c.id !== id));
  };

  const filteredContacts = savedContacts.filter(c => {
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase();
    return `${c.nombre} ${c.apellidos}`.toLowerCase().includes(q) ||
      c.cargo?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company_nombre?.toLowerCase().includes(q);
  });

  const downloadContactsCsv = (list) => {
    const headers = "nombre,apellidos,cargo,email,telefono,linkedin,empresa,dominio";
    const rows = list.map(c => [`"${c.nombre}"`, `"${c.apellidos}"`, `"${c.cargo}"`, c.email, c.telefono, c.linkedin, `"${c.company_nombre}"`, c.company_domain].join(","));
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "contactos.csv"; a.click(); URL.revokeObjectURL(url);
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="px-8 py-6 max-w-5xl w-full space-y-5">

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: "empresas",  label: "🏢 Empresas",  count: savedCompanies.length },
          { id: "contactos", label: "👤 Contactos", count: savedContacts.length  },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${activeTab === tab.id ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: EMPRESAS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "empresas" && (
        <>
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Building2 size={15} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-800">Búsqueda de empresas</h2>
            </div>
            <div className="px-6 py-5 space-y-5">

              {/* Industrias */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Industrias</label>
                <div className="relative">
                  <input value={industriaInput}
                    onChange={e => { setIndustriaInput(e.target.value); setShowIndustrySuggestions(true); }}
                    onFocus={() => setShowIndustrySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowIndustrySuggestions(false), 150)}
                    onKeyDown={handleIndustriaKey}
                    placeholder="Buscar industria…"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                  {showIndustrySuggestions && industrySuggestions.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {industrySuggestions.map(ind => (
                        <button key={ind} onMouseDown={() => addIndustria(ind)}
                          className="w-full text-left text-sm px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">{ind}</button>
                      ))}
                    </div>
                  )}
                </div>
                {industries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {industries.map(ind => (
                      <span key={ind} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                        {ind}<button onClick={() => removeIndustria(ind)} className="ml-0.5 text-indigo-400 hover:text-indigo-700 leading-none">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Revenue */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Revenue</label>
                <div className="flex flex-wrap gap-1.5">
                  {REVENUES.map(r => (
                    <button key={r} onClick={() => toggleRevenue(r)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${revenues.includes(r) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tamaño */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Tamaño</label>
                <div className="flex gap-2">
                  {tamanos.map(({ key, label, sub }) => (
                    <button key={key} onClick={() => toggleTamano(key)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${tamanosSel.includes(key) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                      <span className="block">{label}</span>
                      <span className={`text-xs font-normal ${tamanosSel.includes(key) ? "text-indigo-200" : "text-gray-400"}`}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Geografía */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Geografía</label>
                <div className="flex flex-wrap gap-1.5">
                  {geografias.map(geo => (
                    <button key={geo} onClick={() => toggleGeo(geo)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${geos.includes(geo) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                      {geo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lookalike + nº resultados */}
              <div className="grid grid-cols-2 gap-x-6">
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Similar a (lookalike)</label>
                  <select value={lookalike} onChange={e => setLookalike(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                    <option value="">Sin referencia</option>
                    {clientesPublicos.map(c => <option key={c.id} value={c.nombre}>{c.nombre}{c.industria ? ` · ${c.industria}` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Nº de resultados</label>
                  <div className="flex gap-1.5">
                    {[10, 20, 50, 100].map(n => (
                      <button key={n} onClick={() => setNumResults(n)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${numResults === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Payload + envío */}
          {canSend && (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">JSON payload</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">listo para N8N</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowJson(s => !s)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">{showJson ? "Ocultar" : "Ver JSON"}</button>
                  <button onClick={() => { navigator.clipboard.writeText(payloadJson).catch(() => {}); setCopied("json"); setTimeout(() => setCopied(null), 1500); }}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                    <Copy size={11} />{copied === "json" ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
              {showJson && <pre className="px-6 py-4 text-xs font-mono text-gray-600 bg-gray-50 overflow-x-auto">{payloadJson}</pre>}
              <div className="px-6 py-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Webhook URL</label>
                  <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} onBlur={e => setWebhook('prospect', e.target.value)} placeholder="https://tu-n8n.com/webhook/..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
                </div>
                <button onClick={enviar} disabled={loading || !webhookUrl.trim()}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${loading ? "bg-indigo-100 text-indigo-400 cursor-not-allowed" : !webhookUrl.trim() ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                  {loading
                    ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Buscando empresas...</>
                    : <><Zap size={13} />{webhookUrl.trim() ? "Enviar a N8N" : "Pega la URL para enviar"}</>}
                </button>
              </div>
            </section>
          )}

          {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-xs text-red-600 font-mono">{error}</div>}

          {/* Resultados */}
          {resultado && (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800">Resultados</h2>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{companyDomains.length} empresas · guardadas</span>
                  {selectedDomains.size > 0 && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{selectedDomains.size} seleccionadas</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {companies.length > 0 && (
                    <button onClick={irAContactos}
                      className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-all">
                      <Users size={11} />
                      Buscar contactos{selectedDomains.size > 0 ? ` (${selectedDomains.size})` : ""}
                    </button>
                  )}
                  <button onClick={downloadJson} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                    <Download size={11} /> JSON
                  </button>
                  <button onClick={downloadCsv} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                    <Download size={11} /> CSV
                  </button>
                  <button onClick={copyAllDomains} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                    <Copy size={11} />{copied === "all" ? "¡Copiado!" : "Copiar dominios"}
                  </button>
                </div>
              </div>

              {companyDomains.length === 0 ? (
                <div className="px-6 py-10 text-center"><p className="text-sm text-gray-400">N8N respondió pero no devolvió resultados.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-2.5 w-10">
                          <input type="checkbox"
                            checked={selectedDomains.size === companies.filter(c => c.domain).length && companies.length > 0}
                            onChange={toggleAllDomains}
                            className="w-3.5 h-3.5 accent-indigo-600" />
                        </th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5 w-8">#</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Empresa</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Industrias</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Revenue</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Empleados</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">País</th>
                        <th className="px-4 py-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(companies.length > 0 ? companies : companyDomains.map(d => ({ domain: d }))).map((company, idx) => (
                        <tr key={company.domain ?? idx}
                          onClick={() => company.domain && toggleDomain(company.domain)}
                          className={`hover:bg-gray-50 transition-colors group cursor-pointer ${selectedDomains.has(company.domain) ? "bg-indigo-50/40" : ""}`}>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            {company.domain && (
                              <input type="checkbox" checked={selectedDomains.has(company.domain)} onChange={() => toggleDomain(company.domain)}
                                className="w-3.5 h-3.5 accent-indigo-600" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-300 font-mono">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 leading-tight">{company.name ?? company.domain}</p>
                            {company.name && (
                              <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                className="text-xs text-gray-400 hover:text-indigo-600 font-mono">{company.domain}</a>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(company.industries ?? []).slice(0, 3).map(ind => (
                                <span key={ind} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ind}</span>
                              ))}
                              {(company.industries ?? []).length > 3 && <span className="text-xs text-gray-400">+{company.industries.length - 3}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">{company.revenue ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{company.employeeCount != null ? company.employeeCount : "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 uppercase">{(company.countries ?? []).join(", ") || "—"}</td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <a href={`https://${company.domain}`} target="_blank" rel="noreferrer"
                                className="text-gray-300 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50"><ExternalLink size={11} /></a>
                              <button onClick={() => copyDomain(company.domain, idx)}
                                className="text-gray-300 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 text-xs">
                                {copied === idx ? "✓" : <Copy size={11} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Historial empresas (cuando no hay resultado activo) */}
          {savedCompanies.length > 0 && !resultado && (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800">Empresas guardadas</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{savedCompanies.length}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Empresa</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Revenue</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Empleados</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">País</th>
                      <th className="px-4 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {savedCompanies.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-sm">{c.nombre || c.domain}</p>
                          <a href={`https://${c.domain}`} target="_blank" rel="noreferrer"
                            className="text-xs text-gray-400 hover:text-indigo-600 font-mono">{c.domain}</a>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{c.revenue || "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{c.employee_count ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 uppercase">{(c.countries ?? []).join(", ") || "—"}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteCompany(c.id)}
                            className="opacity-0 group-hover:opacity-100 transition-all p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: CONTACTOS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "contactos" && (
        <>
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={15} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-800">Búsqueda de contactos</h2>
            </div>
            <div className="px-6 py-5 space-y-5">

              {/* Empresas pre-cargadas */}
              {preselectedCompanies.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                    Empresas objetivo <span className="text-indigo-400 normal-case font-normal">· desde búsqueda anterior</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {preselectedCompanies.map(c => (
                      <span key={c.domain} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                        {c.name ?? c.nombre ?? c.domain}
                        <button onClick={() => removePreselected(c.domain)} className="ml-0.5 text-indigo-400 hover:text-indigo-700 leading-none">×</button>
                      </span>
                    ))}
                  </div>
                  <button onClick={() => setPreselectedCompanies([])} className="text-xs text-gray-400 hover:text-red-500 mt-1.5 transition-all">
                    Limpiar empresas
                  </button>
                </div>
              )}

              {/* Personas */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Personas / Roles</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {KEY_PERSONAS.map(p => (
                    <button key={p} onClick={() => contactPersonas.includes(p) ? removePersona(p) : addPersona(p)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${contactPersonas.includes(p) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                      {p}
                    </button>
                  ))}
                </div>
                <input value={contactPersonaInput} onChange={e => setContactPersonaInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPersona(); } }}
                  placeholder="Otro rol personalizado… (Enter para añadir)"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                {contactPersonas.filter(p => !KEY_PERSONAS.includes(p)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {contactPersonas.filter(p => !KEY_PERSONAS.includes(p)).map(p => (
                      <span key={p} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                        {p}<button onClick={() => removePersona(p)} className="ml-0.5 text-indigo-400 hover:text-indigo-700 leading-none">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Nº resultados */}
              <div className="max-w-xs">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Nº de resultados</label>
                <div className="flex gap-1.5">
                  {[10, 20, 50, 100].map(n => (
                    <button key={n} onClick={() => setContactNumResults(n)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${contactNumResults === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Webhook */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Webhook N8N</label>
                <input value={contactWebhookUrl} onChange={e => setContactWebhookUrl(e.target.value)} onBlur={e => setWebhook('contacts', e.target.value)}
                  placeholder="https://tu-n8n.com/webhook/contacts"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
              </div>

              <button onClick={enviarContactos} disabled={contactLoading || !contactWebhookUrl.trim()}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  contactLoading ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                  : !contactWebhookUrl.trim() ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                {contactLoading
                  ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Buscando contactos...</>
                  : <><Users size={13} />Buscar contactos</>}
              </button>
            </div>
          </section>

          {contactError && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-xs text-red-600 font-mono">{contactError}</div>}

          {/* Resultados nuevos */}
          {contactResults && contactResults.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800">Nuevos contactos</h2>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    {contactResults.length} encontrados · guardados automáticamente
                  </span>
                </div>
                <button onClick={() => downloadContactsCsv(contactResults)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                  <Download size={11} /> CSV
                </button>
              </div>
              <ContactTable contacts={contactResults} onDelete={null} />
            </section>
          )}

          {/* Historial */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-800">Historial de contactos</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{filteredContacts.length}</span>
              </div>
              {savedContacts.length > 0 && (
                <button onClick={() => downloadContactsCsv(filteredContacts)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                  <Download size={11} /> CSV
                </button>
              )}
            </div>

            {savedContacts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users size={20} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">Aún no hay contactos guardados.</p>
                <p className="text-xs text-gray-300 mt-1">Lanza una búsqueda para poblar el historial.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-3 border-b border-gray-100">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                      placeholder="Buscar por nombre, cargo, email o empresa…"
                      className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                </div>
                {filteredContacts.length === 0
                  ? <div className="px-6 py-8 text-center"><p className="text-sm text-gray-400">No hay contactos que coincidan.</p></div>
                  : <ContactTable contacts={filteredContacts} onDelete={handleDeleteContact} />
                }
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
