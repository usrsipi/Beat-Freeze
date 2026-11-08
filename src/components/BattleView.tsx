import React, { useState, useEffect } from 'react';
import { Room, BeatSubmission, UserProfile, BattleResult } from '../types/game';
import { 
  Clock, Upload, Play, Pause, RotateCcw, Star, Trophy, 
  CheckCircle2, Music, AlertCircle, FileAudio 
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { calculateBattleOutcomes, applyXpGain } from '../game/battleEngine';
import { AudioWaveform } from './AudioWaveform';
import { IceIcon } from './IceIcon';

interface BattleViewProps {
  room: Room;
  profile: UserProfile;
  onBattleFinished: (updatedProfile: UserProfile) => void;
  onReturnToLobby: () => void;
}

export const BattleView: React.FC<BattleViewProps> = ({
  room,
  profile,
  onBattleFinished,
  onReturnToLobby,
}) => {
  // Battle phases: 'crafting' | 'showcase' | 'podium'
  const [phase, setPhase] = useState<'crafting' | 'showcase' | 'podium'>('crafting');

  // Phase 1: Crafting / Submission state
  const [secondsLeft, setSecondsLeft] = useState<number>(room.roundTimerSeconds || 180);
  const [totalTimerSeconds] = useState<number>(room.roundTimerSeconds || 180);
  const [trackTitle, setTrackTitle] = useState<string>('My SubZero Beat');
  const [hasNoAudio, setHasNoAudio] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>(
    audioEngine.generateFallbackPeaks('default_seed', 120)
  );
  const [audioDuration, setAudioDuration] = useState<number>(45);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isDecodingAudio, setIsDecodingAudio] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  // Phase 2: Showcase State
  const [submissions, setSubmissions] = useState<BeatSubmission[]>([]);
  const [currentShowcaseIndex, setCurrentShowcaseIndex] = useState<number>(0);
  const [userRating, setUserRating] = useState<number>(5);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Phase 3: Podium State
  const [results, setResults] = useState<BattleResult[]>([]);

  // Production countdown timer
  useEffect(() => {
    if (phase !== 'crafting') return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          audioEngine.playFreezeSound();
          startShowcasePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Audio file upload and real PCM decoding
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingAudio(true);
    setUploadedFile(file);
    setTrackTitle(file.name.replace(/\.[^/.]+$/, ''));
    setHasNoAudio(false);

    try {
      const decoded = await audioEngine.decodeAudioFile(file, 140);
      setWaveformPeaks(decoded.peaks);
      setAudioDuration(decoded.duration);
      setAudioBlobUrl(decoded.audioUrl);
      audioEngine.playReadyUp();
    } catch {
      // Fallback peaks
      setWaveformPeaks(audioEngine.generateFallbackPeaks(file.name, 140));
    } finally {
      setIsDecodingAudio(false);
    }
  };

  // Toggle "Submit without audio"
  const handleToggleNoAudio = (checked: boolean) => {
    setHasNoAudio(checked);
    if (checked) {
      audioEngine.stopAudio();
      setIsPlayingAudio(false);
    }
    audioEngine.playUiClick();
  };

  // Submit beat
  const handleSubmitBeat = () => {
    audioEngine.playReadyUp();
    setHasSubmitted(true);
  };

  // Transition to Showcase
  const startShowcasePhase = () => {
    audioEngine.stopAudio();
    setIsPlayingAudio(false);
    setElapsedSeconds(0);

    const userEntry: BeatSubmission = {
      id: `sub-${profile.id}`,
      anonymousLabel: 'Anonymous Entry #1',
      producerId: profile.id,
      producerName: profile.name,
      trackTitle: trackTitle.trim() || 'Untitled Cryo Beat',
      originalFileName: uploadedFile ? uploadedFile.name : undefined,
      genre: room.genre,
      duration: hasNoAudio ? 0 : audioDuration,
      playLimitSeconds: 45,
      waveformPeaks: hasNoAudio ? [] : waveformPeaks,
      audioBlobUrl: hasNoAudio ? undefined : (audioBlobUrl || undefined),
      hasNoAudio,
      scores: [],
      averageRating: 0,
      cryoPointsEarned: 0,
    };

    setSubmissions([userEntry]);
    setCurrentShowcaseIndex(0);
    setPhase('showcase');
  };

  // Audio playback controls for 45s showcase
  const handleTogglePlay = () => {
    if (hasNoAudio) return;

    if (isPlayingAudio) {
      audioEngine.stopAudio();
      setIsPlayingAudio(false);
    } else {
      const currentSub = submissions[currentShowcaseIndex];
      if (currentSub?.audioBlobUrl) {
        setIsPlayingAudio(true);
        audioEngine.playShowcaseAudio(
          currentSub.audioBlobUrl,
          (elapsed) => {
            setElapsedSeconds(elapsed);
          },
          () => {
            setIsPlayingAudio(false);
          },
          elapsedSeconds >= 45 ? 0 : elapsedSeconds
        );
      } else {
        // Mock 45s timer ticker for preview when no local audio was provided
        setIsPlayingAudio(true);
        const start = Date.now() - elapsedSeconds * 1000;
        const tick = () => {
          if (!audioEngine) return;
          const nowElapsed = (Date.now() - start) / 1000;
          if (nowElapsed >= 45) {
            setElapsedSeconds(45);
            setIsPlayingAudio(false);
            return;
          }
          setElapsedSeconds(nowElapsed);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }
  };

  const handleSeekWaveform = (targetSeconds: number) => {
    if (hasNoAudio) return;
    setElapsedSeconds(targetSeconds);
    if (isPlayingAudio && submissions[currentShowcaseIndex]?.audioBlobUrl) {
      audioEngine.playShowcaseAudio(
        submissions[currentShowcaseIndex].audioBlobUrl!,
        (elapsed) => setElapsedSeconds(elapsed),
        () => setIsPlayingAudio(false),
        targetSeconds
      );
    }
  };

  // Lock vote and reveal podium
  const handleLockVoteAndFinish = () => {
    audioEngine.stopAudio();
    setIsPlayingAudio(false);
    audioEngine.playFreezeSound();

    const updated = [...submissions];
    const curr = updated[currentShowcaseIndex];
    curr.scores.push({ voterId: profile.id, rating: userRating });
    curr.averageRating = userRating;

    const outcomes = calculateBattleOutcomes(updated, profile.currentStreak);
    setResults(outcomes);
    setPhase('podium');

    const userOutcome = outcomes.find((o) => o.producerId === profile.id);
    if (userOutcome) {
      const xpResult = applyXpGain(profile.level, profile.xp, userOutcome.xpEarned);
      const isWin = userOutcome.isWinner;

      const updatedProfile: UserProfile = {
        ...profile,
        cryoScore: Math.max(0, profile.cryoScore + userOutcome.cryoScoreDelta),
        frostBits: profile.frostBits + userOutcome.frostBitsEarned,
        level: xpResult.newLevel,
        xp: xpResult.newXp,
        xpToNextLevel: xpResult.xpToNext,
        battlesPlayed: profile.battlesPlayed + 1,
        battlesWon: isWin ? profile.battlesWon + 1 : profile.battlesWon,
        currentStreak: isWin ? profile.currentStreak + 1 : 0,
      };

      onBattleFinished(updatedProfile);
    }
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="py-6 px-4 md:px-8 max-w-4xl mx-auto text-sky-100">
      {/* ========================================================= */}
      {/* PHASE 1: CRAFTING / SUBMISSION                            */}
      {/* ========================================================= */}
      {phase === 'crafting' && (
        <div className="space-y-6">
          {/* Header Bar with Countdown */}
          <div className="p-6 rounded-xl bg-[#08101e] border border-cyan-500/40 cryo-card-shadow flex items-center justify-between">
            <div>
              <span className="text-[11px] font-code px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold uppercase">
                PRODUCTION ROUND
              </span>
              <h2 className="font-arcade text-2xl md:text-3xl font-extrabold text-white mt-1 uppercase">
                {room.name}
              </h2>
              <div className="text-xs font-code text-slate-400 mt-0.5">
                Genre: <strong className="text-cyan-300">{room.genre}</strong> · Showcase Cap: <strong>45 Seconds</strong>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <Clock size={20} className={secondsLeft < 30 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'} />
                <span className={`font-arcade text-3xl font-black tabular-nums ${
                  secondsLeft < 30 ? 'text-rose-400' : 'text-cyan-300 cryo-glow-text'
                }`}>
                  {formatTimer(secondsLeft)}
                </span>
              </div>
              <button
                onClick={startShowcasePhase}
                className="mt-2 text-xs font-code text-cyan-400 hover:text-cyan-200 underline"
              >
                Skip timer & start showcase →
              </button>
            </div>
          </div>

          {/* Upload & Submission Form */}
          <div className="p-6 rounded-xl bg-[#08101e] border border-cyan-500/30 cryo-card-shadow-sm space-y-5">
            <h3 className="font-arcade text-lg font-bold text-white uppercase tracking-wider">
              Beat Submission
            </h3>

            {/* Track Title Rename Input */}
            <div>
              <label className="block text-xs font-code text-slate-400 mb-1">
                Track Title (Rename your beat)
              </label>
              <input
                type="text"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder="Give your beat a title..."
                className="w-full px-3 py-2 rounded bg-[#020408] border border-cyan-500/40 font-arcade text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Audio File Drop / Selector */}
            {!hasNoAudio && (
              <div>
                <label className="block text-xs font-code text-slate-400 mb-1">
                  Upload Audio File (.mp3, .wav, .ogg)
                </label>
                <label className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-[#020408]/60 transition-colors">
                  <Upload size={24} className="text-cyan-400 mb-2" />
                  <span className="font-arcade text-sm font-bold text-cyan-300 uppercase">
                    {uploadedFile ? uploadedFile.name : 'Select or Drag Audio File'}
                  </span>
                  <span className="text-[11px] font-code text-slate-400 mt-1">
                    {uploadedFile
                      ? `File loaded (${Math.round(uploadedFile.size / 1024)} KB) · PCM Waveform Extracted`
                      : 'MP3 or WAV audio track (Full file supported, 45s showcase cap)'}
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Submit without audio option */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded bg-[#020408]/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
                <input
                  type="checkbox"
                  checked={hasNoAudio}
                  onChange={(e) => handleToggleNoAudio(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
                />
                <div>
                  <span className="font-arcade text-xs font-bold text-white uppercase tracking-wide">
                    Submit without audio track
                  </span>
                  <span className="block text-[11px] font-code text-slate-400 mt-0.5">
                    Submit your producer slot without uploading an audio file (e.g. title reservation or silent entry).
                  </span>
                </div>
              </label>
            </div>

            {/* Waveform Preview Display */}
            <div>
              <div className="flex items-center justify-between text-xs font-code text-slate-400 mb-1.5">
                <span>Standstill Audio Waveform (DAW Amplitude Peaks)</span>
                <span className="text-cyan-400">45s Showcase Limit Marker</span>
              </div>
              <AudioWaveform
                peaks={waveformPeaks}
                progressSeconds={0}
                maxSeconds={45}
                totalDuration={audioDuration}
                hasNoAudio={hasNoAudio}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-cyan-500/20">
              <button
                onClick={handleSubmitBeat}
                disabled={hasSubmitted}
                className={`w-full py-3 rounded-lg font-arcade font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  hasSubmitted
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-[#020408] cryo-card-shadow-sm'
                }`}
              >
                {hasSubmitted ? (
                  <>
                    <CheckCircle2 size={18} /> BEAT SUBMITTED & LOCKED
                  </>
                ) : (
                  <>
                    <Upload size={18} /> LOCK & SUBMIT BEAT
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 2: ANONYMOUS SHOWCASE & 45s BLIND VOTING           */}
      {/* ========================================================= */}
      {phase === 'showcase' && submissions.length > 0 && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-xl bg-[#08101e] border border-cyan-500/40 cryo-card-shadow">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
              <div>
                <span className="text-xs font-code text-cyan-400 font-bold uppercase tracking-wider">
                  ANONYMOUS SHOWCASE (45S MAX AUDIO CAP)
                </span>
                <h3 className="font-arcade text-2xl font-bold text-white uppercase mt-0.5">
                  {submissions[currentShowcaseIndex].anonymousLabel}
                </h3>
              </div>
              <div className="text-xs font-code text-slate-400 bg-[#020408] px-3 py-1 rounded border border-cyan-500/20">
                Track 1 of {submissions.length}
              </div>
            </div>

            {/* Track Info */}
            <div className="mt-5 p-4 rounded-lg bg-[#020408] border border-slate-800">
              <div className="flex items-center justify-between text-xs font-code text-slate-400 mb-2">
                <span>
                  Track Title: <strong className="text-cyan-300">{submissions[currentShowcaseIndex].trackTitle}</strong>
                </span>
                <span>{submissions[currentShowcaseIndex].genre} · {submissions[currentShowcaseIndex].hasNoAudio ? 'No Audio' : '45s Showcase'}</span>
              </div>

              {/* Real Standstill Audio Waveform (DAW vertical peaks across subtle grid) */}
              <div className="my-3">
                <AudioWaveform
                  peaks={submissions[currentShowcaseIndex].waveformPeaks}
                  progressSeconds={elapsedSeconds}
                  maxSeconds={45}
                  totalDuration={submissions[currentShowcaseIndex].duration || 45}
                  isPlaying={isPlayingAudio}
                  onSeek={handleSeekWaveform}
                  hasNoAudio={submissions[currentShowcaseIndex].hasNoAudio}
                />
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleTogglePlay}
                  disabled={submissions[currentShowcaseIndex].hasNoAudio}
                  className={`px-5 py-2 rounded font-arcade text-xs font-bold uppercase flex items-center gap-2 transition-colors ${
                    submissions[currentShowcaseIndex].hasNoAudio
                      ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                      : isPlayingAudio
                      ? 'bg-rose-500 text-white'
                      : 'bg-cyan-400 hover:bg-cyan-300 text-[#020408]'
                  }`}
                >
                  {isPlayingAudio ? <Pause size={14} /> : <Play size={14} />}
                  {isPlayingAudio ? 'PAUSE' : 'PLAY SHOWCASE (45S)'}
                </button>

                <div className="text-xs font-code text-slate-400">
                  {submissions[currentShowcaseIndex].hasNoAudio ? (
                    <span className="text-amber-400">[Silent Entry]</span>
                  ) : (
                    <span>
                      Playback: <strong className="text-cyan-300">{Math.floor(elapsedSeconds)}s</strong> / 45s Cap
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 1 to 5 Frost Stars Rating */}
            <div className="mt-8 text-center">
              <div className="text-xs font-code text-slate-400 uppercase tracking-widest mb-2">
                Rate Anonymous Beat (1 - 5 Frost Stars)
              </div>
              <div className="flex items-center justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      setUserRating(star);
                      audioEngine.playStarVote(star);
                    }}
                    className={`p-2 transition-transform hover:scale-125 ${
                      star <= userRating ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]' : 'text-slate-700'
                    }`}
                    aria-label={`Rate ${star} Stars`}
                  >
                    <Star size={36} fill={star <= userRating ? '#00f5ff' : 'none'} />
                  </button>
                ))}
              </div>
              <div className="mt-2 font-arcade text-lg font-bold text-cyan-300">
                {userRating} / 5 Frost Stars
              </div>
            </div>

            {/* Finish & Reveal Podium CTA */}
            <div className="mt-8 pt-4 border-t border-cyan-500/20 flex justify-end">
              <button
                onClick={handleLockVoteAndFinish}
                className="px-8 py-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#020408] font-arcade font-extrabold text-sm uppercase tracking-wider transition-all cryo-card-shadow-sm flex items-center gap-2"
              >
                <span>LOCK VOTE & REVEAL RESULTS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 3: PODIUM & RESULTS                                 */}
      {/* ========================================================= */}
      {phase === 'podium' && results.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-8 rounded-xl bg-[#08101e] border border-cyan-500/40 cryo-card-shadow text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-code text-xs mb-3">
              <Trophy size={14} className="text-amber-400" /> BATTLE SHOWCASE RESULTS
            </div>

            <div className="flex justify-center mb-3">
              <IceIcon size={64} glow={true} />
            </div>

            <h2 className="font-arcade text-4xl md:text-5xl font-black text-white uppercase tracking-wider cryo-glow-text">
              VICTORY REVEAL
            </h2>

            <div className="mt-6 max-w-md mx-auto p-4 rounded-lg bg-[#020408] border border-cyan-500/30 text-left space-y-2 font-code text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Producer:</span>
                <span className="text-white font-bold">{profile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Track:</span>
                <span className="text-cyan-300 font-semibold">{results[0].trackTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frost Star Rating:</span>
                <span className="text-cyan-400 font-bold">★ {results[0].averageRating} / 5</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Cryo Kelvin Score:</span>
                <span className="text-sky-300 font-bold">+{results[0].cryoScoreDelta} K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">FrostBits Earned:</span>
                <span className="text-cyan-300 font-bold">+{results[0].frostBitsEarned} ❄️</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={onReturnToLobby}
                className="px-8 py-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#020408] font-arcade font-bold text-xs uppercase tracking-wider transition-colors cryo-card-shadow-sm"
              >
                RETURN TO LOBBY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
