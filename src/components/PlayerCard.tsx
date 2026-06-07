import { motion, AnimatePresence } from "motion/react";
import { Crown, Sparkles } from "lucide-react";

interface PlayerCardProps {
  name: string;
  score: number;
  color: string;
  isHost: boolean;
  isCurrentPlayer: boolean;
  isLeader: boolean;
  isDrawer?: boolean; // If painter in Drawing Mode
}

export function PlayerCard({
  name,
  score,
  color,
  isHost,
  isCurrentPlayer,
  isLeader,
  isDrawer = false
}: PlayerCardProps) {
  
  return (
    <motion.div
      id={`player_card_${name}`}
      layout
      className={`relative p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
        isCurrentPlayer
          ? "bg-slate-900 border-amber-500/70 shadow-[0_0_12px_rgba(245,166,35,0.15)]"
          : isDrawer
          ? "bg-[#ff4757]/10 border-[#ff4757]/60"
          : "bg-slate-900/60 border-slate-700/80"
      }`}
    >
      {/* Crown indicator if leader list */}
      {isLeader && score > 0 && (
        <div className="absolute -top-3 -left-2 rotate-[-20deg] z-10 text-yellow-400 filter drop-shadow-[0_2px_5px_rgba(234,179,8,0.4)]">
          <Crown className="w-5 h-5 fill-yellow-400" />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Avatar bulb element with neon matching halos */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-black text-black text-lg relative"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`
          }}
        >
          {name.charAt(0).toUpperCase()}
          {isDrawer && (
            <span className="absolute -bottom-1 -right-1 text-xs bg-slate-950 px-1 rounded-md border border-slate-700">🎨</span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-semibold truncate max-w-[100px] ${isCurrentPlayer ? "text-amber-300 font-bold" : "text-white"}`}>
              {name}
            </span>
            {isCurrentPlayer && (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30">您</span>
            )}
            {isHost && (
              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 rounded border border-rose-500/30 font-medium">房主</span>
            )}
          </div>
          {isDrawer && (
            <span className="text-[10px] text-[#ff4757] font-semibold animate-pulse">正在畫畫...</span>
          )}
        </div>
      </div>

      {/* Point scores element with Framer Motion spring jump popups */}
      <div className="flex items-center font-mono font-bold text-lg text-white">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score}
            initial={{ scale: 1.4, color: "#f5a623" }}
            animate={{ scale: 1, color: "#ffffff" }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="text-right"
          >
            {score}
          </motion.span>
        </AnimatePresence>
        <span className="text-xs text-gray-400 ml-1">分</span>
      </div>
    </motion.div>
  );
}
