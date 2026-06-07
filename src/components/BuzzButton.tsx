import { motion } from "motion/react";
import { useRef } from "react";

interface BuzzButtonProps {
  onBuzz: () => void;
  isBuzzed: boolean; // Is buzzer currently claimed by anyone?
  buzzerName: string | null; // Who claimed the buzzer?
  isCurrentUserBuzzer: boolean; // Are we the holder of the buzzer?
  isLockedOut: boolean; // Are we locked out of this question (answered wrong)?
  onClickAudio?: () => void;
}

export function BuzzButton({
  onBuzz,
  isBuzzed,
  buzzerName,
  isCurrentUserBuzzer,
  isLockedOut,
  onClickAudio
 }: BuzzButtonProps) {
  
  const lastPressTime = useRef<number>(0);

  const handlePress = () => {
    if (isLockedOut || isBuzzed) return;
    
    const now = Date.now();
    // Debounce clicks within 600ms to safeguard against multi-tap spamming race conditions
    if (now - lastPressTime.current < 600) {
      return;
    }
    lastPressTime.current = now;

    // Physical haptic vibration response for mobile gameplay hand-feel
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(80);
    }

    if (onClickAudio) onClickAudio();
    onBuzz();
  };

  if (isLockedOut) {
    return (
      <div className="w-full flex justify-center py-4">
        <div className="w-44 h-44 rounded-full bg-slate-900 border-8 border-slate-850 flex flex-col items-center justify-center text-center p-3 text-slate-500 shadow-inner">
          <span className="text-2xl mb-1">✗</span>
          <span className="text-xs font-bold leading-tight uppercase tracking-wider font-sans">
            此題答錯<br />鎖定中
          </span>
        </div>
      </div>
    );
  }

  if (isBuzzed) {
    if (isCurrentUserBuzzer) {
      return (
        <div className="w-full flex flex-col items-center justify-center py-4">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-44 h-44 rounded-full bg-green-500 border-8 border-white flex flex-col items-center justify-center text-black text-center p-3 font-black shadow-[0_0_35px_rgba(34,197,94,0.6)] cursor-default"
          >
            <span className="text-2xl">⚡</span>
            <span className="text-base font-heading uppercase tracking-widest mt-1">
              您搶到了！
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">
              請回答
            </span>
          </motion.div>
        </div>
      );
    } else {
      return (
        <div className="w-full flex flex-col items-center justify-center py-4">
          <div className="w-44 h-44 rounded-full bg-[#1c1c3a] border-8 border-gray-700 flex flex-col items-center justify-center text-gray-400 text-center p-3 cursor-not-allowed">
            <span className="text-xl mb-1">💤</span>
            <span className="text-xs font-bold leading-tight max-w-[120px] truncate" style={{ color: "orange" }}>
              {buzzerName}
            </span>
            <span className="text-[10px] text-gray-550 leading-none">
              搶答中...
            </span>
          </div>
        </div>
      );
    }
  }

  // Active / Ready to Buzz: THE MAGICAL ARTISTIC FLAIR RED BUTTON
  return (
    <div className="w-full flex flex-col items-center justify-center py-4 select-none">
      <button
        id="buzz_game_button"
        type="button"
        onClick={handlePress}
        className="group relative focus:outline-none"
      >
        {/* Glow behind */}
        <div className="absolute inset-0 bg-[#ff4757] rounded-full blur-xl opacity-50 group-hover:opacity-85 transition-opacity duration-300"></div>
        
        {/* 3D Button element */}
        <div className="relative w-44 h-44 bg-[#ff4757] rounded-full border-8 border-white flex flex-col items-center justify-center text-white font-black text-2xl tracking-widest shadow-[0_10px_0_#9d1c27] group-active:translate-y-2 group-active:shadow-none transition-all cursor-pointer">
          <span className="text-sm uppercase tracking-widest text-[#fff]/80 font-bold mb-1">HIT ME</span>
          <span className="text-3xl font-black drop-shadow-[2px_2px_0_#000000]">搶答！</span>
          <span className="absolute bottom-4 text-[9px] text-[#ffdfdf] tracking-widest animate-pulse">PRESS BUZZER</span>
        </div>
      </button>
      <p className="text-gray-400 text-xs mt-5 animate-pulse flex items-center gap-1.5 font-bold uppercase tracking-widest font-mono">
        <span className="w-2 h-2 rounded-full bg-[#ff4757] animate-ping" />
        等待搶答中...
      </p>
    </div>
  );
}

