import React from 'react';

interface AudioWaveformProps {
  peaks: number[];
  progressSeconds?: number;
  maxSeconds?: number; // Capped at 45 seconds for battle showcase
  totalDuration?: number;
  isPlaying?: boolean;
  onSeek?: (seconds: number) => void;
  className?: string;
  hasNoAudio?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  peaks,
  progressSeconds = 0,
  maxSeconds = 45,
  totalDuration = 45,
  isPlaying = false,
  onSeek,
  className = '',
  hasNoAudio = false,
}) => {
  // If no audio, render flat silent line
  const effectivePeaks = hasNoAudio ? new Array(120).fill(0.04) : peaks;

  // Fraction of total duration that is capped at 45s
  const cappedLimitSeconds = Math.min(maxSeconds, totalDuration);
  const cutoffRatio = Math.min(1, cappedLimitSeconds / Math.max(cappedLimitSeconds, totalDuration));

  // Current playback ratio within 0..1
  const playProgressRatio = Math.min(1, progressSeconds / cappedLimitSeconds);

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || hasNoAudio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    // Cannot seek past 45s cutoff
    const seekTime = Math.min(cappedLimitSeconds, ratio * cappedLimitSeconds);
    onSeek(seekTime);
  };

  return (
    <div
      onClick={handleWaveformClick}
      className={`relative w-full h-28 md:h-32 bg-[#050406] border border-cyan-500/20 rounded-md overflow-hidden cursor-pointer select-none ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }}
      title="Audio Waveform (45s Battle Showcase Cap)"
    >
      {/* Center Baseline Grid Line */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-cyan-500/20 pointer-events-none" />

      {/* 45-Second Cutoff Boundary Marker */}
      {cutoffRatio < 0.98 && (
        <div
          className="absolute top-0 bottom-0 z-20 border-r-2 border-dashed border-rose-500/70 pointer-events-none flex flex-col justify-between"
          style={{ left: `${cutoffRatio * 100}%` }}
        >
          <span className="text-[9px] font-code bg-rose-950/90 text-rose-300 px-1 py-0.5 rounded-bl border-b border-l border-rose-500/50">
            45s Cut-off
          </span>
          <span className="text-[8px] font-code text-rose-400/80 px-1 pb-1">
            Muted Zone
          </span>
        </div>
      )}

      {/* Amplitude Bars Container */}
      <div className="absolute inset-0 px-2 py-3 flex items-center justify-between gap-[2px]">
        {effectivePeaks.map((peak, idx) => {
          const barRatio = idx / effectivePeaks.length;
          const isPastCutoff = barRatio > cutoffRatio;
          const isPlayed = barRatio <= playProgressRatio && !isPastCutoff;

          // Height as percentage of container (mirrored from center)
          const barHeightPercent = Math.max(6, peak * 90);

          let barColor = 'bg-[#3b1c1c]'; // Dimmed / cut-off zone (matches reference screenshot)
          if (!isPastCutoff) {
            barColor = isPlayed ? 'bg-[#f8fafc] shadow-[0_0_6px_rgba(255,255,255,0.7)]' : 'bg-cyan-900/60';
          }

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-center h-full"
            >
              <div
                className={`w-full max-w-[3px] rounded-xs transition-colors duration-75 ${barColor}`}
                style={{ height: `${barHeightPercent}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Playhead Vertical Line */}
      {!hasNoAudio && (
        <div
          className="absolute top-0 bottom-0 z-30 w-[2px] bg-cyan-300 shadow-[0_0_8px_#00f5ff] pointer-events-none"
          style={{ left: `${playProgressRatio * (cutoffRatio * 100)}%` }}
        >
          <div className="w-2 h-2 -ml-[3px] bg-cyan-300 rounded-full shadow" />
        </div>
      )}

      {/* Duration and Cutoff Labels */}
      <div className="absolute bottom-1.5 left-2.5 z-20 flex items-center gap-2 text-[10px] font-code text-slate-400 bg-black/60 px-1.5 py-0.5 rounded">
        <span>{Math.floor(progressSeconds)}s / {cappedLimitSeconds}s (Max 45s)</span>
        {hasNoAudio && <span className="text-amber-400 font-semibold">[No Audio Submitted]</span>}
      </div>
    </div>
  );
};
