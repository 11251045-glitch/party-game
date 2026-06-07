import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Sparkles, Zap, Trophy, Star } from "lucide-react";
import { AchievementNotice } from "../hooks/useRoom";

interface AchievementOverlayProps {
  notice: AchievementNotice | null;
}

export function AchievementOverlay({ notice }: AchievementOverlayProps) {
  const [visitedNoticeIds, setVisitedNoticeIds] = useState<Set<string>>(new Set());
  const [activeNotice, setActiveNotice] = useState<AchievementNotice | null>(null);

  useEffect(() => {
    if (!notice) return;
    
    // Check if we already showed this achievement popup alert in this session
    if (!visitedNoticeIds.has(notice.id)) {
      const now = Date.now();
      // Ensure the achievement notice is fresh (created in the last 15 seconds)
      if (now - notice.timestamp < 15000) {
        setVisitedNoticeIds((prev) => {
          const updated = new Set(prev);
          updated.add(notice.id);
          return updated;
        });

        // Trigger mobile haptic feedback - long dual pulsing celebration vibration!
        if (typeof window !== "undefined" && navigator.vibrate) {
          navigator.vibrate([100, 50, 150]);
        }

        setActiveNotice(notice);

        // Keep the modal active for 5.5 seconds then fade it out beautifully
        const timer = setTimeout(() => {
          setActiveNotice(null);
        }, 5500);

        return () => clearTimeout(timer);
      }
    }
  }, [notice, visitedNoticeIds]);

  const handleClose = () => {
    setActiveNotice(null);
  };

  return (
    <AnimatePresence>
      {activeNotice && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm pointer-events-auto">
          {/* Explosion Particle Ring Background for Celebration */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            {[...Array(12)].map((_, i) => {
              const angle = (i * 360) / 12;
              const rad = (angle * Math.PI) / 180;
              const targetX = Math.cos(rad) * 200;
              const targetY = Math.sin(rad) * 200;

              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: targetX,
                    y: targetY,
                    scale: [1, 2, 0],
                    opacity: [1, 0.8, 0]
                  }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeNotice.color, boxShadow: `0 0 12px ${activeNotice.color}` }}
                />
              );
            })}
          </div>

          <motion.div
            initial={{ scale: 0.7, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-4 rounded-3xl p-6 text-center relative overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)]"
            style={{ borderColor: activeNotice.color }}
          >
            {/* Top golden accent sparkle lights */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Spinning/pulsing Star Badge Frame */}
              <div className="relative mb-5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 rounded-full border border-dashed border-white/20"
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl relative z-10 shadow-2xl bg-black/60 border-2"
                  style={{ borderColor: activeNotice.color }}
                >
                  {activeNotice.badge}
                </motion.div>
                
                <div className="absolute -top-2 -right-2 text-[#f5a623] animate-bounce">
                  <Sparkles className="w-6 h-6 fill-current" />
                </div>
              </div>

              {/* Achievement Header */}
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 select-none">
                <Award className="w-3.5 h-3.5" style={{ color: activeNotice.color }} />
                <span>恭喜解鎖全新成就！</span>
              </div>

              {/* Title & Description with glowing theme color */}
              <h2 className="text-2xl font-black mb-2 tracking-wide block leading-tight text-white select-none">
                {activeNotice.title}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-[280px] bg-black/30 p-3 rounded-xl border border-white/5 select-none">
                {activeNotice.description}
              </p>

              {/* Congratulate owner name marker */}
              <div className="mt-5 text-sm font-bold flex items-center justify-center gap-2 select-none">
                <span className="text-slate-400">解鎖者：</span>
                <span className="px-3 py-1 rounded-full text-xs font-black text-white bg-black/40 border border-slate-800" style={{ borderLeftColor: activeNotice.color, borderLeftWidth: "4px" }}>
                  {activeNotice.playerName}
                </span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-black bg-white hover:bg-slate-200 transition-all shadow-md select-none cursor-pointer"
              >
                收下荣誉
              </button>
            </div>

            {/* Ambient subtle decorative icons in card background */}
            <div className="absolute -bottom-8 -left-8 text-white/5 rotate-12 pointer-events-none select-none">
              <Trophy className="w-24 h-24" />
            </div>
            <div className="absolute -bottom-8 -right-8 text-white/5 -rotate-12 pointer-events-none select-none">
              <Star className="w-24 h-24" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
