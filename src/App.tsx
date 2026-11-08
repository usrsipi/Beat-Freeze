/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, Room, ChatMessage } from './types/game';
import { getInitialRooms } from './game/battleEngine';
import { MainMenu } from './components/MainMenu';
import { RoomBrowser } from './components/RoomBrowser';
import { LobbyRoom } from './components/LobbyRoom';
import { BattleView } from './components/BattleView';
import { CreditsView } from './components/CreditsView';
import { LeftChatPanel } from './components/LeftChatPanel';
import { audioEngine } from './services/audioEngine';

const STORAGE_KEY = 'beat_freeze_profile_v1';

const defaultProfile: UserProfile = {
  id: 'usr-cryo-01',
  name: 'CyroProducer',
  frostBits: 100,
  cryoScore: 1200,
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  battlesWon: 0,
  battlesPlayed: 0,
  currentStreak: 0,
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultProfile;
  });

  const [currentView, setCurrentView] = useState<'menu' | 'rooms' | 'lobby' | 'battle' | 'credits'>('menu');
  const [rooms, setRooms] = useState<Room[]>(getInitialRooms()); // Initial 0 active rooms
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  // Volume state
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Chat message states
  const [universalMessages, setUniversalMessages] = useState<ChatMessage[]>([
    {
      id: 'u-1',
      senderId: 'sys',
      senderName: 'SYSTEM',
      channel: 'universal',
      text: 'Welcome to BEAT FREEZE v1. Universal Chat is live for all producers.',
      timestamp: '18:00',
      isSystem: true,
    },
  ]);

  const [battleMessages, setBattleMessages] = useState<ChatMessage[]>([]);

  // Sync profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (isMuted && val > 0) {
      setIsMuted(false);
    }
    audioEngine.setMasterVolume(val / 100);
  };

  const handleToggleMute = () => {
    const nextMuted = audioEngine.toggleMute();
    setIsMuted(nextMuted);
    audioEngine.playUiClick();
  };

  const handleSelectRoom = (room: Room) => {
    setActiveRoom(room);
    // Initialize room battle chat
    setBattleMessages([
      {
        id: `b-sys-${Date.now()}`,
        senderId: 'sys',
        senderName: 'ROOM',
        channel: 'battle',
        text: `Entered room #${room.code} (${room.name}). Battle chat active!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
    setCurrentView('lobby');
  };

  const handleCreateRoom = (newRoom: Room) => {
    setRooms((prev) => [newRoom, ...prev]);
  };

  const handleStartBattle = () => {
    if (!activeRoom) return;
    const updated = { ...activeRoom, status: 'Cooking' as const };
    setActiveRoom(updated);
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updated : r)));
    setCurrentView('battle');
  };

  const handleBattleFinished = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  const handleReturnToLobby = () => {
    if (activeRoom) {
      const updated = { ...activeRoom, status: 'Open' as const };
      setActiveRoom(updated);
      setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updated : r)));
      setCurrentView('lobby');
    } else {
      setCurrentView('rooms');
    }
  };

  // Chat send handlers
  const handleSendUniversalMessage = (text: string) => {
    const msg: ChatMessage = {
      id: `u-${Date.now()}`,
      senderId: profile.id,
      senderName: profile.name,
      channel: 'universal',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setUniversalMessages((prev) => [...prev, msg]);
  };

  const handleSendBattleMessage = (text: string) => {
    const msg: ChatMessage = {
      id: `b-${Date.now()}`,
      senderId: profile.id,
      senderName: profile.name,
      channel: 'battle',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setBattleMessages((prev) => [...prev, msg]);
  };

  const isInBattleOrLobby = (currentView === 'lobby' || currentView === 'battle') && activeRoom !== null;

  return (
    <div className="relative min-h-screen bg-[#020408] text-[#e0f2fe] cryo-grid flex font-sans selection:bg-cyan-500 selection:text-[#020408]">
      {/* CRT Cold-Cathode Scanlines */}
      <div className="fixed inset-0 crt-overlay z-50 pointer-events-none" />

      {/* Docked Left-Side Chat Panel (Universal Chat & Battle Chat) */}
      <LeftChatPanel
        profile={profile}
        isInBattleOrLobby={isInBattleOrLobby}
        activeRoomName={activeRoom ? `#${activeRoom.code} ${activeRoom.name}` : undefined}
        universalMessages={universalMessages}
        battleMessages={battleMessages}
        onSendUniversalMessage={handleSendUniversalMessage}
        onSendBattleMessage={handleSendBattleMessage}
      />

      {/* Main App Content Viewport */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="w-full">
          {currentView === 'menu' && (
            <MainMenu
              onBrowseRooms={() => setCurrentView('rooms')}
              onOpenCredits={() => setCurrentView('credits')}
              activeProducersCount={0}
              activeRoomsCount={rooms.length}
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
            />
          )}

          {currentView === 'rooms' && (
            <RoomBrowser
              rooms={rooms}
              onSelectRoom={handleSelectRoom}
              onCreateRoom={handleCreateRoom}
              onBackToMenu={() => setCurrentView('menu')}
            />
          )}

          {currentView === 'lobby' && activeRoom && (
            <LobbyRoom
              room={activeRoom}
              profile={profile}
              onStartBattle={handleStartBattle}
              onLeaveRoom={() => {
                setActiveRoom(null);
                setCurrentView('rooms');
              }}
            />
          )}

          {currentView === 'battle' && activeRoom && (
            <BattleView
              room={activeRoom}
              profile={profile}
              onBattleFinished={handleBattleFinished}
              onReturnToLobby={handleReturnToLobby}
            />
          )}

          {currentView === 'credits' && (
            <CreditsView
              onBack={() => setCurrentView('menu')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
