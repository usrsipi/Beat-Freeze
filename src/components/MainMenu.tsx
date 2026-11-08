import React from 'react';
import { IceIcon } from './IceIcon';
import { Radio, Volume2, VolumeX, Award } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface MainMenuProps {
  onBrowseRooms: () => void;
  onOpenCredits: () => void;
  activeProducersCount?: number;
  activeRoomsCount?: number;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onBrowseRooms,
  onOpenCredits,
  activeProducersCount = 0,
  activeRoomsCount = 0,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}) => {
  return (
    <div className="relative min-h-screen flex flex-col justify-between py-6 px-4 md:px-8 max-w-5xl mx-auto text-sky-100">
      {/* Top Header Row with Volume Control & LuSipi Credits link */}
      <div className="flex items-center justify-between w-full pt-2">
        <div className="flex items-center gap-2">
          {/* Audio Master Volume */}
          <div className="flex items-center gap-2 bg-[#08101e] px-3 py-1.5 rounded-lg border border-cyan-500/25">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-cyan-300 transition-colors"
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
              className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              aria-label="Master Volume"
            />
            <span className="text-[10px] font-code text-cyan-400 tabular-nums w-7 text-right">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>
        </div>

        {/* Credits Button (LuSipi) */}
        <button
          onClick={() => {
            audioEngine.playUiClick();
            onOpenCredits();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#08101e] hover:bg-[#0c1830] border border-cyan-500/30 text-cyan-300 hover:text-white font-arcade text-xs uppercase tracking-wider transition-colors"
        >
          <Award size={14} className="text-cyan-400" />
          <span>Credits (LuSipi)</span>
        </button>
      </div>

      {/* Main Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-12">
        {/* Accurate Real-time Telemetry Status Pill (0 Active Players & 0 Active Rooms) */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#08101e] border border-cyan-500/30 text-xs font-code text-cyan-300 mb-8 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span>
            Active Producers: <strong className="text-white tabular-nums">{activeProducersCount}</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span>
            Active Rooms: <strong className="text-white tabular-nums">{activeRoomsCount}</strong>
          </span>
        </div>

        {/* Sharp Ice Icon SVG */}
        <div
          className="relative mb-5 group cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-200"
          onClick={() => audioEngine.playFreezeSound()}
          title="Click to trigger cryo freeze"
        >
          <IceIcon size={96} glow={true} />
        </div>

        {/* Prominent BEAT FREEZE Title */}
        <h1 className="font-arcade text-5xl md:text-7xl font-extrabold tracking-wider text-white cryo-glow-text uppercase">
          BEAT <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">FREEZE</span>
        </h1>

        {/* Single Primary Action: Browse Rooms */}
        <div className="mt-10">
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onBrowseRooms();
            }}
            className="px-10 py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#020408] font-arcade font-extrabold text-lg md:text-xl tracking-wider uppercase transition-all transform hover:-translate-y-0.5 active:translate-y-0 cryo-card-shadow flex items-center gap-3"
          >
            <Radio size={22} className="text-[#020408]" />
            BROWSE ROOMS
          </button>
        </div>
      </div>

      {/* Footer text: keep version to v1, remove cloudflare text */}
      <footer className="pb-4 text-center text-xs font-code text-slate-500">
        BEAT FREEZE v1 · Created by <span className="text-cyan-400 font-bold font-arcade">LuSipi</span>
      </footer>
    </div>
  );
};
