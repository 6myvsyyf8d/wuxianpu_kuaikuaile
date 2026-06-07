import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
// @ts-ignore
import confetti from "canvas-confetti";

type NoteName = "C" | "D" | "E" | "F" | "G" | "A" | "B";
type LevelKey = 1 | 2 | 3;
type ClefType = "treble" | "bass";
type FeedbackState = "none" | "correct" | "wrong";

interface NoteData {
  id: string;
  name: NoteName;
  octave: number;
  step: number; // 0 = E4, each step = half line-space upward
}

// Note colors for buttons
const NOTE_COLORS: Record<NoteName, { bg: string; shadow: string; text: string }> = {
  C: { bg: "#FF6B6B", shadow: "#CC4444", text: "#fff" },
  D: { bg: "#FF9A3C", shadow: "#CC6A1A", text: "#fff" },
  E: { bg: "#FBBF24", shadow: "#CA8A04", text: "#fff" },
  F: { bg: "#34D399", shadow: "#059669", text: "#fff" },
  G: { bg: "#60A5FA", shadow: "#2563EB", text: "#fff" },
  A: { bg: "#A78BFA", shadow: "#7C3AED", text: "#fff" },
  B: { bg: "#F472B6", shadow: "#DB2777", text: "#fff" },
};

const SOLFEGE: Record<NoteName, string> = {
  C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si",
};

// All treble clef notes. step 0 = E4, each step = half staff-space upward.
const ALL_NOTES: NoteData[] = [
  { id: "C4", name: "C", octave: 4, step: -2 },
  { id: "D4", name: "D", octave: 4, step: -1 },
  { id: "E4", name: "E", octave: 4, step: 0 },
  { id: "F4", name: "F", octave: 4, step: 1 },
  { id: "G4", name: "G", octave: 4, step: 2 },
  { id: "A4", name: "A", octave: 4, step: 3 },
  { id: "B4", name: "B", octave: 4, step: 4 },
  { id: "C5", name: "C", octave: 5, step: 5 },
  { id: "D5", name: "D", octave: 5, step: 6 },
  { id: "E5", name: "E", octave: 5, step: 7 },
  { id: "F5", name: "F", octave: 5, step: 8 },
  { id: "G5", name: "G", octave: 5, step: 9 },
  { id: "A5", name: "A", octave: 5, step: 10 },
];

// All bass clef notes. step 0 = G2, each step = half staff-space upward.
// Bass clef staff lines from bottom to top: G2 (0), B2 (2), D3 (4), F3 (6), A3 (8)
const BASS_NOTES: NoteData[] = [
  { id: "E2", name: "E", octave: 2, step: -4 },
  { id: "F2", name: "F", octave: 2, step: -3 },
  { id: "G2", name: "G", octave: 2, step: 0 },
  { id: "A2", name: "A", octave: 2, step: 1 },
  { id: "B2", name: "B", octave: 2, step: 2 },
  { id: "C3", name: "C", octave: 3, step: 3 },
  { id: "D3", name: "D", octave: 3, step: 4 },
  { id: "E3", name: "E", octave: 3, step: 5 },
  { id: "F3", name: "F", octave: 3, step: 6 },
  { id: "G3", name: "G", octave: 3, step: 7 },
  { id: "A3", name: "A", octave: 3, step: 8 },
  { id: "B3", name: "B", octave: 3, step: 9 },
  { id: "C4", name: "C", octave: 4, step: 11 },
];

// Treble clef levels
const TREBLE_LEVELS: Record<LevelKey, {
  name: string; emoji: string; desc: string; hint: string;
  noteIds: string[]; color: string; bg: string; gradFrom: string; gradTo: string;
}> = {
  1: {
    name: "初学", emoji: "🌱",
    desc: "五条线上的音",
    hint: "E · G · B · D · F",
    noteIds: ["E4", "G4", "B4", "D5", "F5"],
    color: "#16A34A", bg: "#F0FDF4", gradFrom: "#BBF7D0", gradTo: "#86EFAC",
  },
  2: {
    name: "进阶", emoji: "🎵",
    desc: "五线谱全部音",
    hint: "线上 + 线间",
    noteIds: ["E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5"],
    color: "#2563EB", bg: "#EFF6FF", gradFrom: "#BFDBFE", gradTo: "#93C5FD",
  },
  3: {
    name: "高手", emoji: "⭐",
    desc: "含加线，挑战极限！",
    hint: "中央C到A5",
    noteIds: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5"],
    color: "#7C3AED", bg: "#F5F3FF", gradFrom: "#DDD6FE", gradTo: "#C4B5FD",
  },
};

