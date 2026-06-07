import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ───
import type {
  NoteName,
  ClefType,
  FeedbackState,
  LevelConfig,
  RoundQuestion,
  LevelProgress,
} from "./types";
import {
  ALL_NOTE_MAP,
  CHORDS,
  BASS_NOTES,
  TREBLE_ORDER,
  BASS_ORDER,
  NOTE_COLORS,
  SOLFEGE,
  TOTAL_Q,
  starsFor,
} from "./types";
import type { UserProfile } from "../../shared/user/types";
import { ensureDefaultUser, getActiveUser } from "../../shared/user/UserManager";

// ─── Module imports ───
import { playNoteSound, playChordSound, playSuccessSound, playErrorSound, initAudio } from "./audio";
import {
  getLevelConfig,
  generateCampaignRound,
  generateFreeRound,
  makeChoicesForNote,
  makeChoicesForChord,
  calculateScore,
} from "./level-engine";
import { loadProgress, updateLevelProgress, collectCard, getCollectedCards } from "./persistence";

// Disney character cards for each level
const LEVEL_CHARACTERS: Record<number, { name: string; emoji: string; color: string }> = {};
const CHARACTER_POOLS = [
  { name: "米奇", emoji: "🐭", color: "#DC2626" },
  { name: "米妮", emoji: "🎀", color: "#EC4899" },
  { name: "唐老鸭", emoji: "🦆", color: "#2563EB" },
  { name: "黛西", emoji: "💜", color: "#7C3AED" },
  { name: "高飞", emoji: "🐕", color: "#F59E0B" },
  { name: "普鲁托", emoji: "🐶", color: "#D97706" },
  { name: "白雪公主", emoji: "🍎", color: "#BE123C" },
  { name: "灰姑娘", emoji: "👑", color: "#6366F1" },
  { name: "睡美人", emoji: "🌹", color: "#DB2777" },
  { name: "小美人鱼", emoji: "🧜‍♀️", color: "#0891B2" },
  { name: "贝儿", emoji: "🥀", color: "#9333EA" },
  { name: "茉莉", emoji: "🏺", color: "#065F46" },
  { name: "辛巴", emoji: "🦁", color: "#F59E0B" },
  { name: "木法沙", emoji: "👑", color: "#92400E" },
  { name: "娜拉", emoji: "🐾", color: "#78350F" },
  { name: "彭彭", emoji: "🐗", color: "#EA580C" },
  { name: "丁满", emoji: "🦝", color: "#CA8A04" },
  { name: "拉菲奇", emoji: "🐒", color: "#7C3AED" },
  { name: "大力士", emoji: "💪", color: "#DC2626" },
  { name: "海格力斯", emoji: "⚡", color: "#F59E0B" },
  { name: "彼得潘", emoji: "🧚", color: "#16A34A" },
  { name: "小叮当", emoji: "✨", color: "#60A5FA" },
  { name: "温蒂", emoji: "🌙", color: "#6366F1" },
  { name: "虎克船长", emoji: "⚓", color: "#7C3AED" },
  { name: "毛克利", emoji: "🌿", color: "#16A34A" },
  { name: "巴希拉", emoji: "🐆", color: "#1F2937" },
  { name: "巴鲁", emoji: "🐻", color: "#92400E" },
  { name: "谢利可汗", emoji: "🐅", color: "#DC2626" },
  { name: "路易王", emoji: "🐒", color: "#D97706" },
  { name: "卡阿", emoji: "🐍", color: "#059669" },
];

// Assign characters to levels (each character appears once every 10 levels with slight variation)
for (let level = 1; level <= 100; level++) {
  const poolIndex = (level - 1) % CHARACTER_POOLS.length;
  LEVEL_CHARACTERS[level] = CHARACTER_POOLS[poolIndex];
}

// ─── Component imports ───
import StartScreen from "./components/StartScreen";
import { StaffSVG } from "./components/StaffSVG";
import { AnswerBtn } from "./components/AnswerBtn";

type Phase = "start" | "playing" | "results";

interface Props {
  onModuleChange: (moduleId: string) => void;
}

