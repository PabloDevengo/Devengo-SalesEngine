// ── UI Constants ──────────────────────────────────────────
// These are structural constants that define the app's navigation and layout.
// For business data (geografias, tamanos, angulos, prompts) see /public/data/*.json

export const NAV_ITEMS = [
  { id: "knowledge", label: "Playbook",       icon: "📖" },
  { id: "email",     label: "Email Verificator", icon: "✉️" },
  { id: "prospect",  label: "Prospección",     icon: "🔍" },
  { id: "campaigns", label: "Email Generator",   icon: "✍️" },
  { id: "meetings", label: "Reuniones",      icon: "🎙️" },
  { id: "config",   label: "Configuración", icon: "⚙️" },
];

export const MODULE_TITLES = {
  knowledge: { title: "Playbook",        sub: "Empresa, productos, clientes y competidores · base de todos los módulos" },
  email:     { title: "Email Verificator", sub: "Genera combinaciones y verifica la deliverability con Bouncer" },
  prospect:  { title: "Prospección",     sub: "Gestiona y enriquece tu pipeline de prospectos" },
  campaigns: { title: "Email Generator",  sub: "Genera emails personalizados con IA y súbelos a Instantly" },
  meetings:     { title: "Reuniones",     sub: "Transcripciones e inteligencia de reuniones" },
  config: { title: "Configuración", sub: "Ajustes y prompts de la aplicación" },
};

export const EMPTY_COMPANY = {
  nombre: "Devengo",
  web: "https://devengo.com",
  linkedin: "",
  descripcion: "",
  sede: "Madrid, España",
  alcanceGeografico: ["España"],
};