// Bass clef levels
const BASS_LEVELS: Record<LevelKey, {
  name: string; emoji: string; desc: string; hint: string;
  noteIds: string[]; color: string; bg: string; gradFrom: string; gradTo: string;
}> = {
  1: {
    name: "初学", emoji: "🌱",
    desc: "低音五条线上的音",
    hint: "G · B · D · F · A",
    noteIds: ["G2", "B2", "D3", "F3", "A3"],
    color: "#16A34A", bg: "#F0FDF4", gradFrom: "#BBF7D0", gradTo: "#86EFAC",
  },
  2: {
    name: "进阶", emoji: "🎵",
    desc: "低音五线谱全部音",
    hint: "线上 + 线间",
    noteIds: ["A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3"],
    color: "#2563EB", bg: "#EFF6FF", gradFrom: "#BFDBFE", gradTo: "#93C5FD",
  },
  3: {
    name: "高手", emoji: "⭐",
    desc: "含加线，挑战极限！",
    hint: "E2到C4",
    noteIds: ["E2", "F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"],
    color: "#7C3AED", bg: "#F5F3FF", gradFrom: "#DDD6FE", gradTo: "#C4B5FD",
  },
};

const TOTAL_Q = 10;

// Staff drawing constants
const SY = 220; // bottom staff line y (E4/G2, step 0)
const HS = 20;  // half-step height (20px per step)
const NX = 330; // note x position
const SL = 108; // staff left x
const SR = 520; // staff right x

const noteY = (step: number) => SY - step * HS;

// Lines are at step 0,2,4,6,8 → y = 220,180,140,100,60
const LINE_YS = [220, 180, 140, 100, 60];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeChoices(note: NoteData, levelIds: string[], clef: ClefType): NoteName[] {
  const notes = clef === "treble" ? ALL_NOTES : BASS_NOTES;
  const pool = [...new Set(notes.filter(n => levelIds.includes(n.id)).map(n => n.name))];
  const others = shuffle(pool.filter(n => n !== note.name)) as NoteName[];
  return shuffle([note.name as NoteName, ...others.slice(0, 3)]);
}

function makeRound(lvl: LevelKey, clef: ClefType): NoteData[] {
  const notes = clef === "treble" ? ALL_NOTES : BASS_NOTES;
  const levels = clef === "treble" ? TREBLE_LEVELS : BASS_LEVELS;
  const pool = notes.filter(n => levels[lvl].noteIds.includes(n.id));
  const round: NoteData[] = [];
  let last = "";
  for (let i = 0; i < TOTAL_Q; i++) {
    const avail = pool.filter(n => n.id !== last);
    const pick = avail[Math.floor(Math.random() * avail.length)];
    round.push(pick);
    last = pick.id;
  }
  return round;
}

function starsFor(correct: number) {
  if (correct >= 9) return 3;
  if (correct >= 7) return 2;
  if (correct >= 5) return 1;
  return 0;
}

