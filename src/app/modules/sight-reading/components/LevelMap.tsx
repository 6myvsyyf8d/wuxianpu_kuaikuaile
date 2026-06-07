import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { LevelProgress } from "../types";
import { MILESTONES, STAGES, getStage } from "../types";

interface CollectedCard {
  level: number;
  characterName: string;
  characterEmoji: string;
  characterColor: string;
}

interface LevelMapProps {
  progress: Record<number, LevelProgress>;
  unlockedLevel: number;
  currentLevel: number;
  milestones: string[];
  onSelectLevel: (level: number) => void;
  collectedCards: CollectedCard[];
}

const CHORD_LEVELS = new Set([8, 15, 28, 35, 48, 68, 88]);

const milestoneByLevel: Record<number, (typeof MILESTONES)[number]> = {};
MILESTONES.forEach((m) => {
  milestoneByLevel[m.level] = m;
});
// Stage theme colors (Disney inspired)
const STAGE_THEMES: Record<number, { 
  name: string; 
  emoji: string; 
  color: string; 
  bgGradient: string; 
  parkIcon: string;
  description: string;
}> = {
  1: { name: "米奇小镇", emoji: "🏰", color: "#DC2626", bgGradient: "linear-gradient(180deg, #FEF2F2 0%, #FEE2E2 100%)", parkIcon: "🏠", description: "欢迎来到迪士尼！学习五线谱基础音符" },
  2: { name: "公主花园", emoji: "🌹", color: "#DB2777", bgGradient: "linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 100%)", parkIcon: "🌸", description: "在童话花园中继续你的冒险" },
  3: { name: "荣耀之地", emoji: "🦁", color: "#F59E0B", bgGradient: "linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)", parkIcon: "🌅", description: "在大草原上挑战更高难度" },
  4: { name: "梦幻城堡", emoji: "✨", color: "#6366F1", bgGradient: "linear-gradient(180deg, #EEF2FF 0%, #E0E7FF 100%)", parkIcon: "🏰", description: "进入魔法世界，挑战你的极限" },
  5: { name: "冒险丛林", emoji: "🌴", color: "#059669", bgGradient: "linear-gradient(180deg, #ECFDF5 0%, #D1FAE5 100%)", parkIcon: "🎪", description: "最后的冒险！成为音乐大师" },
};