export default function SightReadingModule({ onModuleChange }: Props) {
  // ── Core state ──
  const [phase, setPhase] = useState<Phase>("start");
  const [mode, setMode] = useState<"campaign" | "free">("campaign");

  // ── Campaign state ──
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);

  // ── Free state ──
  const [freeLevelKey, setFreeLevelKey] = useState<1 | 2 | 3>(1);
  const [freeClef, setFreeClef] = useState<ClefType>("treble");

  // ── Playing state ──
  const [round, setRound] = useState<RoundQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>("none");
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // ── Results state ──
  const [resultStars, setResultStars] = useState<0 | 1 | 2 | 3>(0);
  const [resultScore, setResultScore] = useState(0);
  const [resultCorrect, setResultCorrect] = useState(0);
  const [newMilestones, setNewMilestones] = useState<string[]>([]);

  // ── Persisted progress ──
  const [progress, setProgress] = useState<Record<number, LevelProgress>>({});
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [freeBest, setFreeBest] = useState<Record<string, number>>({});
  const [milestones, setMilestones] = useState<string[]>([]);
  const [collectedCards, setCollectedCards] = useState<{
    level: number;
    characterName: string;
    characterEmoji: string;
    characterColor: string;
  }[]>([]);

  // ── Active user ──
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);

  // ── Celebration & card reward state ──
  const [showCardReward, setShowCardReward] = useState<{
    character: { name: string; emoji: string; color: string };
    level: number;
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  // ── Refs ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioInitRef = useRef(false);

  // ── Load persisted data on mount ──
  useEffect(() => {
    const user = ensureDefaultUser();
    setActiveUser(user);

    const data = loadProgress(user.id);
    setProgress(data.levels);
    setUnlockedLevel(data.unlockedLevel);
    setMilestones(data.milestones);
    setCollectedCards(data.collectedCards);

    // Build free best from level progress data
    const best: Record<string, number> = {};
    for (const [lvl, lp] of Object.entries(data.levels)) {
      best[`free-${lvl}`] = lp.bestScore;
    }
    setFreeBest(best);
  }, []);

  // ── Cleanup timer on unmount ──
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Helper: load progress for current user ──
  const reloadUserProgress = useCallback((user: UserProfile) => {
    const data = loadProgress(user.id);
    setProgress(data.levels);
    setUnlockedLevel(data.unlockedLevel);
    setMilestones(data.milestones);
    setCollectedCards(data.collectedCards);

    const best: Record<string, number> = {};
    for (const [lvl, lp] of Object.entries(data.levels)) {
      best[`free-${lvl}`] = lp.bestScore;
    }
    setFreeBest(best);
  }, []);

  // ── Initialize audio on first interaction ──
  const ensureAudio = useCallback(async () => {
    if (!audioInitRef.current) {
      audioInitRef.current = true;
      try {
        await initAudio();
      } catch (error) {
        console.error("Audio init failed:", error);
      }
    }
  }, []);

  // ── Initialize audio on mount (with user interaction check) ──
  useEffect(() => {
    const handleFirstInteraction = async () => {
      await ensureAudio();
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
    
    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);
    
    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [ensureAudio]);

  // ── Timer management ──
  const startTimer = useCallback((seconds: number) => {
    setTimeRemaining(seconds);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0.1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Compute free-mode note pool ──
  const getFreeNotePool = useCallback((levelKey: 1 | 2 | 3, clef: ClefType): string[] => {
    const order = clef === "treble" ? TREBLE_ORDER : BASS_ORDER;
    const noteCounts: Record<number, number> = { 1: 5, 2: 9, 3: 13 };
    return order.slice(0, noteCounts[levelKey]);
  }, []);

  // ── Start campaign game ──
  const handleStartCampaign = useCallback(
    (level: number) => {
      ensureAudio();

      const config = getLevelConfig(level);
      const qs = generateCampaignRound(config);

      setMode("campaign");
      setCurrentLevel(level);
      setLevelConfig(config);
      setRound(qs);
      setQIdx(0);
      setFeedback("none");
      setSelected(null);
      setScore(0);
      setCorrect(0);
      setStreak(0);

      // Set up first question choices
      const q = qs[0];
      if (q.type === "note") {
        setChoices(makeChoicesForNote(q.noteId!, config.noteIds, q.clef));
      } else {
        setChoices(makeChoicesForChord(q.chordId!, config.chordIds));
      }

      // Start timer if timed level
      if (config.timeLimit) {
        startTimer(config.timeLimit);
      }

      setPhase("playing");
    },
    [ensureAudio, startTimer],
  );

  // ── Start free game ──
  const handleStartFree = useCallback(
    (levelKey: 1 | 2 | 3, clef: ClefType) => {
      ensureAudio();

      const qs = generateFreeRound(levelKey, clef);
      const poolIds = getFreeNotePool(levelKey, clef);

      setMode("free");
      setFreeLevelKey(levelKey);
      setFreeClef(clef);
      setLevelConfig(null);
      setRound(qs);
      setQIdx(0);
      setFeedback("none");
      setSelected(null);
      setScore(0);
      setCorrect(0);
      setStreak(0);

      // Set up first question choices
      const q = qs[0];
      setChoices(makeChoicesForNote(q.noteId!, poolIds, q.clef));

      setPhase("playing");
    },
    [ensureAudio, getFreeNotePool],
  );

  // ── Advance to next question or results ──
  const advance = useCallback(
    (newQIdx: number, newScore: number, newCorrect: number) => {
      if (newQIdx >= TOTAL_Q) {
        stopTimer();
        const s = starsFor(newCorrect);
        setResultStars(s);
        setResultScore(newScore);
        setResultCorrect(newCorrect);

        // Persist progress
        if (activeUser) {
          if (mode === "campaign") {
            const result = updateLevelProgress(
              activeUser.id,
              currentLevel,
              s,
              newScore,
            );
            setNewMilestones(result.newMilestones);

            // Reload progress
            const data = loadProgress(activeUser.id);
            setProgress(data.levels);
            setUnlockedLevel(data.unlockedLevel);
            setMilestones(data.milestones);
            setCollectedCards(data.collectedCards);
          } else {
            // Free mode: update best score
            const bestKey = `${freeClef}-${freeLevelKey}`;
            setFreeBest((prev) => ({
              ...prev,
              [bestKey]: Math.max(prev[bestKey] ?? 0, newScore),
            }));
            setNewMilestones([]);
          }
        }

        setPhase("results");
      } else {
        setQIdx(newQIdx);
        setScore(newScore);
        setCorrect(newCorrect);
        setFeedback("none");
        setSelected(null);

        // Set up next question choices
        const q = round[newQIdx];
        if (q.type === "note") {
          const poolIds =
            mode === "campaign" && levelConfig
              ? levelConfig.noteIds
              : getFreeNotePool(freeLevelKey, q.clef);
          setChoices(makeChoicesForNote(q.noteId!, poolIds, q.clef));
        } else if (mode === "campaign" && levelConfig) {
          setChoices(makeChoicesForChord(q.chordId!, levelConfig.chordIds));
        }
      }
    },
    [
      activeUser,
      mode,
      currentLevel,
      freeClef,
      freeLevelKey,
      levelConfig,
      round,
      stopTimer,
      getFreeNotePool,
    ],
  );

  // ── Handle timeout (timer ran out) ──
  const handleTimeout = useCallback(() => {
    setFeedback("timeout");
    setTimeout(() => {
      advance(qIdx + 1, score, correct);
    }, 1400);
  }, [qIdx, score, correct, advance]);

  // Watch for timer reaching zero
  const prevTimeRemaining = useRef(timeRemaining);
  useEffect(() => {
    if (
      phase === "playing" &&
      timeRemaining === 0 &&
      prevTimeRemaining.current > 0 &&
      levelConfig?.timeLimit != null
    ) {
      handleTimeout();
    }
    prevTimeRemaining.current = timeRemaining;
  }, [timeRemaining, phase, levelConfig, handleTimeout]);

  // ── Handle answer ──
  const handleAnswer = useCallback(
    (answer: string) => {
      if (feedback !== "none" || phase !== "playing") {
        return;
      }

      const q = round[qIdx];
      if (!q) return;

      setSelected(answer);

      // Kick off audio init inside this user gesture (safe to call repeatedly)
      ensureAudio();

      let isCorrect: boolean;

      if (q.type === "chord") {
        isCorrect = answer === q.chordId;
      } else {
        const noteData = ALL_NOTE_MAP[q.noteId!];
        isCorrect = answer === noteData?.name;
      }

      // Time ratio for timed levels (bonus for fast answers)
      let timeRatio: number | undefined;
      if (levelConfig?.timeLimit && levelConfig.timeLimit > 0) {
        timeRatio = timeRemaining / levelConfig.timeLimit;
      }

      // Calculate per-question score
      const questionScore = calculateScore(isCorrect, streak, timeRatio);

      if (isCorrect) {
        try {
          if (q.type === "chord") {
            playChordSound(q.chordNoteIds ?? []);
          } else if (q.noteId) {
            playNoteSound(q.noteId);
          }
        } catch {
          // Sound failure is non-blocking
        }

        const newScore = score + questionScore;
        const newCorrect = correct + 1;
        setFeedback("correct");
        setStreak((s) => s + 1);

        setTimeout(() => {
          advance(qIdx + 1, newScore, newCorrect);
        }, 700);
      } else {
        try {
          playErrorSound();
        } catch {
          // Sound failure is non-blocking
        }
        setFeedback("wrong");
        setStreak(0);

        setTimeout(() => {
          advance(qIdx + 1, score, correct);
        }, 1400);
      }
    },
    [feedback, phase, round, qIdx, streak, score, correct, timeRemaining, levelConfig, advance],
  );

  // ── User switch handler ──
  const handleUserSwitch = useCallback(() => {
    const user = getActiveUser();
    if (user) {
      setActiveUser(user);
      reloadUserProgress(user);
      // Go back to start screen
      stopTimer();
      setPhase("start");
    }
  }, [reloadUserProgress, stopTimer]);

  // ── Celebration & card collect logic (must be before early return) ──
  const isPassedWithHighScore = resultCorrect >= 7;

  useEffect(() => {
    if (phase === "results" && isPassedWithHighScore && activeUser && mode === "campaign") {
      const character = LEVEL_CHARACTERS[currentLevel];
      if (character) {
        const collected = collectCard(
          activeUser.id,
          currentLevel,
          character.name,
          character.emoji,
          character.color
        );
        if (collected) {
          setCollectedCards(loadProgress(activeUser.id).collectedCards);
          setTimeout(() => {
            setShowCelebration(true);
            setCardFlipped(false);
            setShowCardReward({ character, level: currentLevel });
          }, 500);
        }
      }
    }
  }, [phase, isPassedWithHighScore, currentLevel, activeUser, mode]);

  // ── Render Start Screen ──
  if (phase === "start") {
    if (!activeUser) return null;

    return (
      <StartScreen
        onStartCampaign={handleStartCampaign}
        onStartFree={handleStartFree}
        onModuleChange={onModuleChange}
        progress={progress}
        unlockedLevel={unlockedLevel}
        freeBest={freeBest}
        milestones={milestones}
        activeUser={activeUser}
        onSwitchUser={handleUserSwitch}
        collectedCards={collectedCards}
      />
    );
  }

  // ── Render Results Screen ──
  if (phase === "results") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-5 py-8 relative"
          style={{
            background: "linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)",
          }}
        >
        {/* Celebration particles */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, x: Math.random() * 100, opacity: 1, scale: 0 }}
                  animate={{
                    y: 400 + Math.random() * 200,
                    x: Math.random() * 300 - 150,
                    opacity: [1, 1, 0],
                    scale: [0, 1.2, 1],
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    ease: "easeOut",
                    delay: Math.random() * 0.5,
                  }}
                  className="absolute"
                >
                  <span style={{ fontSize: 24 + Math.random() * 16 }}>
                    {["⭐", "🎉", "🎊", "✨", "🌟", "🎈", "🎁", "🎀"][Math.floor(Math.random() * 8)]}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result header */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="mb-4"
        >
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{
              background:
                resultStars >= 2
                  ? "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)"
                  : "linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)",
              boxShadow:
                resultStars >= 2
                  ? "0 12px 32px rgba(245, 158, 11, 0.4)"
                  : "0 12px 32px rgba(59, 130, 246, 0.3)",
            }}
          >
            <span style={{ fontSize: 48 }}>
              {resultStars === 3 ? "🏆" : resultStars === 2 ? "🥈" : resultStars === 1 ? "🥉" : "🎵"}
            </span>
          </div>
        </motion.div>

        {/* Celebration message */}
        <AnimatePresence>
          {isPassedWithHighScore && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2"
            >
              <div
                className="px-6 py-3 rounded-full flex items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                }}
              >
                <span style={{ fontSize: 20 }}>🎉</span>
                <span className="text-white font-bold text-sm">过关成功！太棒了！</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <h2
          className="text-2xl font-extrabold text-center mb-2"
          style={{ color: "#1D1D1F" }}
        >
          {resultStars >= 2 ? "太棒了！" : resultStars >= 1 ? "不错哦！" : "继续加油！"}
        </h2>

        <p className="text-sm text-gray-500 mb-6 text-center">
          {mode === "campaign"
            ? `第 ${currentLevel} 关完成`
            : `${freeClef === "treble" ? "高音" : "低音"}谱号 · ${freeLevelKey === 1 ? "初学" : freeLevelKey === 2 ? "进阶" : "高手"}`}
        </p>

        {/* Stars display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-8"
        >
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: i <= resultStars ? 1 : 0.6, rotate: 0 }}
              transition={{
                delay: 0.3 + i * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              style={{
                fontSize: i <= resultStars ? 42 : 36,
                filter: i <= resultStars ? "none" : "grayscale(1)",
                opacity: i <= resultStars ? 1 : 0.3,
              }}
            >
              ⭐
            </motion.span>
          ))}
        </motion.div>

        {/* Score details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-6"
        >
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-600">总分</span>
            <span className="text-3xl font-extrabold text-indigo-600">{resultScore}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-green-600">{resultCorrect}</div>
              <div className="text-xs text-gray-500 mt-1">答对</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-red-500">{TOTAL_Q - resultCorrect}</div>
              <div className="text-xs text-gray-500 mt-1">答错</div>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col gap-3 w-full max-w-sm"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (mode === "campaign") {
                handleStartCampaign(currentLevel);
              } else {
                handleStartFree(freeLevelKey, freeClef);
              }
            }}
            className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.35)",
              border: "none",
              cursor: "pointer",
            }}
          >
            🔄 再练一次
          </motion.button>

          {mode === "campaign" && currentLevel < 100 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStartCampaign(currentLevel + 1)}
              className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
                border: "none",
                cursor: "pointer",
              }}
            >
              ▶ 下一关
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase("start")}
            className="w-full py-4 rounded-2xl font-bold text-base shadow-md"
            style={{
              background: "#fff",
              color: "#4B5563",
              border: "1px solid #E5E7EB",
              cursor: "pointer",
            }}
          >
            🏠 返回主页
          </motion.button>
        </motion.div>

        {/* Card reward modal with flip animation */}
        <AnimatePresence>
          {showCardReward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            >
              <motion.div
                initial={{ scale: 0, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, y: 50 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="rounded-3xl p-8 flex flex-col items-center gap-5 mx-4"
                style={{
                  background: cardFlipped
                    ? `linear-gradient(135deg, ${showCardReward.character.color}15 0%, ${showCardReward.character.color}30 100%)`
                    : "linear-gradient(135deg, #F5F5F7 0%, #E8E8ED 100%)",
                  border: cardFlipped
                    ? `3px solid ${showCardReward.character.color}`
                    : "3px solid #AEAEB2",
                  boxShadow: cardFlipped
                    ? `0 20px 60px ${showCardReward.character.color}55`
                    : "0 20px 60px rgba(0,0,0,0.3)",
                  maxWidth: 320,
                  minWidth: 280,
                }}
              >
                {/* The Card with flip */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="rounded-2xl flex items-center justify-center"
                  style={{
                    width: 180,
                    height: 220,
                    perspective: 1000,
                  }}
                >
                  <motion.div
                    animate={{ rotateY: cardFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 120, damping: 15 }}
                    className="w-full h-full relative"
                    style={{
                      transformStyle: "preserve-3d",
                      cursor: cardFlipped ? "default" : "pointer",
                    }}
                    onClick={() => !cardFlipped && setCardFlipped(true)}
                  >
                    {/* Front (back of card - shown first) */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center"
                      style={{
                        backfaceVisibility: "hidden",
                        background: "linear-gradient(135deg, #FBC2EB 0%, #A6C1EE 100%)",
                        border: "4px solid #fff",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      }}
                    >
                      <span style={{ fontSize: 56, marginBottom: 8 }}>🎁</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                        点击抽卡
                      </span>
                      <span style={{ fontSize: 11, color: "#fff", marginTop: 4, opacity: 0.9 }}>
                        ↻ 翻牌揭晓
                      </span>
                    </motion.div>

                    {/* Back (character revealed - shown after flip) */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        background: `linear-gradient(135deg, ${showCardReward.character.color}22 0%, ${showCardReward.character.color}44 100%)`,
                        border: `4px solid ${showCardReward.character.color}`,
                        boxShadow: `0 8px 24px ${showCardReward.character.color}44`,
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={cardFlipped ? { scale: [0, 1.3, 1] } : { scale: 0 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 250, damping: 12 }}
                        className="flex items-center justify-center rounded-full mb-2"
                        style={{
                          width: 110,
                          height: 110,
                          background: "rgba(255,255,255,0.95)",
                          boxShadow: `0 8px 24px ${showCardReward.character.color}44`,
                        }}
                      >
                        <span style={{ fontSize: 64 }}>{showCardReward.character.emoji}</span>
                      </motion.div>
                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={cardFlipped ? { opacity: 1, y: 0 } : { opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: showCardReward.character.color,
                          textAlign: "center",
                          marginTop: 8,
                        }}
                      >
                        {showCardReward.character.name}
                      </motion.h2>
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Text content shown after flip */}
                {cardFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-col items-center"
                  >
                    <h3 style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: showCardReward.character.color,
                      textAlign: "center",
                    }}>
                      🎉 恭喜抽卡成功！
                    </h3>
                    <p style={{
                      fontSize: 12,
                      color: "#8E8E93",
                      textAlign: "center",
                      marginTop: 4,
                      fontWeight: 500,
                    }}>
                      恭喜你收集到了迪士尼角色卡片！
                    </p>
                    <div
                      className="flex items-center gap-2 px-4 py-1.5 rounded-full mt-3"
                      style={{
                        background: `rgba(255,255,255,0.9)`,
                        border: `1px solid ${showCardReward.character.color}22`,
                      }}
                    >
                      <span style={{ fontSize: 11 }}>🎵</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#636366" }}>
                        第 {showCardReward.level} 关奖励
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Close button (only after flip) */}
                {cardFlipped && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 }}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setShowCardReward(null)}
                    className="px-10 py-3 rounded-full font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${showCardReward.character.color} 0%, ${showCardReward.character.color}dd 100%)`,
                      color: "#fff",
                      fontSize: 15,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: `0 4px 12px ${showCardReward.character.color}44`,
                      marginTop: 4,
                    }}
                  >
                    太棒了！
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // ── Playing Screen ──
  const currentQ = round[qIdx];
  const answered = feedback !== "none";

  // Derive StaffSVG props from current question
  const currentNoteData = currentQ?.type === "note" && currentQ.noteId
    ? ALL_NOTE_MAP[currentQ.noteId]
    : null;
  const currentChordNotes = currentQ?.type === "chord" && currentQ.chordNoteIds
    ? currentQ.chordNoteIds.map((id) => ALL_NOTE_MAP[id]).filter(Boolean)
    : [];

  const resolvedClef: ClefType = currentQ?.clef ?? "treble";

  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{
        background: "linear-gradient(160deg, #F8FAFC 0%, #FAFAFA 60%, #fff 100%)",
        maxWidth: "100vw",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{
          background: mode === "campaign" ? "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" : "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
          color: "#fff",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 20 }}>
            {mode === "campaign" ? "🗺️" : "🎵"}
          </span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            {mode === "campaign"
              ? `第 ${currentLevel} 关`
              : `${freeClef === "treble" ? "高音" : "低音"} ${freeLevelKey === 1 ? "初学" : freeLevelKey === 2 ? "进阶" : "高手"}`}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_Q }).map((_, i) => {
            const done = i < qIdx;
            const active = i === qIdx;
            return (
              <motion.div
                key={i}
                initial={active ? { scale: 0.8 } : {}}
                animate={active ? { scale: [1, 1.2, 1] } : {}}
                transition={active ? { repeat: Infinity, duration: 1.5 } : {}}
                className="rounded-full transition-all"
                style={{
                  width: active ? 20 : 8,
                  height: 8,
                  background: done
                    ? "rgba(255,255,255,0.9)"
                    : active
                      ? "#fff"
                      : "rgba(255,255,255,0.3)",
                  boxShadow: active ? "0 0 6px rgba(255,255,255,0.5)" : "none",
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
              style={{
                fontSize: 13,
                fontWeight: 700,
                background: "rgba(255,255,255,0.25)",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              🔥×{streak}
            </motion.div>
          )}
          <span style={{ fontWeight: 800, fontSize: 18 }}>{score}</span>
        </div>
      </motion.div>

      {/* Question counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0"
      >
        <span style={{ color: "#64748B", fontWeight: 600, fontSize: 14 }}>
          第{" "}
          <span style={{ color: "#4F46E5", fontWeight: 800, fontSize: 18 }}>
            {qIdx + 1}
          </span>{" "}
          / {TOTAL_Q} 题
        </span>
        <span style={{ color: "#64748B", fontSize: 14 }}>
          {currentQ?.type === "chord" ? "这是什么和弦？" : "这是什么音？"}
        </span>
      </motion.div>

      {/* Staff area */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-4">
        <div className="w-full max-w-lg">
        <motion.div
          key={qIdx}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
            padding: "20px 12px 12px",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <StaffSVG
            note={currentQ?.type === "note" ? currentNoteData : null}
            feedback={feedback}
            clef={resolvedClef}
            isChord={currentQ?.type === "chord"}
            chordNotes={
              currentQ?.type === "chord"
                ? currentChordNotes
                : undefined
            }
          />

          {/* Feedback banner */}
          <AnimatePresence>
            {feedback !== "none" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center gap-2 rounded-2xl py-3 mt-3"
                style={{
                  background:
                    feedback === "correct" ? "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)" : "linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)",
                }}
              >
                {feedback === "correct" ? (
                  <>
                    <span style={{ fontSize: 22 }}>🎉</span>
                    <span style={{ fontWeight: 700, color: "#065F46", fontSize: 16 }}>
                      太棒了！+{calculateScore(true, streak)} 分
                    </span>
                    {streak >= 3 && (
                      <span style={{ fontSize: 14, color: "#047857" }}>
                        🔥连击！
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 22 }}>🤔</span>
                    <span style={{ fontWeight: 700, color: "#991B1B", fontSize: 16 }}>
                      是{" "}
                      <span style={{ fontSize: 18 }}>
                        {currentQ?.type === "chord"
                          ? CHORDS.find((c) => c.id === currentQ.chordId)?.name ?? currentQ.chordId
                          : currentNoteData?.name}
                      </span>
                      {currentQ?.type === "note" && currentNoteData && (
                        <span style={{ fontSize: 14, color: "#B91C1C", marginLeft: 4 }}>
                          ({SOLFEGE[currentNoteData.name]})
                        </span>
                      )}
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </div>
      </div>

      {/* Answer buttons 2×2 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 pb-6 pt-2 flex-shrink-0 w-full flex justify-center"
      >
        <div className="grid gap-1.5 max-w-lg w-full" style={{ gridTemplateColumns: `repeat(${choices.length}, minmax(0, 1fr))` }}>
          {choices.map((choice, idx) => {
            const isChordQ = currentQ?.type === "chord";

            if (isChordQ) {
              const chordDef = CHORDS.find((c) => c.id === choice);
              const displayName = chordDef?.name ?? choice;
              const correctChordId = currentQ.chordId;

              return (
                <AnswerBtn
                  key={choice}
                  name={displayName as NoteName}
                  label="和弦"
                  disabled={answered}
                  isCorrect={answered && choice === correctChordId}
                  isWrong={answered && choice === selected && choice !== correctChordId}
                  onClick={() => handleAnswer(choice)}
                  color={{ bg: "#6366F1", shadow: "#4338CA", text: "#fff" }}
                  index={idx}
                />
              );
            }

            // Note choices: display name + solfège
            const noteName = choice as NoteName;
            const correctNoteName = currentNoteData?.name;
            const noteColor = NOTE_COLORS[noteName] ?? NOTE_COLORS["C"];

            return (
              <AnswerBtn
                key={choice}
                name={noteName}
                label={SOLFEGE[noteName]}
                disabled={answered}
                isCorrect={answered && choice === correctNoteName}
                isWrong={answered && choice === selected && choice !== correctNoteName}
                onClick={() => handleAnswer(choice)}
                color={noteColor}
                index={idx}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
