import { createContext, useContext, useEffect } from "react";
import { useLocalStorage } from "../utils/storage";
import { useData } from "../utils/dataLoader";
import { EMPTY_COMPANY } from "../constants";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Persistent state (survives page reloads via localStorage) ──────────────
  const [company,        setCompany]        = useLocalStorage("se_company",        EMPTY_COMPANY);
  const [productos,      setProductos]      = useLocalStorage("se_productos",      []);
  const [clientes,       setClientes]       = useLocalStorage("se_clientes",       []);
  const [competidores,   setCompetidores]   = useLocalStorage("se_competidores",   []);

  // Prompts start as null until we know whether localStorage has a saved value.
  // null = "not yet set by the user"
  const [campaignPrompt, setCampaignPrompt] = useLocalStorage("se_campaignPrompt", null);
  const [meetingPrompt,  setMeetingPrompt]  = useLocalStorage("se_meetingPrompt",  null);
  const [emailPrompt,    setEmailPrompt]    = useLocalStorage("se_emailPrompt",    null);

  // ── Remote defaults (loaded from /public/data/prompts.json on GitHub) ──────
  // Editing prompts.json in GitHub and deploying will update the defaults for
  // everyone who hasn't manually overridden them.
  const { data: promptsData } = useData("prompts");

  useEffect(() => {
    if (!promptsData) return;
    // Only seed if the user hasn't saved a custom version yet
    if (campaignPrompt === null) setCampaignPrompt(promptsData.campaign);
    if (meetingPrompt  === null) setMeetingPrompt(promptsData.meeting);
    if (emailPrompt    === null) setEmailPrompt(promptsData.email);
  }, [promptsData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Context value ──────────────────────────────────────────────────────────
  return (
    <AppContext.Provider value={{
      // Company & catalogue
      company,        setCompany,
      productos,      setProductos,
      clientes,       setClientes,
      competidores,   setCompetidores,

      // Prompts (user value, falls back to "" while loading)
      campaignPrompt: campaignPrompt ?? "",
      setCampaignPrompt,
      meetingPrompt:  meetingPrompt  ?? "",
      setMeetingPrompt,
      emailPrompt:    emailPrompt    ?? "",
      setEmailPrompt,

      // Raw defaults from GitHub — used by the "Reset" button in ConfigModule
      defaultCampaignPrompt: promptsData?.campaign ?? "",
      defaultMeetingPrompt:  promptsData?.meeting  ?? "",
      defaultEmailPrompt:    promptsData?.email    ?? "",
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
