// ── UI Constants ──────────────────────────────────────────
// These are structural constants that define the app's navigation and layout.
// For business data (geografias, tamanos, angulos, prompts) see /public/data/*.json

export const NAV_ITEMS = [
  { id: "knowledge", label: "Playbook",       icon: "📖" },
  { id: "email",     label: "Email Generator", icon: "✉️" },
  { id: "prospect",  label: "Prospección",     icon: "🔍" },
  { id: "campaigns", label: "Campañas",         icon: "📣" },
  { id: "meetings",      label: "Reuniones",        icon: "🎙️" },
  { id: "verification", label: "Verificación",    icon: "✅" },
  { id: "config",       label: "Configuración",   icon: "⚙️" },
];

export const MODULE_TITLES = {
  knowledge: { title: "Playbook",        sub: "Empresa, productos, clientes y competidores · base de todos los módulos" },
  email:     { title: "Email Generator", sub: "Genera combinaciones de email ordenadas por probabilidad" },
  prospect:  { title: "Prospección",     sub: "Gestiona y enriquece tu pipeline de prospectos" },
  campaigns: { title: "Campañas",        sub: "Genera secuencias de outbound con IA" },
  meetings:     { title: "Reuniones",     sub: "Transcripciones e inteligencia de reuniones" },
  verification: { title: "Verificación", sub: "Comprueba la deliverability de tus emails con Bouncer" },
  config:       { title: "Configuración", sub: "Ajustes y prompts de la aplicación" },
};

export const EMPTY_COMPANY = {
  nombre: "Devengo",
  web: "https://devengo.com",
  linkedin: "",
  descripcion: "",
  sede: "Madrid, España",
  alcanceGeografico: ["España"],
};
