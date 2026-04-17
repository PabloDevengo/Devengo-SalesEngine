import { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { NAV_ITEMS, MODULE_TITLES } from "./constants";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PinGate from "./components/PinGate";
import KnowledgeModule  from "./modules/knowledge/KnowledgeModule";
import EmailModule      from "./modules/email/EmailModule";
import CampaignModule   from "./modules/campaigns/CampaignModule";
import ProspectModule   from "./modules/prospecting/ProspectModule";
import MeetingsModule from "./modules/meetings/MeetingsModule";
import ColasModule    from "./modules/queues/ColasModule";
import ConfigModule   from "./modules/config/ConfigModule";

function AppContent({ onLogout }) {
  const [activeModule, setActiveModule] = useState("knowledge");
  const { title, sub } = MODULE_TITLES[activeModule] || MODULE_TITLES.knowledge;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="flex h-screen bg-gray-50">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} sub={sub} activeModule={activeModule} onLogout={onLogout} />
        <div className="flex-1 overflow-y-auto">
          {activeModule === "knowledge" && <KnowledgeModule />}
          {activeModule === "email"     && <EmailModule />}
          {activeModule === "campaigns" && <CampaignModule />}
          {activeModule === "prospect"  && <ProspectModule />}
          {activeModule === "meetings" && <MeetingsModule />}
          {activeModule === "colas"    && <ColasModule />}
          {activeModule === "config"   && <ConfigModule />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("se_auth") === "1"
  );

  function handleLogout() {
    sessionStorage.removeItem("se_auth");
    setAuthed(false);
  }

  return (
    <AppProvider>
      {authed
        ? <AppContent onLogout={handleLogout} />
        : <PinGate onSuccess={() => setAuthed(true)} />
      }
    </AppProvider>
  );
}
