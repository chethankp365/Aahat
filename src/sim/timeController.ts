import { useEffect, useRef } from 'react';
import { useSimStore } from '../state/simStore';

/**
 * Time Controller Hook that drives the simulation loop clock outside of WebGL frame when canvas is hidden or alongside it
 */
export function useTimeController() {
  const updateTick = useSimStore((s) => s.updateTick);
  const isPlaying = useSimStore((s) => s.isPlaying);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const tick = (now: number) => {
      const deltaSeconds = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Cap deltaSeconds to prevent massive jumps when switching tabs (max 0.1s)
      const cappedDelta = Math.min(deltaSeconds, 0.1);

      if (isPlaying) {
        updateTick(cappedDelta);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, updateTick]);
}
