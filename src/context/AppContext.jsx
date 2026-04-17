import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useData } from "../utils/dataLoader";
import { useLocalStorage } from "../utils/storage";
import { EMPTY_COMPANY } from "../constants";
import { getCompany, updateCompany } from "../services/companyService";
import { getProducts, saveProduct, deleteProduct } from "../services/productsService";
import { getClients, saveClient, deleteClient } from "../services/clientsService";
import { getCompetitors, saveCompetitor, deleteCompetitor } from "../services/competitorsService";
import { getPrompts, setPrompt } from "../services/promptsService";
import { getWebhooks, saveWebhook } from "../services/webhooksService";
import {
  ensureSeedLoaded as ensureIndustriesLoaded,
  saveIndustryDevengo,
  deleteIndustryDevengo,
} from "../services/industriesDevengoService";
import { dedupKey } from "../services/queuesService";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Local state (loaded from Supabase on mount) ────────────────────────────
  const [company,        setCompanyState]        = useState(EMPTY_COMPANY);
  const [productos,      setProductosState]      = useState([]);
  const [clientes,       setClientesState]       = useState([]);
  const [competidores,   setCompetidoresState]   = useState([]);
  const [industriesDevengo, setIndustriesDevengoState] = useState([]);
  const [campaignPrompt, setCampaignPromptState] = useState(null);
  const [meetingPrompt,  setMeetingPromptState]  = useState(null);
  const [emailPrompt,    setEmailPromptState]    = useState(null);
  const [webhooks,       setWebhooksState]       = useState({
    prospect: '', contacts: '', lookalike: '',
    emailgen: '', instantly: '', meetings: '', verification: '',
  });
  const [dbLoading,      setDbLoading]           = useState(true);

  // ── Queues (localStorage) ─────────────────────────────────────────────────
  const [queues, setQueuesState] = useLocalStorage("queues.v1", {
    verification: [], prospecting: [], instantly: [],
  });

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
      getWebhooks(),
      ensureIndustriesLoaded(),
    ])
      .then(([co, prods, clients, comps, prompts, hooks, industries]) => {
        if (co) setCompanyState(co);
        setProductosState(prods);
        setClientesState(clients);
        setCompetidoresState(comps);
        setIndustriesDevengoState(industries);
        if (prompts.campaign !== null) setCampaignPromptState(prompts.campaign);
        if (prompts.meeting  !== null) setMeetingPromptState(prompts.meeting);
        if (prompts.email    !== null) setEmailPromptState(prompts.email);
        setWebhooksState(hooks);
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
  const setProductos = useCallback(async (newListOrFn) => {
    setProductosState(prev => {
      const newList = typeof newListOrFn === 'function' ? newListOrFn(prev) : newListOrFn;
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
  const setClientes = useCallback(async (newListOrFn) => {
    setClientesState(prev => {
      const newList = typeof newListOrFn === 'function' ? newListOrFn(prev) : newListOrFn;
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
  const setCompetidores = useCallback(async (newListOrFn) => {
    setCompetidoresState(prev => {
      const newList = typeof newListOrFn === 'function' ? newListOrFn(prev) : newListOrFn;
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

  // ── Industries Devengo setter ──────────────────────────────────────────────
  const setIndustriesDevengo = useCallback(async (newListOrFn) => {
    setIndustriesDevengoState(prev => {
      const newList = typeof newListOrFn === 'function' ? newListOrFn(prev) : newListOrFn;
      _syncIndustries(prev, newList);
      return newList;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function _syncIndustries(oldList, newList) {
    const oldMap = new Map(oldList.map(i => [i.id, i]));
    const newMap = new Map(newList.map(i => [i.id, i]));
    for (const [id] of oldMap) {
      if (!newMap.has(id)) {
        try { await deleteIndustryDevengo(id); }
        catch (e) { console.error("[industries] delete error", e); }
      }
    }
    for (const [, ind] of newMap) {
      const old = oldMap.get(ind.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(ind)) {
        try { await saveIndustryDevengo(ind); }
        catch (e) { console.error("[industries] save error", e); }
      }
    }
  }

  // ── Webhook setter ─────────────────────────────────────────────────────────
  const setWebhook = useCallback(async (key, value) => {
    setWebhooksState(prev => ({ ...prev, [key]: value }));
    try { await saveWebhook(key, value); }
    catch (e) { console.error("[webhooks] save error", e); }
  }, []);

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

  // ── Queue actions ─────────────────────────────────────────────────────────
  // Devuelve { added, duplicates } para feedback.
  const addToQueue = useCallback((type, payloadOrPayloads) => {
    const payloads = Array.isArray(payloadOrPayloads) ? payloadOrPayloads : [payloadOrPayloads];
    let added = 0, duplicates = 0;
    setQueuesState(prev => {
      const existing = prev[type] ?? [];
      const seen = new Set(existing.map(it => dedupKey(type, it.payload)));
      const toAdd = [];
      for (const p of payloads) {
        if (!p) { duplicates++; continue; }
        const { __source, ...payload } = p;
        const k = dedupKey(type, payload);
        if (!k || seen.has(k)) { duplicates++; continue; }
        seen.add(k);
        toAdd.push({
          id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
          status: "pending",
          addedAt: Date.now(),
          launchedAt: null,
          completedAt: null,
          error: null,
          result: null,
          source: __source ?? "manual",
          payload,
        });
        added++;
      }
      return { ...prev, [type]: [...existing, ...toAdd] };
    });
    return { added, duplicates };
  }, [setQueuesState]);

  const removeFromQueue = useCallback((type, id) => {
    setQueuesState(prev => ({ ...prev, [type]: (prev[type] ?? []).filter(it => it.id !== id) }));
  }, [setQueuesState]);

  const updateQueueItems = useCallback((type, patchById) => {
    setQueuesState(prev => ({
      ...prev,
      [type]: (prev[type] ?? []).map(it =>
        patchById[it.id] ? { ...it, ...patchById[it.id] } : it
      ),
    }));
  }, [setQueuesState]);

  // filter: "all" | "done" | "pending" | "error"
  const clearQueue = useCallback((type, filter = "all") => {
    setQueuesState(prev => {
      const items = prev[type] ?? [];
      let next;
      if (filter === "all") next = [];
      else if (filter === "done") next = items.filter(it => it.status !== "done");
      else if (filter === "error") next = items.filter(it => it.status !== "error");
      else if (filter === "pending") next = items.filter(it => it.status !== "pending");
      else if (filter === "processed") next = items.filter(it => it.status !== "done" && it.status !== "error");
      else next = items;
      return { ...prev, [type]: next };
    });
  }, [setQueuesState]);

  // ── Context value ──────────────────────────────────────────────────────────
  return (
    <AppContext.Provider value={{
      dbLoading,

      // Company & catalogue
      company,        setCompany,
      productos,      setProductos,
      clientes,       setClientes,
      competidores,   setCompetidores,
      industriesDevengo, setIndustriesDevengo,

      // Webhooks N8N
      webhooks, setWebhook,

      // Queues
      queues, addToQueue, removeFromQueue, updateQueueItems, clearQueue,

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
