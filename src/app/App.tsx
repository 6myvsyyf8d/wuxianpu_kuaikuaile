import { useState, useEffect, useCallback } from "react";
import SightReadingModule from "./modules/sight-reading/index";
import RhythmModule from "./modules/rhythm/index";
import LeaderboardModule from "./modules/leaderboard/index";
import { ensureDefaultUser, getActiveUser } from "./shared/user/UserManager";
import type { UserProfile } from "./shared/user/types";
import { initAudio } from "./modules/sight-reading/audio";

export default function App() {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [activeModule, setActiveModule] = useState("sight-reading");

  useEffect(() => {
    setActiveUser(ensureDefaultUser());
  }, []);

  // Preload piano samples on first user interaction
  useEffect(() => {
    const preload = () => { initAudio(); };
    document.addEventListener("click", preload, { once: true });
    document.addEventListener("touchend", preload, { once: true });
    return () => {
      document.removeEventListener("click", preload);
      document.removeEventListener("touchend", preload);
    };
  }, []);

  const handleUserSwitch = useCallback(() => {
    setActiveUser(getActiveUser());
  }, []);

  const handleModuleChange = useCallback((moduleId: string) => {
    setActiveModule(moduleId);
  }, []);

  if (!activeUser) return null;

  return (
    <div className="size-full">
      {activeModule === "sight-reading" && (
        <SightReadingModule onModuleChange={handleModuleChange} />
      )}
      {activeModule === "rhythm" && <RhythmModule />}
      {activeModule === "leaderboard" && <LeaderboardModule />}
    </div>
  );
}
