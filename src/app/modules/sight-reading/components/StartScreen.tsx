import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { ClefType, LevelProgress } from "../types";
import type { UserProfile } from "../../../shared/user/types";
import { LevelMap } from "./LevelMap";

interface FreeLevelDisplay {
  name: string;
  emoji: string;
  desc: string;
  hint: string;
  noteIds: string[];
  color: string;
  bg: string;
  gradFrom: string;
  gradTo: string;
}

const TREBLE_DISPLAY: Record<1 | 2 | 3, FreeLevelDisplay> = {
  1: {
    name: "初学", emoji: "🌱",
    desc: "五条线上的音",
    hint: "E · G · B · D · F",
    noteIds: ["E4", "G4", "B4", "D5", "F5"],
    color: "#10B981", bg: "#F0FDF4", gradFrom: "#D1FAE5", gradTo: "#A7F3D0",
  },
  2: {
    name: "进阶", emoji: "🎵",
    desc: "五线谱全部音",
    hint: "线上 + 线间",
    noteIds: ["E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5"],
    color: "#3B82F6", bg: "#EFF6FF", gradFrom: "#DBEAFE", gradTo: "#BFDBFE",
  },
  3: {
    name: "高手", emoji: "⭐",
    desc: "含加线，挑战极限！",
    hint: "中央C到A5",
    noteIds: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5"],
    color: "#8B5CF6", bg: "#F5F3FF", gradFrom: "#EDE9FE", gradTo: "#DDD6FE",
  },
};

const BASS_DISPLAY: Record<1 | 2 | 3, FreeLevelDisplay> = {
  1: {
    name: "初学", emoji: "🌱",
    desc: "低音五条线上的音",
    hint: "G · B · D · F · A",
    noteIds: ["G2", "B2", "D3", "F3", "A3"],
    color: "#10B981", bg: "#F0FDF4", gradFrom: "#D1FAE5", gradTo: "#A7F3D0",
  },
  2: {
    name: "进阶", emoji: "🎵",
    desc: "低音五线谱全部音",
    hint: "线上 + 线间",
    noteIds: ["A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3"],
    color: "#3B82F6", bg: "#EFF6FF", gradFrom: "#DBEAFE", gradTo: "#BFDBFE",
  },
  3: {
    name: "高手", emoji: "⭐",
    desc: "含加线，挑战极限！",
    hint: "E2到C4",
    noteIds: ["E2", "F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"],
    color: "#8B5CF6", bg: "#F5F3FF", gradFrom: "#EDE9FE", gradTo: "#DDD6FE",
  },
};

function starsFor(correct: number): 0 | 1 | 2 | 3 {
  if (correct >= 9) return 3;
  if (correct >= 7) return 2;
  if (correct >= 5) return 1;
  return 0;
}

// Navigation levels:
// module: LV1 - choose module (识谱/节奏/排行)
// mode: LV2 - choose mode (闯关/自由练习)
// levelmap: LV3 for 闯关 - show Disney map
// clef: LV3 for 自由练习 - choose clef (高音/低音)
// difficulty: LV4 for 自由练习 - choose difficulty (初学/进阶/高手)
type NavigationLevel = "module" | "mode" | "levelmap" | "clef" | "difficulty";

interface CollectedCard {
  level: number;
  characterName: string;
  characterEmoji: string;
  characterColor: string;
}

interface Props {
  onStartCampaign: (level: number) => void;
  onStartFree: (levelKey: 1 | 2 | 3, clef: ClefType) => void;
  onModuleChange: (moduleId: string) => void;
  progress: Record<number, LevelProgress>;
  unlockedLevel: number;
  freeBest: Record<string, number>;
  milestones: string[];
  activeUser: UserProfile;
  onSwitchUser: () => void;
  collectedCards: CollectedCard[];
}

