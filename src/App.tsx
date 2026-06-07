import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRoom } from "./hooks/useRoom";
import { Home } from "./pages/Home";
import { Lobby } from "./pages/Lobby";
import { TriviaGame } from "./pages/TriviaGame";
import { DrawingGame } from "./pages/DrawingGame";
import { Scoreboard } from "./pages/Scoreboard";
import { dbRef, dbSet, dbOnValue, dbPush } from "./firebase";
import { ShieldCheck, LogOut, Trophy, Info, Volume2, VolumeX, Music, Smile, Mic, MicOff, MessageSquare, Send } from "lucide-react";
import { sfx, bgm } from "./utils/audio";
import { useTimer } from "./hooks/useTimer";
import { AchievementOverlay } from "./components/AchievementOverlay";

export default function App() {
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem("party_night_player_name") || "";
  });
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    return localStorage.getItem("party_night_room_code") || null;
  });
  const [muted, setMuted] = useState<boolean>(sfx.isMuted);
  const [bgmMuted, setBgmMuted] = useState<boolean>(bgm.isMuted);

  const toggleMute = () => {
    const isNowMuted = sfx.toggleMute();
    setMuted(isNowMuted);
  };

  const toggleBgm = () => {
    const isNowMuted = bgm.toggleMute();
    setBgmMuted(isNowMuted);
  };

  // Autoplay or stop the procedural BGM synthesizer depending on mute states and manual gestures
  useEffect(() => {
    if (!bgmMuted) {
      const startBgmOnGesture = () => {
        bgm.start();
        // Clear window gesture event listeners once playing has successfully booted
        window.removeEventListener("click", startBgmOnGesture);
        window.removeEventListener("keydown", startBgmOnGesture);
        window.removeEventListener("touchstart", startBgmOnGesture);
      };
      window.addEventListener("click", startBgmOnGesture);
      window.addEventListener("keydown", startBgmOnGesture);
      window.addEventListener("touchstart", startBgmOnGesture);
      
      // Auto-start immediately in case user already had interaction state
      bgm.start();

      return () => {
        window.removeEventListener("click", startBgmOnGesture);
        window.removeEventListener("keydown", startBgmOnGesture);
        window.removeEventListener("touchstart", startBgmOnGesture);
        bgm.stop();
      };
    } else {
      bgm.stop();
    }
  }, [bgmMuted]);

  // Track player ID in localStorage to resume sessions cleanly
  useEffect(() => {
    let pid = localStorage.getItem("party_night_player_id");
    if (!pid) {
      pid = "p_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("party_night_player_id", pid);
    }
    setCurrentPlayerId(pid);

    // If there is an active room query parameter that differs from currently cached roomCode,
    // clear the cached roomCode to allow them to enter a new room cleanly!
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("room") || params.get("roomCode");
      if (urlCode && urlCode.length === 4) {
        const cachedCode = localStorage.getItem("party_night_room_code");
        if (urlCode !== cachedCode) {
          localStorage.removeItem("party_night_room_code");
          setRoomCode(null);
        }
      }
    }
  }, []);

  const savePlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem("party_night_player_name", name);
  };

  // Subscribe to real-time sync
  const {
    room,
    loading,
    error,
    createRoom,
    joinRoom,
    setGameMode,
    startGame,
    buzzIn,
    gradeBuzzedAnswer,
    skipTriviaQuestion,
    submitGuess,
    updateCanvasStrokes,
    handleDrawingTimeUp,
    restartRoom,
    leaveRoom
  } = useRoom(roomCode, currentPlayerId);

  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; name: string; color: string; left: number }[]>([]);
  const [trayExpanded, setTrayExpanded] = useState<boolean>(false);
  const [notesExpanded, setNotesExpanded] = useState<boolean>(false);
  const [micEnabled, setMicEnabled] = useState<boolean>(false);
  const [customNote, setCustomNote] = useState<string>("");

  const PRESET_NOTES = [
    "我畫的不像但我盡力了 😭",
    "這題也太難了吧 orz",
    "這題我會！看好了 😎",
    "太神啦！簡直是靈魂畫家 🏆",
    "手手手...手速太慢了 ⚡",
    "哈哈哈哈這什麼鬼啦 🤣",
    "承讓承讓，純屬運氣 🍻",
    "你們都是猜題大師吧 🔮"
  ];

  // Microphone voice detection engine checks
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let localIsSpeaking = false;

    async function startMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioCtx();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let lastSpeakingTime = 0;

        checkInterval = setInterval(() => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          
          let total = 0;
          for (let i = 0; i < dataArray.length; i++) {
            total += dataArray[i];
          }
          const averageVolume = total / dataArray.length;
          
          // Sound wave thresholds checks (amplitude volume peak triggers)
          const isNoisyNow = averageVolume > 20;

          if (isNoisyNow) {
            lastSpeakingTime = Date.now();
            if (!localIsSpeaking) {
              localIsSpeaking = true;
              if (roomCode && currentPlayerId) {
                dbSet(dbRef(`rooms/${roomCode}/players/${currentPlayerId}/isSpeaking`), true).catch(() => {});
              }
            }
          } else {
            // Wait 1.5 seconds of silence before marking speaking state off
            if (localIsSpeaking && Date.now() - lastSpeakingTime > 1500) {
              localIsSpeaking = false;
              if (roomCode && currentPlayerId) {
                dbSet(dbRef(`rooms/${roomCode}/players/${currentPlayerId}/isSpeaking`), null).catch(() => {});
              }
            }
          }
        }, 150);

      } catch (err) {
        console.warn("Microphone access denied or error:", err);
        setMicEnabled(false);
      }
    }

    if (micEnabled && roomCode && currentPlayerId) {
      startMic();
    } else {
      if (checkInterval) clearInterval(checkInterval);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      analyserRef.current = null;
      
      if (roomCode && currentPlayerId) {
        dbSet(dbRef(`rooms/${roomCode}/players/${currentPlayerId}/isSpeaking`), null).catch(() => {});
      }
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [micEnabled, roomCode, currentPlayerId]);

  const sendTacticalNote = async (text: string) => {
    if (!roomCode || !currentPlayerId || !text.trim()) return;
    
    sfx.playSuccess();
    
    // Custom navigator vibration API tactile effect on tactical messages trigger!
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(35);
    }

    const trimmed = text.trim().substring(0, 25);
    await dbSet(dbRef(`rooms/${roomCode}/players/${currentPlayerId}/bubbleMsg`), trimmed);
    await dbSet(dbRef(`rooms/${roomCode}/players/${currentPlayerId}/bubbleTimestamp`), Date.now());
    
    setCustomNote("");
    setNotesExpanded(false);
  };

  // Sync lower timing border alerts
  const secondsLeft = useTimer(room?.timer || null, false);
  const showLowTimeWarning = room?.gameState === "playing" && room?.timer?.isActive && secondsLeft > 0 && secondsLeft <= 5;

  const EMOJI_OPTIONS = ["🎉", "🔥", "🤔", "👏", "😂", "❤️", "👑", "😱", "😮", "💯"];

  const sendReaction = async (emoji: string) => {
    if (!roomCode || !currentPlayerId || !room) return;
    const currentPlayer = room.players[currentPlayerId];
    const pName = currentPlayer?.name || playerName || "匿名";
    const pColor = currentPlayer?.color || "#ff4757";

    const reactionId = "react_" + Math.random().toString(36).substring(2, 9);
    const reactionsRef = dbRef(`rooms/${roomCode}/reactions`);
    
    sfx.playTick(); // soft haptic click tone logic

    // Tactile haptic feedback for user-selected interactive emoji clicks!
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(35);
    }

    await dbPush(reactionsRef, {
      id: reactionId,
      playerId: currentPlayerId,
      playerName: pName,
      playerColor: pColor,
      emoji,
      timestamp: Date.now()
    });
  };

  // Real-time listener for incoming emoji reactions
  useEffect(() => {
    if (!roomCode) {
      setFloatingEmojis([]);
      return;
    }

    const loadThreshold = Date.now() - 1500;
    const reactionsRef = dbRef(`rooms/${roomCode}/reactions`);

    const unsubscribe = dbOnValue(reactionsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const reactionList = Object.values(data) as any[];

        const freshEmojis: any[] = [];
        reactionList.forEach((item) => {
          if (item && item.timestamp > loadThreshold && item.id) {
            freshEmojis.push({
              id: item.id + "_" + item.timestamp,
              emoji: item.emoji,
              name: item.playerName || "匿名",
              color: item.playerColor || "#ff4757",
              left: 15 + Math.random() * 70,
            });
          }
        });

        if (freshEmojis.length > 0) {
          setFloatingEmojis((prev) => {
            const currentIds = new Set(prev.map((p) => p.id));
            const filtered = freshEmojis.filter((x) => !currentIds.has(x.id));
            return [...prev, ...filtered].slice(-35); // limit simultaneous layout memory overhead
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode]);

  const handleRoomCreated = (code: string, playerId: string, name: string) => {
    setRoomCode(code);
    setCurrentPlayerId(playerId);
    localStorage.setItem("party_night_room_code", code);
  };

  const handleRoomJoined = (code: string, playerId: string, name: string) => {
    setRoomCode(code);
    setCurrentPlayerId(playerId);
    localStorage.setItem("party_night_room_code", code);
  };

  const handleExitRoom = async () => {
    if (roomCode && currentPlayerId) {
      try {
        await leaveRoom();
      } catch (e) {
        console.error("Error leaving", e);
      }
    }
    setRoomCode(null);
    localStorage.removeItem("party_night_room_code");
    sfx.playSuccess();
  };

  const isHost = room && currentPlayerId ? room.players[currentPlayerId]?.isHost : false;

  // Render Loader
  if (roomCode && loading) {
    return (
      <div className="w-full min-h-screen bg-[#0f0f1a] text-white flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-t-[#f5a623] border-slate-800 rounded-full animate-spin" />
        <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Connecting to Room...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0f0f1a] text-white selection:bg-[#f5a623] selection:text-black font-sans relative">
      
      {/* Persistent Global Header with Game Brand and Sound Switcher */}
      <header className="w-full bg-slate-950/95 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 select-none shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff4757] shadow-[0_0_8px_#ff4757] animate-pulse" />
          <span className="text-xs font-mono font-black tracking-widest text-slate-300 uppercase">
            派對之夜 ARCADE
          </span>
          {roomCode && (
            <span className="hidden sm:inline-block ml-2 text-[10px] bg-[#f5a623]/10 text-[#f5a623] px-2.5 py-0.5 rounded border border-[#f5a623]/30 font-mono font-black">
              房號 ID: {roomCode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {roomCode && (
            <div className="hidden md:flex items-center gap-1 text-[10px] text-emerald-400 font-mono tracking-wider font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>即時同步聯線中</span>
            </div>
          )}

          {/* Persistent Sound Controller */}
          <button
            id="global_sound_toggle_btn"
            type="button"
            onClick={toggleMute}
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold font-mono"
            title={muted ? "取消靜音" : "靜音音效"}
          >
            {muted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[9px] text-red-400 font-black tracking-wide">MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[9px] text-green-400 font-black tracking-wide">SOUND ON</span>
              </>
            )}
          </button>

          {/* Persistent BGM Controller */}
          <button
            id="global_bgm_toggle_btn"
            type="button"
            onClick={toggleBgm}
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold font-mono"
            title={bgmMuted ? "開啟背景音樂" : "關閉背景音樂"}
          >
            {bgmMuted ? (
              <>
                <Music className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[9px] text-slate-500 font-black tracking-wide">BGM OFF</span>
              </>
            ) : (
              <>
                <Music className="w-3.5 h-3.5 text-[#f5a623] animate-pulse" />
                <span className="text-[9px] text-[#f5a623] font-black tracking-wide">BGM ON</span>
              </>
            )}
          </button>

          {roomCode && (
            <button
              id="header_exit_button"
              type="button"
              onClick={handleExitRoom}
              className="px-2.5 py-1.5 bg-red-950/30 border border-red-500/35 hover:bg-red-950/60 hover:border-red-500/60 text-xs text-red-400 rounded-lg font-sans font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <LogOut className="w-3 h-3" />
              <span>離房</span>
            </button>
          )}
        </div>
      </header>

      {/* Main router dispatch */}
      <AnimatePresence mode="wait">
        {!roomCode || !room ? (
          // SCREEN 1 — HOME
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Home
              onRoomCreated={handleRoomCreated}
              onRoomJoined={handleRoomJoined}
              savedName={playerName}
              setSavedName={savePlayerName}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
            />
          </motion.div>
        ) : room.gameState === "lobby" ? (
          // SCREEN 2 — LOBBY
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Lobby
              roomCode={roomCode}
              players={room.players}
              gameMode={room.gameMode}
              isHost={isHost}
              currentPlayerId={currentPlayerId || ""}
              onChangeMode={setGameMode}
              onStartGame={startGame}
              onLeaveRoom={handleExitRoom}
            />
          </motion.div>
        ) : room.gameState === "playing" ? (
          // SCREEN 3: ACTIVE PLAY MODE (TRIVIA OR DRAWING)
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-7xl mx-auto px-4 py-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* PRIMARY GAME BOARD MODULE (Col 9) */}
              <div className="lg:col-span-9 flex flex-col gap-4">
                {room.gameMode === "trivia" ? (
                  <TriviaGame
                    room={room}
                    currentPlayerId={currentPlayerId || ""}
                    isHost={isHost}
                    onBuzzIn={buzzIn}
                    onGradeAnswer={gradeBuzzedAnswer}
                    onSkipTrivia={skipTriviaQuestion}
                  />
                ) : (
                  <DrawingGame
                    room={room}
                    currentPlayerId={currentPlayerId || ""}
                    isHost={isHost}
                    onSubmitGuess={submitGuess}
                    onUpdateCanvasStrokes={updateCanvasStrokes}
                    onTimeUp={handleDrawingTimeUp}
                  />
                )}
              </div>

              {/* SCREEN 4: IN-GAME REAL-TIME SCOREBOARD HOOK (Col 3) */}
              <div className="lg:col-span-3 lg:sticky lg:top-14 space-y-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-widest font-mono">
                  <Trophy className="w-4 h-4 text-[#f5a623]" />
                  <span>賽況計分板</span>
                </div>
                <Scoreboard
                  players={room.players}
                  currentPlayerId={currentPlayerId || ""}
                  isHost={isHost}
                  gameState="playing"
                  activeBuzzerId={room?.buzzer}
                />
              </div>

            </div>
          </motion.div>
        ) : (
          // SCREEN 5 — FINAL PODIUM scoreboard finished
          <motion.div
            key="finished"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Scoreboard
              players={room.players}
              currentPlayerId={currentPlayerId || ""}
              isHost={isHost}
              gameState="finished"
              roomCode={roomCode}
              onRestartRoom={restartRoom}
              onExitRoom={handleExitRoom}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Emojis Active Animation Overlay */}
      <AnimatePresence>
        {floatingEmojis.map((item) => (
          <motion.div
            key={item.id}
            initial={{ y: "110vh", opacity: 0, scale: 0.4, rotate: Math.random() * 20 - 10 }}
            animate={{
              y: ["100vh", "35vh", "-10vh"],
              opacity: [0, 1, 1, 0],
              scale: [0.7, 1.35, 1.35, 0.8],
              x: [0, Math.random() * 80 - 40, Math.random() * 120 - 60, Math.random() * 85 - 42]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4.2, ease: "easeOut" }}
            onAnimationComplete={() => {
              setFloatingEmojis((prev) => prev.filter((x) => x.id !== item.id));
            }}
            className="fixed bottom-0 z-[9999] pointer-events-none flex flex-col items-center gap-1 select-none"
            style={{ left: `${item.left}%` }}
          >
            <div className="text-4xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)] animate-bounce">
              {item.emoji}
            </div>
            <div
              className="px-2 py-0.5 rounded-full text-[9px] font-black border border-white/10 shadow-lg bg-slate-950/95 whitespace-nowrap"
              style={{ color: item.color, borderColor: `${item.color}35` }}
            >
              {item.name}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

       {/* Retractable Floating Emoji React Menu & Tactical Quick Notes Panel */}
      {roomCode && room && currentPlayerId && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2.5 font-mono">
          
          {/* Preset notes tray container */}
          <AnimatePresence>
            {notesExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 15 }}
                className="bg-slate-950/95 border border-slate-850 p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-md flex flex-col gap-2.5 max-w-[280px] sm:max-w-[340px] z-[9999]"
              >
                <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                  <span className="text-yellow-400 animate-bounce">💬</span>
                  <span className="text-xs text-amber-500 font-extrabold">戰術氣泡筆記</span>
                </div>

                {/* Grid of Preset tactical notes */}
                <div className="grid grid-cols-1 gap-1 max-h-[140px] overflow-y-auto pr-0.5">
                  {PRESET_NOTES.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => sendTacticalNote(text)}
                      className="text-left py-1 px-2.5 rounded-lg text-[10px] text-zinc-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer font-medium truncate"
                    >
                      {text}
                    </button>
                  ))}
                </div>

                {/* Custom text writing message panel inside notes popup */}
                <div className="flex gap-1.5 items-center border-t border-slate-900 pt-2">
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value.substring(0, 25))}
                    placeholder="自訂短句... (限25字)"
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-cyan-500 placeholder-slate-650"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customNote.trim()) {
                        sendTacticalNote(customNote);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customNote.trim()) {
                        sendTacticalNote(customNote);
                      }
                    }}
                    disabled={!customNote.trim()}
                    className="p-1 px-2 bg-slate-900 hover:bg-cyan-500 hover:text-black rounded-lg text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-slate-300 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji tray container */}
          <AnimatePresence>
            {trayExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 15 }}
                className="bg-slate-950/95 border border-slate-800 p-2 text-center rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-md flex flex-wrap gap-1.5 max-w-[280px] sm:max-w-[360px] justify-center z-[9999]"
              >
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => sendReaction(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-2xl hover:scale-130 active:scale-95 transition-all cursor-pointer rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar controller buttons Row */}
          <div className="flex items-center gap-2">
            {/* Microphone Speak Detector Toggle Trigger */}
            <button
              id="microphone_trigger_btn"
              type="button"
              onClick={() => {
                sfx.playTick();
                setMicEnabled(!micEnabled);
                if (typeof window !== "undefined" && navigator.vibrate) {
                  navigator.vibrate(35);
                }
              }}
              className={`w-11 h-11 rounded-full border-2 bg-slate-950 flex items-center justify-center shadow-2xl transition-all cursor-pointer select-none group ${
                micEnabled 
                  ? "border-emerald-500 text-emerald-400 hover:bg-slate-900 shadow-[0_0_12px_rgba(46,204,113,0.3)] animate-pulse" 
                  : "border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
              title={micEnabled ? "關閉語音發光偵測" : "開啟語音發光偵測 (說話時頭像會發光)"}
            >
              {micEnabled ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5 text-slate-500" />}
            </button>

            {/* Tactical Notes Tray Trigger */}
            <button
              id="tactical_notes_trigger_btn"
              type="button"
              onClick={() => {
                setNotesExpanded(!notesExpanded);
                setTrayExpanded(false);
                sfx.playTick();
                if (typeof window !== "undefined" && navigator.vibrate) {
                  navigator.vibrate(35);
                }
              }}
              className={`w-11 h-11 rounded-full border-2 bg-slate-950 flex items-center justify-center shadow-2xl transition-all cursor-pointer select-none group ${
                notesExpanded
                  ? "border-[#f5a623] text-[#f5a623] hover:bg-slate-900 shadow-[0_0_12px_rgba(245,166,35,0.3)]"
                  : "border-slate-800 hover:border-[#f5a623] text-slate-400 hover:text-[#f5a623] hover:bg-slate-900"
              }`}
              title="戰術聊天便貼"
            >
              <MessageSquare className="w-5 h-5 group-hover:scale-115 transition-all" />
            </button>

            {/* Emojis Reaction Tray Trigger */}
            <button
              id="reaction_tray_trigger_btn"
              type="button"
              onClick={() => {
                setTrayExpanded(!trayExpanded);
                setNotesExpanded(false);
                sfx.playTick();
                if (typeof window !== "undefined" && navigator.vibrate) {
                  navigator.vibrate(35);
                }
              }}
              className={`w-11 h-11 rounded-full border-2 bg-slate-950 flex items-center justify-center shadow-2xl transition-all cursor-pointer select-none group ${
                trayExpanded
                  ? "border-[#f5a623] text-[#f5a623] hover:bg-slate-900 shadow-[0_0_12px_rgba(245,166,35,0.3)]"
                  : "border-slate-800 hover:border-[#f5a623] text-slate-400 hover:text-[#f5a623] hover:bg-slate-900"
              }`}
              title="互動表情符號"
            >
              <Smile className={`w-5 h-5 group-hover:scale-115 transition-all ${trayExpanded ? "text-[#f5a623] rotate-12" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Low-Time Visual Red Alert flashing frame */}
      {showLowTimeWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 pointer-events-none border-[10px] border-[#ff4757] shadow-[inset_0_0_40px_rgba(255,71,87,0.8)] z-[9999] mix-blend-screen"
        />
      )}

      {/* Achievement Celebratory Backdrop Overlay Modal */}
      <AchievementOverlay notice={room?.achievementNotice || null} />
    </div>
  );
}
