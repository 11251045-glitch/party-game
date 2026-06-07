import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, Check, X, ShieldAlert, SkipForward, Clock } from "lucide-react";
import { GameState, Player } from "../hooks/useRoom";
import { BuzzButton } from "../components/BuzzButton";
import { sfx } from "../utils/audio";
import { dbRef, dbSet, dbUpdate } from "../firebase";

interface TriviaGameProps {
  room: GameState;
  currentPlayerId: string;
  isHost: boolean;
  onBuzzIn: (playerId: string) => void;
  onGradeAnswer: (isCorrect: boolean) => void;
  onSkipTrivia: () => void;
}

export function TriviaGame({
  room,
  currentPlayerId,
  isHost,
  onBuzzIn,
  onGradeAnswer,
  onSkipTrivia
}: TriviaGameProps) {
  const { currentQuestion, currentRound, totalRounds, buzzer, lockedOut = {}, players = {} } = room;

  const buzzerPlayer = buzzer ? players[buzzer] : null;
  const isCurrentUserBuzzer = buzzer === currentPlayerId;
  const isCurrentLockedOut = !!lockedOut[currentPlayerId];

  // --------------------------------------------------------------------------
  // BOT SIMULATION TRIGGERS (Auto-buzz for solo debugging in AI Studio!)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (buzzer) return; // already buzzed

    // Collect bots
    const botList = Object.values(players).filter(p => p.id.startsWith("bot_"));
    if (botList.length === 0) return;

    // Check if everyone is locked out
    const availableBots = botList.filter(b => !lockedOut[b.id]);
    if (availableBots.length === 0) return;

    // Schedule a random bot buzz in between 4 to 8 seconds
    const delay = 4000 + Math.random() * 4000;
    const timer = setTimeout(async () => {
      // Re-query buzzer state
      if (room.buzzer) return;

      const luckyBotIdx = Math.floor(Math.random() * availableBots.length);
      const luckyBot = availableBots[luckyBotIdx];

      // Bot buzzes!
      try {
        const buzzerRef = dbRef(`rooms/${room.roomCode}/buzzer`);
        const lastEventRef = dbRef(`rooms/${room.roomCode}/lastEvent`);
        const speedRef = dbRef(`rooms/${room.roomCode}/players/${luckyBot.id}/lastBuzzSpeed`);
        
        await dbSet(speedRef, delay);
        await dbSet(buzzerRef, luckyBot.id);

        if (Math.random() < 0.50) {
          const quizBotNotes = [
            "這題秒懂！看好了 😎",
            "手速太慢就搶不到啦 ⚡",
            "天賜良機！這題我會！",
            "讓我來為大家揭曉答案！🏆",
            "承讓承讓，我的網速比較快 📡"
          ];
          const choice = quizBotNotes[Math.floor(Math.random() * quizBotNotes.length)];
          dbSet(dbRef(`rooms/${room.roomCode}/players/${luckyBot.id}/bubbleMsg`), choice).catch(() => {});
          dbSet(dbRef(`rooms/${room.roomCode}/players/${luckyBot.id}/bubbleTimestamp`), Date.now()).catch(() => {});
        }

        await dbSet(lastEventRef, {
          type: "buzz",
          playerId: luckyBot.id,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error("Bot fail buzz", e);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [buzzer, players, lockedOut, room.roomCode]);

  // Handle local sfx play triggers on grade actions for client feel
  const handleHostGrade = (isCorrect: boolean) => {
    if (isCorrect) {
      sfx.playSuccess();
    } else {
      sfx.playBuzz();
    }
    onGradeAnswer(isCorrect);
  };

  if (!currentQuestion) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 italic font-medium">
        載入題目中... 請稍候
      </div>
    );
  }

  // Map difficulty colors
  const difficultyColors: Record<string, string> = {
    "簡單": "text-green-400 border-green-500/35 bg-green-500/10",
    "中等": "text-amber-400 border-amber-500/35 bg-amber-500/10",
    "難": "text-red-400 border-red-500/35 bg-red-500/10"
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-xl mx-auto py-4">
      {/* Round Header scoreboard bar */}
      <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
        <span className="text-sm text-slate-400 font-mono tracking-wide">
          進度: <b className="text-white font-black">{currentRound}</b> / {totalRounds} 題
        </span>
        <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-medium">
          分類：{currentQuestion.category}
        </span>
      </div>

      {/* Main Question Flip Card element */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-[#1a1a2e] border-4 border-[#ff4757] p-8 md:p-10 rounded-3xl shadow-[0_0_35px_rgba(255,71,87,0.22)] text-center min-h-[190px] flex flex-col justify-center items-center overflow-visible mt-4"
        >
          {/* Category Label */}
          <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 bg-[#ff4757] px-6 py-1.5 rounded-full text-xs font-black italic shadow-lg text-white tracking-widest uppercase border-2 border-white flex items-center gap-1.5 whitespace-nowrap z-10">
            <HelpCircle className="w-4 h-4 text-white" />
            <span>{currentQuestion.category} QUIZ</span>
          </div>
          
          <div className="flex items-center gap-2 mb-3 mt-4">
            <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded border ${difficultyColors[currentQuestion.difficulty] || "text-gray-400 border-gray-750 bg-slate-900"}`}>
              難度：{currentQuestion.difficulty}
            </span>
          </div>

          {/* Active Question Title text */}
          <h2 className="text-xl md:text-2xl font-black text-center text-white leading-relaxed my-3 font-sans select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {currentQuestion.question}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Locked status alerts */}
      {isCurrentLockedOut && !buzzer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-red-950/30 border border-red-500/30 text-xs text-red-300 rounded-xl text-center flex items-center justify-center gap-1.5 font-bold"
        >
          <ShieldAlert className="w-4 h-4 text-red-400" />
          您已此題答錯！鎖定等待下個回合。
        </motion.div>
      )}

      {/* Buzz-In Tactile Button */}
      <BuzzButton
        onBuzz={() => onBuzzIn(currentPlayerId)}
        isBuzzed={!!buzzer}
        buzzerName={buzzerPlayer ? buzzerPlayer.name : null}
        isCurrentUserBuzzer={isCurrentUserBuzzer}
        isLockedOut={isCurrentLockedOut}
        onClickAudio={() => sfx.playBuzz()}
      />

      {/* Answer reveal & grading center (Visible to HOST ONLY, or special state to view) */}
      <AnimatePresence>
        {buzzer && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-2xl relative"
          >
            <div className="text-center mb-4">
              <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Buzzer Claimed</span>
              <h3 className="text-lg font-bold text-slate-100 flex items-center justify-center gap-2 mt-1">
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block animate-pulse"
                  style={{ backgroundColor: buzzerPlayer?.color }}
                />
                <span style={{ color: buzzerPlayer?.color }} className="font-extrabold">{buzzerPlayer?.name}</span> 
                <span>正在起立搶答中！</span>
              </h3>
            </div>

            {isHost ? (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-mono">提示正確答案:</span>
                  <span className="text-[#f5a623] font-bold text-base">{currentQuestion.answer}</span>
                </div>

                <div className="text-xs text-slate-400 text-center">
                  💡 房主大人，請依據現場語音回答判定是否符合答案：
                </div>

                <div className="flex gap-3">
                  <button
                    id="grade_wrong_answer_btn"
                    type="button"
                    onClick={() => handleHostGrade(false)}
                    className="flex-1 min-h-[50px] bg-[#ff4757] text-white font-bold rounded-xl border-b-4 border-red-800 hover:brightness-110 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-sm"
                  >
                    <X className="w-4 h-4 text-white" />
                    答錯了 ✗
                  </button>

                  <button
                    id="grade_correct_answer_btn"
                    type="button"
                    onClick={() => handleHostGrade(true)}
                    className="flex-1 min-h-[50px] bg-[#2ecc71] text-black font-extrabold rounded-xl border-b-4 border-green-800 hover:brightness-110 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-sm"
                  >
                    <Check className="w-4 h-4 text-black" />
                    答對了 ✓
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center bg-slate-950 rounded-xl p-3 border border-slate-850 text-xs text-slate-400 italic">
                💤 正在判官審查中... 還請房主做出誠信判決。
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer Speed Leaderboard Widget */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mt-2">
        <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-3 select-none">
          <Clock className="w-4 h-4 animate-pulse text-[#f5a623]" />
          <span>⚡ 搶答速度排行榜 (神速前三強)</span>
        </h3>
        {Object.values(players).filter(p => p.bestBuzzSpeed && p.bestBuzzSpeed > 0).length === 0 ? (
          <div className="text-xs text-slate-500 italic py-2 text-center select-none">
            尚無已完成的搶答速度紀錄。快按下搶答按鈕並答對來爭奪寶座！
          </div>
        ) : (
          <div className="space-y-2">
            {Object.values(players)
              .filter((p) => p.bestBuzzSpeed && p.bestBuzzSpeed > 0)
              .sort((a, b) => (a.bestBuzzSpeed || 0) - (b.bestBuzzSpeed || 0))
              .slice(0, 5)
              .map((player, idx) => {
                const seconds = ((player.bestBuzzSpeed || 0) / 1000).toFixed(2);
                const isTopThree = idx < 3;
                const medals = ["🥇 超光速", "🥈 極速", "🥉 神速"];
                const bgStyles = [
                  "bg-amber-500/10 border-amber-500/35 text-amber-400",
                  "bg-slate-300/10 border-slate-300/35 text-slate-300",
                  "bg-amber-700/10 border-amber-700/35 text-amber-600"
                ];

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                      isTopThree ? bgStyles[idx] : "bg-slate-950/40 border-slate-850 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold w-5 text-center">{idx + 1}.</span>
                      <span
                        className="w-2 rounded-full h-2 inline-block"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="font-bold">{player.name}</span>
                      {isTopThree && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/40 font-black tracking-wider uppercase font-mono">
                          {medals[idx]}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold">{seconds} 秒</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Host Aux Options (Skip question if no one is buzzing/knows) */}
      {isHost && !buzzer && (
        <div className="flex justify-center mt-2.5">
          <button
            id="skip_current_question_btn"
            type="button"
            onClick={() => {
              sfx.playSuccess();
              onSkipTrivia();
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-500 transition-all border border-slate-850 hover:bg-slate-900 bg-slate-950/20 px-3.5 py-2 rounded-full cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            無人知曉？跳過此題 ➔
          </button>
        </div>
      )}
    </div>
  );
}