// ─── Staff SVG ───────────────────────────────────────────────────────────────
function StaffSVG({ note, feedback, clef }: { note: NoteData | null; feedback: FeedbackState; clef: ClefType }) {
  const nY = note ? noteY(note.step) : null;
  const stemUp = note ? note.step < 4 : true;

  const noteFill =
    feedback === "correct" ? "#16A34A"
    : feedback === "wrong" ? "#DC2626"
    : "#1E293B";

  const ledgerYs: number[] = [];
  if (note) {
    const minStep = clef === "treble" ? -2 : -4;
    const maxStep = 10;
    for (let s = minStep; s >= note.step; s -= 2) {
      if (s !== note.step || (s === minStep)) {
        if (s < 0 || s > 8) {
          ledgerYs.push(noteY(s));
        }
      }
    }
    for (let s = maxStep; s <= note.step; s += 2) {
      if (s > 8) {
        ledgerYs.push(noteY(s));
      }
    }
  }

  return (
    <svg
      viewBox="0 0 560 310"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", maxWidth: "100%", overflow: "hidden" }}
    >
      {/* Staff lines */}
      {LINE_YS.map((y, i) => (
        <line key={i} x1={SL} y1={y} x2={SR} y2={y} stroke="#374151" strokeWidth="2.5" />
      ))}

      {/* Clef */}
      {clef === "treble" ? (
        <text
          x={105} y={242}
          fontSize={309}
          fontFamily="'Times New Roman', 'Georgia', serif"
          fill="#4B5563"
          style={{ userSelect: "none" }}
        >
          𝄞
        </text>
      ) : (
        <text
          x={108} y={200}
          fontSize={206}
          fontFamily="'Times New Roman', 'Georgia', serif"
          fill="#4B5563"
          style={{ userSelect: "none" }}
        >
          𝄢
        </text>
      )}

      {/* Opening barline */}
      <line x1={SL} y1={60} x2={SL} y2={220} stroke="#374151" strokeWidth="2.5" />

      {/* Ledger lines */}
      {ledgerYs.map((y, i) => (
        <line key={i} x1={NX - 33} y1={y} x2={NX + 33} y2={y} stroke="#374151" strokeWidth="2.5" />
      ))}

      {/* Note */}
      <AnimatePresence mode="wait">
        {note && nY !== null && (
          <motion.g
            key={note.id + feedback}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            {/* Stem */}
            {stemUp ? (
              <line x1={NX + 17} y1={nY} x2={NX + 17} y2={nY - 72} stroke={noteFill} strokeWidth="3.5" strokeLinecap="round" />
            ) : (
              <line x1={NX - 17} y1={nY} x2={NX - 17} y2={nY + 72} stroke={noteFill} strokeWidth="3.5" strokeLinecap="round" />
            )}
            {/* Note head */}
            <ellipse
              cx={NX} cy={nY}
              rx={18} ry={13}
              fill={noteFill}
              transform={`rotate(-15, ${NX}, ${nY})`}
            />
            {/* Correct tick */}
            {feedback === "correct" && (
              <motion.text
                x={NX + 26} y={nY + 5}
                fontSize="30" fill="#16A34A" fontWeight="bold"
                initial={{ opacity: 0, y: nY + 20 }}
                animate={{ opacity: 1, y: nY + 5 }}
                transition={{ delay: 0.05 }}
              >
                ✓
              </motion.text>
            )}
            {/* Wrong X */}
            {feedback === "wrong" && (
              <motion.text
                x={NX + 26} y={nY + 5}
                fontSize="30" fill="#DC2626" fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ✗
              </motion.text>
            )}
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

// ─── Answer Button ───────────────────────────────────────────────────────────
function AnswerBtn({
  name, disabled, isCorrect, isWrong, onClick,
}: {
  name: NoteName;
  disabled: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  onClick: () => void;
}) {
  const col = NOTE_COLORS[name];
  const bg = isCorrect ? "#16A34A" : isWrong ? "#DC2626" : col.bg;
  const shadow = isCorrect ? "#0F5132" : isWrong ? "#7F1D1D" : col.shadow;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.94 }}
      animate={isWrong ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
      transition={isWrong ? { duration: 0.4 } : { type: "spring" }}
      className="flex flex-col items-center justify-center rounded-3xl select-none"
      style={{
        background: `linear-gradient(160deg, ${bg} 0%, ${shadow} 100%)`,
        boxShadow: `0 6px 0 ${shadow}, 0 8px 20px ${bg}55`,
        color: col.text,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !isCorrect && !isWrong ? 0.55 : 1,
        minHeight: 90,
        transition: "background 0.25s",
      }}
    >
      <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>{name}</span>
      <span style={{ fontSize: 15, opacity: 0.85, fontWeight: 600, marginTop: 2 }}>{SOLFEGE[name]}</span>
    </motion.button>
  );
}

// ─── Start Screen ─────────────────────────────────────────────────────────────
function StartScreen({ onStart, best, clef, setClef }: {
  onStart: (l: LevelKey, cf: ClefType) => void;
  best: Record<string, number>;
  clef: ClefType;
  setClef: (c: ClefType) => void;
}) {
  const levels = clef === "treble" ? TREBLE_LEVELS : BASS_LEVELS;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto min-h-screen px-5 py-8 gap-6"
      style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F5F3FF 50%, #FFF1F5 100%)" }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="text-center"
      >
        <div style={{ fontSize: 72 }}>🎹</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1E293B", marginTop: 8 }}>
          五线谱识谱练习
        </h1>
        <p style={{ color: "#64748B", marginTop: 4, fontSize: 16 }}>小小音乐家，快来挑战！</p>
      </motion.div>

      {/* Clef selector */}
      <div className="flex gap-2">
        {(["treble", "bass"] as ClefType[]).map((c) => (
          <button
            key={c}
            onClick={() => setClef(c)}
            className="px-4 py-2 rounded-full font-semibold transition-all"
            style={{
              background: clef === c ? "#4F46E5" : "#E2E8F0",
              color: clef === c ? "#fff" : "#64748B",
              border: "none",
              cursor: "pointer",
            }}
          >
            {c === "treble" ? "🎼 高音谱号" : "🎻 低音谱号"}
          </button>
        ))}
      </div>

      <div className="w-full max-w-lg flex flex-col gap-4">
        {([1, 2, 3] as LevelKey[]).map((lvl, i) => {
          const lv = levels[lvl];
          const bestKey = `${clef}-${lvl}`;
          const bestScore = best[bestKey] ?? 0;
          const stars = starsFor(Math.round(bestScore / 10));
          return (
            <motion.button
              key={lvl}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              onClick={() => onStart(lvl, clef)}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-3xl p-5 flex items-center gap-4 text-left"
              style={{
                background: `linear-gradient(135deg, ${lv.gradFrom} 0%, ${lv.gradTo} 100%)`,
                border: `2px solid ${lv.color}22`,
                boxShadow: `0 4px 20px ${lv.color}22`,
                cursor: "pointer",
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-2xl"
                style={{
                  width: 56, height: 56,
                  background: `${lv.color}22`,
                  fontSize: 28,
                }}
              >
                {lv.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 20, fontWeight: 800, color: lv.color }}>{lv.name}</span>
                  <span style={{ fontSize: 13, color: "#64748B", background: "#fff6", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
                    {lv.desc}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#475569", marginTop: 3 }}>{lv.hint}</div>
                {bestScore > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3].map(s => (
                      <span key={s} style={{ fontSize: 18, opacity: s <= stars ? 1 : 0.2 }}>⭐</span>
                    ))}
                    <span style={{ fontSize: 12, color: "#64748B", marginLeft: 4 }}>最高 {bestScore} 分</span>
                  </div>
                )}
              </div>
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: lv.color, color: "#fff", fontSize: 20 }}
              >
                ▶
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-auto text-center"
        style={{ color: "#94A3B8", fontSize: 14 }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎵 🎶 🎵</div>
        <p>认识五线谱上的每一个音符</p>
        <p>每关10题，看看你能拿几颗星！</p>
      </motion.div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressDots({ total, current, correct, wrong }: {
  total: number; current: number; correct: number; wrong: number;
}) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }).map((_, i) => {
        const state = i < correct ? "correct" : i < correct + wrong ? "wrong" : i < current ? "done" : "pending";
        return (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: i === current - (state === "pending" ? 0 : 0) ? 20 : 10,
              height: 10,
              background:
                state === "correct" ? "#16A34A"
                : state === "wrong" ? "#DC2626"
                : i < current ? "#94A3B8"
                : "#E2E8F0",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────
function ResultsScreen({
  score, correct, level, clef, onReplay, onMenu,
}: {
  score: number; correct: number; level: LevelKey; clef: ClefType;
  onReplay: () => void; onMenu: () => void;
}) {
  const stars = starsFor(correct);
  const levels = clef === "treble" ? TREBLE_LEVELS : BASS_LEVELS;
  const lv = levels[level];
  const pct = Math.round((correct / TOTAL_Q) * 100);

  const msgs = [
    "继续加油！多练习就会了 💪",
    "不错哦！再来一次会更好！😊",
    "非常棒！你越来越厉害了！🌟",
    "完美！你是识谱小天才！🏆",
  ];

  const mascots = ["🐧", "🐨", "🦊", "🦁"];

  const fireworks = () => {
    if (stars >= 2) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 70, origin: { y: 0.4, x: 0.3 } }), 400);
      setTimeout(() => confetti({ particleCount: 80, spread: 70, origin: { y: 0.4, x: 0.7 } }), 700);
    }
  };

  // Trigger confetti on mount
  useEffect(() => { const t = setTimeout(fireworks, 300); return () => clearTimeout(t); }, []);

  return (
    <div
      className="flex flex-col items-center w-full max-w-lg mx-auto min-h-screen px-6 py-10 gap-6"
      style={{ background: `linear-gradient(160deg, ${lv.bg} 0%, #fff 100%)` }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        style={{ fontSize: 80 }}
      >
        {mascots[stars]}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1E293B" }}>
          第{level}关完成！
        </h2>
        <p style={{ color: "#64748B", marginTop: 4 }}>{msgs[stars]}</p>
      </motion.div>

      {/* Stars */}
      <div className="flex gap-3">
        {[1, 2, 3].map(s => (
          <motion.div
            key={s}
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: s <= stars ? 1 : 0.7, y: 0 }}
            transition={{ type: "spring", delay: 0.4 + s * 0.12 }}
            style={{ fontSize: 56, opacity: s <= stars ? 1 : 0.2, filter: s <= stars ? "drop-shadow(0 4px 8px #F59E0B88)" : "none" }}
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
          ].map(item => (
            <div key={item.label} className="text-center">
              <div style={{ fontSize: 24 }}>{item.emoji}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: lv.color }}>{item.value}</div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Unlock badge if 3 stars */}
      {stars === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 300 }}
          className="rounded-2xl px-6 py-3 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", border: "2px solid #F59E0B" }}
        >
          <span style={{ fontSize: 28 }}>🏅</span>
          <div>
            <p style={{ fontWeight: 700, color: "#92400E", fontSize: 15 }}>成就解锁！</p>
            <p style={{ color: "#B45309", fontSize: 13 }}>
              {level === 1 ? "五线音符小达人" : level === 2 ? "五线谱全能手" : "识谱大师"}
            </p>
          </div>
        </motion.div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs mt-auto">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onReplay}
          className="w-full py-4 rounded-2xl font-bold"
          style={{ background: lv.color, color: "#fff", fontSize: 18, border: "none", cursor: "pointer", boxShadow: `0 4px 16px ${lv.color}55` }}
        >
          🔄 再来一次
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onMenu}
          className="w-full py-4 rounded-2xl font-bold"
          style={{ background: "#F1F5F9", color: "#475569", fontSize: 18, border: "none", cursor: "pointer" }}
        >
          📋 选择难度
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main Game ────────────────────────────────────────────────────────────────
export function SightReadingGame() {
  type Phase = "start" | "playing" | "results";

  const [phase, setPhase] = useState<Phase>("start");
  const [level, setLevel] = useState<LevelKey>(1);
  const [clef, setClef] = useState<ClefType>("treble");
  const [round, setRound] = useState<NoteData[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [choices, setChoices] = useState<NoteName[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>("none");
  const [selected, setSelected] = useState<NoteName | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [, setWrongCount] = useState(0);
  const [best, setBest] = useState<Record<string, number>>({});

  const currentNote = round[qIdx] ?? null;
  const levels = clef === "treble" ? TREBLE_LEVELS : BASS_LEVELS;
  const bestKey = `${clef}-${level}`;

  const startGame = useCallback((lvl: LevelKey, cf: ClefType) => {
    const r = makeRound(lvl, cf);
    setLevel(lvl);
    setClef(cf);
    setRound(r);
    setQIdx(0);
    setChoices(makeChoices(r[0], cf === "treble" ? TREBLE_LEVELS[lvl].noteIds : BASS_LEVELS[lvl].noteIds, cf));
    setFeedback("none");
    setSelected(null);
    setScore(0);
    setCorrect(0);
    setWrongCount(0);
    setStreak(0);
    setPhase("playing");
  }, []);

  const advance = useCallback((newIdx: number, newScore: number, newCorrect: number) => {
    if (newIdx >= TOTAL_Q) {
      setBest(prev => ({ ...prev, [bestKey]: Math.max(prev[bestKey] ?? 0, newScore) }));
      setScore(newScore);
      setCorrect(newCorrect);
      setPhase("results");
    } else {
      setQIdx(newIdx);
      setFeedback("none");
      setSelected(null);
      setChoices(makeChoices(round[newIdx], clef === "treble" ? TREBLE_LEVELS[level].noteIds : BASS_LEVELS[level].noteIds, clef));
    }
  }, [bestKey, clef, level, round]);

  const handleAnswer = useCallback((name: NoteName) => {
    if (feedback !== "none" || !currentNote) return;
    setSelected(name);
    const isOk = name === currentNote.name;
    if (isOk) {
      const bonus = streak >= 2 ? 3 : 0;
      const newScore = score + 10 + bonus;
      const newCorrect = correct + 1;
      setFeedback("correct");
      setStreak(s => s + 1);
      setTimeout(() => advance(qIdx + 1, newScore, newCorrect), 700);
    } else {
      setFeedback("wrong");
      setStreak(0);
      setWrongCount(w => w + 1);
      setTimeout(() => advance(qIdx + 1, score, correct), 1400);
    }
  }, [feedback, currentNote, streak, score, correct, qIdx, advance]);

  const lv = levels[level];

  if (phase === "start") {
    return <StartScreen onStart={startGame} best={best} clef={clef} setClef={setClef} />;
  }

  if (phase === "results") {
    return (
      <ResultsScreen
        score={score}
        correct={correct}
        level={level}
        clef={clef}
        onReplay={() => startGame(level, clef)}
        onMenu={() => setPhase("start")}
      />
    );
  }

  const answered = feedback !== "none";

  return (
    <div
      className="flex flex-col min-h-screen w-full max-w-lg mx-auto"
      style={{ background: `linear-gradient(160deg, ${lv.bg} 0%, #FAFAFA 60%, #fff 100%)` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ background: lv.color, color: "#fff" }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 20 }}>{lv.emoji}</span>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{lv.name}</span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_Q }).map((_, i) => {
            const done = i < qIdx;
            const active = i === qIdx;
            return (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: active ? 20 : 8,
                  height: 8,
                  background: done ? "rgba(255,255,255,0.9)" : active ? "#fff" : "rgba(255,255,255,0.3)",
                  boxShadow: active ? "0 0 6px #fff" : "none",
                }}
              />
            );
          })}
        </div>

        {/* Score + streak */}
        <div className="flex items-center gap-2">
          {streak >= 3 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-0.5"
              style={{ fontSize: 13, fontWeight: 700, background: "#fff3", padding: "2px 8px", borderRadius: 99 }}
            >
              🔥×{streak}
            </motion.div>
          )}
          <span style={{ fontWeight: 800, fontSize: 20 }}>
            {score}
          </span>
        </div>
      </div>

      {/* Question counter */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1 flex-shrink-0">
        <span style={{ color: "#64748B", fontWeight: 600, fontSize: 15 }}>
          第 <span style={{ color: lv.color, fontWeight: 800, fontSize: 18 }}>{qIdx + 1}</span> / {TOTAL_Q} 题
        </span>
        <span style={{ color: "#64748B", fontSize: 14 }}>这是什么音？</span>
      </div>

      {/* Staff area */}
      <div className="flex-1 flex flex-col justify-center px-4">
        <motion.div
          layout
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#fff",
            boxShadow: "0 8px 40px #0001, 0 2px 8px #0001",
            padding: "20px 12px 12px",
          }}
        >
          <StaffSVG note={currentNote} feedback={feedback} clef={clef} />

          {/* Feedback banner */}
          <AnimatePresence>
            {feedback !== "none" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 rounded-2xl py-3 mt-2"
                style={{
                  background: feedback === "correct" ? "#DCFCE7" : "#FEF2F2",
                }}
              >
                {feedback === "correct" ? (
                  <>
                    <span style={{ fontSize: 22 }}>🎉</span>
                    <span style={{ fontWeight: 700, color: "#16A34A", fontSize: 17 }}>
                      太棒了！+{10 + (streak > 1 ? 3 : 0)} 分
                    </span>
                    {streak >= 3 && (
                      <span style={{ fontSize: 15, color: "#16A34A" }}>🔥连击！</span>
                    )}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 22 }}>🤔</span>
                    <span style={{ fontWeight: 700, color: "#DC2626", fontSize: 17 }}>
                      是 <span style={{ fontSize: 20 }}>{currentNote?.name}</span>（{currentNote ? SOLFEGE[currentNote.name] : ""}）
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Answer buttons 2×2 */}
      <div className="px-4 pb-6 pt-4 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3">
          {choices.map(name => (
            <AnswerBtn
              key={name}
              name={name}
              disabled={answered}
              isCorrect={answered && name === currentNote?.name}
              isWrong={answered && name === selected && name !== currentNote?.name}
              onClick={() => handleAnswer(name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
