import React, { useRef, useCallback } from 'react';

interface AudioWaveformProps {
  peaks: number[];
  progressSeconds?: number;
  maxSeconds?: number; // Capped at 45 seconds for battle showcase
  totalDuration?: number;
  isPlaying?: boolean;
  onSeek?: (seconds: number) => void;
  className?: string;
  hasNoAudio?: boolean;
  // Trimming/editing support
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  onTrimChange?: (start: number, end: number) => void;
  isEditable?: boolean;
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
  trimStartSeconds = 0,
  trimEndSeconds,
  onTrimChange,
  isEditable = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<'start' | 'end' | 'playhead' | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // If no audio and not editable, don't render anything — caller should handle empty state
  if (hasNoAudio && !isEditable) {
    return null;
  }

  const effectivePeaks = hasNoAudio ? new Array(200).fill(0.02) : peaks;

  const cappedLimitSeconds = Math.min(maxSeconds, totalDuration);
  const effectiveTrimEnd = trimEndSeconds ?? cappedLimitSeconds;
  const effectiveTrimStart = Math.min(trimStartSeconds, effectiveTrimEnd);

  // Map seconds to 0..1 ratio across the full totalDuration
  const secToRatio = (sec: number) => {
    const dur = Math.max(0.001, totalDuration);
    return Math.max(0, Math.min(1, sec / dur));
  };

  const cutoffRatio = secToRatio(cappedLimitSeconds);
  const trimStartRatio = secToRatio(effectiveTrimStart);
  const trimEndRatio = secToRatio(effectiveTrimEnd);
  const playProgressRatio = Math.min(1, progressSeconds / cappedLimitSeconds);

  // Width constants for the SVG viewbox
  const VB_WIDTH = 1000;
  const VB_HEIGHT = 100;
  const MID_Y = VB_HEIGHT / 2;

  // Build the smooth waveform path from peaks
  const buildWaveformPath = (peakData: number[]) => {
    if (peakData.length === 0) return '';
    const barW = VB_WIDTH / peakData.length;
    const points: string[] = [];

    // Top edge (left to right)
    for (let i = 0; i < peakData.length; i++) {
      const x = i * barW + barW / 2;
      const h = Math.max(0.5, peakData[i] * (VB_HEIGHT * 0.85));
      const yTop = MID_Y - h / 2;
      points.push(`${x.toFixed(2)},${yTop.toFixed(2)}`);
    }
    // Bottom edge (right to left) for a filled area
    for (let i = peakData.length - 1; i >= 0; i--) {
      const x = i * barW + barW / 2;
      const h = Math.max(0.5, peakData[i] * (VB_HEIGHT * 0.85));
      const yBottom = MID_Y + h / 2;
      points.push(`${x.toFixed(2)},${yBottom.toFixed(2)}`);
    }

    // Build a smooth closed path using quadratic curves between points
    let path = `M ${points[0]}`;
    for (let i = 1; i < points.length; i++) {
      const [px, py] = points[i].split(',').map(Number);
      const [prevX, prevY] = points[i - 1].split(',').map(Number);
      const cpx = (prevX + px) / 2;
      const cpy = (prevY + py) / 2;
      path += ` Q ${prevX.toFixed(2)} ${prevY.toFixed(2)} ${cpx.toFixed(2)} ${cpy.toFixed(2)}`;
    }
    path += ' Z';
    return path;
  };

  const waveformPath = buildWaveformPath(effectivePeaks);

  // Build the "played" portion clip path (from trim start to current progress)
  const playedEndRatio = Math.min(trimEndRatio, Math.max(trimStartRatio, secToRatio(progressSeconds)));

