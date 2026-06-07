import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { useTimer } from "../hooks/useTimer";

interface TimerProps {
  timerData: {
    startedAt: number;
    duration: number;
    isActive: boolean;
  } | null;
  isHostOrDrawer: boolean;
  onTimeUp?: () => void;
}

export function Timer({ timerData, isHostOrDrawer, onTimeUp }: TimerProps) {
  const secondsLeft = useTimer(timerData, isHostOrDrawer, onTimeUp);

  if (!timerData || !timerData.isActive) return null;

  const isLowTime = secondsLeft <= 10;
  
  // Progress bar ratio
  const ratio = Math.min(1, secondsLeft / timerData.duration);
  const colorClass = isLowTime 
    ? "text-[#ff4757] border-[#ff4757] shadow-[0_0_15px_rgba(255,71,87,0.4)] bg-[#ff4757]/10" 
    : "text-[#f5a623] border-[#f5a623] shadow-[0_0_10px_rgba(245,166,35,0.2)] bg-slate-900/80";

  return (
    <div className="w-full flex flex-col items-center gap-1">
      {/* Clock badge */}
      <motion.div
        animate={isLowTime && secondsLeft > 0 ? {
          scale: [1, 1.1, 1],
          rotate: [0, -3, 3, 0]
        } : {}}
        transition={{ repeat: Infinity, duration: 1 }}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 font-mono font-black text-lg md:text-xl transition-all ${colorClass}`}
      >
        <Clock className={`w-5 h-5 ${isLowTime ? "animate-bounce" : ""}`} />
        <span>00:{secondsLeft.toString().padStart(2, "0")}</span>
      </motion.div>

      {/* Retro progress beam bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
        <motion.div
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${isLowTime ? "bg-[#ff4757]" : "bg-[#f5a623]"}`}
        />
      </div>
    </div>
  );
}
