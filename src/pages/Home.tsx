import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Sparkles, Gamepad2, ArrowRight, User } from "lucide-react";
import { sfx } from "../utils/audio";

interface HomeProps {
  onRoomCreated: (code: string, playerId: string, name: string) => void;
  onRoomJoined: (code: string, playerId: string, name: string) => void;
  savedName: string;
  setSavedName: (name: string) => void;
  onCreateRoom: (name: string) => Promise<{ code: string; playerId: string }>;
  onJoinRoom: (code: string, name: string) => Promise<{ code: string; playerId: string }>;
}

export function Home({
  onRoomCreated,
  onRoomJoined,
  savedName,
  setSavedName,
  onCreateRoom,
  onJoinRoom
}: HomeProps) {
  const [name, setName] = useState<string>(savedName);
  const [code, setCode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("room") || params.get("roomCode") || "";
    }
    return "";
  });
  const [isJoining, setIsJoining] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("room") || params.get("roomCode");
      return !!r;
    }
    return false;
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Bokeh night-market drift floating particles effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Deep neon amber, pink, and cyan colors representing Taiwanese night-market stands
    const colors = ["rgba(245, 166, 35, 0.15)", "rgba(255, 71, 87, 0.12)", "rgba(0, 210, 211, 0.1)"];
    
    interface Particle {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
    }

    const particles: Particle[] = Array.from({ length: 25 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 40 + 20,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.8 - 0.2, // slow drifting upwards
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.fillStyle = "#0f0f1a";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 30;
        ctx.shadowColor = p.color;
        ctx.fill();

        // Update coordinates
        p.x += p.vx;
        p.y += p.vy;

        // Bouncing/wrapping bounds
        if (p.x < -p.radius) p.x = width + p.radius;
        if (p.x > width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) {
          p.y = height + p.radius;
          p.x = Math.random() * width;
        }
      });

      // Clear shadows for performance
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setBannerError("別忘記輸入您的勇者大名喔！👋");
      return;
    }
    setSubmitting(true);
    setBannerError(null);
    try {
      sfx.playSuccess();
      setSavedName(trimmed);
      const res = await onCreateRoom(trimmed);
      onRoomCreated(res.code, res.playerId, trimmed);
    } catch (e: any) {
      setBannerError(e.message || "建立房間失敗。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setBannerError("先給自己取個好聽的名字吧！✍️");
      return;
    }
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setBannerError("請輸入房主提供的 4 位數字房號！🔑");
      return;
    }

    setSubmitting(true);
    setBannerError(null);
    try {
      sfx.playSuccess();
      setSavedName(trimmedName);
      const res = await onJoinRoom(trimmedCode, trimmedName);
      onRoomJoined(res.code, res.playerId, trimmedName);
    } catch (e: any) {
      setBannerError(e.message || "加入房間失敗，請確認房號！");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center p-4">
      {/* Dynamic Drifting Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -z-10" />

      {/* Retro night-market frame */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,166,35,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Main card box panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-900/90 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-md relative"
      >
        {/* Title arcade cabinet marquee */}
        <div className="text-center mb-8 relative flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-[#ff4757] text-white px-3 py-1 rounded-sm font-black text-xs md:text-sm italic tracking-tighter shadow-[3px_3px_0_#000] select-none uppercase">
              LIVE ARCADE
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
          </div>
          
          <motion.div
            animate={{ rotate: [-1.5, 1.5, -1.5] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="inline-block mt-1"
          >
            <h1 className="text-4xl md:text-5xl font-heading text-[#f5a623] drop-shadow-[3px_3px_0_#ff4757] tracking-widest flex items-center justify-center gap-1">
              <span>派對之夜</span>
              <span className="text-3xl animate-bounce">🎉</span>
            </h1>
          </motion.div>
          <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase mt-1">
            ★ RETRO NIGHT-MARKET ENERGY ★
          </p>
        </div>

        {/* Inputs parameters */}
        <div className="space-y-5">
          {/* USERNAME INPUT TILE */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4 text-[#ff4757]" />
              玩家暱稱：
            </label>
            <div className="relative">
              <input
                id="player_name_home_input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setBannerError(null);
                }}
                maxLength={10}
                placeholder="輸入大名 (例如：饒河街彭于晏)"
                disabled={submitting}
                className="w-full min-h-[50px] px-4 bg-slate-950/80 border-2 border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-[#f5a623] transition-all font-semibold placeholder-gray-500 text-sm"
              />
              <Sparkles className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-[#f5a623]/60 animate-pulse pointer-events-none" />
            </div>
          </div>

          {/* DYNAMIC TOGGLE FOR CREATE vs JOIN */}
          {bannerError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-300 font-semibold"
            >
              ⚠️ {bannerError}
            </motion.div>
          )}

          {!isJoining ? (
            // BUTTON CHOICE SCENE
            <div className="flex flex-col gap-3.5 pt-2">
              <button
                id="create_room_selection_btn"
                type="button"
                disabled={submitting}
                onClick={handleCreate}
                className="w-full min-h-[56px] bg-[#ff4757] text-white rounded-2xl border-b-4 border-red-800 hover:brightness-110 font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,71,87,0.3)] transition-all cursor-pointer text-lg"
              >
                <Gamepad2 className="w-5 h-5" />
                建立新房間
              </button>

              <button
                id="join_room_selection_mode_btn"
                type="button"
                disabled={submitting}
                onClick={() => setIsJoining(true)}
                className="w-full min-h-[56px] bg-slate-800 text-white rounded-2xl border-b-4 border-slate-950 hover:bg-slate-755 hover:border-slate-800 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer font-heading tracking-wide text-lg"
              >
                加入現有房間
              </button>
            </div>
          ) : (
            // JOIN ROOM INTERSECTION PIN
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-1"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-300">
                  輸入 4 位房號：
                </label>
                <input
                  id="room_code_input"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").substring(0, 4));
                    setBannerError(null);
                  }}
                  maxLength={4}
                  placeholder="例如：8472"
                  disabled={submitting}
                  className="w-full min-h-[50px] text-center tracking-[10px] text-2xl font-bold bg-slate-950 text-amber-400 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-[#f5a623] transition-all font-mono"
                />
              </div>

              <div className="flex gap-3">
                <button
                  id="cancel_join_btn"
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsJoining(false);
                    setBannerError(null);
                  }}
                  className="flex-1 min-h-[48px] bg-slate-800 text-gray-300 rounded-xl font-semibold border border-slate-700 hover:bg-slate-700 cursor-pointer text-sm"
                >
                  返回
                </button>
                <button
                  id="submit_join_btn"
                  type="button"
                  disabled={submitting}
                  onClick={handleJoin}
                  className="flex-1 min-h-[48px] bg-[#f5a623] text-black font-bold rounded-xl flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(245,166,35,0.3)] hover:brightness-105 cursor-pointer text-sm"
                >
                  確認加入
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Small aesthetic note */}
        <div className="mt-8 text-center text-[10px] text-slate-500 font-mono">
          © 2026 PARTY NIGHT APPS LLC • VERIFIED LOCAL SYNC
        </div>
      </motion.div>
    </div>
  );
}
