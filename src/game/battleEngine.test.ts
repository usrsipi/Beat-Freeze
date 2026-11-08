import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRankDivision,
  getXpRequiredForLevel,
  applyXpGain,
  generateRoomCode,
  isValidRoomCode,
  calculateBattleOutcomes,
} from './battleEngine';
import { BeatSubmission } from '../types/game';

test('getRankDivision assigns correct ranks by Cryo Score (Kelvin)', () => {
  assert.equal(getRankDivision(900), 'Frostbite');
  assert.equal(getRankDivision(1200), 'Glacier');
  assert.equal(getRankDivision(1500), 'Blizzard');
  assert.equal(getRankDivision(1800), 'Permafrost');
  assert.equal(getRankDivision(2150), 'Diamond');
  assert.equal(getRankDivision(2450), 'Absolute Zero');
});

test('XP requirement scales with level', () => {
  assert.equal(getXpRequiredForLevel(1), 100);
  assert.ok(getXpRequiredForLevel(2) > 100);
  assert.ok(getXpRequiredForLevel(3) > getXpRequiredForLevel(2));
});

test('applyXpGain calculates level ups properly', () => {
  const result1 = applyXpGain(1, 0, 50);
  assert.equal(result1.newLevel, 1);
  assert.equal(result1.newXp, 50);
  assert.equal(result1.levelsGained, 0);

  const result2 = applyXpGain(1, 0, 150);
  assert.equal(result2.newLevel, 2);
  assert.equal(result2.newXp, 50);
  assert.equal(result2.levelsGained, 1);
});

test('generateRoomCode produces valid 6-char alphanumeric code', () => {
  const code = generateRoomCode();
  assert.equal(code.length, 6);
  assert.equal(isValidRoomCode(code), true);
  assert.equal(isValidRoomCode('FRZ982'), true);
  assert.equal(isValidRoomCode('bad'), false);
  assert.equal(isValidRoomCode('TOO_LONG_123'), false);
});

test('calculateBattleOutcomes ranks by averageRating and awards rewards', () => {
  const dummySubmissions: BeatSubmission[] = [
    {
      id: 'sub-1',
      anonymousLabel: 'Beat #1',
      producerId: 'p-1',
      producerName: 'ProducerA',
      trackTitle: 'Glacier Bass',
      genre: 'Trap',
      duration: 30,
      playLimitSeconds: 45,
      waveformPeaks: [0.5, 0.8],
      hasNoAudio: false,
      scores: [{ voterId: 'v1', rating: 3.5 }],
      averageRating: 3.5,
      cryoPointsEarned: 0,
    },
    {
      id: 'sub-2',
      anonymousLabel: 'Beat #2',
      producerId: 'p-2',
      producerName: 'ProducerB',
      trackTitle: 'Ice Flow',
      genre: 'Trap',
      duration: 30,
      playLimitSeconds: 45,
      waveformPeaks: [0.5, 0.8],
      hasNoAudio: false,
      scores: [{ voterId: 'v1', rating: 4.8 }],
      averageRating: 4.8,
      cryoPointsEarned: 0,
    },
  ];

  const outcomes = calculateBattleOutcomes(dummySubmissions, 2);
  assert.equal(outcomes.length, 2);
  assert.equal(outcomes[0].producerId, 'p-2');
  assert.equal(outcomes[0].rank, 1);
  assert.equal(outcomes[0].isWinner, true);
  assert.ok(outcomes[0].cryoScoreDelta > 0);
  assert.ok(outcomes[0].frostBitsEarned >= 150);

  assert.equal(outcomes[1].producerId, 'p-1');
  assert.equal(outcomes[1].rank, 2);
  assert.equal(outcomes[1].isWinner, false);
});
