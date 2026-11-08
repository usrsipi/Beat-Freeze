import React, { useState } from 'react';
import { Room, Player, UserProfile } from '../types/game';
import { Users, Copy, Check, Play, ArrowLeft, Clock } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface LobbyRoomProps {
  room: Room;
  profile: UserProfile;
  onStartBattle: () => void;
  onLeaveRoom: () => void;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({
  room,
  profile,
  onStartBattle,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isReady, setIsReady] = useState(true);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    audioEngine.playUiClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleReady = () => {
    setIsReady(!isReady);
    audioEngine.playUiClick();
  };

  // Only real user(s) in room - no fake bots!
  const players: Player[] = [
    {
      id: profile.id,
      name: profile.name,
      isHost: true,
      isReady,
      cryoScore: profile.cryoScore,
      division: 'Permafrost',
    },
    ...room.players.filter((p) => p.name !== profile.name),
  ];

  return (
    <div className="py-6 px-4 md:px-8 max-w-4xl mx-auto text-sky-100">
      {/* Lobby Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onLeaveRoom();
            }}
            className="p-2 rounded bg-[#08101e] hover:bg-[#0c1830] border border-cyan-500/30 text-cyan-300 transition-colors"
            title="Leave Room"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-arcade text-2xl font-bold text-white tracking-wide uppercase">
                {room.name}
              </h2>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-code text-xs font-semibold">
                {room.genre}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-code flex items-center gap-3 mt-0.5">
              <span>Host: <strong className="text-cyan-300">{profile.name} (You)</strong></span>
              <span>·</span>
              <span>Round Duration: <strong className="text-slate-200">{Math.floor(room.roundTimerSeconds / 60)} Minutes</strong></span>
            </div>
          </div>
        </div>

        {/* Room Code & Battle Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#08101e] border border-cyan-500/30">
            <span className="text-xs font-code text-slate-400">INVITE CODE:</span>
            <span className="font-code text-sm font-bold text-cyan-300 tracking-widest uppercase">
              {room.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 transition-colors"
              title="Copy Room Code"
            >
              {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>

          <button
            onClick={() => {
              audioEngine.playFreezeSound();
              onStartBattle();
            }}
            className="px-6 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#020408] font-arcade font-extrabold text-xs uppercase tracking-wider transition-all cryo-card-shadow-sm flex items-center gap-1.5"
          >
            <Play size={16} fill="#020408" />
            START BATTLE
          </button>
        </div>
      </div>

      {/* Main Room Card */}
      <div className="mt-8 p-6 rounded-xl bg-[#08101e]/90 border border-cyan-500/30 cryo-card-shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-cyan-400" />
            <h3 className="font-arcade text-base font-bold text-white uppercase tracking-wider">
              Connected Producers ({players.length}/{room.maxPlayers})
            </h3>
          </div>
          <span className="text-xs font-code text-cyan-400">Live Room</span>
        </div>

        <div className="space-y-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-lg bg-[#020408] border border-cyan-500/30 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-400 flex items-center justify-center font-arcade text-sm font-bold text-cyan-300">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-arcade text-base font-bold text-white">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-code px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                      HOST
                    </span>
                  </div>
                  <div className="text-xs font-code text-slate-400">
                    {p.division} · {p.cryoScore} K
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleReady}
                  className={`px-3 py-1 rounded text-xs font-arcade uppercase font-semibold transition-colors ${
                    isReady
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isReady ? '✓ READY' : 'CLICK TO READY'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Battle Rules Banner */}
        <div className="mt-8 p-4 rounded-lg bg-[#020408]/60 border border-slate-800 text-xs font-code text-slate-400 flex items-center gap-3">
          <Clock size={16} className="text-cyan-400 shrink-0" />
          <span>
            Production Round: Upload your beat or submit without audio. Each showcase is limited to <strong>45 seconds</strong> of audio playback with live waveform display.
          </span>
        </div>
      </div>
    </div>
  );
};
