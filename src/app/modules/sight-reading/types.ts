export type NoteName = "C" | "D" | "E" | "F" | "G" | "A" | "B";
export type ClefType = "treble" | "bass";
export type FeedbackState = "none" | "correct" | "wrong" | "timeout";

// ─── Note data ─────────────────────────────────────────────────────────────
export interface NoteData {
  id: string;
  name: NoteName;
  octave: number;
  step: number;
}

// ─── Chord data ────────────────────────────────────────────────────────────
export interface ChordDef {
  id: string;          // "C-major"
  name: string;        // "C和弦"
  noteIds: string[];   // 3 note IDs e.g. ["C4","E4","G4"]
}

// ─── Level config ──────────────────────────────────────────────────────────
export interface LevelConfig {
  level: number;
  stage: 1 | 2 | 3 | 4 | 5;
  clef: "treble" | "bass" | "mixed";
  noteIds: string[];
  timeLimit: number | null;
  isChordLevel: boolean;
  chordIds: string[];
}

// ─── Round question ────────────────────────────────────────────────────────
export interface RoundQuestion {
  type: "note" | "chord";
  clef: ClefType;
  noteId?: string;
  chordId?: string;
  chordNoteIds?: string[];
}

// ─── Progress ──────────────────────────────────────────────────────────────
export interface LevelProgress {
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
  completedAt: string;
}

export interface CollectedCard {
  level: number;
  characterName: string;
  characterEmoji: string;
  characterColor: string;
  collectedAt: string;
}

export interface PersistedData {
  version: 1;
  levels: Record<number, LevelProgress>;
  unlockedLevel: number;
  milestones: string[];
  lastPlayedAt: string;
  collectedCards: CollectedCard[];
}

// ─── Milestones ────────────────────────────────────────────────────────────
export interface MilestoneDef {
  id: string;
  level: number;
  icon: string;       // "🏅" | "🎵" | "🏆" | "👑"
  name: string;
  condition: string;
}

