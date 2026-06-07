import { useState, useEffect, useRef } from "react";
import { 
  dbRef, 
  dbOnValue, 
  dbSet, 
  dbUpdate, 
  dbPush, 
  dbGet 
} from "../firebase";
import { TRIVIA_QUESTIONS, Question } from "../data/questions";
import { DRAWING_WORDS, DrawingWord } from "../data/words";
import { sfx } from "../utils/audio";

// Neon styling themes
export const NEON_COLORS = [
  "#ff4757", // Hot Coral
  "#f5a623", // Neon Amber
  "#2ecc71", // Green Neon
  "#00d2d3", // Cyan Neon
  "#a55eea", // Purple Violet
  "#ff9ff3", // Pink Neon
  "#ff9f43", // Orange Glow
  "#f1c40f"  // Sunny Yellow
];

export interface Player {
  id: string;
  name: string;
  score: number;
  color: string;
  isHost: boolean;
  isActive?: boolean;
  lastBuzzSpeed?: number | null;
  bestBuzzSpeed?: number | null;
  triviaStreak?: number | null;
  drawingGuessedGuaranteed?: number | null;
  unlockedAchievements?: string[] | null;
  bubbleMsg?: string | null;
  bubbleTimestamp?: number | null;
  isSpeaking?: boolean | null;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  text: string;
  correct: boolean;
  timestamp: number;
}

export interface AchievementNotice {
  id: string;
  playerId: string;
  playerName: string;
  type: string;
  title: string;
  description: string;
  badge: string;
  color: string;
  timestamp: number;
}

export interface GameState {
  roomCode: string;
  players: Record<string, Player>;
  gameMode: "trivia" | "drawing";
  gameState: "lobby" | "playing" | "finished";
  currentRound: number;
  totalRounds: number;
  currentDrawer: string | null; // Drawing mode
  currentWord: string | null;   // Drawing mode secret word
  currentWordCategory: string | null; // Drawing word category
  currentQuestion: Question | null; // Trivia mode
  questionStartedAt?: number | null;
  triviaDeck: Question[] | null; // Pre-shuffled trivia deck
  buzzer: string | null; // Trivia mode holding player
  lockedOut: Record<string, boolean>; // Trivia mode wrong players locked out for current round
  timer: {
    startedAt: number;
    duration: number;
    isActive: boolean;
  } | null;
  canvasStrokes: any[] | null;
  lastEvent: {
    type: "buzz" | "correct" | "wrong" | "timer_end" | "new_round" | "game_start";
    playerId?: string;
    timestamp: number;
  } | null;
  achievementNotice?: AchievementNotice | null;
}

