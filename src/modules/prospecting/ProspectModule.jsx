import { useState } from "react";
import { Zap, Copy, Download, ExternalLink } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useData } from "../../utils/dataLoader";

const REVENUES = ["0-1M", "1-10M", "10-50M", "50-100M", "100-500M", "500-1000M", ">1000M"];

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

export default function ProspectModule() {
  const { clientes } = useApp();
  const { data: geografias = [] } = useData("geografias");
  const { data: tamanos    = [] } = useData("tamanos");

  const [industries,     setIndustries]     = useState([]);
  const [industriaInput, setIndustriaInput] = useState("");
  const [showIndustrySuggestions, setShowIndustrySuggestions] = useState(false);
  const [geos,           setGeos]           = useState(["España"]);
  const [tamanosSel,     setTamanosSel]     = useState([]);
  const [revenues,       setRevenues]       = useState([]);
  const [lookalike,      setLookalike]      = useState("");
  const [numResults,     setNumResults]     = useState(20);
  const [webhookUrl,     setWebhookUrl]     = useState(import.meta.env.VITE_N8N_PROSPECT_WEBHOOK || "");
  const [showJson,       setShowJson]       = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [copied,         setCopied]         = useState(false);
  const [resultado,      setResultado]      = useState(null);

  const toggleGeo     = (g) => setGeos(gs => gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]);
  const toggleTamano  = (t) => setTamanosSel(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);
  const toggleRevenue = (r) => setRevenues(rs => rs.includes(r) ? rs.filter(x => x !== r) : [...rs, r]);
  const clientesPublicos = clientes.filter(c => c.visibilidad === "publico");

  const addIndustria = (val) => {
    const v = (val || industriaInput).trim();
    if (v && !industries.includes(v)) setIndustries(prev => [...prev, v]);
    setIndustriaInput("");
    setShowIndustrySuggestions(false);
  };
  const removeIndustria = (ind) => setIndustries(prev => prev.filter(x => x !== ind));
  const handleIndustriaKey = (e) => {
    if (e.key === "Escape") { setShowIndustrySuggestions(false); return; }
    const suggestions = SURFE_INDUSTRIES.filter(i =>
      i.toLowerCase().includes(industriaInput.toLowerCase()) && !industries.includes(i)
    );
    if (e.key === "Enter") { e.preventDefault(); if (suggestions.length > 0) addIndustria(suggestions[0]); }
  };
  const industrySuggestions = industriaInput.length >= 1
    ? SURFE_INDUSTRIES.filter(i => i.toLowerCase().includes(industriaInput.toLowerCase()) && !industries.includes(i)).slice(0, 8)
    : [];

  const buildPayload = () => ({
    tipo: "empresa",
    industries,
    geografias: geos,
    tamanos: tamanosSel,
    revenues,
    lookalike: lookalike || null,
    lookalike_data: lookalike ? clientes.find(c => c.nombre === lookalike) || null : null,
    num_resultados: numResults,
  });

  const payloadJson = JSON.stringify(buildPayload(), null, 2);
  const canSend = industries.length > 0 || lookalike;

  const copyJson = () => { navigator.clipboard.writeText(payloadJson).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const enviar = async () => {
    if (!webhookUrl.trim()) { setError("Pega la URL del webhook de N8N."); return; }
    setLoading(true); setError(null); setResultado(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const res = await fetch(webhookUrl.trim(), {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      clearTimeout(timeout);
      if (!res.ok) { setError(`Error HTTP ${res.status} desde N8N.`); return; }
      const data = await res.json();
      const root = Array.isArray(data) ? data[0] : data;
      const companies    = root?.companies    ?? [];
      const companyDomains = root?.companyDomains ?? companies.map(c => c.domain).filter(Boolean);
      setResultado({ companies, companyDomains, raw: data });
    } catch (e) {
      setError(e.name === "AbortError" ? "Timeout: N8N tardó más de 90s." : `Error de red: ${e.message}`);
    } finally { setLoading(false); }
  };

  // ── Result helpers ────────────────────────────────────────
  const companies      = resultado?.companies      ?? [];
  const companyDomains = resultado?.companyDomains ?? [];

  const copyDomain = (d, idx) => {
    navigator.clipboard.writeText(d).catch(() => {});
    setCopied(idx); setTimeout(() => setCopied(null), 1500);
  };
  const copyAllDomains = () => {
    navigator.clipboard.writeText(companyDomains.join("\n")).catch(() => {});
    setCopied("all"); setTimeout(() => setCopied(null), 1500);
  };
  const downloadCsv = () => {
    const headers = "#,nombre,dominio,industrias,revenue,empleados,paises";
    const rows = companies.length > 0
      ? companies.map((c, i) => [
          i + 1,
          `"${c.name ?? ""}"`,
          c.domain ?? "",
          `"${(c.industries ?? []).join("; ")}"`,
          c.revenue ?? "",
          c.employeeCount ?? "",
          `"${(c.countries ?? []).join("; ")}"`,
        ].join(","))
      : companyDomains.map((d, i) => `${i + 1},,${d},,,,`);
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "prospectos.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(resultado.raw, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "prospectos.json"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="px-8 py-6 max-w-3xl w-full space-y-5">

      {/* ── Formulario ── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="text-base">🔍</span>
          <h2 className="text-sm font-semibold text-gray-800">Búsqueda de empresas</h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Industrias</label>
            <div className="relative">
              <input
                value={industriaInput}
                onChange={e => { setIndustriaInput(e.target.value); setShowIndustrySuggestions(true); }}
                onFocus={() => setShowIndustrySuggestions(true)}
                onBlur={() => setTimeout(() => setShowIndustrySuggestions(false), 150)}
                onKeyDown={handleIndustriaKey}
                placeholder="Buscar industria…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {showIndustrySuggestions && industrySuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {industrySuggestions.map(ind => (
                    <button key={ind} onMouseDown={() => addIndustria(ind)}
                      className="w-full text-left text-sm px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                      {ind}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {industries.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {industries.map(ind => (
                  <span key={ind} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                    {ind}
                    <button onClick={() => removeIndustria(ind)} className="ml-0.5 text-indigo-400 hover:text-indigo-700 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

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

      {/* ── Payload + envío ── */}
      {canSend && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">JSON payload</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">listo para N8N</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowJson(s => !s)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">{showJson ? "Ocultar" : "Ver JSON"}</button>
              <button onClick={copyJson} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Copy size={11} />{copied === true ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
          {showJson && <pre className="px-6 py-4 text-xs font-mono text-gray-600 bg-gray-50 overflow-x-auto">{payloadJson}</pre>}
          <div className="px-6 py-4 border-t border-gray-100 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Webhook URL</label>
              <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://tu-n8n.com/webhook/..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
            </div>
            <button onClick={enviar} disabled={loading || !webhookUrl.trim()}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                loading ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                : !webhookUrl.trim() ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
              {loading
                ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Buscando empresas...</>
                : <><Zap size={13} />{webhookUrl.trim() ? "Enviar a N8N" : "Pega la URL para enviar"}</>}
            </button>
          </div>
        </section>
      )}

      {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-xs text-red-600 font-mono">{error}</div>}

      {/* ── Resultados ── */}
      {resultado && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">Resultados</h2>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{companyDomains.length} empresas</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={downloadJson} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Download size={11} /> JSON
              </button>
              <button onClick={downloadCsv} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Download size={11} /> CSV
              </button>
              <button onClick={copyAllDomains} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                <Copy size={11} />{copied === "all" ? "¡Copiado!" : "Copiar todos"}
              </button>
            </div>
          </div>

          {companyDomains.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-400">N8N respondió pero no devolvió resultados.</p>
            </div>
          ) : companies.length > 0 ? (
            // Rich company cards
            <div className="divide-y divide-gray-50">
              {companies.map((company, idx) => (
                <div key={company.domain ?? idx} className="px-6 py-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-xs text-gray-300 font-mono w-5 shrink-0 text-right mt-0.5">{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800">{company.name ?? company.domain}</p>
                          <span className="text-xs text-gray-400 font-mono">{company.domain}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-400">
                          {company.employeeCount != null && (
                            <span>👥 {company.employeeCount} empleados</span>
                          )}
                          {company.revenue && (
                            <span>💰 {company.revenue}</span>
                          )}
                          {(company.countries ?? []).length > 0 && (
                            <span>📍 {company.countries.join(", ").toUpperCase()}</span>
                          )}
                        </div>
                        {(company.industries ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {company.industries.slice(0, 4).map(ind => (
                              <span key={ind} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{ind}</span>
                            ))}
                            {company.industries.length > 4 && (
                              <span className="text-xs text-gray-400">+{company.industries.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5">
                      <a href={`https://${company.domain}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">
                        <ExternalLink size={11} />
                      </a>
                      <button onClick={() => copyDomain(company.domain, idx)}
                        className="flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">
                        <Copy size={11} />{copied === idx ? "✓" : "Copiar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Fallback: plain domain list
            <div className="divide-y divide-gray-50">
              {companyDomains.map((domain, idx) => (
                <div key={domain} className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-gray-300 font-mono w-5 shrink-0 text-right">{idx + 1}</span>
                    <p className="text-sm font-medium text-gray-800 truncate">{domain}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <a href={`https://${domain}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">
                      <ExternalLink size={11} />
                    </a>
                    <button onClick={() => copyDomain(domain, idx)}
                      className="flex items-center gap-1 text-xs text-gray-300 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">
                      <Copy size={11} />{copied === idx ? "✓" : "Copiar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
