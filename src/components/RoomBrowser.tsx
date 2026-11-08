import React, { useState } from 'react';
import { Room, BattleGenre } from '../types/game';
import { Plus, Radio, Clock, Users, ArrowRight, ArrowLeft, Lock, Music } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { generateRoomCode } from '../game/battleEngine';

interface RoomBrowserProps {
  rooms: Room[];
  onSelectRoom: (room: Room) => void;
  onCreateRoom: (newRoom: Room) => void;
  onBackToMenu: () => void;
}

export const RoomBrowser: React.FC<RoomBrowserProps> = ({
  rooms,
  onSelectRoom,
  onCreateRoom,
  onBackToMenu,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // New room form
  const [newRoomName, setNewRoomName] = useState<string>('Glacial Phonk Arena');
  const [newGenre, setNewGenre] = useState<BattleGenre>('Phonk');
  const [newTimerSeconds, setNewTimerSeconds] = useState<number>(300);
  const [newMaxPlayers, setNewMaxPlayers] = useState<number>(8);
  const [newIsPrivate, setNewIsPrivate] = useState<boolean>(false);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    audioEngine.playUiClick();
    const matched = rooms.find((r) => r.code.toUpperCase() === cleanCode);
    if (matched) {
      onSelectRoom(matched);
    } else {
      const created: Room = {
        id: `room-${Date.now()}`,
        code: cleanCode,
        name: `Room ${cleanCode}`,
        genre: 'Trap',
        hostName: 'You (Host)',
        status: 'Open',
        playerCount: 1,
        maxPlayers: 8,
        roundTimerSeconds: 300,
        isPrivate: true,
        players: [],
      };
      onCreateRoom(created);
      onSelectRoom(created);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playReadyUp();
    const code = generateRoomCode();
    const created: Room = {
      id: `room-${Date.now()}`,
      code,
      name: newRoomName.trim() || 'Cryo Arena',
      genre: newGenre,
      hostName: 'You (Host)',
      status: 'Open',
      playerCount: 1,
      maxPlayers: newMaxPlayers,
      roundTimerSeconds: newTimerSeconds,
      isPrivate: newIsPrivate,
      players: [],
    };
    onCreateRoom(created);
    setIsCreateModalOpen(false);
    onSelectRoom(created);
  };

  const genres: BattleGenre[] = ['Trap', 'Phonk', 'Cyberpunk', 'Drill', 'Lo-Fi', 'Hyperpop'];

  return (
    <div className="py-6 px-4 md:px-8 max-w-5xl mx-auto text-sky-100">
      {/* Header with Return to Menu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onBackToMenu();
            }}
            className="p-2 rounded bg-[#08101e] hover:bg-[#0c1830] border border-cyan-500/30 text-cyan-300 transition-colors"
            title="Return to Main Menu"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-arcade text-3xl font-extrabold text-white tracking-wide uppercase cryo-glow-text flex items-center gap-3">
              <Radio size={28} className="text-cyan-400" /> BATTLE ROOMS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Enter an invite code or host your own custom battle room.
            </p>
          </div>
        </div>

        {/* Join by Code Form & Create Button */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleJoinByCode} className="flex items-center gap-1.5 bg-[#08101e] p-1 rounded-lg border border-cyan-500/30">
            <input
              type="text"
              maxLength={6}
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="CODE (e.g. FRZ982)"
              className="bg-transparent px-3 py-1.5 text-xs font-code tracking-widest text-cyan-300 placeholder:text-slate-600 focus:outline-none w-36 uppercase"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#020408] font-arcade text-xs font-bold uppercase transition-colors"
            >
              JOIN
            </button>
          </form>

          <button
            onClick={() => {
              audioEngine.playUiClick();
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#020408] font-arcade text-xs font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 cryo-card-shadow-sm"
          >
            <Plus size={16} /> HOST ROOM
          </button>
        </div>
      </div>

      {/* Room Grid */}
      <div className="mt-8">
        {rooms.length === 0 ? (
          <div className="text-center p-12 bg-[#08101e]/60 rounded-xl border border-cyan-500/20">
            <Music size={40} className="text-cyan-500/50 mx-auto mb-3" />
            <h3 className="font-arcade text-xl font-bold text-white uppercase">0 Active Battle Rooms</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No live rooms currently open. Click &quot;Host Room&quot; above to create a battle room and generate your 6-character room code!
            </p>
            <button
              onClick={() => {
                audioEngine.playUiClick();
                setIsCreateModalOpen(true);
              }}
              className="mt-5 px-6 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#020408] font-arcade text-xs font-bold uppercase tracking-wider"
            >
              Host the First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-5 rounded-xl bg-[#08101e]/90 border border-cyan-500/30 hover:border-cyan-400 transition-all cryo-card-shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-code mb-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold">
                      {room.genre}
                    </span>
                    <span className="text-cyan-400 tracking-widest font-bold">
                      #{room.code}
                    </span>
                  </div>

                  <h3 className="font-arcade text-lg font-bold text-white tracking-wide mt-1">
                    {room.name}
                  </h3>
                  <div className="text-xs text-slate-400 font-code mt-0.5">
                    Host: <span className="text-cyan-300">{room.hostName}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cyan-500/10 flex items-center justify-between text-xs font-code text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-cyan-400" />
                      <span className="text-slate-200">{room.playerCount}/{room.maxPlayers}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-sky-400" />
                      <span>{Math.floor(room.roundTimerSeconds / 60)}m Round</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    audioEngine.playUiClick();
                    onSelectRoom(room);
                  }}
                  className="mt-4 w-full py-2 px-3 rounded font-arcade font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[#020408]"
                >
                  ENTER LOBBY
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Custom Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#08101e] border border-cyan-500/40 p-6 rounded-xl cryo-card-shadow text-white">
            <div className="flex justify-between items-center pb-3 border-b border-cyan-500/20 mb-4">
              <h3 className="font-arcade text-lg font-bold text-cyan-300 uppercase flex items-center gap-2">
                <Plus size={18} /> Host Battle Room
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white font-code text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-code text-slate-400 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#020408] border border-cyan-500/30 font-arcade text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. SubZero 140BPM Championship"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-code text-slate-400 mb-1">Genre</label>
                  <select
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value as BattleGenre)}
                    className="w-full px-3 py-2 rounded bg-[#020408] border border-cyan-500/30 font-code text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-code text-slate-400 mb-1">Timer</label>
                  <select
                    value={newTimerSeconds}
                    onChange={(e) => setNewTimerSeconds(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded bg-[#020408] border border-cyan-500/30 font-code text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value={180}>3 Minutes</option>
                    <option value={300}>5 Minutes</option>
                    <option value={600}>10 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-cyan-500/20 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-900 text-slate-400 font-code text-xs hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-[#020408] font-arcade font-bold text-xs uppercase tracking-wider"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
