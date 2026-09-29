import React, { useEffect, useState } from 'react';
import { useSimStore } from '../state/simStore';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

export function CriticalToastAlert() {
  const [activeToast, setActiveToast] = useState<{ id: string; locationKm: number; title: string } | null>(null);

  const getActiveDefects = useSimStore((s) => s.getActiveDefects);
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const trackLength = useSimStore((s) => s.trackLength);

  const currentDistM = vehicleProgress * trackLength;
  const activeDefects = getActiveDefects();

  // Check if vehicle is passing directly over a critical defect
  useEffect(() => {
    const criticalPassing = activeDefects.find(
      (d) => d.severity === 'critical' && Math.abs(d.distance - currentDistM) < 4.0
    );

    if (criticalPassing) {
      setActiveToast({
        id: criticalPassing.id,
        locationKm: criticalPassing.locationKm,
        title: criticalPassing.title,
      });

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentDistM, activeDefects]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-top duration-300 select-none">
      <div className="p-4 rounded-2xl bg-rose-950/95 backdrop-blur-xl border-2 border-rose-500/80 text-rose-100 shadow-2xl shadow-rose-950/80 flex items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-900 border border-rose-400 text-rose-200 animate-bounce">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-rose-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              CRITICAL RAIL ANOMALY DETECTED
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              Location: KM {activeToast.locationKm.toFixed(3)} &bull; Risk: CRITICAL
            </div>
            <div className="text-xs text-rose-200/90 font-sans mt-0.5">
              Action: Immediate speed restriction & track inspection recommended.
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="p-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
