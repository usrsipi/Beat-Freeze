export type RankDivision = 
  | 'Frostbite' 
  | 'Glacier' 
  | 'Blizzard' 
  | 'Permafrost' 
  | 'Diamond' 
  | 'Absolute Zero';

export interface UserProfile {
  id: string;
  name: string;
  frostBits: number;
  cryoScore: number; // In Kelvin (e.g. 1850 K)
  level: number;
  xp: number;
  xpToNextLevel: number;
  battlesWon: number;
  battlesPlayed: number;
  currentStreak: number;
}

export type BattleGenre = 'Trap' | 'Phonk' | 'Cyberpunk' | 'Drill' | 'Lo-Fi' | 'Hyperpop';

export type RoomStatus = 'Open' | 'Cooking' | 'Voting' | 'Results';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  cryoScore: number;
  division: RankDivision;
  hasSubmitted?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  channel: 'universal' | 'battle';
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  genre: BattleGenre;
  hostName: string;
  status: RoomStatus;
  playerCount: number;
  maxPlayers: number;
  roundTimerSeconds: number;
  isPrivate: boolean;
  players: Player[];
}

export interface BeatSubmission {
  id: string;
  anonymousLabel: string;
  producerId: string;
  producerName: string;
  trackTitle: string;
  originalFileName?: string;
  genre: BattleGenre;
  duration: number; // Total seconds of audio file
  playLimitSeconds: number; // 45 seconds max per battle round showcase
  waveformPeaks: number[]; // Extracted audio waveform amplitude peaks
  audioBlobUrl?: string; // Real uploaded audio object URL if available
  hasNoAudio: boolean; // Option to submit without audio
  trimStartSeconds?: number; // Start of the playable trim window
  trimEndSeconds?: number; // End of the playable trim window
  scores: {
    voterId: string;
    rating: number; // 1 - 5 stars
  }[];
  averageRating: number;
  cryoPointsEarned: number;
}

export interface BattleResult {
  rank: number;
  producerId: string;
  producerName: string;
  trackTitle: string;
  hasNoAudio: boolean;
  averageRating: number;
  totalVotes: number;
  cryoScoreDelta: number;
  frostBitsEarned: number;
  xpEarned: number;
  isWinner: boolean;
}
