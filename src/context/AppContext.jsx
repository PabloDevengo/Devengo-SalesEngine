import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useData } from "../utils/dataLoader";
import { EMPTY_COMPANY } from "../constants";
import { getCompany, updateCompany } from "../services/companyService";
import { getProducts, saveProduct, deleteProduct } from "../services/productsService";
import { getClients, saveClient, deleteClient } from "../services/clientsService";
import { getCompetitors, saveCompetitor, deleteCompetitor } from "../services/competitorsService";
import { getPrompts, setPrompt } from "../services/promptsService";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Local state (loaded from Supabase on mount) ────────────────────────────
  const [company,        setCompanyState]        = useState(EMPTY_COMPANY);
  const [productos,      setProductosState]      = useState([]);
  const [clientes,       setClientesState]       = useState([]);
  const [competidores,   setCompetidoresState]   = useState([]);
  const [campaignPrompt, setCampaignPromptState] = useState(null);
  const [meetingPrompt,  setMeetingPromptState]  = useState(null);
  const [emailPrompt,    setEmailPromptState]    = useState(null);
  const [dbLoading,      setDbLoading]           = useState(true);

  // ── Remote defaults (from /public/data/prompts.json) ──────────────────────
  const { data: promptsData } = useData("prompts");

  // ── Load all data from Supabase on mount ───────────────────────────────────
  useEffect(() => {
    Promise.all([
      getCompany(),
      getProducts(),
      getClients(),
      getCompetitors(),
      getPrompts(),
    ])
      .then(([co, prods, clients, comps, prompts]) => {
        if (co) setCompanyState(co);
        setProductosState(prods);
        setClientesState(clients);
        setCompetidoresState(comps);
        if (prompts.campaign !== null) setCampaignPromptState(prompts.campaign);
        if (prompts.meeting  !== null) setMeetingPromptState(prompts.meeting);
        if (prompts.email    !== null) setEmailPromptState(prompts.email);
      })
      .catch(err => console.error("[AppContext] Supabase load failed:", err))
      .finally(() => setDbLoading(false));
  }, []);

  // ── Seed prompts from JSON if not customised yet ───────────────────────────
  useEffect(() => {
    if (!promptsData) return;
    if (campaignPrompt === null) setCampaignPromptState(promptsData.campaign);
    if (meetingPrompt  === null) setMeetingPromptState(promptsData.meeting);
    if (emailPrompt    === null) setEmailPromptState(promptsData.email);
  }, [promptsData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Company setter (optimistic + sync) ────────────────────────────────────
  const setCompany = useCallback(async (val) => {
    setCompanyState(val);
    try { await updateCompany(val); }
    catch (e) { console.error("[company] sync error", e); }
  }, []);

  // ── Products setter (diff + sync) ─────────────────────────────────────────
  const setProductos = useCallback(async (newList) => {
    setProductosState(prev => {
      // Run sync in background with the previous value for diffing
      _syncProducts(prev, newList);
      return newList;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function _syncProducts(oldList, newList) {
    const oldMap = new Map(oldList.map(p => [p.id, p]));
    const newMap = new Map(newList.map(p => [p.id, p]));
    for (const [id] of oldMap) {
      if (!newMap.has(id)) {
        try { await deleteProduct(id); }
        catch (e) { console.error("[products] delete error", e); }
      }
    }
    for (const [, p] of newMap) {
      const old = oldMap.get(p.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(p)) {
        try { await saveProduct(p); }
        catch (e) { console.error("[products] save error", e); }
      }
    }
  }

  // ── Clientes setter ────────────────────────────────────────────────────────
  const setClientes = useCallback(async (newList) => {
    setClientesState(prev => {
      _syncClients(prev, newList);
      return newList;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function _syncClients(oldList, newList) {
    const oldMap = new Map(oldList.map(c => [c.id, c]));
    const newMap = new Map(newList.map(c => [c.id, c]));
    for (const [id] of oldMap) {
      if (!newMap.has(id)) {
        try { await deleteClient(id); }
        catch (e) { console.error("[clients] delete error", e); }
      }
    }
    for (const [, c] of newMap) {
      const old = oldMap.get(c.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(c)) {
        try { await saveClient(c); }
        catch (e) { console.error("[clients] save error", e); }
      }
    }
  }

  // ── Competidores setter ────────────────────────────────────────────────────
  const setCompetidores = useCallback(async (newList) => {
    setCompetidoresState(prev => {
      _syncCompetitors(prev, newList);
      return newList;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function _syncCompetitors(oldList, newList) {
    const oldMap = new Map(oldList.map(c => [c.id, c]));
    const newMap = new Map(newList.map(c => [c.id, c]));
    for (const [id] of oldMap) {
      if (!newMap.has(id)) {
        try { await deleteCompetitor(id); }
        catch (e) { console.error("[competitors] delete error", e); }
      }
    }
    for (const [, c] of newMap) {
      const old = oldMap.get(c.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(c)) {
        try { await saveCompetitor(c); }
        catch (e) { console.error("[competitors] save error", e); }
      }
    }
  }

  // ── Prompt setters ─────────────────────────────────────────────────────────
  const setCampaignPrompt = useCallback(async (val) => {
    setCampaignPromptState(val);
    try { await setPrompt("campaign", val); }
    catch (e) { console.error("[prompts] campaign sync error", e); }
  }, []);

  const setMeetingPrompt = useCallback(async (val) => {
    setMeetingPromptState(val);
    try { await setPrompt("meeting", val); }
    catch (e) { console.error("[prompts] meeting sync error", e); }
  }, []);

  const setEmailPrompt = useCallback(async (val) => {
    setEmailPromptState(val);
    try { await setPrompt("email", val); }
    catch (e) { console.error("[prompts] email sync error", e); }
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────
  return (
    <AppContext.Provider value={{
      dbLoading,

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
