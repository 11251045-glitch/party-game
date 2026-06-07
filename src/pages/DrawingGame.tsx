import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Paintbrush, Brain, Eye, HelpCircle, Trophy } from "lucide-react";
import { GameState, Player } from "../hooks/useRoom";
import { Canvas, CanvasStroke, StrokePoint } from "../components/Canvas";
import { Timer } from "../components/Timer";
import { ChatBox } from "../components/ChatBox";
import { sfx } from "../utils/audio";
import { dbRef, dbSet } from "../firebase";

interface DrawingGameProps {
  room: GameState;
  currentPlayerId: string;
  isHost: boolean;
  onSubmitGuess: (playerId: string, testText: string) => void;
  onUpdateCanvasStrokes: (strokes: CanvasStroke[]) => void;
  onTimeUp: () => void;
}

// Preset vector doodles for bots to draw!
const BOT_DOODLES: Record<string, StrokePoint[][]> = {
  // Simple smiley face
  face: [
    // Head circle outline
    [
      { x: 0.3, y: 0.5 }, { x: 0.32, y: 0.38 }, { x: 0.4, y: 0.28 }, { x: 0.5, y: 0.25 },
      { x: 0.6, y: 0.28 }, { x: 0.68, y: 0.38 }, { x: 0.7, y: 0.5 }, { x: 0.68, y: 0.62 },
      { x: 0.6, y: 0.72 }, { x: 0.5, y: 0.75 }, { x: 0.4, y: 0.72 }, { x: 0.32, y: 0.62 },
      { x: 0.3, y: 0.5 }
    ],
    // Left eye dot
    [{ x: 0.42, y: 0.42 }, { x: 0.42, y: 0.45 }],
    // Right eye dot
    [{ x: 0.58, y: 0.42 }, { x: 0.58, y: 0.45 }],
    // Mouth curve
    [{ x: 0.4, y: 0.58 }, { x: 0.45, y: 0.63 }, { x: 0.5, y: 0.65 }, { x: 0.55, y: 0.63 }, { x: 0.6, y: 0.58 }]
  ],
  // Simple house
  house: [
    // Box walls
    [{ x: 0.3, y: 0.75 }, { x: 0.3, y: 0.45 }, { x: 0.7, y: 0.45 }, { x: 0.7, y: 0.75 }, { x: 0.3, y: 0.75 }],
    // Triangular roof
    [{ x: 0.3, y: 0.45 }, { x: 0.5, y: 0.25 }, { x: 0.7, y: 0.45 }],
    // Door
    [{ x: 0.45, y: 0.75 }, { x: 0.45, y: 0.58 }, { x: 0.55, y: 0.58 }, { x: 0.55, y: 0.75 }],
    // Window
    [{ x: 0.58, y: 0.5 }, { x: 0.64, y: 0.5 }, { x: 0.64, y: 0.56 }, { x: 0.58, y: 0.56 }, { x: 0.58, y: 0.5 }]
  ],
  // Simple tree
  tree: [
    // Trunk
    [{ x: 0.46, y: 0.75 }, { x: 0.46, y: 0.55 }, { x: 0.54, y: 0.55 }, { x: 0.54, y: 0.75 }, { x: 0.46, y: 0.75 }],
    // Bush outline
    [
      { x: 0.4, y: 0.55 }, { x: 0.35, y: 0.5 }, { x: 0.35, y: 0.4 }, { x: 0.4, y: 0.32 },
      { x: 0.5, y: 0.28 }, { x: 0.6, y: 0.32 }, { x: 0.65, y: 0.4 }, { x: 0.65, y: 0.5 },
      { x: 0.6, y: 0.55 }, { x: 0.4, y: 0.55 }
    ]
  ]
};

