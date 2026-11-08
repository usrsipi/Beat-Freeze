import React from 'react';
import { IceIcon } from './IceIcon';
import { ArrowLeft, Sparkles, Terminal, Cpu, Radio, Music, ShieldCheck, Award } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface CreditsViewProps {
  onBack: () => void;
}

export const CreditsView: React.FC<CreditsViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-full py-8 px-4 md:px-8 max-w-4xl mx-auto text-sky-100">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => {
            audioEngine.playUiClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#08101e] hover:bg-[#0c1830] border border-cyan-500/30 text-cyan-300 font-arcade text-xs tracking-wider uppercase transition-colors"
        >
          <ArrowLeft size={16} /> Return to Main Menu
        </button>
      </div>

      {/* Hero Creator Showcase */}
      <div className="relative p-6 md:p-10 rounded-xl bg-[#08101e]/90 border border-cyan-500/40 cryo-card-shadow overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative shrink-0">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-[#020408] border-2 border-cyan-400 p-3 flex items-center justify-center shadow-[0_0_24px_rgba(0,245,255,0.3)]">
              <IceIcon size={80} glow={true} />
            </div>
            <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded bg-cyan-400 text-[#020408] font-arcade font-extrabold text-xs uppercase tracking-wider shadow">
              CREATOR
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-code text-xs mb-3">
              <Sparkles size={13} className="text-cyan-400" />
              <span>Lead Architect & Sound Designer</span>
            </div>

            <h1 className="font-arcade text-4xl md:text-5xl font-extrabold tracking-tight text-white cryo-glow-text">
              LuSipi
            </h1>

            <p className="mt-3 text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
              Creator of <strong className="text-cyan-300">BEAT FREEZE</strong> — the competitive online music producer arena featuring sub-zero aesthetics, authentic standstill audio waveforms, 45-second battle showcases, and instant client-side Web Audio synthesis.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs font-code">
              <span className="px-3 py-1 rounded bg-[#020408] border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5">
                <Award size={14} className="text-sky-400" /> Absolute Zero Rank #1
              </span>
              <span className="px-3 py-1 rounded bg-[#020408] border border-cyan-500/40 text-sky-300 flex items-center gap-1.5">
                <Music size={14} className="text-cyan-400" /> Pure Client Audio Core
              </span>
              <span className="px-3 py-1 rounded bg-[#020408] border border-cyan-500/40 text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-400" /> Version 1.0 Static Build
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* The Strategic Brand Inversion Breakdown */}
      <div className="mt-8">
        <h2 className="font-arcade text-xl font-bold tracking-wide text-cyan-300 uppercase mb-4 flex items-center gap-2">
          <Terminal size={18} /> Strategic Anti-Beat Battle Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-lg bg-[#08101e] border border-cyan-500/20 cryo-card-shadow-sm">
            <h3 className="font-arcade text-base font-semibold text-white mb-2 flex items-center gap-2">
              <span className="text-cyan-400">🧊</span> The Cryo-Arcade Inversion
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
              Where other battle sites rely on fiery chili peppers and warm orange heat bars, <strong>LuSipi</strong> inverted the paradigm into a cold-cathode, sub-zero cyberpunk arena powered by liquid nitrogen fog and Kelvin chill indices.
            </p>
            <div className="p-3 rounded bg-[#020408] border border-slate-800 text-[11px] font-code space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Competitor Metric:</span>
                <span className="text-rose-400">Heat Score / Ghost Pepper 🔥</span>
              </div>
              <div className="flex justify-between font-semibold text-cyan-300">
                <span>Beat Freeze Metric:</span>
                <span>Cryo Score / Absolute Zero (0 K) ❄️</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-[#08101e] border border-cyan-500/20 cryo-card-shadow-sm">
            <h3 className="font-arcade text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Cpu size={16} className="text-sky-400" /> 45-Second Showcase & Audio PCM
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
              Engineered by <strong>LuSipi</strong> with authentic standstill DAW audio waveforms, 45-second automatic cutoff limits, and direct browser PCM decoding.
            </p>
            <div className="p-3 rounded bg-[#020408] border border-slate-800 text-[11px] font-code space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Showcase Cap:</span>
                <span className="text-sky-300">45 Seconds Hard Capped Limit</span>
              </div>
              <div className="flex justify-between">
                <span>Waveform Engine:</span>
                <span className="text-sky-300">140 Peak Window Amplitude Extractor</span>
              </div>
              <div className="flex justify-between">
                <span>Offline Support:</span>
                <span className="text-sky-300">Optional Silent/No-Audio Slots</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-400 font-code">
        BEAT FREEZE v1 · Created with cyber precision by <span className="text-cyan-300 font-bold font-arcade">LuSipi</span>
      </div>
    </div>
  );
};
