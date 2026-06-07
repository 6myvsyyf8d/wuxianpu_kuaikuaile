import { motion, AnimatePresence } from "motion/react";
import { GAME_MODULES } from "../types";

interface TabBarProps {
  moduleTab: string;
  onModuleChange: (moduleId: string) => void;
  modeTab: "campaign" | "free";
  onModeChange: (mode: "campaign" | "free") => void;
}

const MODE_TABS = [
  { id: "campaign" as const, label: "闯关模式", icon: "🏰" },
  { id: "free" as const, label: "自由练习", icon: "🎹" },
];

export function TabBar({
  moduleTab,
  onModuleChange,
  modeTab,
  onModeChange,
}: TabBarProps) {
  const isSightReading = moduleTab === "sight-reading";

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-1.5 bg-gray-100/80 rounded-2xl p-1"
        style={{
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        {GAME_MODULES.map((mod, index) => (
          <motion.button
            key={mod.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={mod.enabled ? { scale: 1.02 } : {}}
            whileTap={mod.enabled ? { scale: 0.98 } : {}}
            onClick={() => mod.enabled && onModuleChange(mod.id)}
            disabled={!mod.enabled}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: moduleTab === mod.id 
                ? "rgba(255, 255, 255, 0.95)" 
                : "transparent",
              color: mod.enabled
                ? moduleTab === mod.id
                  ? "#1D1D1F"
                  : "#636366"
                : "#C7C7CC",
              boxShadow: moduleTab === mod.id 
                ? "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)" 
                : "none",
              cursor: mod.enabled ? "pointer" : "default",
              border: "none",
            }}
          >
            <motion.span
              animate={moduleTab === mod.id ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: 15 }}
            >
              {mod.icon}
            </motion.span>
            <span>{mod.name}</span>
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence>
        {isSightReading && modeTab === "campaign" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-1.5 bg-gray-50/90 rounded-2xl p-1"
            style={{
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            {MODE_TABS.map((mode, index) => (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onModeChange(mode.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: modeTab === mode.id 
                    ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" 
                    : "transparent",
                  color: modeTab === mode.id ? "#fff" : "#636366",
                  boxShadow: modeTab === mode.id 
                    ? "0 4px 16px rgba(99, 102, 241, 0.3)" 
                    : "none",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                <motion.span
                  animate={modeTab === mode.id ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ fontSize: 15 }}
                >
                  {mode.icon}
                </motion.span>
                <span>{mode.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