  // Convert a mouse/touch X position to seconds
  const xToSeconds = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * totalDuration;
  }, [totalDuration]);

  const handlePointerDown = (e: React.PointerEvent, type: 'start' | 'end' | 'playhead') => {
    if (!isEditable && type !== 'playhead') return;
    if (!onSeek && type === 'playhead') return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = type;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const sec = xToSeconds(e.clientX);

    if (dragRef.current === 'start' && onTrimChange) {
      const newStart = Math.max(0, Math.min(sec, effectiveTrimEnd - 1));
      onTrimChange(newStart, effectiveTrimEnd);
    } else if (dragRef.current === 'end' && onTrimChange) {
      const newEnd = Math.min(cappedLimitSeconds, Math.max(sec, effectiveTrimStart + 1));
      onTrimChange(effectiveTrimStart, newEnd);
    } else if (dragRef.current === 'playhead' && onSeek) {
      const clampedSec = Math.max(effectiveTrimStart, Math.min(effectiveTrimEnd, sec));
      onSeek(clampedSec);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    }
    dragRef.current = null;
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || hasNoAudio || dragRef.current) return;
    const sec = xToSeconds(e.clientX);
    const clampedSec = Math.max(effectiveTrimStart, Math.min(effectiveTrimEnd, sec));
    onSeek(clampedSec);
  };

  // Whether the 45s cutoff is within the visible waveform
  const showCutoff = cutoffRatio < 0.98;

  return (
    <div
      ref={containerRef}
      onClick={handleWaveformClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full bg-[#050406] border border-cyan-500/20 rounded-md overflow-hidden cursor-pointer select-none ${className}`}
      style={{ height: isEditable ? '140px' : '120px' }}
      title="Audio Waveform"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Center baseline */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-cyan-500/15 pointer-events-none" />

      {/* Dim overlay for trimmed-out regions (left of trim start) */}
      {isEditable && effectiveTrimStart > 0 && (
        <div
          className="absolute top-0 bottom-0 bg-black/60 pointer-events-none z-10"
          style={{ left: 0, width: `${trimStartRatio * 100}%` }}
        />
      )}

      {/* Dim overlay for trimmed-out regions (right of trim end) */}
      {isEditable && effectiveTrimEnd < totalDuration && (
        <div
          className="absolute top-0 bottom-0 bg-black/60 pointer-events-none z-10"
          style={{ left: `${trimEndRatio * 100}%`, right: 0 }}
        />
      )}

      {/* SVG Waveform */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#00f5ff" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="waveGradPlayed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="50%" stopColor="#e0f2fe" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
          {/* Clip for the played portion */}
          <clipPath id="playedClip">
            <rect
              x={trimStartRatio * VB_WIDTH}
              y={0}
              width={Math.max(0, (playedEndRatio - trimStartRatio) * VB_WIDTH)}
              height={VB_HEIGHT}
            />
          </clipPath>
          {/* Clip for the unplayed (but within trim) portion */}
          <clipPath id="unplayedClip">
            <rect
              x={playedEndRatio * VB_WIDTH}
              y={0}
              width={Math.max(0, (trimEndRatio - playedEndRatio) * VB_WIDTH)}
              height={VB_HEIGHT}
            />
          </clipPath>
        </defs>

        {/* Full waveform in dim color */}
        <path
          d={waveformPath}
          fill="url(#waveGrad)"
          opacity={0.25}
        />

        {/* Unplayed portion (cyan) */}
        <path
          d={waveformPath}
          fill="url(#waveGrad)"
          clipPath="url(#unplayedClip)"
        />

        {/* Played portion (bright white) */}
        <path
          d={waveformPath}
          fill="url(#waveGradPlayed)"
          clipPath="url(#playedClip)"
          style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' }}
        />
      </svg>

      {/* 45-Second Cutoff Boundary Marker */}
      {showCutoff && (
        <div
          className="absolute top-0 bottom-0 z-20 border-r-2 border-dashed border-rose-500/70 pointer-events-none flex flex-col justify-between"
          style={{ left: `${cutoffRatio * 100}%` }}
        >
          <span className="text-[9px] font-code bg-rose-950/90 text-rose-300 px-1 py-0.5 rounded-bl border-b border-l border-rose-500/50">
            45s
          </span>
        </div>
      )}

      {/* Trim Start Handle */}
      {isEditable && (
        <>
          <div
            onPointerDown={(e) => handlePointerDown(e, 'start')}
            className="absolute top-0 bottom-0 z-30 cursor-ew-resize group"
            style={{ left: `calc(${trimStartRatio * 100}% - 3px)`, width: '6px' }}
          >
            <div className="w-[2px] h-full bg-amber-400 mx-auto shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
            <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-8 rounded bg-amber-400 flex items-center justify-center text-[#020408] text-[8px] font-bold pointer-events-none">
              ▸
            </div>
          </div>

          {/* Trim End Handle */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'end')}
            className="absolute top-0 bottom-0 z-30 cursor-ew-resize group"
            style={{ left: `calc(${trimEndRatio * 100}% - 3px)`, width: '6px' }}
          >
            <div className="w-[2px] h-full bg-amber-400 mx-auto shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
            <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-8 rounded bg-amber-400 flex items-center justify-center text-[#020408] text-[8px] font-bold pointer-events-none">
              ◂
            </div>
          </div>
        </>
      )}

      {/* Playhead Vertical Line */}
      {!hasNoAudio && (
        <div
          onPointerDown={(e) => handlePointerDown(e, 'playhead')}
          className="absolute top-0 bottom-0 z-30 w-[2px] bg-cyan-300 shadow-[0_0_8px_#00f5ff] cursor-pointer"
          style={{
            left: `${secToRatio(progressSeconds) * 100}%`,
            pointerEvents: onSeek ? 'auto' : 'none',
          }}
        >
          <div className="w-2.5 h-2.5 -ml-[3px] bg-cyan-300 rounded-full shadow" />
        </div>
      )}

      {/* Duration Labels */}
      <div className="absolute bottom-1.5 left-2.5 z-20 flex items-center gap-2 text-[10px] font-code text-slate-400 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
        {isEditable ? (
          <span>
            Trim: {effectiveTrimStart.toFixed(1)}s – {effectiveTrimEnd.toFixed(1)}s
            {' '}({(effectiveTrimEnd - effectiveTrimStart).toFixed(1)}s window · 45s cap)
          </span>
        ) : (
          <span>{Math.floor(progressSeconds)}s / {cappedLimitSeconds}s (Max 45s)</span>
        )}
      </div>

      {/* Fade-out indicator at cutoff */}
      {isEditable && showCutoff && (
        <div className="absolute bottom-1.5 right-2.5 z-20 text-[10px] font-code text-amber-400 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none flex items-center gap-1">
          <span>♪ Fade out at 45s</span>
        </div>
      )}
    </div>
  );
};
