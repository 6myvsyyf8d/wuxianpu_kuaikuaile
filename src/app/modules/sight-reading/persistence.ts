import type { PersistedData } from "./types";
import { MILESTONES } from "./types";
import { loadJson, saveJson } from "../../shared/storage";

// ─── Key helpers ────────────────────────────────────────────────────────────

function storageKey(userId: string): string {
  return `piano-sight-reading-${userId}`;
}

// ─── Load / Save / Default ─────────────────────────────────────────────────

/**
 * Load persisted data for a user from localStorage.
 * Returns a fresh default object when nothing has been saved yet.
 */
export function loadProgress(userId: string): PersistedData {
  return loadJson<PersistedData>(storageKey(userId), createDefaultProgress());
}

/** Write the full PersistedData object back to localStorage. */
export function saveProgress(userId: string, data: PersistedData): void {
  saveJson(storageKey(userId), data);
}

/** Return a clean default PersistedData object. */
export function createDefaultProgress(): PersistedData {
  return {
    version: 1,
    levels: {},
    unlockedLevel: 1,
    milestones: [],
    lastPlayedAt: "",
    collectedCards: [],
  };
}

// ─── Update ─────────────────────────────────────────────────────────────────

/**
 * Record (or update) a level completion for a user.
 *
 * - Keeps the best stars and best score seen so far for this level.
 * - Unlocks the next level when stars >= 1 and this was the current frontier.
 * - Checks MILESTONES and returns any newly triggered milestone IDs.
 */
export function updateLevelProgress(
  userId: string,
  level: number,
  stars: 0 | 1 | 2 | 3,
  score: number,
): { newMilestones: string[] } {
  const progress = loadProgress(userId);
  const prev = progress.levels[level];

  // Keep best stars and best score across attempts
  progress.levels[level] = {
    stars: Math.max(prev?.stars ?? 0, stars),
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    completedAt: new Date().toISOString(),
  };

  // Unlock the next level when the player passes the current frontier
  if (stars >= 1 && level === progress.unlockedLevel && level < 100) {
    progress.unlockedLevel = level + 1;
  }

  // Scan milestones — trigger any whose level matches the one just completed
  const newMilestones: string[] = [];
  for (const m of MILESTONES) {
    if (m.level === level && !progress.milestones.includes(m.id)) {
      progress.milestones.push(m.id);
      newMilestones.push(m.id);
    }
  }

  progress.lastPlayedAt = new Date().toISOString();
  saveProgress(userId, progress);

  return { newMilestones };
}

// ─── Query ──────────────────────────────────────────────────────────────────

/** Return the highest campaign level this user has unlocked. */
export function getUnlockedLevel(userId: string): number {
  return loadProgress(userId).unlockedLevel;
}

/** Return all collected cards for a user. */
export function getCollectedCards(userId: string): PersistedData["collectedCards"] {
  return loadProgress(userId).collectedCards;
}

/**
 * Collect a Disney character card for completing a level with 7+ correct answers.
 * Returns the collected card or null if already collected.
 */
export function collectCard(
  userId: string,
  level: number,
  characterName: string,
  characterEmoji: string,
  characterColor: string,
): PersistedData["collectedCards"][0] | null {
  const progress = loadProgress(userId);
  
  // Check if already collected this level's card
  const existingCard = progress.collectedCards.find((card) => card.level === level);
  if (existingCard) {
    return null;
  }
  
  // Add the new card
  const newCard: PersistedData["collectedCards"][0] = {
    level,
    characterName,
    characterEmoji,
    characterColor,
    collectedAt: new Date().toISOString(),
  };
  
  progress.collectedCards.push(newCard);
  saveProgress(userId, progress);
  
  return newCard;
}
