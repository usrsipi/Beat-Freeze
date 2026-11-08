import React, { useState, useEffect, useRef } from 'react';
import { Room, BeatSubmission, UserProfile, BattleResult } from '../types/game';
import { 
  Clock, Upload, Play, Pause, RotateCcw, Star, Trophy, 
  CheckCircle2, Music, AlertCircle, Scissors, Move
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
  const [phase, setPhase] = useState<'crafting' | 'showcase' | 'podium'>('crafting');

  // Phase 1: Crafting / Submission state
  const [secondsLeft, setSecondsLeft] = useState<number>(room.roundTimerSeconds || 180);
  const [trackTitle, setTrackTitle] = useState<string>('My SubZero Beat');
  const [hasNoAudio, setHasNoAudio] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [audioDuration, setAudioDuration] = useState<number>(45);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isDecodingAudio, setIsDecodingAudio] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [hasUploadedAudio, setHasUploadedAudio] = useState<boolean>(false);

  // Trim state
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(45);

  // Phase 2: Showcase State
  const [submissions, setSubmissions] = useState<BeatSubmission[]>([]);
  const [currentShowcaseIndex, setCurrentShowcaseIndex] = useState<number>(0);
  const [userRating, setUserRating] = useState<number>(5);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [isShowcasePlaying, setIsShowcasePlaying] = useState<boolean>(false);
  const [showcaseFinished, setShowcaseFinished] = useState<boolean>(false);

  // Phase 3: Podium State
  const [results, setResults] = useState<BattleResult[]>([]);

  const countdownTimerRef = useRef<number | null>(null);

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

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Audio file upload and real PCM decoding
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingAudio(true);
    setUploadedFile(file);
    setTrackTitle(file.name.replace(/\.[^/.]+$/, ''));
    setHasNoAudio(false);
    setHasUploadedAudio(true);

    try {
      const decoded = await audioEngine.decodeAudioFile(file, 200);
      setWaveformPeaks(decoded.peaks);
      setAudioDuration(decoded.duration);
      setAudioBlobUrl(decoded.audioUrl);
      // Set trim to start at 0, end at min(duration, 45)
      const endSec = Math.min(decoded.duration, 45);
      setTrimStart(0);
      setTrimEnd(endSec);
      audioEngine.playReadyUp();
    } catch {
      setWaveformPeaks(audioEngine.generateFallbackPeaks(file.name, 200));
    } finally {
      setIsDecodingAudio(false);
    }
  };

  const handleToggleNoAudio = (checked: boolean) => {
    setHasNoAudio(checked);
    if (checked) {
      audioEngine.stopAudio();
      setHasUploadedAudio(false);
      setWaveformPeaks([]);
      setAudioBlobUrl(null);
    }
    audioEngine.playUiClick();
  };

  const handleSubmitBeat = () => {
    audioEngine.playReadyUp();
    setHasSubmitted(true);
  };

  const startShowcasePhase = () => {
    audioEngine.stopAudio();
    setElapsedSeconds(0);
    setShowcaseFinished(false);
    setIsShowcasePlaying(false);

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
      trimStartSeconds: hasNoAudio ? 0 : trimStart,
      trimEndSeconds: hasNoAudio ? 45 : trimEnd,
      scores: [],
      averageRating: 0,
      cryoPointsEarned: 0,
    };

    setSubmissions([userEntry]);
    setCurrentShowcaseIndex(0);
    setPhase('showcase');

    // Start the 3-2-1 countdown automatically
    startCountdown();
  };

  // 3-2-1 countdown before showcase audio plays
  const startCountdown = () => {
    setCountdownNumber(3);
    setIsShowcasePlaying(false);
    setShowcaseFinished(false);
    setElapsedSeconds(0);

    let count = 3;
    countdownTimerRef.current = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
        audioEngine.playUiClick();
      } else if (count === 0) {
        setCountdownNumber(0);
        audioEngine.playFreezeSound();
      } else {
        // Countdown finished — start audio playback
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdownNumber(null);
        startShowcasePlayback();
      }
    }, 1000);
  };

  const startShowcasePlayback = () => {
    const currentSub = submissions[currentShowcaseIndex];
    if (!currentSub || currentSub.hasNoAudio) {
      // No audio — skip to voting after a brief moment
      setShowcaseFinished(true);
      return;
    }

    setIsShowcasePlaying(true);

    const trimS = currentSub.trimStartSeconds ?? 0;
    const trimE = currentSub.trimEndSeconds ?? 45;

    if (currentSub.audioBlobUrl) {
      audioEngine.playShowcaseAudio(
        currentSub.audioBlobUrl,
        (elapsed) => {
          setElapsedSeconds(elapsed);
        },
        () => {
          setIsShowcasePlaying(false);
          setShowcaseFinished(true);
        },
        0,
        trimS,
        trimE
      );
    } else {
      // Mock ticker when no blob URL
      setIsShowcasePlaying(true);
      const start = Date.now();
      const tick = () => {
        const nowElapsed = (Date.now() - start) / 1000;
        const playEnd = Math.min(trimE, 45) - trimS;
        if (nowElapsed >= playEnd) {
          setElapsedSeconds(playEnd);
          setIsShowcasePlaying(false);
          setShowcaseFinished(true);
          return;
        }
        setElapsedSeconds(nowElapsed);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  };

  const handleSeekWaveform = (targetSeconds: number) => {
    const currentSub = submissions[currentShowcaseIndex];
    if (!currentSub || currentSub.hasNoAudio) return;
    setElapsedSeconds(targetSeconds);
  };

  const handleTrimChange = (start: number, end: number) => {
    setTrimStart(start);
    setTrimEnd(end);
  };

  const handleLockVoteAndFinish = () => {
    audioEngine.stopAudio();
    setIsShowcasePlaying(false);
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

  const currentSub = submissions[currentShowcaseIndex];

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
                <label className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-[#020408]/60 transition-colors ${
                  isDecodingAudio ? 'border-amber-400 animate-pulse' : 'border-cyan-500/40 hover:border-cyan-400'
                }`}>
                  <Upload size={24} className="text-cyan-400 mb-2" />
                  <span className="font-arcade text-sm font-bold text-cyan-300 uppercase">
                    {isDecodingAudio ? 'Decoding audio...' : uploadedFile ? uploadedFile.name : 'Select or Drag Audio File'}
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

            {/* Submit without audio — improved toggle card */}
            <div className="p-4 rounded-xl bg-[#020408] border border-slate-700 hover:border-cyan-500/30 transition-colors">
              <button
                onClick={() => handleToggleNoAudio(!hasNoAudio)}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className={`shrink-0 w-12 h-7 rounded-full p-1 transition-colors ${
                  hasNoAudio ? 'bg-cyan-400' : 'bg-slate-700'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    hasNoAudio ? 'translate-x-5' : ''
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-arcade text-sm font-bold text-white uppercase tracking-wide block">
                    Submit without audio track
                  </span>
                  <span className="text-[11px] font-code text-slate-400 mt-0.5 block">
                    {hasNoAudio
                      ? 'Your entry will be silent — just a title reservation.'
                      : 'Toggle on to submit a silent entry without uploading an audio file.'}
                  </span>
                </div>
              </button>
            </div>

            {/* Waveform Preview + Editor — only shown when audio is uploaded */}
            {hasUploadedAudio && !hasNoAudio && waveformPeaks.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs font-code text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Scissors size={12} className="text-amber-400" /> Waveform Editor — Drag handles to trim
                  </span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Move size={12} /> 45s Showcase Limit
                  </span>
                </div>
                <AudioWaveform
                  peaks={waveformPeaks}
                  progressSeconds={0}
                  maxSeconds={45}
                  totalDuration={audioDuration}
                  hasNoAudio={false}
                  isEditable={true}
                  trimStartSeconds={trimStart}
                  trimEndSeconds={trimEnd}
                  onTrimChange={handleTrimChange}
                />
                <div className="mt-2 flex items-center justify-between text-[11px] font-code text-slate-500">
                  <span>
                    Playable: <strong className="text-cyan-300">{(trimEnd - trimStart).toFixed(1)}s</strong>
                    {' '}(from {trimStart.toFixed(1)}s to {trimEnd.toFixed(1)}s)
                  </span>
                  <span className="text-amber-400">♪ Auto fade-out at cut point</span>
                </div>
              </div>
            )}

            {/* Empty state when no audio uploaded yet and not in no-audio mode */}
            {!hasUploadedAudio && !hasNoAudio && (
              <div className="p-8 rounded-xl bg-[#020408] border border-dashed border-slate-700 text-center">
                <Music size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-code text-slate-500">
                  Upload an audio file to see the waveform and trim your 45-second showcase.
                </p>
              </div>
            )}

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
      {phase === 'showcase' && currentSub && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-xl bg-[#08101e] border border-cyan-500/40 cryo-card-shadow">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
              <div>
                <span className="text-xs font-code text-cyan-400 font-bold uppercase tracking-wider">
                  ANONYMOUS SHOWCASE (45S MAX AUDIO CAP)
                </span>
                <h3 className="font-arcade text-2xl font-bold text-white uppercase mt-0.5">
                  {currentSub.anonymousLabel}
                </h3>
              </div>
              <div className="text-xs font-code text-slate-400 bg-[#020408] px-3 py-1 rounded border border-cyan-500/20">
                Track {currentShowcaseIndex + 1} of {submissions.length}
              </div>
            </div>

            {/* Track Info */}
            <div className="mt-5 p-4 rounded-lg bg-[#020408] border border-slate-800">
              <div className="flex items-center justify-between text-xs font-code text-slate-400 mb-2">
                <span>
                  Track Title: <strong className="text-cyan-300">{currentSub.trackTitle}</strong>
                </span>
                <span>{currentSub.genre} · {currentSub.hasNoAudio ? 'No Audio' : '45s Showcase'}</span>
              </div>

              {/* Waveform (read-only in showcase) */}
              <div className="my-3">
                <AudioWaveform
                  peaks={currentSub.waveformPeaks}
                  progressSeconds={elapsedSeconds}
                  maxSeconds={45}
                  totalDuration={currentSub.duration || 45}
                  onSeek={handleSeekWaveform}
                  hasNoAudio={currentSub.hasNoAudio}
                  trimStartSeconds={currentSub.trimStartSeconds}
                  trimEndSeconds={currentSub.trimEndSeconds}
                />
              </div>

              {/* Playback status — no play button, auto-plays after countdown */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-code text-slate-400">
                  {currentSub.hasNoAudio ? (
                    <span className="text-amber-400">[Silent Entry]</span>
                  ) : showcaseFinished ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Showcase finished
                    </span>
                  ) : countdownNumber !== null ? (
                    <span className="text-cyan-300">Starting showcase...</span>
                  ) : isShowcasePlaying ? (
                    <span>
                      Now Playing: <strong className="text-cyan-300">{Math.floor(elapsedSeconds)}s</strong> / 45s
                    </span>
                  ) : (
                    <span>Ready to play</span>
                  )}
                </div>
              </div>
            </div>

            {/* 3-2-1 Countdown Overlay */}
            {countdownNumber !== null && !currentSub.hasNoAudio && (
              <div className="mt-6 flex flex-col items-center justify-center py-12">
                <div className="text-xs font-code text-slate-400 uppercase tracking-widest mb-4">
                  {countdownNumber > 0 ? 'Showcase starts in' : 'Now playing'}
                </div>
                <div
                  key={countdownNumber}
                  className="font-arcade text-7xl md:text-8xl font-black text-white cryo-glow-text animate-[countdownPulse_1s_ease-in-out]"
                  style={{
                    color: countdownNumber === 0 ? '#34d399' : '#00f5ff',
                  }}
                >
                  {countdownNumber > 0 ? countdownNumber : '♪'}
                </div>
              </div>
            )}

            {/* 1 to 5 Frost Stars Rating — shown after showcase finishes or immediately for silent entries */}
            {(showcaseFinished || currentSub.hasNoAudio) && countdownNumber === null && (
              <div className="mt-8 text-center animate-in fade-in duration-300">
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

                {/* Finish & Reveal Podium CTA */}
                <div className="mt-6 pt-4 border-t border-cyan-500/20 flex justify-center">
                  <button
                    onClick={handleLockVoteAndFinish}
                    className="px-8 py-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#020408] font-arcade font-extrabold text-sm uppercase tracking-wider transition-all cryo-card-shadow-sm flex items-center gap-2"
                  >
                    <span>LOCK VOTE & REVEAL RESULTS</span>
                  </button>
                </div>
              </div>
            )}

            {/* Waiting state during playback */}
            {!showcaseFinished && !currentSub.hasNoAudio && countdownNumber === null && isShowcasePlaying && (
              <div className="mt-6 text-center py-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-code text-xs">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Listening to showcase... Rating unlocks after playback
                </div>
              </div>
            )}
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

      <style>{`
        @keyframes countdownPulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
