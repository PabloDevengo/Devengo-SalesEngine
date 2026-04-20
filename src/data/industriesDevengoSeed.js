// ── Industry Devengo — seed canónico (55 verticales internas) ────────────────
// Taxonomía Devengo aprobada internamente. Cada vertical mapea 1..N a:
//   · surfe_industries[]  → industrias que Surfe reconoce (taxonomía tipo
//                           LinkedIn). Se envían tal cual al buscar empresas.
//   · serper_keywords[]   → queries Google/Serper para el flujo "Contactos
//                           por industria".
//
// Ambos arrays son editables desde Playbook → Verticales · Industry Devengo.

export const INDUSTRIES_DEVENGO_SEED = [

  // ══════════════════════════════════════════════════════════════════════
  //  PAYMENTS
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "fintech-adquirer",
    label: "Fintech - Adquirer",
    category: "Payments",
    descripcion: "Adquirentes de tarjeta — procesan pagos para comercios.",
    surfe_industries: ["Financial Services", "Banking"],
    serper_keywords: ["card acquirer", "merchant acquirer", "payment acquirer", "acquiring bank"],
  },
  {
    id: "fintech-card-processor",
    label: "Fintech - Card Processor",
    category: "Payments",
    descripcion: "Procesadores de tarjeta — routing, autorización, clearing.",
    surfe_industries: ["Financial Services", "Information Technology and Services"],
    serper_keywords: ["card processor", "payment processor", "card processing platform"],
  },
  {
    id: "fintech-emi",
    label: "Fintech - EMI",
    category: "Payments",
    descripcion: "Electronic Money Institutions — emisión y custodia de dinero electrónico.",
    surfe_industries: ["Financial Services", "Banking"],
    serper_keywords: ["electronic money institution", "EMI license", "e-money provider"],
  },
  {
    id: "fintech-issuer",
    label: "Fintech - Issuer",
    category: "Payments",
    descripcion: "Emisores de tarjeta — consumer, corporate, virtual cards.",
    surfe_industries: ["Financial Services", "Banking"],
    serper_keywords: ["card issuer", "card issuing platform", "virtual card issuing", "BIN sponsor"],
  },
  {
    id: "fintech-psp",
    label: "Fintech - PSP",
    category: "Payments",
    descripcion: "Payment Service Providers — gateway + adquirencia empaquetada.",
    surfe_industries: ["Financial Services"],
    serper_keywords: ["payment service provider", "PSP platform", "payment gateway"],
  },
  {
    id: "payments-orchestrator",
    label: "Payments Orchestrator",
    category: "Payments",
    descripcion: "Orquestadores multi-PSP — routing dinámico, smart retries.",
    surfe_industries: ["Financial Services", "Information Technology and Services"],
    serper_keywords: ["payment orchestration", "payments orchestrator", "payment routing platform"],
  },
  {
    id: "cross-border-fx",
    label: "Cross Border - FX",
    category: "Payments",
    descripcion: "FX y divisas cross-border — mesas de FX, liquidity providers.",
    surfe_industries: ["Financial Services", "Capital Markets"],
    serper_keywords: ["cross border FX", "foreign exchange platform", "FX provider", "currency conversion"],
  },
  {
    id: "cross-border-psp",
    label: "Cross Border - PSP",
    category: "Payments",
    descripcion: "PSPs especializados en pagos internacionales y payouts multidivisa.",
    surfe_industries: ["Financial Services"],
    serper_keywords: ["cross border payments", "international payments platform", "multi-currency PSP"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  REMITTANCES & MONEY TRANSFER
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "mtos",
    label: "MTOs",
    category: "Remittances & Money Transfer",
    descripcion: "Money Transfer Operators — envío de dinero retail internacional.",
    surfe_industries: ["Financial Services"],
    serper_keywords: ["money transfer operator", "MTO", "international money transfer"],
  },
  {
    id: "remittances",
    label: "Remittances",
    category: "Remittances & Money Transfer",
    descripcion: "Remesas — envío peer-to-peer entre países, corredores específicos.",
    surfe_industries: ["Financial Services"],
    serper_keywords: ["remittance platform", "remittance service", "cross border remittances"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  BANKING & BAAS
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "banking",
    label: "Banking",
    category: "Banking & BaaS",
    descripcion: "Bancos tradicionales, neobancos, challenger banks.",
    surfe_industries: ["Banking", "Financial Services"],
    serper_keywords: ["commercial bank", "retail bank", "neobank", "digital bank", "challenger bank"],
  },
  {
    id: "baas-licensed",
    label: "Baas - Licensed",
    category: "Banking & BaaS",
    descripcion: "Banking-as-a-Service con licencia bancaria propia.",
    surfe_industries: ["Banking", "Financial Services"],
    serper_keywords: ["banking as a service", "licensed BaaS", "BaaS with banking license"],
  },
  {
    id: "baas-unlicensed",
    label: "Baas - Unlicensed",
    category: "Banking & BaaS",
    descripcion: "BaaS sin licencia — operan vía partner bancario.",
    surfe_industries: ["Financial Services", "Information Technology and Services"],
    serper_keywords: ["banking as a service", "embedded finance", "BaaS platform", "embedded banking"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  OPEN BANKING
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "fintech-ais",
    label: "Fintech - AIS",
    category: "Open Banking",
    descripcion: "Account Information Service providers — agregación de cuentas.",
    surfe_industries: ["Financial Services", "Information Technology and Services"],
    serper_keywords: ["account information service", "AIS provider", "open banking data", "account aggregation"],
  },
  {
    id: "fintech-pisp",
    label: "Fintech - PISP",
    category: "Open Banking",
    descripcion: "Payment Initiation Service providers — pagos A2A vía open banking.",
    surfe_industries: ["Financial Services", "Information Technology and Services"],
    serper_keywords: ["payment initiation service", "PISP provider", "open banking payments", "A2A payments"],
  },
  {
    id: "fintech-ais-pisp",
    label: "Fintech - AIS + PISP",
    category: "Open Banking",
    descripcion: "Proveedores completos AIS + PISP — datos y pagos.",
    surfe_industries: ["Financial Services", "Information Technology and Services"],
    serper_keywords: ["open banking platform", "AIS PISP provider", "open banking API"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  LENDING & CREDIT
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "lending",
    label: "Lending",
    category: "Lending & Credit",
    descripcion: "Préstamos — consumer, SME, hipotecario.",
    surfe_industries: ["Financial Services", "Banking"],
    serper_keywords: ["lending platform", "online lender", "digital lending", "SME lending"],
  },
  {
    id: "lending-bnpl",
    label: "Lending - BNPL",
    category: "Lending & Credit",
    descripcion: "Buy Now Pay Later — pago fraccionado en el checkout.",
    surfe_industries: ["Financial Services"],
    serper_keywords: ["buy now pay later", "BNPL", "split payments", "installment payments"],
  },
  {
    id: "lending-factoring",
    label: "Lending - Factoring",
    category: "Lending & Credit",
    descripcion: "Factoring — adelanto de facturas B2B.",
    surfe_industries: ["Financial Services"],
    serper_keywords: ["invoice factoring", "factoring platform", "accounts receivable financing"],
  },
  {
    id: "lending-rbf",
    label: "Lending - Revenue Based Financing",
    category: "Lending & Credit",
    descripcion: "Financiación basada en ingresos — RBF para SaaS/ecommerce.",
    surfe_industries: ["Financial Services", "Venture Capital & Private Equity"],
    serper_keywords: ["revenue based financing", "RBF", "non-dilutive financing"],
  },
  {
    id: "microlending",
    label: "Microlending",
    category: "Lending & Credit",
    descripcion: "Microcréditos — ticket pequeño, consumer o SME.",
    surfe_industries: ["Financial Services"],
    serper_keywords: ["microlending", "microloan", "microfinance platform"],
  },
  {
    id: "salary-advance",
    label: "Salary Advance",
    category: "Lending & Credit",
    descripcion: "Adelanto de nómina — Earned Wage Access.",
    surfe_industries: ["Financial Services", "Human Resources"],
    serper_keywords: ["salary advance", "earned wage access", "EWA", "on-demand pay"],
  },
  {
    id: "debt-recovery-services",
    label: "Debt Recovery Services",
    category: "Lending & Credit",
    descripcion: "Cobranza y recuperación de deudas — B2C y B2B.",
    surfe_industries: ["Financial Services", "Legal Services"],
    serper_keywords: ["debt collection", "debt recovery", "collections platform"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  INVESTMENT & CAPITAL
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "fund",
    label: "Fund",
    category: "Investment & Capital",
    descripcion: "Fondos de inversión — VC, PE, hedge, asset management.",
    surfe_industries: ["Venture Capital & Private Equity", "Investment Management", "Capital Markets"],
    serper_keywords: ["venture capital fund", "private equity fund", "investment fund", "asset management"],
  },
  {
    id: "investment-services",
    label: "Investment Services",
    category: "Investment & Capital",
    descripcion: "Brokers, wealth management, robo-advisors, trading platforms.",
    surfe_industries: ["Investment Management", "Capital Markets", "Financial Services"],
    serper_keywords: ["investment platform", "wealth management", "robo-advisor", "trading platform", "brokerage"],
  },
  {
    id: "crowdfunding",
    label: "Crowdfunding",
    category: "Investment & Capital",
    descripcion: "Plataformas de crowdfunding — equity, lending, rewards.",
    surfe_industries: ["Financial Services", "Internet"],
    serper_keywords: ["crowdfunding platform", "equity crowdfunding", "crowdlending"],
  },
  {
    id: "crypto",
    label: "Crypto",
    category: "Investment & Capital",
    descripcion: "Exchanges, custodios, wallets, infra cripto y Web3.",
    surfe_industries: ["Financial Services", "Computer Software"],
    serper_keywords: ["cryptocurrency exchange", "crypto wallet", "crypto custody", "digital assets platform"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  INSURANCE
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "insurtech",
    label: "Insurtech",
    category: "Insurance",
    descripcion: "Aseguradoras digitales y plataformas insurtech.",
    surfe_industries: ["Insurance"],
    serper_keywords: ["insurtech", "digital insurance", "insurance platform", "online insurance"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  B2B FINANCE & OPS
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "accounts-payable-platform",
    label: "Accounts Payable Platform",
    category: "B2B Finance & Ops",
    descripcion: "Automatización de cuentas a pagar / AP.",
    surfe_industries: ["Financial Services", "Accounting", "Computer Software"],
    serper_keywords: ["accounts payable platform", "AP automation", "invoice processing software"],
  },
  {
    id: "accounts-receivable-platform",
    label: "Accounts Receivable Platform",
    category: "B2B Finance & Ops",
    descripcion: "Automatización de cuentas a cobrar / AR.",
    surfe_industries: ["Financial Services", "Accounting", "Computer Software"],
    serper_keywords: ["accounts receivable platform", "AR automation", "invoice collections software"],
  },
  {
    id: "treasury-management",
    label: "Treasury Management",
    category: "B2B Finance & Ops",
    descripcion: "Plataformas de tesorería corporativa — cash management, liquidez.",
    surfe_industries: ["Financial Services", "Computer Software"],
    serper_keywords: ["treasury management", "corporate treasury platform", "cash management software"],
  },
  {
    id: "tax-tech",
    label: "Tax Tech",
    category: "B2B Finance & Ops",
    descripcion: "Software fiscal — compliance, reporting, indirect tax.",
    surfe_industries: ["Accounting", "Computer Software", "Financial Services"],
    serper_keywords: ["tax technology", "tax automation", "tax compliance software", "VAT software"],
  },
  {
    id: "payroll",
    label: "Payroll",
    category: "B2B Finance & Ops",
    descripcion: "Plataformas de nómina — local y global.",
    surfe_industries: ["Human Resources", "Computer Software"],
    serper_keywords: ["payroll platform", "payroll software", "global payroll", "HRIS payroll"],
  },
  {
    id: "employee-benefits",
    label: "Employee Benefits",
    category: "B2B Finance & Ops",
    descripcion: "Beneficios para empleados — flexible benefits, wellness, comida.",
    surfe_industries: ["Human Resources", "Insurance"],
    serper_keywords: ["employee benefits platform", "flexible benefits", "employee rewards"],
  },
  {
    id: "software-erp",
    label: "Software/ERP",
    category: "B2B Finance & Ops",
    descripcion: "ERPs, SaaS financiero y operativo B2B.",
    surfe_industries: ["Computer Software", "Information Technology and Services"],
    serper_keywords: ["ERP software", "enterprise resource planning", "business management software"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  IDENTITY & COMPLIANCE
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "id-verification-solutions",
    label: "ID and Verification Solutions",
    category: "Identity & Compliance",
    descripcion: "KYC, KYB, AML, identity verification, document checks.",
    surfe_industries: ["Computer Software", "Information Technology and Services", "Financial Services"],
    serper_keywords: ["identity verification", "KYC platform", "KYB provider", "AML software", "document verification"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  PROFESSIONAL SERVICES
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "consulting-services",
    label: "Consulting Services",
    category: "Professional Services",
    descripcion: "Consultoras de negocio, tecnología y estrategia.",
    surfe_industries: ["Management Consulting", "Information Technology and Services"],
    serper_keywords: ["management consulting", "business consulting", "strategy consulting", "IT consulting"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  MARKETPLACE
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "marketplace-content-creators",
    label: "Marketplace - Content Creators",
    category: "Marketplace",
    descripcion: "Marketplaces de creators — monetización, suscripciones, fan platforms.",
    surfe_industries: ["Internet", "Media Production", "Entertainment"],
    serper_keywords: ["creator economy platform", "content creator marketplace", "creator monetization"],
  },
  {
    id: "marketplace-products",
    label: "Marketplace - Products",
    category: "Marketplace",
    descripcion: "Marketplaces de productos físicos — retail multi-vendor.",
    surfe_industries: ["Internet", "Retail", "Consumer Goods"],
    serper_keywords: ["product marketplace", "multi-vendor marketplace", "online marketplace"],
  },
  {
    id: "marketplace-services",
    label: "Marketplace - Services",
    category: "Marketplace",
    descripcion: "Marketplaces de servicios — home, local, on-demand.",
    surfe_industries: ["Internet", "Consumer Services"],
    serper_keywords: ["services marketplace", "on-demand services", "service platform"],
  },
  {
    id: "marketplace-talent",
    label: "Marketplace - Talent",
    category: "Marketplace",
    descripcion: "Marketplaces de talento — freelance, gig, staffing.",
    surfe_industries: ["Staffing and Recruiting", "Internet", "Human Resources"],
    serper_keywords: ["talent marketplace", "freelance platform", "gig economy platform"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  COMMERCE & DELIVERY
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "ecommerce",
    label: "Ecommerce",
    category: "Commerce & Delivery",
    descripcion: "Retailers online, D2C, marketplaces verticales.",
    surfe_industries: ["Retail", "Internet", "Consumer Goods"],
    serper_keywords: ["ecommerce", "online retailer", "D2C brand", "online store"],
  },
  {
    id: "delivery-services",
    label: "Delivery Services",
    category: "Commerce & Delivery",
    descripcion: "Entrega última milla — food, grocery, parcel.",
    surfe_industries: ["Package/Freight Delivery", "Logistics and Supply Chain", "Consumer Services"],
    serper_keywords: ["delivery service", "last mile delivery", "food delivery", "grocery delivery"],
  },
  {
    id: "loyalty-cashback",
    label: "Loyalty/Cashback",
    category: "Commerce & Delivery",
    descripcion: "Programas de fidelización, cashback, rewards.",
    surfe_industries: ["Marketing and Advertising", "Internet", "Financial Services"],
    serper_keywords: ["loyalty program platform", "cashback app", "rewards platform"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  REAL ESTATE
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "prop-tech",
    label: "Prop Tech",
    category: "Real Estate",
    descripcion: "Proptech — marketplaces, SaaS inmobiliario, iBuyers.",
    surfe_industries: ["Real Estate", "Computer Software"],
    serper_keywords: ["proptech", "real estate technology", "property tech platform"],
  },
  {
    id: "property-management",
    label: "Property Management",
    category: "Real Estate",
    descripcion: "Gestión de propiedades — residential, commercial, short-term.",
    surfe_industries: ["Real Estate", "Commercial Real Estate"],
    serper_keywords: ["property management", "property manager", "rental management platform"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  MOBILITY & LOGISTICS
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "logistics",
    label: "Logistics",
    category: "Mobility & Logistics",
    descripcion: "Logística y supply chain — freight, warehousing, 3PL.",
    surfe_industries: ["Logistics and Supply Chain", "Transportation/Trucking/Railroad"],
    serper_keywords: ["logistics provider", "supply chain platform", "freight forwarder", "3PL"],
  },
  {
    id: "mobility",
    label: "Mobility",
    category: "Mobility & Logistics",
    descripcion: "Mobility — ride-hailing, shared mobility, EV, MaaS.",
    surfe_industries: ["Automotive", "Transportation/Trucking/Railroad", "Internet"],
    serper_keywords: ["mobility platform", "ride hailing", "shared mobility", "mobility as a service"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  UTILITIES & TELECOM
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "electricity-gas",
    label: "Electricity/Gas",
    category: "Utilities & Telecom",
    descripcion: "Utilities — comercializadoras, distribuidoras, energías renovables.",
    surfe_industries: ["Utilities", "Oil & Energy", "Renewables & Environment"],
    serper_keywords: ["electricity provider", "gas utility", "energy retailer", "utility company"],
  },
  {
    id: "telecom",
    label: "Telecom",
    category: "Utilities & Telecom",
    descripcion: "Operadores de telecomunicaciones — móvil, fijo, ISPs.",
    surfe_industries: ["Telecommunications"],
    serper_keywords: ["telecom operator", "telecommunications company", "mobile operator", "ISP"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  VERTICAL INDUSTRIES
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "education",
    label: "Education",
    category: "Vertical Industries",
    descripcion: "Edtech, escuelas, universidades, e-learning.",
    surfe_industries: ["Education Management", "E-Learning", "Higher Education"],
    serper_keywords: ["edtech", "online education platform", "e-learning", "education technology"],
  },
  {
    id: "travel",
    label: "Travel",
    category: "Vertical Industries",
    descripcion: "OTAs, aerolíneas, hoteles, alojamiento, travel tech.",
    surfe_industries: ["Leisure, Travel & Tourism", "Hospitality", "Airlines/Aviation"],
    serper_keywords: ["travel platform", "OTA", "online travel agency", "travel tech"],
  },
  {
    id: "sports",
    label: "Sports",
    category: "Vertical Industries",
    descripcion: "Clubs, ligas, media deportivo, sportstech.",
    surfe_industries: ["Sports", "Entertainment"],
    serper_keywords: ["sports platform", "sportstech", "sports club", "sports league"],
  },
  {
    id: "gambling",
    label: "Gambling",
    category: "Vertical Industries",
    descripcion: "Gambling — casinos online, sportsbooks, lottery.",
    surfe_industries: ["Gambling & Casinos"],
    serper_keywords: ["online gambling", "sportsbook", "online casino", "igaming"],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  OTHER
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "other",
    label: "Other",
    category: "Other",
    descripcion: "Vertical no categorizada — usar libremente.",
    surfe_industries: [],
    serper_keywords: [],
  },
];

// Helper: agrupar por categoría para UI
export function groupByCategory(list) {
  const groups = {};
  for (const item of list) {
    const cat = item.category || "Other";
    (groups[cat] ??= []).push(item);
  }
  return groups;
}