export function LevelMap({
  progress,
  unlockedLevel,
  currentLevel,
  milestones: unlockedMilestones,
  onSelectLevel,
  collectedCards = [],
}: LevelMapProps) {
  const [activeStage, setActiveStage] = useState<number>(() => {
    return Math.ceil(currentLevel / 20) || 1;
  });
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const unlockedMilestoneSet = new Set(unlockedMilestones);

  const stageStart = (activeStage - 1) * 20 + 1;
  const stageEnd = Math.min(activeStage * 20, 100);
  const stageTheme = STAGE_THEMES[activeStage] || STAGE_THEMES[1];

  return (
    <div className="flex flex-col w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)",
        fontFamily: 'var(--font-family)',
      }}
    >
      {/* Stage selector tabs */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-5 pb-3"
      >
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {STAGES.map((stage, index) => {
            const theme = STAGE_THEMES[stage.id] || STAGE_THEMES[1];
            const isUnlocked = (stage.id - 1) * 20 < unlockedLevel + 20;
            const isActive = activeStage === stage.id;
            const totalStars = Object.entries(progress)
              .filter(([lvl]) => {
                const levelNum = parseInt(lvl);
                return levelNum >= (stage.id - 1) * 20 + 1 && levelNum <= stage.id * 20;
              })
              .reduce((sum, [, lp]) => sum + lp.stars, 0);

            return (
              <motion.button
                key={stage.id}
                whileTap={isUnlocked ? { scale: 0.95 } : {}}
                whileHover={isUnlocked ? { scale: 1.02 } : {}}
                onClick={() => isUnlocked && setActiveStage(stage.id)}
                disabled={!isUnlocked}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`
                    : "rgba(255,255,255,0.95)",
                  border: isActive
                    ? `2px solid ${theme.color}`
                    : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: isActive
                    ? `0 8px 24px ${theme.color}44`
                    : "0 2px 8px rgba(0,0,0,0.04)",
                  cursor: isUnlocked ? "pointer" : "not-allowed",
                  opacity: isUnlocked ? 1 : 0.4,
                  minWidth: 90,
                }}
              >
                <span style={{ fontSize: 20 }}>{isUnlocked ? theme.emoji : "🔒"}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isActive ? "#fff" : "#1D1D1F",
                  whiteSpace: "nowrap",
                }}>
                  {stage.name}
                </span>
                {isUnlocked && (
                  <div className="flex items-center gap-0.5">
                    <span style={{ fontSize: 9, color: isActive ? "#fff" : "#86868B" }}>⭐</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? "#fff" : "#636366" }}>
                      {totalStars}/60
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Stage title */}
      <motion.div
        key={activeStage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-3"
      >
        <div
          className="rounded-3xl p-4 flex items-center gap-4"
          style={{
            background: stageTheme.bgGradient,
            border: `2px solid ${stageTheme.color}33`,
          }}
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="flex items-center justify-center rounded-2xl"
            style={{
              width: 64,
              height: 64,
              background: "rgba(255,255,255,0.9)",
              boxShadow: `0 4px 12px ${stageTheme.color}33`,
            }}
          >
            <span style={{ fontSize: 36 }}>{stageTheme.emoji}</span>
          </motion.div>
          <div className="flex-1 min-w-0">
            <h2 style={{
              fontSize: 20,
              fontWeight: 800,
              color: stageTheme.color,
              marginBottom: 4,
            }}>
              {stageTheme.name}
            </h2>
            <p style={{
              fontSize: 13,
              color: "#636366",
              fontWeight: 500,
              lineHeight: 1.4,
            }}>
              {stageTheme.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span style={{
                fontSize: 11,
                color: stageTheme.color,
                fontWeight: 700,
                background: "rgba(255,255,255,0.8)",
                padding: "3px 10px",
                borderRadius: 99,
              }}>
                第 {stageStart}-{stageEnd} 关
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Park map - levels as attraction points */}
      <motion.div
        key={`map-${activeStage}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 px-5 py-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: 18 }}>{stageTheme.parkIcon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>
            乐园地图
          </span>
          <span style={{ fontSize: 12, color: "#86868B", marginLeft: 4 }}>
            点击关卡开始挑战
          </span>
        </div>

        {/* Map container - winding path */}
        <div
          className="relative rounded-3xl p-4 overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${stageTheme.color}11 0%, ${stageTheme.color}05 100%)`,
            border: `2px solid ${stageTheme.color}22`,
            minHeight: 400,
          }}
        >
          {/* Decorative background pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, ${stageTheme.color} 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          {/* Levels grid with winding path */}
          <div className="grid grid-cols-4 gap-3 relative">
            {Array.from({ length: Math.min(20, stageEnd - stageStart + 1) }, (_, i) => {
              const level = stageStart + i;
              const lp = progress[level];
              const isUnlocked = level <= unlockedLevel;
              const isCompleted = lp && lp.stars > 0;
              const isCurrent = level === currentLevel;
              const isMilestone = milestoneByLevel[level];
              const isChord = CHORD_LEVELS.has(level);
              const milestoneUnlocked = isMilestone && unlockedMilestoneSet.has(isMilestone.id);
              const collectedCard = collectedCards.find((card) => card.level === level);

              const row = Math.floor(i / 4);
              const col = i % 4;
              // Create winding pattern: even rows left to right, odd rows right to left
              const displayCol = row % 2 === 0 ? col : 3 - col;
              const pathOrder = row * 4 + (row % 2 === 0 ? col : 3 - col);

              return (
                <motion.button
                  key={level}
                  ref={isCurrent ? currentRef : undefined}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: pathOrder * 0.03 }}
                  whileHover={isUnlocked ? { scale: 1.1, y: -3 } : {}}
                  whileTap={isUnlocked ? { scale: 0.95 } : {}}
                  onClick={() => isUnlocked && onSelectLevel(level)}
                  disabled={!isUnlocked}
                  className="aspect-square rounded-3xl flex flex-col items-center justify-center relative"
                  style={{
                    background: isCompleted
                      ? `linear-gradient(135deg, ${stageTheme.color} 0%, ${stageTheme.color}dd 100%)`
                      : isCurrent
                        ? "linear-gradient(135deg, #fff 0%, #fff 100%)"
                        : isUnlocked
                          ? "rgba(255,255,255,0.95)"
                          : "#F3F4F6",
                    border: isCurrent
                      ? `3px solid ${stageTheme.color}`
                      : isCompleted
                        ? `2px solid ${stageTheme.color}`
                        : isUnlocked
                          ? `2px solid ${stageTheme.color}55`
                          : "2px dashed #D1D5DB",
                    color: isCompleted ? "#fff" : isUnlocked ? stageTheme.color : "#9CA3AF",
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: isUnlocked ? "pointer" : "default",
                    opacity: !isUnlocked ? 0.5 : 1,
                    boxShadow: isCurrent
                      ? `0 8px 24px ${stageTheme.color}55, 0 0 0 4px ${stageTheme.color}22`
                      : isCompleted
                        ? `0 4px 12px ${stageTheme.color}44`
                        : isUnlocked
                          ? "0 2px 8px rgba(0,0,0,0.06)"
                          : "none",
                    gridColumn: displayCol + 1,
                    gridRow: row + 1,
                  }}
                >
                  {/* Level number or lock */}
                  {!isUnlocked ? (
                    <span style={{ fontSize: 20, zIndex: 10, position: "relative" }}>🔒</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 18, fontWeight: 800, zIndex: 10, position: "relative" }}>{level}</span>

                      {/* Stars */}
                      {isCompleted && (
                        <div className="flex gap-0.5 mt-0.5">
                          {[1, 2, 3].map((s) => (
                            <motion.span
                              key={s}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 + s * 0.05 }}
                              style={{
                                fontSize: 9,
                                opacity: s <= lp.stars ? 1 : 0.4,
                              }}
                            >
                              ⭐
                            </motion.span>
                          ))}
                        </div>
                      )}

                      {/* Chord marker */}
                      {isChord && isUnlocked && !isCompleted && (
                        <div
                          className="absolute -top-2 -right-2 rounded-full flex items-center justify-center"
                          style={{
                            width: 24,
                            height: 24,
                            background: "#6366F1",
                            color: "#fff",
                            fontSize: 12,
                            boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
                          }}
                        >
                          🎵
                        </div>
                      )}

                      {/* Milestone badge */}
                      {milestoneUnlocked && (
                        <div
                          className="absolute -bottom-2 -right-2 rounded-full flex items-center justify-center"
                          style={{
                            width: 24,
                            height: 24,
                            background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                            border: "2px solid #F59E0B",
                            fontSize: 12,
                            boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
                            zIndex: 20,
                          }}
                        >
                          {milestoneByLevel[level].icon}
                        </div>
                      )}

                      {/* Character card as background */}
                      {collectedCard && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="absolute inset-0 rounded-3xl overflow-hidden flex items-center justify-center"
                          style={{
                            background: "linear-gradient(135deg, rgba(255, 182, 193, 0.4) 0%, rgba(255, 192, 203, 0.25) 100%)",
                            zIndex: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 52,
                              opacity: 0.6,
                              transform: "translateY(10px)",
                            }}
                          >
                            {collectedCard.characterEmoji}
                          </span>
                        </motion.div>
                      )}

                      {/* Current level pulsing ring */}
                      {isCurrent && (
                        <motion.div
                          className="absolute inset-0 rounded-3xl"
                          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          style={{
                            border: `3px solid ${stageTheme.color}`,
                          }}
                        />
                      )}
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Connecting path lines (decorative) */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%", opacity: 0.3 }}
            preserveAspectRatio="none"
            viewBox="0 0 400 400"
          >
            <path
              d="M 50 50 Q 100 30 150 50 T 250 50 T 350 50 M 350 100 Q 300 130 250 100 T 150 100 T 50 100 M 50 150 Q 100 180 150 150 T 250 150 T 350 150 M 350 200 Q 300 230 250 200 T 150 200 T 50 200"
              fill="none"
              stroke={stageTheme.color}
              strokeWidth="3"
              strokeDasharray="8,8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </motion.div>


    </div>
  );
}