export default function StartScreen({
  onStartCampaign,
  onStartFree,
  onModuleChange,
  progress,
  unlockedLevel,
  freeBest,
  milestones,
  activeUser,
  onSwitchUser,
  collectedCards,
}: Props) {
  const [navLevel, setNavLevel] = useState<NavigationLevel>("module");
  const [freeClef, setFreeClef] = useState<ClefType>("treble");
  const isImage = activeUser.avatar.startsWith("data:");

  const handleBack = () => {
    if (navLevel === "difficulty") {
      setNavLevel("clef");
    } else if (navLevel === "clef" || navLevel === "levelmap") {
      setNavLevel("mode");
    } else if (navLevel === "mode") {
      setNavLevel("module");
    }
  };

  const getBreadcrumb = () => {
    switch (navLevel) {
      case "module": return "选择学习模块";
      case "mode": return "选择练习模式";
      case "levelmap": return "闯关模式 · 主题乐园";
      case "clef": return "自由练习 · 选择谱号";
      case "difficulty": return `${freeClef === "treble" ? "高音" : "低音"}谱号 · 选择难度`;
      default: return "";
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: "linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 50%, #F5F5F7 100%)",
        fontFamily: 'var(--font-family)',
        width: "100%",
        maxWidth: "100vw",
      }}
    >
      {/* Header - Apple style glass effect */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0"
        style={{
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "0.5px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)",
              borderRadius: 14,
              boxShadow: "0 4px 12px rgba(88, 86, 214, 0.3)",
            }}
          >
            <span style={{ fontSize: 26 }}>🎹</span>
          </motion.div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: -0.02 }}>
              五线谱快快乐
            </h1>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, marginTop: 1 }}>Music Reading Practice</p>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={onSwitchUser}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2.5 px-4 py-2.5"
          style={{
            background: "rgba(0, 0, 0, 0.04)",
            border: "none",
            cursor: "pointer",
            borderRadius: 12,
          }}
        >
          {isImage ? (
            <motion.img
              src={activeUser.avatar}
              alt={activeUser.name}
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
              whileHover={{ scale: 1.05 }}
            />
          ) : (
            <span className="text-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">
              {activeUser.avatar}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-800">{activeUser.name}</span>
          <motion.span
            style={{ fontSize: 10, color: "#86868B", fontWeight: 600 }}
            animate={{ y: [0, -1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ▼
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Breadcrumb / Back button */}
      <AnimatePresence>
        {navLevel !== "module" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-5 py-3 flex items-center gap-2 flex-shrink-0"
          >
            <motion.button
              onClick={handleBack}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
            >
              <span style={{ fontSize: 14, color: "#6366F1" }}>←</span>
              <span style={{ fontSize: 13, color: "#6366F1", fontWeight: 600 }}>返回</span>
            </motion.button>
            <div
              className="flex-1 text-center"
              style={{
                fontSize: 13,
                color: "#86868B",
                fontWeight: 500,
                marginRight: 56,
              }}
            >
              {getBreadcrumb()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content - scrollable */}
      <div className="flex-1 w-full overflow-y-auto flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* LV1: Module selection (识谱/节奏/排行) */}
          {navLevel === "module" && (
            <motion.div
              key="module"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5 px-5 py-6 w-full max-w-xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-3"
              >
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 6, letterSpacing: -0.02 }}>
                  你好，{activeUser.name}！
                </h2>
                <p style={{ fontSize: 14, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                  今天想学习什么呢？
                </p>
              </motion.div>

              {/* 识谱 - Primary option, highlighted */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setNavLevel("mode")}
                className="w-full p-5 flex items-center gap-4 text-left"
                style={{
                  background: "linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)",
                  border: "none",
                  borderRadius: 20,
                  boxShadow: "0 8px 24px rgba(88, 86, 214, 0.35)",
                  cursor: "pointer",
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: 64,
                    height: 64,
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: 16,
                    border: "1.5px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <span style={{ fontSize: 32 }}>🎼</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 3, letterSpacing: -0.01 }}>
                    识谱练习
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.4 }}>
                    学习识读五线谱上的音符
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span
                      className="px-2.5 py-1"
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#fff",
                        borderRadius: 8,
                      }}
                    >
                      🏰 闯关模式
                    </span>
                    <span
                      className="px-2.5 py-1"
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#fff",
                        borderRadius: 8,
                      }}
                    >
                      🎹 自由练习
                    </span>
                  </div>
                </div>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  style={{ fontSize: 22, color: "#fff", opacity: 0.9 }}
                >
                  →
                </motion.span>
              </motion.button>

              {/* 节奏 */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled
                className="w-full p-5 flex items-center gap-4 text-left"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                  borderRadius: 20,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  cursor: "not-allowed",
                  opacity: 0.75,
                }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: 64,
                    height: 64,
                    background: "linear-gradient(135deg, #FFCC00 0%, #FF9500 100%)",
                    borderRadius: 16,
                    border: "none",
                  }}
                >
                  <span style={{ fontSize: 32 }}>🥁</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 3, letterSpacing: -0.01 }}>
                    节奏训练
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                    培养节奏感和节拍感
                  </div>
                </div>
                <span
                  className="flex-shrink-0 px-3 py-1.5"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#FF9500",
                    background: "rgba(255, 149, 0, 0.12)",
                    borderRadius: 8,
                  }}
                >
                  即将推出
                </span>
              </motion.button>

              {/* 排行榜 */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled
                className="w-full p-5 flex items-center gap-4 text-left"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                  borderRadius: 20,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  cursor: "not-allowed",
                  opacity: 0.75,
                }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: 64,
                    height: 64,
                    background: "linear-gradient(135deg, #FF3B30 0%, #FF6B6B 100%)",
                    borderRadius: 16,
                    border: "none",
                  }}
                >
                  <span style={{ fontSize: 32 }}>🏆</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 3, letterSpacing: -0.01 }}>
                    排行榜
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                    查看排名和成就
                  </div>
                </div>
                <span
                  className="flex-shrink-0 px-3 py-1.5"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#FF9500",
                    background: "rgba(255, 149, 0, 0.12)",
                    borderRadius: 8,
                  }}
                >
                  即将推出
                </span>
              </motion.button>

              {/* Progress summary */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4"
              >
                <div
                  className="rounded-3xl p-5"
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: 18 }}>📊</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F" }}>
                      学习进度
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div
                      className="rounded-2xl p-3 text-center"
                      style={{
                        background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
                        border: "1px solid #C7D2FE",
                      }}
                    >
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#6366F1" }}>
                        {unlockedLevel - 1}
                      </div>
                      <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 500, marginTop: 2 }}>
                        已闯关卡
                      </div>
                    </div>
                    <div
                      className="rounded-2xl p-3 text-center"
                      style={{
                        background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                        border: "1px solid #FCD34D",
                      }}
                    >
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#D97706" }}>
                        {Object.values(progress).reduce((sum, lp) => sum + lp.stars, 0)}
                      </div>
                      <div style={{ fontSize: 11, color: "#D97706", fontWeight: 500, marginTop: 2 }}>
                        获得星星
                      </div>
                    </div>
                    <div
                      className="rounded-2xl p-3 text-center"
                      style={{
                        background: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
                        border: "1px solid #86EFAC",
                      }}
                    >
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#065F46" }}>
                        {milestones.length}
                      </div>
                      <div style={{ fontSize: 11, color: "#065F46", fontWeight: 500, marginTop: 2 }}>
                        解锁成就
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* LV2: Mode selection (闯关模式/自由练习) */}
          {navLevel === "mode" && (
            <motion.div
              key="mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5 px-5 py-6 w-full max-w-xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-2"
              >
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", marginBottom: 6 }}>
                  识谱练习
                </h2>
                <p style={{ fontSize: 13, color: "#86868B", fontWeight: 500 }}>
                  选择你喜欢的练习方式
                </p>
              </motion.div>

              {/* 闯关模式 - Featured */}
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setNavLevel("levelmap")}
                className="w-full rounded-3xl overflow-hidden text-left"
                style={{
                  background: "linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #F59E0B 100%)",
                  border: "none",
                  boxShadow: "0 16px 40px rgba(220, 38, 38, 0.3), 0 4px 12px rgba(0, 0, 0, 0.08)",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {/* Decorative top section with illustration */}
                <div
                  className="relative p-6"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="flex-shrink-0"
                      style={{ fontSize: 72 }}
                    >
                      🏰
                    </motion.div>
                    <div className="flex-1">
                      <div
                        className="inline-block px-3 py-1 rounded-full mb-2"
                        style={{
                          background: "rgba(255, 255, 255, 0.3)",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#fff",
                          letterSpacing: 0.5,
                        }}
                      >
                        ✨ 推荐模式
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
                        闯关模式
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.95)", lineHeight: 1.5 }}>
                        跟随迪士尼主题地图，逐级挑战100关！
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="mt-4 rounded-2xl p-3"
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                        你的进度
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>
                        第 {unlockedLevel} 关 / 100 关
                      </span>
                    </div>
                    <div
                      className="rounded-full overflow-hidden"
                      style={{
                        height: 8,
                        background: "rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min((unlockedLevel / 100) * 100, 100)}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #fff 0%, #FFF7ED 100%)",
                          borderRadius: 999,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {["🗺️ 主题地图", "🎭 角色收集", "⭐ 三星评分", "🏆 成就解锁"].map((tag, i) => (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="px-2.5 py-1 rounded-full"
                        style={{
                          background: "rgba(255, 255, 255, 0.25)",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.button>

              {/* 自由练习 */}
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setNavLevel("clef")}
                className="w-full rounded-3xl p-6 flex items-center gap-5 text-left"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
                  cursor: "pointer",
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex-shrink-0 flex items-center justify-center rounded-2xl"
                  style={{
                    width: 72,
                    height: 72,
                    background: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
                    border: "2px solid #93C5FD",
                  }}
                >
                  <span style={{ fontSize: 40 }}>🎹</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", marginBottom: 4 }}>
                    自由练习
                  </div>
                  <div style={{ fontSize: 13, color: "#636366", lineHeight: 1.4 }}>
                    选择谱号和难度，针对性练习特定音符！
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{
                        background: "#EFF6FF",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#2563EB",
                      }}
                    >
                      🎼 高音谱号
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{
                        background: "#F5F3FF",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#7C3AED",
                      }}
                    >
                      🎻 低音谱号
                    </span>
                  </div>
                </div>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ fontSize: 20, color: "#9CA3AF" }}
                >
                  →
                </motion.span>
              </motion.button>
            </motion.div>
          )}

          {/* LV3: 闯关模式 - Level Map */}
          {navLevel === "levelmap" && (
            <motion.div
              key="levelmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 w-full max-w-4xl mx-auto px-5"
            >
              <LevelMap
                currentLevel={unlockedLevel}
                progress={progress}
                unlockedLevel={unlockedLevel}
                milestones={milestones}
                onSelectLevel={onStartCampaign}
                collectedCards={collectedCards}
              />
            </motion.div>
          )}

          {/* LV3: 自由练习 - Clef selection */}
          {navLevel === "clef" && (
            <motion.div
              key="clef"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5 px-5 py-6 w-full max-w-xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-2"
              >
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", marginBottom: 6 }}>
                  选择谱号
                </h2>
                <p style={{ fontSize: 13, color: "#86868B", fontWeight: 500 }}>
                  高音谱号用于右手/高音乐器，低音谱号用于左手/低音乐器
                </p>
              </motion.div>

              {/* 高音谱号 - Primary option */}
              <motion.button
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setFreeClef("treble");
                  setNavLevel("difficulty");
                }}
                className="w-full rounded-3xl p-6 flex items-center gap-5 text-left"
                style={{
                  background: "linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)",
                  border: "none",
                  boxShadow: "0 12px 32px rgba(99, 102, 241, 0.35), 0 4px 12px rgba(0, 0, 0, 0.08)",
                  cursor: "pointer",
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex-shrink-0 flex items-center justify-center rounded-2xl"
                  style={{
                    width: 72,
                    height: 72,
                    background: "rgba(255, 255, 255, 0.25)",
                    border: "2px solid rgba(255, 255, 255, 0.4)",
                  }}
                >
                  <span style={{ fontSize: 40 }}>🎼</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                    高音谱号
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.4 }}>
                    Treble Clef · 右手/高音区音符练习
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {["初学", "进阶", "高手"].map((level) => (
                      <span
                        key={level}
                        className="px-2.5 py-1 rounded-full"
                        style={{
                          background: "rgba(255, 255, 255, 0.25)",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ fontSize: 24, color: "#fff" }}
                >
                  →
                </motion.span>
              </motion.button>

              {/* 低音谱号 */}
              <motion.button
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setFreeClef("bass");
                  setNavLevel("difficulty");
                }}
                className="w-full rounded-3xl p-6 flex items-center gap-5 text-left"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                  border: "none",
                  boxShadow: "0 12px 32px rgba(139, 92, 246, 0.35), 0 4px 12px rgba(0, 0, 0, 0.08)",
                  cursor: "pointer",
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex-shrink-0 flex items-center justify-center rounded-2xl"
                  style={{
                    width: 72,
                    height: 72,
                    background: "rgba(255, 255, 255, 0.25)",
                    border: "2px solid rgba(255, 255, 255, 0.4)",
                  }}
                >
                  <span style={{ fontSize: 40 }}>🎻</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                    低音谱号
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.4 }}>
                    Bass Clef · 左手/低音区音符练习
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {["初学", "进阶", "高手"].map((level) => (
                      <span
                        key={level}
                        className="px-2.5 py-1 rounded-full"
                        style={{
                          background: "rgba(255, 255, 255, 0.25)",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ fontSize: 24, color: "#fff" }}
                >
                  →
                </motion.span>
              </motion.button>
            </motion.div>
          )}

          {/* LV4: 自由练习 - Difficulty selection */}
          {navLevel === "difficulty" && (
            <motion.div
              key="difficulty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4 px-5 py-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-2"
              >
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
                  style={{
                    background: freeClef === "treble" ? "#DBEAFE" : "#EDE9FE",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{freeClef === "treble" ? "🎼" : "🎻"}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: freeClef === "treble" ? "#2563EB" : "#7C3AED",
                    }}
                  >
                    {freeClef === "treble" ? "高音谱号" : "低音谱号"}
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", marginBottom: 6 }}>
                  选择难度等级
                </h2>
                <p style={{ fontSize: 13, color: "#86868B", fontWeight: 500 }}>
                  每关10道题，看看你能拿几颗星！
                </p>
              </motion.div>

              {([1, 2, 3] as const).map((lvl, i) => {
                const lv = freeClef === "treble" ? TREBLE_DISPLAY[lvl] : BASS_DISPLAY[lvl];
                const bestKey = `${freeClef}-${lvl}`;
                const bestScore = freeBest[bestKey] ?? 0;
                const stars = starsFor(Math.round(bestScore / 10));
                return (
                  <motion.button
                    key={lvl}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.15 }}
                    onClick={() => onStartFree(lvl, freeClef)}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-3xl p-5 flex items-center gap-4 text-left"
                    style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      border: `2px solid ${lv.color}33`,
                      boxShadow: `0 4px 20px ${lv.color}15, 0 1px 3px rgba(0, 0, 0, 0.04)`,
                      cursor: "pointer",
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 3 }}
                      className="flex-shrink-0 flex items-center justify-center rounded-2xl"
                      style={{
                        width: 64,
                        height: 64,
                        background: `linear-gradient(135deg, ${lv.gradFrom} 0%, ${lv.gradTo} 100%)`,
                        boxShadow: `0 4px 12px ${lv.color}33`,
                      }}
                    >
                      <span style={{ fontSize: 32 }}>{lv.emoji}</span>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: "#1D1D1F",
                          }}
                        >
                          {lv.name}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: lv.color,
                            background: `${lv.color}15`,
                            padding: "3px 10px",
                            borderRadius: 99,
                            fontWeight: 700,
                          }}
                        >
                          {lv.desc}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#636366", marginTop: 4 }}>
                        {lv.hint}
                      </div>

                      {/* Score display */}
                      {bestScore > 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 mt-2.5"
                        >
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3].map((s) => (
                              <motion.span
                                key={s}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: s * 0.05 }}
                                style={{
                                  fontSize: 14,
                                  filter: s <= stars ? "none" : "grayscale(1)",
                                  opacity: s <= stars ? 1 : 0.3,
                                }}
                              >
                                ⭐
                              </motion.span>
                            ))}
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              color: lv.color,
                              fontWeight: 700,
                            }}
                          >
                            最高 {bestScore} 分
                          </span>
                        </motion.div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 mt-2.5"
                          style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}
                        >
                          <span>🎯</span>
                          <span>尚未练习</span>
                        </div>
                      )}
                    </div>

                    {/* Start button */}
                    <motion.div
                      whileHover={{ scale: 1.1, x: 3 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex-shrink-0 flex items-center justify-center rounded-2xl"
                      style={{
                        width: 52,
                        height: 52,
                        background: `linear-gradient(135deg, ${lv.color} 0%, ${lv.color}dd 100%)`,
                        boxShadow: `0 4px 16px ${lv.color}55`,
                      }}
                    >
                      <span style={{ fontSize: 20, color: "#fff" }}>▶</span>
                    </motion.div>
                  </motion.button>
                );
              })}

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-4 rounded-3xl p-5"
                style={{
                  background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                  border: "1px solid #FCD34D",
                }}
              >
                <div className="flex items-start gap-3">
                  <span style={{ fontSize: 24 }}>💡</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E", marginBottom: 2 }}>
                      学习建议
                    </div>
                    <div style={{ fontSize: 12, color: "#B45309", lineHeight: 1.5 }}>
                      建议从"初学"开始，熟悉基础音符后再挑战更高难度。循序渐进效果最好哦！
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
