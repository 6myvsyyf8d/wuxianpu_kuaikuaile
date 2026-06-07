import {
  type LevelConfig,
  type RoundQuestion,
  type ClefType,
  type NoteName,
  TREBLE_ORDER,
  BASS_ORDER,
  CHORDS,
  ALL_NOTE_MAP,
  getStage,
  shuffle,
  TOTAL_Q,
} from "./types";

// ─── Chord levels ───────────────────────────────────────────────────────────
const CHORD_LEVELS = new Set([8, 15, 28, 35, 48, 68, 88]);

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Linear interpolate a count within a sub-stage range. */
function lerpCount(
  local: number,
  rangeStart: number,
  rangeEnd: number,
  fromCount: number,
  toCount: number,
): number {
  const t = (local - rangeStart) / (rangeEnd - rangeStart);
  return Math.round(fromCount + t * (toCount - fromCount));
}

/** Extract unique NoteName values from a list of note IDs. */
function getUniqueNames(ids: string[]): NoteName[] {
  const seen = new Set<string>();
  const names: NoteName[] = [];
  for (const id of ids) {
    const data = ALL_NOTE_MAP[id];
    if (data && !seen.has(data.name)) {
      seen.add(data.name);
      names.push(data.name);
    }
  }
  return names;
}

/** Resolve the clef string for a given stage. */
function getClefForLevel(stage: 1 | 2 | 3 | 4 | 5): "treble" | "bass" | "mixed" {
  if (stage === 1) return "treble";
  if (stage === 2) return "bass";
  return "mixed";
}

// ─── Note pool builder ──────────────────────────────────────────────────────

/**
 * Build the note-pool slice for a single-clef stage (1 or 2).
 *
 * Sub-stages within the 20-level segment:
 *   local 0–6  → anchor (line notes)     3 → 5
 *   local 7–13 → fill   (line + space)    6 → 9
 *   local 14–19→ boundary (+ ledger)     10 → 13
 */
function buildSingleClefPool(order: string[], local: number): string[] {
  let count: number;

  if (local <= 6) {
    count = lerpCount(local, 0, 6, 3, 5);
  } else if (local <= 13) {
    count = lerpCount(local, 7, 13, 6, 9);
  } else {
    count = lerpCount(local, 14, 19, 10, 13);
  }

  return order.slice(0, count);
}

/**
 * Build the note-pool slice for the mixed stage (3).
 * Each clef grows proportionally; final local levels reach the full 26 notes.
 */
function buildDualClefPool(local: number): string[] {
  let tCount: number;
  let bCount: number;

  if (local <= 6) {
    tCount = lerpCount(local, 0, 6, 3, 5);
    bCount = lerpCount(local, 0, 6, 3, 5);
  } else if (local <= 13) {
    tCount = lerpCount(local, 7, 13, 6, 9);
    bCount = lerpCount(local, 7, 13, 6, 9);
  } else {
    tCount = lerpCount(local, 14, 19, 10, 13);
    bCount = lerpCount(local, 14, 19, 10, 13);
  }

  return [...TREBLE_ORDER.slice(0, tCount), ...BASS_ORDER.slice(0, bCount)];
}

/**
 * Full note pool for a stage/local position.
 * Stages 1–2 grow from 3→13 notes in a single clef.
 * Stage 3 grows from 6→26 notes across both clefs.
 * Stages 4–5 use the full 26-note pool.
 */
