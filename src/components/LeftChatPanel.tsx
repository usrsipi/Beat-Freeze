import React, { useState, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types/game';
import { MessageSquare, Send, Users, Shield, Lock, ChevronLeft, ChevronRight, Volume2, Settings, X, Plus, Check } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface LeftChatPanelProps {
  profile: UserProfile;
  isInBattleOrLobby: boolean;
  activeRoomName?: string;
  universalMessages: ChatMessage[];
  battleMessages: ChatMessage[];
  onSendUniversalMessage: (text: string) => void;
  onSendBattleMessage: (text: string) => void;
}

const EMOJI_STORAGE_KEY = 'beat_freeze_quick_emojis_v1';
const DEFAULT_EMOJIS: string[] = ['😂', '😭', '🤯', '🔥', '💯', '🥀'];
const EMOJI_POOL: string[] = ['😂', '😭', '🤯', '🔥', '💯', '🥀', '❄️', '🧊', '💀', '⚡', '🎧', '👍', '👎', '😢', '😡', '👏', '🎉', '💎', '🤔', '😅', '😮', '🙌', '👀', '🎵'];
const MAX_SLOTS = 7;

export const LeftChatPanel: React.FC<LeftChatPanelProps> = ({
  profile,
  isInBattleOrLobby,
  activeRoomName,
  universalMessages,
  battleMessages,
  onSendUniversalMessage,
  onSendBattleMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'universal' | 'battle'>(
    isInBattleOrLobby ? 'battle' : 'universal'
  );
  const [inputText, setInputText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEmojiEditorOpen, setIsEmojiEditorOpen] = useState(false);

  const [quickEmojis, setQuickEmojis] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(EMOJI_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= MAX_SLOTS) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_EMOJIS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(EMOJI_STORAGE_KEY, JSON.stringify(quickEmojis));
    } catch {}
  }, [quickEmojis]);

  // If user enters a battle room, default to battle chat automatically
  React.useEffect(() => {
    if (isInBattleOrLobby) {
      setActiveTab('battle');
    } else {
      setActiveTab('universal');
    }
  }, [isInBattleOrLobby]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    audioEngine.playUiClick();
    if (activeTab === 'battle' && isInBattleOrLobby) {
      onSendBattleMessage(clean);
    } else {
      onSendUniversalMessage(clean);
    }
    setInputText('');
  };

  const handleReactionClick = (emoji: string) => {
    audioEngine.playUiClick();
    if (activeTab === 'battle' && isInBattleOrLobby) {
      onSendBattleMessage(emoji);
    } else {
      onSendUniversalMessage(emoji);
    }
  };

  // Emoji editor handlers
  const handleSwapEmoji = (slotIndex: number, newEmoji: string) => {
    setQuickEmojis((prev) => {
      const next = [...prev];
      next[slotIndex] = newEmoji;
      return next;
    });
    audioEngine.playUiClick();
  };

  const handleRemoveSlot = (slotIndex: number) => {
    setQuickEmojis((prev) => {
      if (prev.length <= 1) return prev; // Can't have 0 slots
      return prev.filter((_, i) => i !== slotIndex);
    });
    audioEngine.playUiClick();
  };

  const handleAddSlot = () => {
    setQuickEmojis((prev) => {
      if (prev.length >= MAX_SLOTS) return prev;
      // Find an emoji from the pool not already in use
      const available = EMOJI_POOL.filter((e) => !prev.includes(e));
      if (available.length === 0) return prev;
      return [...prev, available[0]];
    });
    audioEngine.playUiClick();
  };

  const currentMessages = activeTab === 'battle' ? battleMessages : universalMessages;

  return (
    <>
      {/* Floating expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed left-0 top-20 z-40 bg-[#08101e] border-r border-t border-b border-cyan-500/40 p-2 rounded-r-lg text-cyan-300 hover:text-white transition-all shadow-lg flex items-center gap-1.5 font-arcade text-xs uppercase"
          title="Open Chat Panel"
        >
          <MessageSquare size={16} />
          <span className="hidden sm:inline">CHAT</span>
          <ChevronRight size={14} />
        </button>
      )}

      {/* Main Left Chat Sidebar */}
      {!isCollapsed && (
        <aside
          className="w-80 shrink-0 h-[calc(100vh-1rem)] sticky top-2 z-30 ml-2 rounded-xl bg-[#060c18]/95 border border-cyan-500/30 flex flex-col justify-between overflow-hidden cryo-card-shadow-sm transition-all"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {/* Header & Tabs */}
          <div className="p-3 border-b border-cyan-500/20 bg-[#020408]/90">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-cyan-400" />
                <span className="font-arcade text-xs font-bold uppercase tracking-wider text-white">
                  CYBER CHAT PANEL
                </span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded text-slate-400 hover:text-cyan-300 transition-colors"
                title="Collapse Chat"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Two Tabs: Universal vs Battle */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#08101e] rounded-lg border border-cyan-500/20">
              <button
                onClick={() => {
                  audioEngine.playUiClick();
                  setActiveTab('universal');
                }}
                className={`py-1.5 px-2 rounded font-arcade text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'universal'
                    ? 'bg-cyan-500 text-[#020408] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={12} /> Universal
              </button>

              <button
                disabled={!isInBattleOrLobby}
                onClick={() => {
                  if (isInBattleOrLobby) {
                    audioEngine.playUiClick();
                    setActiveTab('battle');
                  }
                }}
                className={`py-1.5 px-2 rounded font-arcade text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  !isInBattleOrLobby
                    ? 'text-slate-600 cursor-not-allowed opacity-60'
                    : activeTab === 'battle'
                    ? 'bg-cyan-500 text-[#020408] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={!isInBattleOrLobby ? 'Available inside a battle room' : 'Room Battle Chat'}
              >
                {!isInBattleOrLobby && <Lock size={11} />}
                Battle
              </button>
            </div>

            {/* Sub-label */}
            <div className="mt-2 text-[10px] font-code text-slate-400 flex items-center justify-between">
              <span>
                {activeTab === 'universal'
                  ? 'Website-wide Producer Channel'
                  : activeRoomName || 'Active Room Channel'}
              </span>
              <span className="text-cyan-400 font-semibold">● LIVE</span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 font-code text-xs">
            {activeTab === 'battle' && !isInBattleOrLobby ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <Lock size={28} className="text-slate-600 mb-2" />
                <p className="font-arcade text-xs uppercase text-slate-400">Battle Chat Unavailable</p>
                <p className="text-[11px] mt-1">Join or host a battle room to unlock match chatter.</p>
              </div>
            ) : currentMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-[11px]">
                No messages yet. Say hello!
              </div>
            ) : (
              currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded ${
                    msg.isSystem
                      ? 'bg-cyan-950/30 border border-cyan-800/40 text-cyan-200'
                      : 'bg-[#020408]/80 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span className="font-bold text-cyan-300">{msg.senderName}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className="text-slate-200 break-words text-[11px]">
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Emoji Reactions Strip + Edit Button */}
          <div className="px-2 py-1.5 border-t border-cyan-500/10 bg-[#020408] flex items-center gap-1">
            {quickEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                onClick={() => handleReactionClick(emoji)}
                disabled={activeTab === 'battle' && !isInBattleOrLobby}
                className="text-base p-1 rounded hover:bg-cyan-950/40 transition-transform hover:scale-125 disabled:opacity-40 flex-1"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => {
                audioEngine.playUiClick();
                setIsEmojiEditorOpen(true);
              }}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors shrink-0"
              title="Edit Quick Reactions"
            >
              <Settings size={14} />
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 border-t border-cyan-500/20 bg-[#040810] flex items-center gap-2"
          >
            <input
              type="text"
              disabled={activeTab === 'battle' && !isInBattleOrLobby}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeTab === 'battle' && !isInBattleOrLobby
                  ? 'Battle chat locked...'
                  : `Message #${activeTab}...`
              }
              className="flex-1 bg-[#08101e] px-2.5 py-1.5 rounded border border-cyan-500/30 text-xs font-sans text-sky-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={activeTab === 'battle' && !isInBattleOrLobby}
              className="p-2 rounded bg-cyan-400 hover:bg-cyan-300 text-[#020408] transition-colors disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={13} />
            </button>
          </form>
        </aside>
      )}

      {/* Emoji Editor Modal */}
      {isEmojiEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#08101e] border border-cyan-500/40 p-6 rounded-xl cryo-card-shadow text-white">
            <div className="flex justify-between items-center pb-3 border-b border-cyan-500/20 mb-4">
              <h3 className="font-arcade text-lg font-bold text-cyan-300 uppercase flex items-center gap-2">
                <Settings size={18} /> Edit Quick Reactions
              </h3>
              <button
                onClick={() => setIsEmojiEditorOpen(false)}
                className="text-slate-400 hover:text-white font-code text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs font-code text-slate-400 mb-4">
              Tap an emoji slot to swap it, or remove slots you don't want. Max {MAX_SLOTS} slots — you need at least 1.
            </p>

            {/* Current slots */}
            <div className="space-y-2 mb-4">
              {quickEmojis.map((emoji, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[#020408] border border-cyan-500/20">
                  <span className="text-xs font-code text-slate-500 w-6">#{idx + 1}</span>
                  <span className="text-2xl flex-shrink-0 w-10 text-center">{emoji}</span>
                  {/* Emoji picker for this slot */}
                  <div className="flex-1 flex flex-wrap gap-1">
                    {EMOJI_POOL.map((poolEmoji) => (
                      <button
                        key={poolEmoji}
                        onClick={() => handleSwapEmoji(idx, poolEmoji)}
                        className={`text-lg p-1 rounded transition-all hover:scale-110 ${
                          emoji === poolEmoji
                            ? 'bg-cyan-500/30 ring-1 ring-cyan-400'
                            : quickEmojis.includes(poolEmoji)
                            ? 'opacity-30'
                            : 'hover:bg-cyan-950/40'
                        }`}
                        title={quickEmojis.includes(poolEmoji) && emoji !== poolEmoji ? 'Already in use' : `Set to ${poolEmoji}`}
                      >
                        {poolEmoji}
                      </button>
                    ))}
                  </div>
                  {/* Remove slot */}
                  <button
                    onClick={() => handleRemoveSlot(idx)}
                    disabled={quickEmojis.length <= 1}
                    className="p-1.5 rounded text-rose-400 hover:bg-rose-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    title={quickEmojis.length <= 1 ? 'Need at least 1 slot' : 'Remove slot'}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add slot button */}
            {quickEmojis.length < MAX_SLOTS && (
              <button
                onClick={handleAddSlot}
                className="w-full py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-arcade text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={16} /> Add Slot ({quickEmojis.length}/{MAX_SLOTS})
              </button>
            )}

            {/* Done button */}
            <div className="mt-4 pt-3 border-t border-cyan-500/20 flex justify-end">
              <button
                onClick={() => {
                  audioEngine.playReadyUp();
                  setIsEmojiEditorOpen(false);
                }}
                className="px-5 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-[#020408] font-arcade font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
              >
                <Check size={16} /> Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
