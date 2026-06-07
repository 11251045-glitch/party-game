import { useState, useEffect, useRef } from "react";
import { sfx } from "../utils/audio";

interface TimerData {
  startedAt: number;
  duration: number;
  isActive: boolean;
}

export function useTimer(
  timerData: TimerData | null,
  isAuthoritative: boolean, // true if the current player is responsible for calling timeout (e.g. Host/Painter)
  onTimeUp?: () => void
) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const onTimeUpRef = useRef<(() => void) | undefined>(onTimeUp);

  // Keep callback reference updated avoiding effect re-runs
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (!timerData || !timerData.isActive) {
      setSecondsLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const elapsedMs = now - timerData.startedAt;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const left = Math.max(0, timerData.duration - elapsedSec);
      return left;
    };

    // Set initial time
    const initialLeft = calculateTimeLeft();
    setSecondsLeft(initialLeft);

    // If time is already up, trigger callback
    if (initialLeft <= 0) {
      if (isAuthoritative && onTimeUpRef.current) {
        onTimeUpRef.current();
      }
      return;
    }

    let lastTickValue = initialLeft;

    const interval = setInterval(() => {
      const left = calculateTimeLeft();
      setSecondsLeft(left);

      // Play retro Web Audio ticks for the final hot 10 seconds of guessing!
      if (left <= 10 && left > 0 && left !== lastTickValue) {
        sfx.playTick();
        lastTickValue = left;
      }

      if (left <= 0) {
        clearInterval(interval);
        if (isAuthoritative && onTimeUpRef.current) {
          onTimeUpRef.current();
        }
      }
    }, 500); // Poll faster than 1s to feel incredibly responsive

    return () => {
      clearInterval(interval);
    };
  }, [timerData, isAuthoritative]);

  return secondsLeft;
}
