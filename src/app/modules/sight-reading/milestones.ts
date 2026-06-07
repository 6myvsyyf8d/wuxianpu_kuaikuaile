import { MILESTONES } from "./types";
import type { MilestoneDef } from "./types";

/** Returns any newly unlocked milestone IDs for the given level. */
export function checkMilestones(level: number, currentMilestones: string[]): string[] {
  const set = new Set(currentMilestones);
  const unlocked: string[] = [];
  for (const m of MILESTONES) {
    if (m.level <= level && !set.has(m.id)) {
      unlocked.push(m.id);
    }
  }
  return unlocked;
}

/** Finds a milestone definition by its ID. */
export function getMilestoneById(id: string): MilestoneDef | undefined {
  return MILESTONES.find((m) => m.id === id);
}

/** Returns all milestone definitions that unlock at or below the given level. */
export function getMilestonesForLevel(level: number): MilestoneDef[] {
  return MILESTONES.filter((m) => m.level <= level);
}
