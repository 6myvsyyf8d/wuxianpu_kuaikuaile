import { useEffect } from "react";
import { motion } from "motion/react";
// @ts-ignore
import confetti from "canvas-confetti";
import type { ClefType } from "../types";
import { TOTAL_Q, MILESTONES } from "../types";

interface ResultsScreenProps {
  mode: "campaign" | "free";
  score: number;
  correct: number;
  level: number;
  stage?: number;
  clef: ClefType;
  stars: 0 | 1 | 2 | 3;
  isChordLevel?: boolean;
  newMilestones: string[];
  onReplay: () => void;
  onNextLevel?: () => void;
  onMenu: () => void;
}

const mascots = ["🐧", "🐨", "🦊", "🦁"];

const msgs = [
  "继续加油！多练习就会了 💪",
  "不错哦！再来一次会更好！😊",
  "非常棒！你越来越厉害了！🌟",
  "完美！你是识谱小天才！🏆",
];

export function ResultsScreen({
  mode,
  score,
  correct,
  level,
  stage,
  clef,
  stars,
  isChordLevel,
  newMilestones,
  onReplay,
  onNextLevel,
  onMenu,
}: ResultsScreenProps) {
  const pct = Math.round((correct / TOTAL_Q) * 100);

  // Fireworks on mount if 3 stars
  useEffect(() => {
    if (stars >= 3) {
      const t = setTimeout(() => {
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
        setTimeout(() => confetti({ particleCount: 80, spread: 70, origin: { y: 0.4, x: 0.3 } }), 400);
        setTimeout(() => confetti({ particleCount: 80, spread: 70, origin: { y: 0.4, x: 0.7 } }), 700);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [stars]);

  // Look up milestone details for newly unlocked ones
  const unlockedMilestones = newMilestones
    .map((id) => MILESTONES.find((m) => m.id === id))
    .filter(Boolean) as typeof MILESTONES;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto min-h-screen px-6 py-10 gap-6"
      style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F5F3FF 50%, #FFF1F5 100%)" }}
    >
      {/* Mascot */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        style={{ fontSize: 80 }}
      >
        {mascots[stars]}
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1E293B" }}>
          {mode === "campaign" ? `第${level}关完成！` : "练习完成！"}
        </h2>
        <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 2 }}>
          {clef === "treble" ? "🎼 高音谱号" : "🎻 低音谱号"}
        </p>
        {mode === "campaign" && stage && (
          <p style={{ color: "#64748B", marginTop: 2, fontSize: 14 }}>
            {["", "高音入门", "低音入门", "混合挑战", "全能大师", "限时速通"][stage]} · 第{stage}阶段
          </p>
        )}
        {mode === "campaign" && isChordLevel && (
          <p style={{ color: "#7C3AED", marginTop: 2, fontSize: 14, fontWeight: 600 }}>
            🎵 和弦关卡
          </p>
        )}
        <p style={{ color: "#64748B", marginTop: 4 }}>{msgs[stars]}</p>
      </motion.div>

      {/* Stars */}
      <div className="flex gap-3">
        {[1, 2, 3].map((s) => (
          <motion.div
            key={s}
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: s <= stars ? 1 : 0.7, y: 0 }}
            transition={{ type: "spring", delay: 0.4 + s * 0.12 }}
            style={{
              fontSize: 56,
              opacity: s <= stars ? 1 : 0.2,
              filter: s <= stars ? "drop-shadow(0 4px 8px #F59E0B88)" : "none",
            }}
          >
            ⭐
          </motion.div>
        ))}
      </div>

      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-xs rounded-3xl p-6"
        style={{ background: "#fff", boxShadow: "0 8px 32px #0002" }}
      >
        <div className="flex justify-around">
          {[
            { label: "得分", value: score, emoji: "🏆" },
            { label: "答对", value: `${correct}/${TOTAL_Q}`, emoji: "✅" },
            { label: "正确率", value: `${pct}%`, emoji: "🎯" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div style={{ fontSize: 24 }}>{item.emoji}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#4F46E5" }}>{item.value}</div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 3-star achievement badge */}
      {stars === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 300 }}
          className="rounded-2xl px-6 py-3 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
            border: "2px solid #F59E0B",
          }}
        >
          <span style={{ fontSize: 28 }}>🏅</span>
          <div>
            <p style={{ fontWeight: 700, color: "#92400E", fontSize: 15 }}>三星完美通关！</p>
            <p style={{ color: "#B45309", fontSize: 13 }}>
              {mode === "campaign" ? `第${level}关满分达成` : "识谱达人"}
            </p>
          </div>
        </motion.div>
      )}

      {/* Milestone unlock animation — campaign only */}
      {mode === "campaign" && unlockedMilestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="w-full max-w-xs flex flex-col gap-2"
        >
          {unlockedMilestones.map((ms, i) => (
            <motion.div
              key={ms.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3 + i * 0.15 }}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{
                background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
                border: "2px solid #A78BFA",
              }}
            >
              <span style={{ fontSize: 28 }}>{ms.icon}</span>
              <div>
                <p style={{ fontWeight: 700, color: "#5B21B6", fontSize: 14 }}>{ms.name}</p>
                <p style={{ color: "#7C3AED", fontSize: 12 }}>成就解锁！</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs mt-auto">
        {mode === "campaign" && onNextLevel && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            whileTap={{ scale: 0.96 }}
            onClick={onNextLevel}
            className="w-full py-4 rounded-2xl font-bold"
            style={{
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              color: "#fff",
              fontSize: 18,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 16px #4F46E555",
            }}
          >
            ▶ 下一关
          </motion.button>
        )}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          whileTap={{ scale: 0.96 }}
          onClick={onReplay}
          className="w-full py-4 rounded-2xl font-bold"
          style={{
            background: "#4F46E5",
            color: "#fff",
            fontSize: 18,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px #4F46E555",
          }}
        >
          🔄 再来一次
        </motion.button>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7 }}
          whileTap={{ scale: 0.96 }}
          onClick={onMenu}
          className="w-full py-4 rounded-2xl font-bold"
          style={{
            background: "#F1F5F9",
            color: "#475569",
            fontSize: 18,
            border: "none",
            cursor: "pointer",
          }}
        >
          📋 返回菜单
        </motion.button>
      </div>
    </div>
  );
}
