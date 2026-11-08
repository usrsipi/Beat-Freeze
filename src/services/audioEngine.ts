/**
 * Web Audio API Engine for BEAT FREEZE
 * Supports real PCM audio waveform extraction, 45-second capped showcase playback, and UI sound effects.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentVolume = 0.8;
  private isMuted = false;
  
  // Real audio playback state
  private currentAudioElement: HTMLAudioElement | null = null;
  private playbackTimer: number | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime);
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.isMuted ? 0 : this.currentVolume;
    }
  }

  public getMasterVolume(): number {
    return this.currentVolume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setMasterVolume(this.currentVolume);
    return this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  // UI Sound Effects
  public playUiClick() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);

      gain.gain.setValueAtTime(0.12 * this.currentVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  public playReadyUp() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      [440, 660, 880, 1320].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = now + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.15 * this.currentVolume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(startTime);
        osc.stop(startTime + 0.12);
      });
    } catch {}
  }

  public playStarVote(rating: number) {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
      const freq = notes[Math.min(notes.length - 1, Math.max(0, rating - 1))];
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2 * this.currentVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  public playFreezeSound() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

      gain.gain.setValueAtTime(0.25 * this.currentVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch {}
  }

  /**
   * Decodes an uploaded audio file (MP3 / WAV / OGG) and extracts real PCM amplitude peaks
   * for a standstill audio waveform matching real DAW sound editors.
   */
  public async decodeAudioFile(
    file: File,
    peaksCount = 140
  ): Promise<{ peaks: number[]; duration: number; audioUrl: string }> {
    this.init();
    const arrayBuffer = await file.arrayBuffer();

    let duration = 30;
    let peaks: number[] = [];

    try {
      if (this.ctx) {
        // Clone buffer as decodeAudioData detaches the arrayBuffer
        const bufferCopy = arrayBuffer.slice(0);
        const audioBuffer = await this.ctx.decodeAudioData(bufferCopy);
        duration = audioBuffer.duration;

        const channelData = audioBuffer.getChannelData(0);
        const step = Math.floor(channelData.length / peaksCount);

        for (let i = 0; i < peaksCount; i++) {
          const start = i * step;
          const end = start + step;
          let max = 0;
          for (let j = start; j < end; j += 10) {
            const val = Math.abs(channelData[j]);
            if (val > max) max = val;
          }
          // Normalize and scale between 0.12 and 1.0
          const normalized = Math.max(0.12, Math.min(1.0, max * 1.5));
          peaks.push(Number(normalized.toFixed(3)));
        }
      }
    } catch (err) {
      // Fallback procedural waveform if file decode is not supported in environment
      peaks = this.generateFallbackPeaks(file.name, peaksCount);
    }

    const audioUrl = URL.createObjectURL(file);
    return { peaks, duration, audioUrl };
  }

  /**
   * Generates procedural realistic soundwave amplitude peaks when no file is uploaded.
   */
  public generateFallbackPeaks(seed: string, count = 140): number[] {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }

    const peaks: number[] = [];
    for (let i = 0; i < count; i++) {
      const envelope = Math.sin((i / count) * Math.PI); // Attack and release
      const harmonic1 = Math.sin((i * 0.4 + hash) * 0.8) * 0.35;
      const harmonic2 = Math.cos((i * 1.2 + hash) * 0.5) * 0.25;
      const noise = (Math.random() - 0.5) * 0.18;
      const base = 0.45 + harmonic1 + harmonic2 + noise;
      const val = Math.max(0.12, Math.min(0.98, base * (0.4 + 0.6 * envelope)));
      peaks.push(Number(val.toFixed(3)));
    }
    return peaks;
  }

  /**
   * Plays uploaded audio with a hard cap of 45 seconds maximum!
   */
  public playShowcaseAudio(
    audioUrl: string,
    onProgress: (elapsed: number, progressPct: number) => void,
    onEnded: () => void,
    startOffset = 0
  ) {
    this.stopAudio();

    const audio = new Audio(audioUrl);
    this.currentAudioElement = audio;
    audio.volume = this.isMuted ? 0 : this.currentVolume;
    audio.currentTime = startOffset;

    const maxSeconds = 45;

    audio.play().catch(() => {});

    this.playbackTimer = window.setInterval(() => {
      if (!this.currentAudioElement) return;
      const current = this.currentAudioElement.currentTime;

      if (current >= maxSeconds || this.currentAudioElement.ended) {
        this.stopAudio();
        onProgress(maxSeconds, 100);
        onEnded();
        return;
      }

      const progress = (current / maxSeconds) * 100;
      onProgress(current, progress);
    }, 100);

    audio.onended = () => {
      this.stopAudio();
      onEnded();
    };
  }

  public stopAudio() {
    if (this.playbackTimer !== null) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
  }

  public isAudioPlaying(): boolean {
    return this.currentAudioElement !== null && !this.currentAudioElement.paused;
  }
}

export const audioEngine = new AudioEngine();
