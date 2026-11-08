import React from 'react';
import { IceIcon } from './IceIcon';
import { ArrowLeft, Sparkles, Crown, Music, Snowflake } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface CreditsViewProps {
  onBack: () => void;
}

export const CreditsView: React.FC<CreditsViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-full py-8 px-4 md:px-8 max-w-3xl mx-auto text-sky-100 flex flex-col items-center justify-center">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={() => {
            audioEngine.playUiClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#08101e] hover:bg-[#0c1830] border border-cyan-500/30 text-cyan-300 font-arcade text-xs tracking-wider uppercase transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Main Showcase Card */}
      <div className="relative w-full p-8 md:p-12 rounded-2xl bg-gradient-to-b from-[#0a1424] to-[#050a14] border border-cyan-400/40 cryo-card-shadow overflow-hidden text-center">
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Ice Icon with glow ring */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-6 animate-[float_3s_ease-in-out_infinite]">
            <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl scale-150" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-[#020408] border-2 border-cyan-400 p-4 flex items-center justify-center shadow-[0_0_32px_rgba(0,245,255,0.4)]">
              <IceIcon size={96} glow={true} />
            </div>
          </div>

          {/* Creator badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-code text-xs mb-4">
            <Crown size={14} className="text-amber-400" />
            <span className="tracking-widest uppercase">Creator & Developer</span>
          </div>

          {/* Name */}
          <h1 className="font-arcade text-5xl md:text-6xl font-extrabold tracking-tight text-white cryo-glow-text">
            LuSipi
          </h1>

          {/* Title line */}
          <div className="mt-4 flex items-center gap-2 text-cyan-400 font-arcade text-sm md:text-base uppercase tracking-widest">
            <Sparkles size={16} className="text-cyan-300" />
            <span>The Mind Behind BEAT FREEZE</span>
            <Sparkles size={16} className="text-cyan-300" />
          </div>

          {/* Tags */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-code">
            <span className="px-4 py-2 rounded-lg bg-[#020408] border border-cyan-500/40 text-cyan-300 flex items-center gap-2">
              <Music size={14} className="text-cyan-400" /> Sound Designer
            </span>
            <span className="px-4 py-2 rounded-lg bg-[#020408] border border-sky-500/40 text-sky-300 flex items-center gap-2">
              <Snowflake size={14} className="text-sky-400" /> Game Architect
            </span>
            <span className="px-4 py-2 rounded-lg bg-[#020408] border border-cyan-500/40 text-cyan-300 flex items-center gap-2">
              <Crown size={14} className="text-amber-400" /> Absolute Zero Rank
            </span>
          </div>

          {/* Tagline */}
          <p className="mt-8 text-slate-300 text-sm md:text-base leading-relaxed max-w-lg font-sans">
            Built from the ground up. Every beat, every freeze, every pixel.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 font-code">
        BEAT FREEZE v1 · <span className="text-cyan-400 font-bold font-arcade">LuSipi</span>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};