// Words to try as incorrect bot guesses
const MOCK_GUESS_POOL: Record<string, string[]> = {
  "動物": ["哈士奇", "梅花鹿", "熊貓", "袋鼠", "小白兔", "哥吉拉"],
  "食物": ["大雕燒", "臭豆腐", "珍珠奶茶", "排骨飯", "滷肉飯", "地瓜球", "蚵仔煎"],
  "日常用品": ["衛生紙", "吹風機", "垃圾桶", "水杯", "鑰匙圈", "手機殼"],
  "職業": ["工程師", "救生員", "波麗士大人", "外送員", "大主廚", "特務"],
  "台灣地名": ["台北車站", "阿里山", "基隆廟口", "太魯閣", "小琉球", "澎湖灣"],
  "電影": ["少林足球", "海角七號", "賽德克巴萊", "當男人戀愛時", "鋼鐵人"]
};

export function DrawingGame({
  room,
  currentPlayerId,
  isHost,
  onSubmitGuess,
  onUpdateCanvasStrokes,
  onTimeUp
}: DrawingGameProps) {
  const { 
    currentDrawer, 
    currentWord, 
    currentWordCategory, 
    currentRound, 
    totalRounds, 
    timer, 
    canvasStrokes = [], 
    roomCode, 
    players = {} 
  } = room;

  const isDrawer = currentDrawer === currentPlayerId;
  const drawerPlayer = currentDrawer ? players[currentDrawer] : null;
  const isHostOrDrawer = isHost || isDrawer;

  // Track state so bot guesses are throttle scheduled
  const lastBotGuessTime = useRef<number>(0);
  const robotDrawingIndex = useRef<number>(0);

  // --------------------------------------------------------------------------
  // BOT SIMULATION INTEGRATION (Automated draw & guess for single testing)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!roomCode || room.gameState !== "playing" || room.gameMode !== "drawing") return;

    const botPlayers = Object.values(players).filter((p) => p.id.startsWith("bot_"));
    if (botPlayers.length === 0) return;

    // ACTIVE SCENARIO 1: A BOT IS DRAWING
    // The Host takes responsibility to slowly upload strokes to Firebase
    if (isHost && currentDrawer && currentDrawer.startsWith("bot_")) {
      const botStrokeTimer = setInterval(async () => {
        // Collect current strokes
        const currentStrokesCount = canvasStrokes ? canvasStrokes.length : 0;
        
        // Select one preset doodle based on word length / random seed
        const doodleKeys = Object.keys(BOT_DOODLES);
        const doodleType = doodleKeys[room.currentRound % doodleKeys.length];
        const doodleLines = BOT_DOODLES[doodleType];

        if (currentStrokesCount < doodleLines.length) {
          // Push next line to Database!
          const nextLinePoints = doodleLines[currentStrokesCount];
          const newStroke: CanvasStroke = {
            points: nextLinePoints,
            color: "#f5a623", // Gold doodle
            width: 5
          };
          
          const updatedStrokes = [...(canvasStrokes || []), newStroke];
          const strokesRef = dbRef(`rooms/${roomCode}/canvas/strokes`);
          await dbSet(strokesRef, updatedStrokes);
        } else {
          clearInterval(botStrokeTimer);
        }
      }, 4000); // Add a line every 4 seconds

      return () => clearInterval(botStrokeTimer);
    }

    // ACTIVE SCENARIO 2: WE ARE DRAWING, BOTS GUESS IN CHAT
    // The drawer client plays other bots' guesses
    if (isDrawer) {
      const botGuessTimer = setInterval(() => {
        const now = Date.now();
        if (now - lastBotGuessTime.current < 8000) return; // limit to 8s interval max

        // Select a random bot
        const luckyBot = botPlayers[Math.floor(Math.random() * botPlayers.length)];
        
        // Generate guess
        let botGuess = "";
        const correctOdds = Math.random() < 0.25; // 25% chance of correct guess every interval

        if (correctOdds && currentWord) {
          botGuess = currentWord;
        } else {
          // Pick wrong guess of matching category
          const pool = MOCK_GUESS_POOL[currentWordCategory || "食物"] || MOCK_GUESS_POOL["食物"];
          botGuess = pool[Math.floor(Math.random() * pool.length)];
        }

        onSubmitGuess(luckyBot.id, botGuess);

        // 35% chance that a guessing bot also posts a funny real-time tactical bubble note!
        if (Math.random() < 0.35) {
          const botNotes = [
            "這題秒懂！看好了 😎",
            "你在畫什麼啦… 🙈",
            "這畫工真的有待加強 🎨",
            "哈哈哈哈完全看不懂 😂",
            "手速太慢了，搶不到 😭",
            "我太聰明了吧！🔮"
          ];
          const chosenNote = botNotes[Math.floor(Math.random() * botNotes.length)];
          dbSet(dbRef(`rooms/${roomCode}/players/${luckyBot.id}/bubbleMsg`), chosenNote).catch(() => {});
          dbSet(dbRef(`rooms/${roomCode}/players/${luckyBot.id}/bubbleTimestamp`), Date.now()).catch(() => {});
        }

        lastBotGuessTime.current = now;
      }, 7000);

      return () => clearInterval(botGuessTimer);
    }

  }, [roomCode, currentDrawer, isHost, isDrawer, canvasStrokes, players, currentWord, currentWordCategory]);

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto py-2">
      {/* Upper info panel ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
        
        {/* Round Ticker info */}
        <div className="flex items-center gap-2 text-slate-400 text-sm font-mono order-1 md:order-none">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>
            回合: <b className="text-white font-black">{currentRound}</b> / {totalRounds}
          </span>
        </div>

        {/* Sync Countdown timer */}
        <div className="order-none md:order-none">
          <Timer
            timerData={timer}
            isHostOrDrawer={isHostOrDrawer}
            onTimeUp={onTimeUp}
          />
        </div>

        {/* Drawer name badge */}
        <div className="text-right flex items-center justify-start md:justify-end gap-1.5 text-xs text-gray-400 order-2 md:order-none">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block animate-ping" />
          <span>正在繪圖中：</span>
          <span
            style={{ color: drawerPlayer?.color }}
            className="font-black text-sm uppercase font-mono"
          >
            {drawerPlayer?.name}
          </span>
        </div>
      </div>

      {/* Primary bento viewport layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* DRAWING BOARD LEFT WING (Col 7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* SECRETS STRIP (Shown only to current Drawer!) */}
          {isDrawer ? (
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/50 rounded-2xl shadow-[0_0_15px_rgba(245,166,35,0.08)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-500 font-heading">
                  <Paintbrush className="w-5 h-5 animate-bounce" />
                  <span className="text-sm font-bold tracking-widest uppercase">你是畫家！請繪製以下詞彙</span>
                </div>
                <div className="text-xs bg-amber-500/10 border border-amber-500/40 px-2.5 py-0.5 rounded text-amber-400 uppercase font-mono">
                  分類：{currentWordCategory}
                </div>
              </div>
              <div className="mt-3 text-center py-2 bg-slate-955 rounded-xl border border-slate-800">
                <span className="text-3xl font-heading font-black tracking-widest text-[#f5a623] drop-shadow-[0_4px_8px_rgba(245,166,35,0.4)]">
                  {currentWord}
                </span>
              </div>
            </div>
          ) : (
            // GUEST VIEW HINTS (Category clue)
            <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-xs">觀察畫作並打字搶答！</span>
              </div>
              <span className="text-xs text-slate-400">
                提示分類：<b className="text-amber-400 font-black">{currentWordCategory}</b>
              </span>
            </div>
          )}

          {/* SHARED SVG/CANVAS VIEWPORT */}
          <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 shadow-xl p-1">
            <Canvas
              strokes={canvasStrokes}
              isDrawer={isDrawer}
              onStrokesChange={onUpdateCanvasStrokes}
            />
          </div>
        </div>

        {/* CHAT GUESS LOG RIGHT WING (Col 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="lg:sticky lg:top-4 h-full flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-mono">
              <Brain className="w-4 h-4 text-rose-500" />
              <span>現場猜測排行榜與通訊欄</span>
            </div>
            <ChatBox
              roomCode={roomCode}
              currentPlayerId={currentPlayerId}
              isDrawer={isDrawer}
              onSubmitGuess={(guessText) => onSubmitGuess(currentPlayerId, guessText)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