function buildNotePool(stage: 1 | 2 | 3 | 4 | 5, local: number): string[] {
  if (stage === 1) return buildSingleClefPool(TREBLE_ORDER, local);
  if (stage === 2) return buildSingleClefPool(BASS_ORDER, local);
  if (stage === 3) return buildDualClefPool(local);
  // Stages 4 & 5: full 26 notes
  return [...TREBLE_ORDER, ...BASS_ORDER];
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Build the full LevelConfig for a given 1-indexed campaign level.
 *
 * @param level – campaign level number (1–100)
 */
export function getLevelConfig(level: number): LevelConfig {
  const stage = getStage(level);
  const local = (level - 1) % 20;
  const clef = getClefForLevel(stage);
  const noteIds = buildNotePool(stage, local);

  let timeLimit: number | null = null;
  if (stage === 5) {
    // Start at 16 s, decrease ~0.5 s per local step, floor at 6 s.
    timeLimit = Math.max(6, 16 - Math.floor(local / 2));
  }

  const isChordLevel = CHORD_LEVELS.has(level);

  // A chord is available only when every constituent note is in the pool.
  const chordIds = isChordLevel
    ? CHORDS.filter((c) => c.noteIds.every((id) => noteIds.includes(id))).map((c) => c.id)
    : [];

  return { level, stage, clef, noteIds, timeLimit, isChordLevel, chordIds };
}

// ─── Choice generators ──────────────────────────────────────────────────────

/**
 * Fixed order for answer choices: C D E F G A B
 * This helps learners associate note names with solfège (Do Re Mi Fa Sol La Si)
 */
const NOTE_ORDER: NoteName[] = ["C", "D", "E", "F", "G", "A", "B"];

/**
 * Build `count` (default 4) answer choices for a note question.
 *
 * Choices are always displayed in C D E F G A B order to help learners
 * associate note names with solfège (C=Do, D=Re, E=Mi, etc.)
 *
 * Distractors are drawn from the note pool first; if the pool has too few
 * unique names the full clef order supplements it.
 *
 * @returns NoteName strings in fixed order (e.g. ["C", "E", "G", "B"])
 */
export function makeChoicesForNote(
  correctId: string,
  notePoolIds: string[],
  clef: ClefType,
  count: number = 7,
): string[] {
  const correctNote = ALL_NOTE_MAP[correctId];
  if (!correctNote) return [];

  // Unique names from the active pool, excluding the correct answer
  const poolNames = getUniqueNames(notePoolIds);
  let distractors = poolNames.filter((n) => n !== correctNote.name);

  // If still short, pull from the full clef order
  if (distractors.length < count - 1) {
    const fullOrder = clef === "treble" ? TREBLE_ORDER : BASS_ORDER;
    const fullNames = getUniqueNames(fullOrder);
    const existing = new Set(distractors);
    for (const name of fullNames) {
      if (distractors.length >= count - 1) break;
      if (name !== correctNote.name && !existing.has(name)) {
        distractors.push(name);
      }
    }
  }

  // Always include all 7 note names (C D E F G A B) for learning
  // Build complete set of all 7 notes, filtering out undefined values
  const allNoteNames = NOTE_ORDER.filter(n => n !== undefined);
  
  // Filter to only include notes from the pool or full order
  const availableNotes = new Set([...poolNames, ...getUniqueNames(clef === "treble" ? TREBLE_ORDER : BASS_ORDER)]);
  
  // Return all 7 notes that are available in the current level
  return allNoteNames.filter(n => availableNotes.has(n));
}

/**
 * Build shuffled answer choices for a chord question.
 *
 * @returns chord ID strings (e.g. ["C-major", "G-major", "F-major"])
 */
export function makeChoicesForChord(
  correctId: string,
  chordPoolIds: string[],
  count: number = 4,
): string[] {
  const distractors = chordPoolIds.filter((id) => id !== correctId);
  // Clamp to however many chords are actually available
  const maxDistractors = Math.min(count - 1, distractors.length);
  const selected = shuffle(distractors).slice(0, maxDistractors);
  return shuffle([correctId, ...selected]);
}

// ─── Question generators ────────────────────────────────────────────────────

/** Extract the answer string from a question (for de-duping consecutive). */
function questionAnswer(q: RoundQuestion): string {
  if (q.type === "note") {
    return ALL_NOTE_MAP[q.noteId!]?.name ?? "";
  }
  return q.chordId ?? "";
}

/** Pick a random note question obeying the "no consecutive same answer" rule. */
function pickRandomNote(
  noteIds: string[],
  clef: "treble" | "bass" | "mixed",
  lastAnswer: string | null,
): { clef: ClefType; noteId: string } {
  // Pre-split for mixed-clef scenarios
  const trebleNotes = noteIds.filter((id) => TREBLE_ORDER.includes(id));
  const bassNotes = noteIds.filter((id) => BASS_ORDER.includes(id));

  let attempts = 0;
  let chosenClef: ClefType;
  let noteId: string;

  do {
    if (clef === "mixed") {
      if (trebleNotes.length > 0 && (Math.random() < 0.5 || bassNotes.length === 0)) {
        chosenClef = "treble";
        noteId = trebleNotes[Math.floor(Math.random() * trebleNotes.length)];
      } else {
        chosenClef = "bass";
        noteId = bassNotes[Math.floor(Math.random() * bassNotes.length)];
      }
    } else {
      chosenClef = clef as ClefType;
      noteId = noteIds[Math.floor(Math.random() * noteIds.length)];
    }
    attempts++;
  } while (
    lastAnswer !== null &&
    ALL_NOTE_MAP[noteId]?.name === lastAnswer &&
    attempts < 50
  );

  return { clef: chosenClef, noteId };
}

/**
 * Generate TOTAL_Q (10) questions for a campaign level.
 *
 * Chord levels (isChordLevel + chords available): 5 chord + 5 note, shuffled.
 * Otherwise: all 10 are note questions.
 * Never places two consecutive questions with the same answer.
 */
export function generateCampaignRound(config: LevelConfig): RoundQuestion[] {
  const hasChords = config.isChordLevel && config.chordIds.length > 0;
  const chordQ = hasChords ? 5 : 0;
  const noteQ = TOTAL_Q - chordQ;

  const questions: RoundQuestion[] = [];

  // ── Note questions ──
  for (let i = 0; i < noteQ; i++) {
    const lastAnswer =
      questions.length > 0 ? questionAnswer(questions[questions.length - 1]) : null;
    const { clef, noteId } = pickRandomNote(config.noteIds, config.clef, lastAnswer);
    questions.push({ type: "note", clef, noteId });
  }

  // ── Chord questions ──
  for (let i = 0; i < chordQ; i++) {
    const lastAnswer =
      questions.length > 0 ? questionAnswer(questions[questions.length - 1]) : null;

    let chordId: string;
    let attempts = 0;
    do {
      chordId = config.chordIds[Math.floor(Math.random() * config.chordIds.length)];
      attempts++;
    } while (chordId === lastAnswer && attempts < 50);

    const chordDef = CHORDS.find((c) => c.id === chordId);
    questions.push({
      type: "chord",
      clef: "treble",
      chordId,
      chordNoteIds: chordDef?.noteIds ?? [],
    });
  }

  return shuffle(questions);
}

/**
 * Generate 10 note-only questions for free practice mode.
 *
 * @param levelKey – 1 (line notes), 2 (line+space 9 notes), 3 (all 13)
 * @param clef     – treble or bass
 */
export function generateFreeRound(
  levelKey: 1 | 2 | 3,
  clef: "treble" | "bass",
): RoundQuestion[] {
  const order = clef === "treble" ? TREBLE_ORDER : BASS_ORDER;

  let range: number;
  switch (levelKey) {
    case 1:
      range = 5; // line notes only
      break;
    case 2:
      range = 9; // line + space
      break;
    case 3:
      range = 13; // all notes
      break;
  }

  const pool = order.slice(0, range);
  const questions: RoundQuestion[] = [];

  for (let i = 0; i < TOTAL_Q; i++) {
    const lastAnswer =
      questions.length > 0
        ? ALL_NOTE_MAP[questions[questions.length - 1].noteId!]?.name ?? ""
        : "";

    let noteId: string;
    let attempts = 0;
    do {
      noteId = pool[Math.floor(Math.random() * pool.length)];
      attempts++;
    } while (
      lastAnswer !== "" &&
      ALL_NOTE_MAP[noteId]?.name === lastAnswer &&
      attempts < 50
    );

    questions.push({ type: "note", clef, noteId });
  }

  return questions;
}

// ─── Scoring ────────────────────────────────────────────────────────────────

/**
 * Calculate the score for a single answer.
 *
 *   base          = 10 (correct) / 0 (wrong)
 *   streak bonus  = +3 when streak >= 2
 *   time bonus    = +5 when timeRatio >= 0.5, +2 when >= 0.25
 */
export function calculateScore(
  isCorrect: boolean,
  streak: number,
  timeRatio?: number,
): number {
  if (!isCorrect) return 0;

  let score = 10;
  if (streak >= 2) score += 3;
  if (timeRatio !== undefined) {
    if (timeRatio >= 0.5) score += 5;
    else if (timeRatio >= 0.25) score += 2;
  }
  return score;
}