export function useRoom(roomCode: string | null, currentPlayerId: string | null) {
  const [room, setRoom] = useState<GameState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // References to track previous states for playing local audio SFX on change events
  const prevBuzzer = useRef<string | null>(null);
  const prevLastEvent = useRef<number>(0);

  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const roomRef = dbRef(`rooms/${roomCode}`);

    // Subscribe to database room updates
    const unsubscribe = dbOnValue(roomRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Structure the state nicely
        const players = data.players || {};
        const canvasStrokes = data.canvas?.strokes || [];
        const triviaDeck = data.triviaDeck || null;
        
        const structuredRoom: GameState = {
          roomCode,
          players,
          gameMode: data.gameMode || "trivia",
          gameState: data.gameState || "lobby",
          currentRound: data.currentRound || 1,
          totalRounds: data.totalRounds || 10,
          currentDrawer: data.currentDrawer || null,
          currentWord: data.currentWord || null,
          currentWordCategory: data.currentWordCategory || null,
          currentQuestion: data.currentQuestion || null,
          questionStartedAt: data.questionStartedAt || null,
          triviaDeck,
          buzzer: data.buzzer || null,
          lockedOut: data.lockedOut || {},
          timer: data.timer || null,
          canvasStrokes,
          lastEvent: data.lastEvent || null,
          achievementNotice: data.achievementNotice || null
        };

        setRoom(structuredRoom);

        // Reactive audio logic based on firebase database values
        if (data.lastEvent && data.lastEvent.timestamp > prevLastEvent.current) {
          prevLastEvent.current = data.lastEvent.timestamp;
          const eventType = data.lastEvent.type;
          
          if (eventType === "buzz") {
            sfx.playBuzz();
          } else if (eventType === "correct") {
            sfx.playSuccess();
          } else if (eventType === "wrong") {
            sfx.playBuzz();
          } else if (eventType === "game_start" || eventType === "new_round") {
            // Can play a neutral sound if desired
          }
        } else if (data.buzzer && data.buzzer !== prevBuzzer.current) {
          // Fallback buzzer audio check
          sfx.playBuzz();
        }
        prevBuzzer.current = data.buzzer || null;

      } else {
        setRoom(null);
        setError("找不到此房間，可能已被關閉。");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode]);

  // Utility to update room state
  const updateRoomData = async (updates: Record<string, any>) => {
    if (!roomCode) return;
    const roomRef = dbRef(`rooms/${roomCode}`);
    await dbUpdate(roomRef, updates);
  };

  // 1. Create Room (Host)
  const createRoom = async (playerName: string) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const playerId = currentPlayerId || "p_" + Math.random().toString(36).substring(2, 9);
    const randomColor = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      color: randomColor,
      isHost: true
    };

    const initialRoomData = {
      gameState: "lobby",
      gameMode: "trivia",
      currentRound: 1,
      totalRounds: 10,
      players: {
        [playerId]: newPlayer
      },
      lastEvent: {
        type: "game_start",
        timestamp: Date.now()
      }
    };

    const roomRef = dbRef(`rooms/${code}`);
    await dbSet(roomRef, initialRoomData);
    return { code, playerId };
  };

  // 2. Join Room (Guest)
  const joinRoom = async (code: string, playerName: string) => {
    const roomRef = dbRef(`rooms/${code}`);
    const snap = await dbGet(roomRef);

    if (!snap.exists()) {
      throw new Error("房間不存在，請檢查房號是否正確！");
    }

    const data = snap.val();
    if (data.gameState !== "lobby") {
      throw new Error("該遊戲已在進行中，無法中途加入！");
    }

    const playerId = currentPlayerId || "p_" + Math.random().toString(36).substring(2, 9);
    
    // Choose a color that isn't taken if possible, or pick randomly
    const takenColors = Object.values(data.players || {}).map((p: any) => p.color);
    const availableColors = NEON_COLORS.filter(c => !takenColors.includes(c));
    const finalColor = availableColors.length > 0 
      ? availableColors[Math.floor(Math.random() * availableColors.length)]
      : NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];

    const joiner: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      color: finalColor,
      isHost: false
    };

    const playerRef = dbRef(`rooms/${code}/players/${playerId}`);
    await dbSet(playerRef, joiner);
    return { code, playerId };
  };

  // 3. Update game attributes (Host only)
  const setGameMode = async (mode: "trivia" | "drawing") => {
    await updateRoomData({ gameMode: mode });
  };

  // 4. Start Game
  const startGame = async () => {
    if (!room || !roomCode) return;

    const updates: Record<string, any> = {
      gameState: "playing",
      currentRound: 1,
      lastEvent: {
        type: "game_start",
        timestamp: Date.now()
      }
    };

    // Reset speed & achievement status metrics on start for both modes
    Object.keys(room.players).forEach((pId) => {
      updates[`players/${pId}/lastBuzzSpeed`] = null;
      updates[`players/${pId}/bestBuzzSpeed`] = null;
      updates[`players/${pId}/triviaStreak`] = null;
      updates[`players/${pId}/drawingGuessedGuaranteed`] = null;
      updates[`players/${pId}/unlockedAchievements`] = null;
    });
    updates[`achievementNotice`] = null;

    const playerList = Object.values(room.players) as Player[];

    if (room.gameMode === "trivia") {
      // Shuffle & initialize questions
      const shuffled = [...TRIVIA_QUESTIONS]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10); // 10 rounds of trivia

      updates.totalRounds = shuffled.length;
      updates.triviaDeck = shuffled;
      updates.currentQuestion = shuffled[0];
      updates.questionStartedAt = Date.now();
      updates.buzzer = null;
      updates.lockedOut = {};
    } else {
      // Shuffled drawings word lists
      const wordsPool = [...DRAWING_WORDS].sort(() => Math.random() - 0.5);
      const chosenWord = wordsPool[0];

      // Assign the first player as painter
      const drawer = playerList[0];

      updates.totalRounds = Math.min(playerList.length * 2, 8); // e.g. 2 drawing turns each, max 8 rounds
      updates.currentDrawer = drawer.id;
      updates.currentWord = chosenWord.word;
      updates.currentWordCategory = chosenWord.category;
      updates.timer = {
        startedAt: Date.now(),
        duration: 60,
        isActive: true
      };
      updates.canvas = { strokes: [] };
      updates.chat = null;
      updates.guesses = null;
    }

    await updateRoomData(updates);
  };

  // 5. Buzz-In (Trivia)
  const buzzIn = async (playerId: string) => {
    if (!roomCode || !room || room.buzzer) return;
    
    // Prevent locked out players
    if (room.lockedOut && room.lockedOut[playerId]) return;

    // Set the buzzer under transactional reference pattern
    const buzzerRef = dbRef(`rooms/${roomCode}/buzzer`);
    const lastEventRef = dbRef(`rooms/${roomCode}/lastEvent`);

    // Record response time
    const startVal = room.questionStartedAt || Date.now();
    const elapsedMs = Math.max(50, Date.now() - startVal);
    const speedRef = dbRef(`rooms/${roomCode}/players/${playerId}/lastBuzzSpeed`);
    await dbSet(speedRef, elapsedMs);

    // Ensure we do it together
    await dbSet(buzzerRef, playerId);
    await dbSet(lastEventRef, {
      type: "buzz",
      playerId,
      timestamp: Date.now()
    });
  };

  // 6. Host Grade Trivia Score (Trivia)
  const gradeBuzzedAnswer = async (isCorrect: boolean) => {
    if (!room || !roomCode || !room.buzzer) return;

    const buzzedPlayerId = room.buzzer;
    const updates: Record<string, any> = {};

    if (isCorrect) {
      // Buzzed player wins point!
      const currentScore = room.players[buzzedPlayerId]?.score || 0;
      updates[`players/${buzzedPlayerId}/score`] = currentScore + 1;
      updates[`lastEvent`] = {
        type: "correct",
        playerId: buzzedPlayerId,
        timestamp: Date.now()
      };

      // Trivia streak calculation
      const currentStreak = (room.players[buzzedPlayerId]?.triviaStreak || 0) + 1;
      updates[`players/${buzzedPlayerId}/triviaStreak`] = currentStreak;

      const currentUnlocked = room.players[buzzedPlayerId]?.unlockedAchievements || [];
      const updatedUnlocked = [...currentUnlocked];

      if (currentStreak === 5 && !updatedUnlocked.includes("trivia_streak_5")) {
        updatedUnlocked.push("trivia_streak_5");
        updates[`players/${buzzedPlayerId}/unlockedAchievements`] = updatedUnlocked;
        updates[`achievementNotice`] = {
          id: "ach_streak_" + Date.now() + "_" + buzzedPlayerId,
          playerId: buzzedPlayerId,
          playerName: room.players[buzzedPlayerId]?.name || "玩家",
          type: "trivia_streak_5",
          title: "🧠 答題超人",
          description: "連續答對 5 題！智慧與速度的化身！",
          badge: "🎖️",
          color: room.players[buzzedPlayerId]?.color || "#f5a623",
          timestamp: Date.now()
        };
      }

      // Set best Buzz speed on successful answers
      const activeSpeed = room.players[buzzedPlayerId]?.lastBuzzSpeed || null;
      if (activeSpeed) {
        const oldBest = room.players[buzzedPlayerId]?.bestBuzzSpeed || 999999;
        if (activeSpeed < oldBest) {
          updates[`players/${buzzedPlayerId}/bestBuzzSpeed`] = activeSpeed;
        }

        // Lightning buzzer achievement trigger
        if (activeSpeed < 1200 && !updatedUnlocked.includes("lightning_buzzer")) {
          updatedUnlocked.push("lightning_buzzer");
          updates[`players/${buzzedPlayerId}/unlockedAchievements`] = updatedUnlocked;
          if (!updates[`achievementNotice`]) {
            updates[`achievementNotice`] = {
              id: "ach_speed_" + Date.now() + "_" + buzzedPlayerId,
              playerId: buzzedPlayerId,
              playerName: room.players[buzzedPlayerId]?.name || "玩家",
              type: "lightning_buzzer",
              title: "⚡ 閃電神速",
              description: "在 1.2 秒內超速搶答並答對！",
              badge: "⚡",
              color: room.players[buzzedPlayerId]?.color || "#ff4757",
              timestamp: Date.now()
            };
          }
        }
      }

      // Unlock buzzer and auto trigger reveal step or hold for next round click
      updates[`buzzer`] = null;
      updates[`lockedOut`] = {}; // reset lockout list for next round
      
      // Move to next question or end game if last card
      if (room.currentRound >= room.totalRounds) {
        updates[`gameState`] = "finished";
      } else {
        const nextIdx = room.currentRound; // index of next
        if (room.triviaDeck && room.triviaDeck[nextIdx]) {
          updates[`currentRound`] = room.currentRound + 1;
          updates[`currentQuestion`] = room.triviaDeck[nextIdx];
          updates[`questionStartedAt`] = Date.now();
          // Clear current speed for next round
          Object.keys(room.players).forEach((pId) => {
            updates[`players/${pId}/lastBuzzSpeed`] = null;
          });
        } else {
          updates[`gameState`] = "finished";
        }
      }
    } else {
      // Mark wrong, lockout this player & reset streak
      updates[`lockedOut/${buzzedPlayerId}`] = true;
      updates[`players/${buzzedPlayerId}/triviaStreak`] = 0;
      updates[`buzzer`] = null; // free up buzzer for others
      updates[`lastEvent`] = {
        type: "wrong",
        playerId: buzzedPlayerId,
        timestamp: Date.now()
      };
    }

    await updateRoomData(updates);
  };

  // Skip / Skip Trivia
  const skipTriviaQuestion = async () => {
    if (!room || !roomCode) return;

    const updates: Record<string, any> = {
      buzzer: null,
      lockedOut: {},
      lastEvent: {
        type: "new_round",
        timestamp: Date.now()
      }
    };

    if (room.currentRound >= room.totalRounds) {
      updates.gameState = "finished";
    } else {
      const nextIdx = room.currentRound;
      if (room.triviaDeck && room.triviaDeck[nextIdx]) {
        updates.currentRound = room.currentRound + 1;
        updates.currentQuestion = room.triviaDeck[nextIdx];
        updates.questionStartedAt = Date.now();
        // Clear speed of all players
        Object.keys(room.players).forEach((pId) => {
          updates[`players/${pId}/lastBuzzSpeed`] = null;
        });
      } else {
        updates.gameState = "finished";
      }
    }
    await updateRoomData(updates);
  };

  // 7. Drawing Guess Attempt (Drawing mode)
  const submitGuess = async (playerId: string, guessText: string) => {
    if (!room || !roomCode) return;

    const cleanedGuess = guessText.trim();
    if (!cleanedGuess) return;

    const isCorrect = 
      room.currentWord && 
      cleanedGuess === room.currentWord;

    const player = room.players[playerId];
    const msgId = "msg_" + Math.random().toString(36).substring(2, 9);

    // Write to chat/guess channel
    const chatRef = dbRef(`rooms/${roomCode}/chat/${msgId}`);
    const msgData = {
      id: msgId,
      playerId,
      playerName: player.name,
      playerColor: player.color,
      text: cleanedGuess,
      correct: isCorrect,
      timestamp: Date.now()
    };

    await dbSet(chatRef, msgData);

    // If correct and not the drawer, award points and cycle drawing round immediately!
    if (isCorrect && playerId !== room.currentDrawer) {
      const updates: Record<string, any> = {};

      // Point for guesser
      const gScore = room.players[playerId]?.score || 0;
      updates[`players/${playerId}/score`] = gScore + 1;

      // Point for drawer too!
      if (room.currentDrawer) {
        const dScore = room.players[room.currentDrawer]?.score || 0;
        updates[`players/${room.currentDrawer}/score`] = dScore + 1;

        // Increment successfully guessed drawings counter for the drawer
        const dGuessedCount = (room.players[room.currentDrawer]?.drawingGuessedGuaranteed || 0) + 1;
        updates[`players/${room.currentDrawer}/drawingGuessedGuaranteed`] = dGuessedCount;

        // Unlocked achievements check for Drawer
        const unlocked = room.players[room.currentDrawer]?.unlockedAchievements || [];
        if (!unlocked.includes("master_drawer")) {
          updates[`players/${room.currentDrawer}/unlockedAchievements`] = [...unlocked, "master_drawer"];
          updates[`achievementNotice`] = {
            id: "ach_draw_" + Date.now() + "_" + room.currentDrawer,
            playerId: room.currentDrawer,
            playerName: room.players[room.currentDrawer]?.name || "畫家",
            type: "master_drawer",
            title: "🎨 靈魂畫手",
            description: "畫作成功被其他玩家秒懂答對！神筆現世！",
            badge: "🏆",
            color: room.players[room.currentDrawer]?.color || "#a55eea",
            timestamp: Date.now()
          };
        }
      }

      updates[`lastEvent`] = {
        type: "correct",
        playerId,
        timestamp: Date.now()
      };

      // Proceed to next round or end game
      await awardPointsAndProceed(updates);
    }
  };

  // Move drawing game round or end game
  const awardPointsAndProceed = async (roundOverUpdates: Record<string, any>) => {
    if (!room || !roomCode) return;

    const playerList = Object.values(room.players) as Player[];
    const nextRound = room.currentRound + 1;

    if (nextRound > room.totalRounds || playerList.length < 2) {
      // Finish
      roundOverUpdates[`gameState`] = "finished";
    } else {
      // Find next drawer in sequence
      const currentDrawerIdx = playerList.findIndex(p => p.id === room.currentDrawer);
      const nextDrawerIdx = (currentDrawerIdx + 1) % playerList.length;
      const nextDrawer = playerList[nextDrawerIdx];

      // Grab new word
      const wordsPool = [...DRAWING_WORDS].sort(() => Math.random() - 0.5);
      const chosenWord = wordsPool[0];

      roundOverUpdates[`currentRound`] = nextRound;
      roundOverUpdates[`currentDrawer`] = nextDrawer.id;
      roundOverUpdates[`currentWord`] = chosenWord.word;
      roundOverUpdates[`currentWordCategory`] = chosenWord.category;
      roundOverUpdates[`canvas/strokes`] = []; // Clear canvas strokes
      roundOverUpdates[`chat`] = null; // Clear logs for new round
      roundOverUpdates[`timer`] = {
        startedAt: Date.now(),
        duration: 60,
        isActive: true
      };
    }

    await updateRoomData(roundOverUpdates);
  };

  // Drawing Time's up handling
  const handleDrawingTimeUp = async () => {
    if (!room || !roomCode || room.gameState !== "playing" || room.gameMode !== "drawing") return;

    // No one guessed correct in time.
    const updates: Record<string, any> = {
      lastEvent: {
        type: "timer_end",
        timestamp: Date.now()
      }
    };

    // System announce answer in Chat first
    const msgId = "sys_" + Math.random().toString(36).substring(2, 9);
    const chatRef = dbRef(`rooms/${roomCode}/chat/${msgId}`);
    await dbSet(chatRef, {
      id: msgId,
      playerId: "system",
      playerName: "🎮 系統宣告",
      playerColor: "#ff4757",
      text: `時間到！沒有人猜對。正確答案是：「${room.currentWord}」！`,
      correct: false,
      timestamp: Date.now()
    });

    await awardPointsAndProceed(updates);
  };

  // Synced drawing strokes updating
  const updateCanvasStrokes = async (strokes: any[]) => {
    if (!roomCode) return;
    const strokesRef = dbRef(`rooms/${roomCode}/canvas/strokes`);
    await dbSet(strokesRef, strokes);
  };

  // 8. Play Again / Restart Game (Resets room to lobby keeping players)
  const restartRoom = async () => {
    if (!room || !roomCode) return;

    // Reset score of all connected players to 0
    const playersReset: Record<string, Player> = {};
    (Object.values(room.players) as Player[]).forEach((p) => {
      playersReset[p.id] = {
        ...p,
        score: 0
      };
    });

    const resetData = {
      gameState: "lobby",
      currentRound: 1,
      players: playersReset,
      buzzer: null,
      lockedOut: null,
      currentDrawer: null,
      currentWord: null,
      currentQuestion: null,
      triviaDeck: null,
      timer: null,
      canvas: null,
      chat: null,
      guesses: null,
      lastEvent: {
        type: "game_start",
        timestamp: Date.now()
      }
    };

    const roomRef = dbRef(`rooms/${roomCode}`);
    await dbSet(roomRef, resetData);
  };

  // 9. Back to Home / Leave Room
  const leaveRoom = async () => {
    if (!room || !roomCode || !currentPlayerId) return;

    // If player leaving is host, shut down room, or pass host duties!
    const playerList = Object.values(room.players) as Player[];
    if (playerList.length <= 1) {
      // Last player left, shut down room
      const roomRef = dbRef(`rooms/${roomCode}`);
      await dbSet(roomRef, null);
    } else {
      // Remove player
      const playerRef = dbRef(`rooms/${roomCode}/players/${currentPlayerId}`);
      await dbSet(playerRef, null);

      if (room.players[currentPlayerId]?.isHost) {
        // Pass host to next player
        const remainingPlayers = playerList.filter(p => p.id !== currentPlayerId);
        if (remainingPlayers.length > 0) {
          const nextHost = remainingPlayers[0];
          const newHostRef = dbRef(`rooms/${roomCode}/players/${nextHost.id}/isHost`);
          await dbSet(newHostRef, true);
        }
      }
    }
  };

  return {
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
  };
}