// ─── Module interface ──────────────────────────────────────────────────────
export interface GameModule {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

// ─── Note colors ───────────────────────────────────────────────────────────
export const NOTE_COLORS: Record<NoteName, { bg: string; shadow: string; text: string }> = {
  C: { bg: "#FF6B6B", shadow: "#CC4444", text: "#fff" },
  D: { bg: "#FF9A3C", shadow: "#CC6A1A", text: "#fff" },
  E: { bg: "#FBBF24", shadow: "#CA8A04", text: "#fff" },
  F: { bg: "#34D399", shadow: "#059669", text: "#fff" },
  G: { bg: "#60A5FA", shadow: "#2563EB", text: "#fff" },
  A: { bg: "#A78BFA", shadow: "#7C3AED", text: "#fff" },
  B: { bg: "#F472B6", shadow: "#DB2777", text: "#fff" },
};

export const SOLFEGE: Record<NoteName, string> = {
  C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si",
};

// ─── Notes ─────────────────────────────────────────────────────────────────
// Treble: step 0 = E4 at bottom line
export const ALL_NOTES: NoteData[] = [
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

// Bass: step 0 = G2 at bottom line
export const BASS_NOTES: NoteData[] = [
  { id: "E2", name: "E", octave: 2, step: -2 },
  { id: "F2", name: "F", octave: 2, step: -1 },
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
  { id: "C4", name: "C", octave: 4, step: 10 },
];

export const ALL_NOTE_MAP: Record<string, NoteData> = {};
[...ALL_NOTES, ...BASS_NOTES].forEach(n => { ALL_NOTE_MAP[n.id] = n; });

// ─── Teaching order ────────────────────────────────────────────────────────
// Anchor notes: line notes first, then spaces, then ledger lines
export const TREBLE_ORDER = [
  "E4","G4","B4","D5","F5",    // line notes (anchor)
  "F4","A4","C5","E5",         // space notes
  "C4","D4","G5","A5",         // ledger line notes
];

export const BASS_ORDER = [
  "G2","B2","D3","F3","A3",    // line notes (anchor)
  "A2","C3","E3","G3","B3",    // space notes
  "E2","F2","C4",              // ledger line notes
];

// ─── Chords ────────────────────────────────────────────────────────────────
export const CHORDS: ChordDef[] = [
  { id: "C-major", name: "C和弦", noteIds: ["C4","E4","G4"] },
  { id: "G-major", name: "G和弦", noteIds: ["G3","B3","D4"] },
  { id: "F-major", name: "F和弦", noteIds: ["F3","A3","C4"] },
];

// ─── Staff constants ───────────────────────────────────────────────────────
export const TOTAL_Q = 10;
export const SY = 220;
export const HS = 20;
export const NX = 330;
export const SL = 108;
export const SR = 520;
export const LINE_YS = [220, 180, 140, 100, 60];

export const noteY = (step: number) => SY - step * HS;

// ─── Milestones ────────────────────────────────────────────────────────────
export const MILESTONES: MilestoneDef[] = [
  { id: "m1",  level: 5,  icon: "🏅", name: "线上音猎手",       condition: "高音5个线上音过关" },
  { id: "m2",  level: 8,  icon: "🎵", name: "第一个和弦",       condition: "首次和弦关通过" },
  { id: "m3",  level: 10, icon: "🏅", name: "五线谱学徒",       condition: "高音9个音过关" },
  { id: "m4",  level: 18, icon: "🏅", name: "高音谱号大师",     condition: "高音13个音过关" },
  { id: "m5",  level: 20, icon: "🏆", name: "高音毕业",         condition: "第1阶段通关" },
  { id: "m6",  level: 25, icon: "🏅", name: "低音探索者",       condition: "低音5个线上音过关" },
  { id: "m7",  level: 30, icon: "🏅", name: "低音谱号学徒",     condition: "低音9个音过关" },
  { id: "m8",  level: 38, icon: "🏅", name: "低音谱号大师",     condition: "低音13个音过关" },
  { id: "m9",  level: 40, icon: "🏆", name: "低音毕业",         condition: "第2阶段通关" },
  { id: "m10", level: 43, icon: "🏅", name: "双重奏",           condition: "双谱线音过关" },
  { id: "m11", level: 48, icon: "🎵", name: "和弦桥梁",         condition: "跨谱号和弦关通过" },
  { id: "m12", level: 50, icon: "🏅", name: "跨界演奏家",       condition: "双谱19音过关" },
  { id: "m13", level: 58, icon: "🏅", name: "五线通",           condition: "26音全部过关" },
  { id: "m14", level: 60, icon: "🏆", name: "桥梁毕业",         condition: "第3阶段通关" },
  { id: "m15", level: 63, icon: "🏅", name: "全音符战士",       condition: "全26音适应" },
  { id: "m16", level: 70, icon: "🏅", name: "精准大师",         condition: "8/10门槛过关" },
  { id: "m17", level: 78, icon: "🏅", name: "识谱艺术家",       condition: "高混淆度过关" },
  { id: "m18", level: 80, icon: "🏆", name: "全能毕业",         condition: "第4阶段通关" },
  { id: "m19", level: 83, icon: "🏅", name: "闪电反应",         condition: "计时模式入门" },
  { id: "m20", level: 90, icon: "🏅", name: "疾风迅雷",         condition: "限时≤8s过关" },
  { id: "m21", level: 98, icon: "🏅", name: "识谱传说",         condition: "限时≤7s过关" },
  { id: "m22", level: 100, icon: "👑", name: "五线谱之王",      condition: "全部100关通关" },
];

// ─── Stage defs ────────────────────────────────────────────────────────────
export const STAGES = [
  { id: 1, name: "高音入门", range: "第1-20关", emoji: "🎼", color: "#16A34A" },
  { id: 2, name: "低音入门", range: "第21-40关", emoji: "🎻", color: "#2563EB" },
  { id: 3, name: "混合挑战", range: "第41-60关", emoji: "🔀", color: "#7C3AED" },
  { id: 4, name: "全能大师", range: "第61-80关", emoji: "🎵", color: "#D97706" },
  { id: 5, name: "限时速通", range: "第81-100关", emoji: "⏱️", color: "#DC2626" },
];

export function getStage(level: number): 1|2|3|4|5 {
  if (level <= 20) return 1;
  if (level <= 40) return 2;
  if (level <= 60) return 3;
  if (level <= 80) return 4;
  return 5;
}

export function starsFor(correct: number): 0|1|2|3 {
  if (correct >= 9) return 3;
  if (correct >= 7) return 2;
  if (correct >= 5) return 1;
  return 0;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Modules ───────────────────────────────────────────────────────────────
export const GAME_MODULES: GameModule[] = [
  { id: "sight-reading", name: "识谱", icon: "🎼", enabled: true },
  { id: "rhythm", name: "节奏", icon: "🥁", enabled: false },
  { id: "leaderboard", name: "排行", icon: "🏆", enabled: false },
];
