import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Copy, Play, ArrowLeft, BrainCircuit, Paintbrush, Users, Bot, UserPlus, QrCode } from "lucide-react";
import { Player, NEON_COLORS } from "../hooks/useRoom";
import { dbRef, dbSet } from "../firebase";
import { sfx } from "../utils/audio";

interface LobbyProps {
  roomCode: string;
  players: Record<string, Player>;
  gameMode: "trivia" | "drawing";
  isHost: boolean;
  currentPlayerId: string;
  onChangeMode: (mode: "trivia" | "drawing") => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const BOT_NAMES = [
  "饒河街小籠包 🥟",
  "淡水阿給大師 🍥",
  "士林雞排機器人 🤖",
  "阿里山小火車 🚂",
  "野柳女王頭 👑",
  "逢甲地瓜球 🍡"
];

export function Lobby({
  roomCode,
  players = {},
  gameMode,
  isHost,
  currentPlayerId,
  onChangeMode,
  onStartGame,
  onLeaveRoom
}: LobbyProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const playerList = Object.values(players);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : `https://party-night.app/?room=${roomCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sfx.playSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  // Add a simulation bot for helpful solo testing in Dev environment!
  const handleAddBot = async () => {
    sfx.playSuccess();
    const botId = "bot_" + Math.random().toString(36).substring(2, 9);
    
    // Pick unoccupied name
    const existingNames = playerList.map(p => p.name);
    const availableNames = BOT_NAMES.filter(n => !existingNames.includes(n));
    const randomName = availableNames.length > 0 
      ? availableNames[Math.floor(Math.random() * availableNames.length)]
      : "夜市路人 " + Math.floor(Math.random() * 100);

    const takenColors = playerList.map(p => p.color);
    const availableColors = NEON_COLORS.filter(c => !takenColors.includes(c));
    const randomColor = availableColors.length > 0
      ? availableColors[Math.floor(Math.random() * availableColors.length)]
      : NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];

    const mockBot: Player = {
      id: botId,
      name: randomName,
      score: 0,
      color: randomColor,
      isHost: false,
      isActive: true // bot marker
    };

    const botRef = dbRef(`rooms/${roomCode}/players/${botId}`);
    await dbSet(botRef, mockBot);
  };

  const handleStart = () => {
    if (playerList.length < 2) return;
    sfx.playVictory();
    onStartGame();
  };

  return (
    <div className="w-full min-h-screen bg-[#0f0f1a] text-white py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-slate-900/60 border-2 border-slate-700/70 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative">
        
        {/* Header navigation back lever */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700/50">
          <button
            id="back_to_home_button"
            type="button"
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#ff4757] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            退出房間
          </button>
          
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-green-500 animate-ping inline-block" />
            <span className="text-xs text-green-400 tracking-wider uppercase font-mono font-bold">Lobby Ready</span>
          </div>
        </div>

        {/* Room Code Marquees */}
        <div className="text-center mb-8 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 bg-amber-500/10 text-amber-500 text-[10px] font-mono tracking-widest px-3 py-1 font-bold rounded-br-lg uppercase">
            Room Code
          </div>
          <p className="text-sm text-slate-400 mt-2">告訴好友輸入以下房號加入遊戲：</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-4xl md:text-5xl font-mono font-black text-[#f5a623] tracking-wider select-all">
              {roomCode}
            </span>
            <button
              id="copy_room_code_button"
              type="button"
              onClick={handleCopyCode}
              title="複製房號"
              className="p-2.5 bg-slate-900 border border-slate-750 hover:bg-slate-800 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer text-amber-500"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          {copied && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-green-400 font-semibold mt-2"
            >
              ✓ 房號複製成功！快傳給朋友玩吧！
            </motion.p>
          )}

          {/* Share Room Button */}
          <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-col items-center justify-center">
            {showQr ? (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center border-4 border-[#f5a623] shadow-2xl relative max-w-[240px] mt-2.5"
              >
                {/* Close Button tag */}
                <button
                  id="close_qr_button"
                  type="button"
                  onClick={() => {
                    setShowQr(false);
                    sfx.playSuccess();
                  }}
                  className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 rounded-full text-white font-extrabold flex items-center justify-center hover:bg-red-650 transition-colors shadow-md cursor-pointer text-xs select-none border-2 border-white"
                  title="隱藏"
                >
                  ✕
                </button>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
                  alt="QR Code"
                  className="w-40 h-40 object-contain block bg-white"
                  referrerPolicy="no-referrer"
                />
                <div className="text-[10px] text-slate-800 font-extrabold tracking-wider leading-tight text-center mt-2 font-sans select-none">
                  請手機掃瞄 QR Code<br />自動帶入房號加入！
                </div>
              </motion.div>
            ) : (
              <button
                id="share_room_qr_button"
                type="button"
                onClick={() => {
                  setShowQr(true);
                  sfx.playSuccess();
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-[#f5a623] text-black hover:brightness-110 active:scale-95 transition-all text-xs font-black rounded-xl flex items-center gap-1.5 shadow-[0_3px_10px_rgba(245,166,35,0.25)] cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>行動分享 QR Code 📱</span>
              </button>
            )}
          </div>
        </div>

        {/* Player List Card grids */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading tracking-wider flex items-center gap-2 text-slate-200">
              <Users className="w-5 h-5 text-[#f5a623]" />
              已入座玩家 ({playerList.length} 人)
            </h2>
            
            {/* Solo testing injection button */}
            <button
              id="add_bot_button"
              type="button"
              onClick={handleAddBot}
              title="加入測試虛擬玩家"
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-amber-300 hover:bg-[#f5a623] hover:text-black hover:border-[#f5a623] transition-all cursor-pointer font-bold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>加測試玩家 🤖</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playerList.map((player) => (
              <motion.div
                key={player.id}
                id={`lobby_pcard_${player.id}`}
                layout
                initial={{ transform: "scale(0.9)", opacity: 0 }}
                animate={{ transform: "scale(1)", opacity: 1 }}
                className="p-3 bg-[#1c1c3a] border-2 border-gray-700/80 rounded-xl flex items-center justify-between gap-3 shadow-[4px_4px_0_rgba(245,166,35,0.12)] hover:border-[#f5a623] hover:shadow-[4px_4px_0_rgba(245,166,35,0.22)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-heading font-black text-black text-base relative border-2 border-white"
                    style={{ 
                      backgroundColor: player.color,
                      boxShadow: `0 0 8px ${player.color}aa`
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-200">
                      {player.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {player.id === currentPlayerId ? "你" : player.id.startsWith("bot_") ? "虛擬玩家" : "玩家"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {player.isHost && (
                    <span className="text-[10px] bg-[#ff4757] text-white px-2 py-0.5 rounded-sm font-black italic border border-black shadow-[2px_2px_0_#000]">
                      房主
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Game Mode Settings Control panel (Host/Player layout depending on role) */}
        <div className="mb-8 p-5 bg-slate-950/40 border border-slate-800 rounded-2xl">
          {isHost ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-amber-300">🎮 房主設置：遊戲模式</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Mode A: 你問我答 */}
                <button
                  id="mode_trivia_selection_btn"
                  type="button"
                  onClick={() => {
                    onChangeMode("trivia");
                    sfx.playSuccess();
                  }}
                  className={`flex-1 p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                    gameMode === "trivia"
                      ? "border-[#f5a623] bg-[#f5a623]/5 shadow-[0_0_12px_rgba(245,166,35,0.15)]"
                      : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-orange-600/20 text-orange-400 mt-0.5">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">你問我答 (Trivia)</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      經典夜市搶答。比拼手速與知識庫！正確答案按讚得分。
                    </p>
                  </div>
                </button>

                {/* Mode B: 你畫我猜 */}
                <button
                  id="mode_drawing_selection_btn"
                  type="button"
                  onClick={() => {
                    onChangeMode("drawing");
                    sfx.playSuccess();
                  }}
                  className={`flex-1 p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                    gameMode === "drawing"
                      ? "border-[#ff4757] bg-[#ff4757]/5 shadow-[0_0_12px_rgba(255,71,87,0.15)]"
                      : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-pink-600/20 text-pink-400 mt-0.5">
                    <Paintbrush className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">你畫我猜 (Draw)</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      畫家在畫布實時揮灑，其他人打字搶猜，猜對雙方大加分。
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-sm text-gray-400 font-medium">
              📣 正在等待房主開始遊戲。目前選擇模式：
              <span className="font-bold text-amber-400 ml-1">
                {gameMode === "trivia" ? "🧠 你問我答 (Trivia)" : "🎨 你畫我猜 (Draw)"}
              </span>
            </div>
          )}
        </div>

        {/* Start Triggers block (Disabled check 2+ players) */}
        {isHost ? (
          <div>
            <button
              id="start_lobby_game_btn"
              type="button"
              onClick={handleStart}
              disabled={playerList.length < 2}
              className={`w-full min-h-[56px] text-lg font-heading tracking-widest uppercase rounded-2xl font-black border-b-4 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                playerList.length >= 2
                  ? "bg-[#2ecc71] text-black border-green-800 hover:brightness-110 shadow-[0_0_20px_rgba(46,204,113,0.3)]"
                  : "bg-slate-800 text-slate-500 border-slate-950 cursor-not-allowed"
              }`}
            >
              <Play className="w-5 h-5 fill-black" />
              開始遊戲 ({playerList.length}/2+ 玩家)
            </button>
            {playerList.length < 2 && (
              <p className="text-[11px] text-slate-400 text-center mt-2.5">
                💡 至少需要 2 位玩家加入才能開始遊戲。點擊右上角「加測試玩家機器人 🤖」可立即玩！
              </p>
            )}
          </div>
        ) : (
          <div className="w-full min-h-[56px] bg-slate-950 rounded-2xl flex items-center justify-center text-slate-400 font-medium border border-slate-800 text-sm italic animate-pulse">
            💤 準備好了！等待房主鳴笛開賽...
          </div>
        )}

      </div>
    </div>
  );
}
