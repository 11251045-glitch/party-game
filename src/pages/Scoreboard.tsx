import { motion } from "motion/react";
import { Trophy, RefreshCw, Home, Crown, Sparkles, Medal } from "lucide-react";
import { Player } from "../hooks/useRoom";
import { sfx } from "../utils/audio";
import { useEffect, useState } from "react";

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  angle: number;
  distance: number;
}

interface Explosion {
  id: string;
  cx: number;
  cy: number;
  color: string;
  particles: Particle[];
}

function FireworkCelebration() {
  const [explosions, setExplosions] = useState<Explosion[]>([]);

  useEffect(() => {
    const colors = ["#ff4757", "#f5a623", "#2ecc71", "#10ac84", "#2e86de", "#ff9f43", "#9b59b6", "#e84393", "#00ffff"];
    
    const triggerExplosion = () => {
      const id = "exp_" + Math.random().toString(36).substring(2, 9);
      const cx = 10 + Math.random() * 80; // randomized X layout range from 10% to 90%
      const cy = 15 + Math.random() * 45; // randomized Y layout range from 15% to 60%
      const color = colors[Math.floor(Math.random() * colors.length)];

      const particles: Particle[] = [];
      const particleCount = 18;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i * 360) / particleCount + (Math.random() * 12 - 6);
        const distance = 60 + Math.random() * 70; // explosion force distance
        particles.push({
          id: `${id}_p_${i}`,
          x: cx,
          y: cy,
          color,
          angle,
          distance
        });
      }

      setExplosions((prev) => [...prev.slice(-3), { id, cx, cy, color, particles }]);
    };

    // First two explosions instantly for a great initial load impression
    triggerExplosion();
    setTimeout(triggerExplosion, 400);

    const interval = setInterval(() => {
      triggerExplosion();
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {explosions.map((exp) => (
        <div key={exp.id} className="absolute inset-0">
          {/* Flash glow effect in center of detonation */}
          <motion.div
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: [1, 2.2], opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: `${exp.cx}%`,
              top: `${exp.cy}%`,
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: exp.color,
              boxShadow: `0 0 25px 12px ${exp.color}`,
              transform: "translate(-50%, -50%)"
            }}
          />

          {exp.particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const targetX = Math.cos(rad) * p.distance;
            const targetY = Math.sin(rad) * p.distance;

            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: targetX,
                  y: [targetY, targetY + 35], // fall slightly downwards due to gravity simulation
                  scale: [1, 1.3, 0],
                  opacity: [1, 0.95, 0]
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeOut"
                }}
                style={{
                  position: "absolute",
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  backgroundColor: p.color,
                  boxShadow: `0 0 8px 2px ${p.color}, 0 0 16px ${p.color}`,
                  transform: "translate(-50%, -50%)"
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface RibbonParticle {
  id: string;
  x: number;
  delay: number;
  color: string;
  sizeW: number;
  sizeH: number;
}

function ConfettiRibbonShower() {
  const [ribbons, setRibbons] = useState<RibbonParticle[]>([]);

  useEffect(() => {
    const rColors = ["#ff4757", "#f5a623", "#2ecc71", "#00d2d3", "#a55eea", "#ff9ff3", "#e056fd", "#f0932b", "#30336b"];
    const generated: RibbonParticle[] = [];
    for (let i = 0; i < 40; i++) {
      generated.push({
        id: `ribbon_${i}_${Math.random()}`,
        x: Math.random() * 100,
        delay: Math.random() * 3,
        color: rColors[Math.floor(Math.random() * rColors.length)],
        sizeW: 6 + Math.random() * 8, // Width 6-14px
        sizeH: 14 + Math.random() * 14 // Height 14-28px
      });
    }
    setRibbons(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {ribbons.map((r) => (
        <motion.div
          key={r.id}
          initial={{
            y: -50,
            x: `${r.x}%`,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            y: ["-5vh", "105vh"],
            rotate: [0, 180, 540, 960],
            x: [`${r.x}%`, `${r.x + (Math.random() * 30 - 15)}%`, `${r.x + (Math.random() * 40 - 20)}%`],
            opacity: [1, 1, 0.4, 0]
          }}
          transition={{
            duration: 5 + Math.random() * 4,
            ease: "linear",
            delay: r.delay,
            repeat: Infinity,
            repeatType: "loop"
          }}
          className="absolute rounded-[2px]"
          style={{
            backgroundColor: r.color,
            width: `${r.sizeW}px`,
            height: `${r.sizeH}px`,
            boxShadow: `0 2px 5px rgba(0,0,0,0.15)`
          }}
        />
      ))}
    </div>
  );
}

interface ScoreboardProps {
  players: Record<string, Player>;
  currentPlayerId: string;
  isHost: boolean;
  gameState: "playing" | "finished" | "lobby";
  roomCode?: string;
  onRestartRoom?: () => void;
  onExitRoom?: () => void;
  activeBuzzerId?: string | null;
}

export function Scoreboard({
  players = {},
  currentPlayerId,
  isHost,
  gameState,
  roomCode,
  onRestartRoom,
  onExitRoom,
  activeBuzzerId
}: ScoreboardProps) {
  
  const playerList = Object.values(players);
  // Sort players by score descending
  const sortedPlayers = [...playerList].sort((a, b) => b.score - a.score);
  
  // Highest score
  const highestScore = sortedPlayers.length > 0 ? sortedPlayers[0].score : 0;

  // Local ticker to auto-expire tactical note bubbles in real-time
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sound cue on game end victory fanfare reveal
  useEffect(() => {
    if (gameState === "finished") {
      sfx.playVictory();
    }
  }, [gameState]);

  // --------------------------------------------------------------------------
  // SCREEN 4: IN-GAME ACTIVE SCOREBOARD PANEL (Lobby or Active Play HUD)
  // --------------------------------------------------------------------------
  if (gameState !== "finished") {
    return (
      <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
        <h3 className="text-sm font-heading tracking-widest text-[#f5a623] mb-3 flex items-center gap-1.5 uppercase">
          <Trophy className="w-4 h-4 text-[#f5a623] animate-pulse" />
          即時玩家分數
        </h3>

        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
          {sortedPlayers.length === 0 ? (
            <p className="text-xs text-gray-500 italic text-center">坐無虛席... 還沒人入座</p>
          ) : (
            sortedPlayers.map((player, index) => {
              const isCurrent = player.id === currentPlayerId;
              const isLeader = player.score > 0 && player.score === highestScore;
              
              // Speaking and Buzzing state checks
              const isSpeakingActive = !!player.isSpeaking;
              const isBuzzerActive = activeBuzzerId === player.id;
              
              // Tactical Note Bubble expiration check (6 seconds duration)
              const showBubble = player.bubbleMsg && player.bubbleTimestamp && (now - player.bubbleTimestamp < 6000);

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded-xl border-2 transition-all relative ${
                    isLeader
                      ? "bg-[#252545]/90 border-[#f5a623] shadow-[4px_4px_0_rgba(245,166,35,0.15)]"
                      : isCurrent
                      ? "bg-[#1c1c3a]/90 border-cyan-500/80 shadow-[4px_4px_0_rgba(6,182,212,0.12)]"
                      : "bg-[#1c1c3a]/70 border-slate-800 shadow-[2px_2px_0_rgba(0,0,0,0.15)]"
                  }`}
                >
                  <div className="flex items-center gap-2 relative">
                    {/* Tiny index / position banner */}
                    <span className="text-[10px] font-mono text-slate-500 font-bold w-4">
                      #{index + 1}
                    </span>

                    {/* Circular Avatar initial block with speech-speaking breathing halo ring */}
                    <div className="relative flex-shrink-0">
                      {/* Base Avatar circle */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-black text-black text-xs select-none border border-white/20 relative z-10 transition-transform duration-300"
                        style={{ 
                          backgroundColor: player.color,
                          boxShadow: `0 0 8px ${player.color}99`
                        }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Active speaking breathing wave halo indicator (Microphone) */}
                      {isSpeakingActive && (
                        <span className="absolute -inset-1 rounded-full border border-emerald-400 animate-ping opacity-70 z-0" />
                      )}
                      {isSpeakingActive && (
                        <span className="absolute -inset-1 rounded-full border-2 border-emerald-500 shadow-[0_0_12px_#2ecc71] animate-pulse duration-700 z-0" />
                      )}

                      {/* Active buzzer claimant blazing flash ring (Buzzing) */}
                      {isBuzzerActive && (
                        <span className="absolute -inset-1 px-4 py-4 rounded-full border-2 border-rose-500 animate-ping opacity-90 z-0" />
                      )}
                      {isBuzzerActive && (
                        <span className="absolute -inset-1 rounded-full border-2 border-[#ff4757] shadow-[0_0_15px_#ff4757] animate-pulse duration-400 z-0" />
                      )}
                    </div>

                    {/* Player Info block & inline Speech Bubble */}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate max-w-[85px] ${isCurrent ? "text-cyan-400 font-extrabold" : "text-gray-200"}`}>
                          {player.name}
                        </span>
                        {isLeader && (
                          <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0 animate-bounce" />
                        )}
                        {isSpeakingActive && (
                          <span className="text-[9px] text-emerald-400 px-1 py-0.2 bg-emerald-950/40 rounded border border-emerald-800/60 font-black animate-pulse flex-shrink-0 scale-90">🎙️ SPEAKING</span>
                        )}
                      </div>

                      {/* Tactical Action speech bubble display inline or floating slightly */}
                      {showBubble && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0, y: 5 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          className="mt-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg text-[9px] text-zinc-300 font-extrabold flex items-center gap-1 max-w-[125px] shadow-lg animate-pulse"
                          style={{ borderLeftColor: player.color, borderLeftWidth: "3px" }}
                        >
                          <span className="text-yellow-400 animate-bounce">💬</span>
                          <span className="truncate" title={player.bubbleMsg || ""}>{player.bubbleMsg}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <span className="font-mono font-black text-xs text-white bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-850 shadow-inner">
                    {player.score} <span className="text-[9px] text-gray-500 font-sans font-medium">分</span>
                  </span>

                  {/* Absolute pointer floating bubble pointing left on large wide workspace contexts */}
                  {showBubble && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, x: 12 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      className="hidden xl:flex absolute left-[-212px] top-1/2 -translate-y-1/2 bg-slate-950/95 border border-slate-750 rounded-2xl p-2.5 shadow-[0_6px_25px_rgba(0,0,0,0.85)] z-50 text-xs text-white max-w-[190px] break-words items-center gap-1.5 font-bold font-sans selection:bg-[#ff4757]"
                      style={{ borderLeftColor: player.color, borderLeftWidth: "4px" }}
                    >
                      <span className="text-amber-400">💭</span>
                      <span className="leading-snug text-[11px]">{player.bubbleMsg}</span>
                      {/* Triangle visual indicator pointer arrow */}
                      <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-l-[6px] border-l-slate-750" />
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCREEN 5: FINAL PODIUM GAME COMPLETED VIEW
  // --------------------------------------------------------------------------
  const p1 = sortedPlayers[0];
  const p2 = sortedPlayers[1];
  const p3 = sortedPlayers[2];
  const remainingWinners = sortedPlayers.slice(3);

  return (
    <div className="w-full min-h-screen bg-[#0f0f1a] text-white py-12 px-4 flex flex-col items-center justify-center relative select-none">
      
      {/* Decorative Night Market Neon Lights overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,71,87,0.04)_0%,transparent_80%)] pointer-events-none" />

      {/* Framer Motion Firework Particle Effects */}
      <FireworkCelebration />

      {/* Main card panel */}
      <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-3 border-slate-705 rounded-3xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-md text-center relative overflow-hidden z-10">
        
        {/* Confetti sparkle vectors background */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-10 left-10 text-amber-500/20 w-8 h-8 animate-pulse" />
          <Sparkles className="absolute bottom-16 right-12 text-pink-500/10 w-12 h-12 animate-bounce" />
          <Sparkles className="absolute top-24 right-20 text-cyan-500/20 w-6 h-6 animate-pulse" />
        </div>

        {/* Header Marquees */}
        <h1 className="text-4xl md:text-5xl font-heading text-[#f5a623] drop-shadow-[0_4px_8px_rgba(245,166,35,0.4)] tracking-widest leading-none mb-1">
          競賽圓滿結束
        </h1>
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mt-2 mb-8">
          👑 Final Score Standings 👑
        </p>

        {/* 3D TRADITIONAL PODIUM STAGE */}
        <div className="w-full flex items-end justify-center h-[260px] md:h-[290px] mb-8 pb-4 relative border-b border-slate-800">
          
          {/* PLACE 2 (🥈 SILVER COLUMN - LEFT) */}
          {p2 && (
            <motion.div
              initial={{ x: -150, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.4 }}
              className="flex flex-col items-center w-24 md:w-32 z-10"
            >
              <div
                className="w-12 h-12 rounded-full border-2 border-slate-400 flex items-center justify-center font-bold text-black text-xl mb-2 relative"
                style={{ backgroundColor: p2.color, boxShadow: `0 0 15px ${p2.color}88` }}
              >
                {p2.name.charAt(0).toUpperCase()}
                <span className="absolute -top-3 -right-3 text-slate-400">
                  <Medal className="w-6 h-6 fill-slate-500 text-slate-200" />
                </span>
              </div>
              <span className="text-sm font-bold text-slate-300 truncate max-w-[90px] mb-1">{p2.name}</span>
              <span className="text-xs font-mono font-bold text-slate-400 mb-2">{p2.score} 分</span>
              {/* Podium Column Block - Rises from the bottom */}
              <motion.div 
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ type: "spring", stiffness: 80, damping: 12, delay: 0.8 }}
                style={{ originY: "bottom" }}
                className="w-full h-24 bg-gradient-to-t from-slate-900 to-slate-800 border-2 border-slate-700 border-b-0 rounded-t-xl flex items-center justify-center font-heading font-black text-slate-400 text-2xl shadow-lg"
              >
                2nd
              </motion.div>
            </motion.div>
          )}

          {/* PLACE 1 (🥇 GOLD COLUMN - CENTER) */}
          {p1 && (
            <motion.div
              initial={{ y: -300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.1 }}
              className="flex flex-col items-center w-28 md:w-36 z-20"
            >
              <div className="relative mb-2">
                {/* Golden Crown */}
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce">
                  <Crown className="w-8 h-8 fill-yellow-450 filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]" />
                </span>
                {/* Circle Bubble */}
                <div
                  className="w-16 h-16 rounded-full border-4 border-yellow-400 flex items-center justify-center font-extrabold text-black text-2xl"
                  style={{ backgroundColor: p1.color, boxShadow: `0 0 25px ${p1.color}` }}
                >
                  {p1.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <span className="text-base font-extrabold text-yellow-300 truncate max-w-[110px] mb-1">{p1.name}</span>
              <span className="text-sm font-mono font-black text-[#f5a623] mb-2">{p1.score} 分</span>
              {/* Gold Column Block - Rises from the bottom */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ type: "spring", stiffness: 70, damping: 10, delay: 0.5 }}
                style={{ originY: "bottom" }}
                className="w-full h-36 bg-gradient-to-t from-[#f5a623]/20 to-slate-800 border-2 border-amber-500 border-b-0 rounded-t-xl flex flex-col items-center justify-center shadow-2xl relative"
              >
                <span className="font-heading font-black text-amber-400 text-3xl">1st</span>
              </motion.div>
            </motion.div>
          )}

          {/* PLACE 3 (🥉 BRONZE COLUMN - RIGHT) */}
          {p3 && (
            <motion.div
              initial={{ x: 150, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.6 }}
              className="flex flex-col items-center w-20 md:w-28 z-15"
            >
              <div
                className="w-10 h-10 rounded-full border-2 border-[#b57c50] flex items-center justify-center font-bold text-black text-lg mb-2 relative"
                style={{ backgroundColor: p3.color, boxShadow: `0 0 10px ${p3.color}aa` }}
              >
                {p3.name.charAt(0).toUpperCase()}
                <span className="absolute -top-2.5 -right-2.5 text-amber-700">
                  <Medal className="w-5 h-5 fill-amber-700 text-amber-500" />
                </span>
              </div>
              <span className="text-xs font-bold text-slate-300 truncate max-w-[80px] mb-1">{p3.name}</span>
              <span className="text-xs font-mono font-bold text-slate-400 mb-2">{p3.score} 分</span>
              {/* Podium Column Box - Rises from the bottom */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ type: "spring", stiffness: 80, damping: 12, delay: 1.0 }}
                style={{ originY: "bottom" }}
                className="w-full h-16 bg-gradient-to-t from-slate-900 to-slate-800 border-2 border-slate-705 border-b-0 rounded-t-xl flex items-center justify-center font-heading font-black text-amber-800 text-xl shadow-lg"
              >
                3rd
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* REMAINING RUNNERS LIST (4th place and below) */}
        {remainingWinners.length > 0 && (
          <div className="max-w-md mx-auto mb-10 bg-slate-950/60 rounded-2xl p-4 border border-slate-850">
            <h3 className="text-xs text-slate-555 font-mono tracking-widest uppercase mb-2.5">其他選手名次</h3>
            <div className="space-y-2">
              {remainingWinners.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between py-1 px-3 border border-slate-850/40 bg-slate-900/30 rounded-lg text-xs text-gray-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono">第 {index + 4} 名</span>
                    <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: player.color }} />
                    <span className="font-semibold">{player.name}</span>
                  </div>
                  <span className="font-mono font-bold">{player.score} 分</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINAL BUTTON NAV CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-sm mx-auto pt-4 border-t border-slate-800/60">
          
          {/* Play again in same room */}
          {isHost ? (
            <button
              id="replay_game_button"
              type="button"
              onClick={() => {
                sfx.playVictory();
                if (onRestartRoom) onRestartRoom();
              }}
              className="w-full sm:flex-1 min-h-[50px] bg-[#2eac71] text-black font-extrabold rounded-2xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(46,204,113,0.3)] hover:brightness-105 active:scale-95 transition-all border-b-4 border-green-800 cursor-pointer text-sm"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              再玩一次
            </button>
          ) : (
            <div className="w-full sm:flex-1 min-h-[50px] bg-slate-950 text-gray-400 rounded-2xl flex items-center justify-center text-xs px-3 text-center border border-slate-850 animate-pulse italic">
              📢 正在等待房主點選「再玩一次」重啟大賽
            </div>
          )}

          {/* Go back back to default main screen */}
          <button
            id="exit_to_home_button"
            type="button"
            onClick={() => {
              sfx.playSuccess();
              if (onExitRoom) onExitRoom();
            }}
            className="w-full sm:flex-1 min-h-[50px] bg-slate-800 text-white font-bold rounded-2xl border-b-4 border-slate-950 hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-all text-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            回到大廳
          </button>
        </div>

      </div>
    </div>
  );
}
