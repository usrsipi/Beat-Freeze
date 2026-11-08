import { RankDivision, BeatSubmission, BattleResult, Room } from '../types/game';

/**
 * Returns the competitive rank division corresponding to a Cryo Score (in Kelvin index).
 */
export function getRankDivision(cryoScore: number): RankDivision {
  if (cryoScore >= 2400) return 'Absolute Zero';
  if (cryoScore >= 2100) return 'Diamond';
  if (cryoScore >= 1800) return 'Permafrost';
  if (cryoScore >= 1500) return 'Blizzard';
  if (cryoScore >= 1200) return 'Glacier';
  return 'Frostbite';
}

/**
 * Calculates XP required to advance from current level to next level.
 */
export function getXpRequiredForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.2, level - 1));
}

/**
 * Applies XP gain to current level and xp pool, returning new level and leftover XP.
 */
export function applyXpGain(currentLevel: number, currentXp: number, xpGained: number): {
  newLevel: number;
  newXp: number;
  levelsGained: number;
  xpToNext: number;
} {
  let level = currentLevel;
  let xp = currentXp + xpGained;
  let levelsGained = 0;

  while (true) {
    const required = getXpRequiredForLevel(level);
    if (xp >= required) {
      xp -= required;
      level += 1;
      levelsGained += 1;
    } else {
      break;
    }
  }

  return {
    newLevel: level,
    newXp: xp,
    levelsGained,
    xpToNext: getXpRequiredForLevel(level),
  };
}

/**
 * Generates a unique 6-character room code (e.g., 'FRZ982').
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validates a room code format (must be 6 alphanumeric chars).
 */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/i.test(code.trim());
}

/**
 * Calculates battle rewards, Cryo Score delta, FrostBits, and rank results based on ratings.
 */
export function calculateBattleOutcomes(
  submissions: BeatSubmission[],
  currentStreak: number
): BattleResult[] {
  const sorted = [...submissions].sort((a, b) => b.averageRating - a.averageRating);

  return sorted.map((sub, index) => {
    const rank = index + 1;
    const isWinner = rank === 1;
    const streakBonus = isWinner ? Math.min(currentStreak + 1, 5) * 5 : 0;

    let cryoScoreDelta = 0;
    let frostBitsEarned = 0;
    let xpEarned = 0;

    if (rank === 1) {
      cryoScoreDelta = 35 + streakBonus;
      frostBitsEarned = 150 + streakBonus * 10;
      xpEarned = 120;
    } else if (rank === 2) {
      cryoScoreDelta = 18;
      frostBitsEarned = 80;
      xpEarned = 80;
    } else if (rank === 3) {
      cryoScoreDelta = 8;
      frostBitsEarned = 40;
      xpEarned = 50;
    } else {
      cryoScoreDelta = -10;
      frostBitsEarned = 15;
      xpEarned = 30;
    }

    return {
      rank,
      producerId: sub.producerId,
      producerName: sub.producerName,
      trackTitle: sub.trackTitle,
      hasNoAudio: sub.hasNoAudio,
      averageRating: Number(sub.averageRating.toFixed(1)),
      totalVotes: sub.scores.length,
      cryoScoreDelta,
      frostBitsEarned,
      xpEarned,
      isWinner,
    };
  });
}

/**
 * Initial rooms list: accurate 0 active rooms as app is being built.
 */
export function getInitialRooms(): Room[] {
  return [];
}
