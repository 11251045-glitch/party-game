import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { dbRef, dbOnValue } from "../firebase";

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  text: string;
  correct: boolean;
  timestamp: number;
}

interface ChatBoxProps {
  roomCode: string;
  currentPlayerId: string;
  isDrawer: boolean;
  onSubmitGuess: (guessText: string) => void;
}

export function ChatBox({ roomCode, currentPlayerId, isDrawer, onSubmitGuess }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomCode) return;

    const chatRef = dbRef(`rooms/${roomCode}/chat`);
    const unsubscribe = dbOnValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() || {};
        const parsed: ChatMessage[] = Object.values(val);
        // Sort chronologically
        parsed.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(parsed);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  // Autoscroll chat on list size changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const txt = inputText.trim();
    if (!txt) return;

    onSubmitGuess(txt);
    setInputText("");
  };

  return (
    <div className="w-full flex flex-col h-[350px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Scrollable feed list */}
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-gray-500 gap-1 italic">
            <Sparkles className="w-4 h-4 text-amber-500/50 animate-pulse" />
            輸入猜測嘗試為大家贏得積分吧！
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-2.5 rounded-lg text-sm border transition-all ${
                  msg.correct
                    ? "bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)] font-semibold"
                    : msg.playerId === "system"
                    ? "bg-red-500/10 border-red-500/30 text-amber-300 font-mono text-center py-2"
                    : "bg-slate-900 border-slate-800 text-gray-200"
                }`}
              >
                {msg.playerId !== "system" && (
                  <div className="flex items-center gap-1.5 mb-1 text-xs">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: msg.playerColor }}
                    />
                    <span 
                      style={{ color: msg.playerColor }}
                      className="font-medium"
                    >
                      {msg.playerName}
                    </span>
                    {msg.playerId === currentPlayerId && (
                      <span className="text-[10px] text-gray-500 bg-slate-800 px-1.5 py-0.2 rounded-full font-mono">你</span>
                    )}
                  </div>
                )}
                
                <p className={msg.playerId === "system" ? "text-center text-xs md:text-sm" : "pl-3.5 break-words"}>
                  {msg.text}
                  {msg.correct && " 🎉 答對了！雙方加 1 分！"}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input panel bar */}
      <form onSubmit={handleSend} className="p-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        {isDrawer ? (
          <div className="flex-1 min-h-[50px] bg-slate-950/60 rounded-xl flex items-center justify-center text-xs text-amber-500 font-heading tracking-wide border border-amber-500/30 px-3 py-2">
            你是畫家，只能默默繪畫，不能打字喔！🤫
          </div>
        ) : (
          <>
            <input
              id="guess_input_field"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="輸入你的猜測..."
              maxLength={20}
              className="flex-1 min-h-[48px] px-3 bg-slate-950 text-white rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-[#f5a623] text-sm text-amber-300 font-medium placeholder-gray-500"
            />
            <button
              id="guess_send_button"
              type="submit"
              className="min-w-[48px] min-h-[48px] bg-[#f5a623] text-black rounded-xl hover:brightness-110 flex items-center justify-center transition-all shadow-[0_0_8px_rgba(245,166,35,0.3)] cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </>
        )}
      </form>
    </div>
  );
}
