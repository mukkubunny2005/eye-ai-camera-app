import React from 'react';
import { SafetyState } from '../types';

interface GazeCursorOverlayProps {
  cursorX: number; // Screen px
  cursorY: number; // Screen px
  dwellProgress: number; // 0 to 1
  safetyState: SafetyState;
  isPaused: boolean;
  isInTopScrollZone: boolean;
  isInBottomScrollZone: boolean;
  actionFlash: boolean;
}

export const GazeCursorOverlay: React.FC<GazeCursorOverlayProps> = ({
  cursorX,
  cursorY,
  dwellProgress,
  safetyState,
  isPaused,
  isInTopScrollZone,
  isInBottomScrollZone,
  actionFlash,
}) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - dwellProgress * circumference;

  const stateColors: Record<SafetyState, { ring: string; dot: string; label: string }> = {
    IDLE: { ring: '#94A3B8', dot: '#64748B', label: 'Idle' },
    TRACKING: { ring: '#38BDF8', dot: '#0284C7', label: 'Tracking' },
    GAZE_STABLE: { ring: '#38BDF8', dot: '#22D3EE', label: 'Stable' },
    ACTION_CANDIDATE: { ring: '#FBBF24', dot: '#D97706', label: 'Candidate' },
    CONFIRMATION: { ring: '#22C55E', dot: '#16A34A', label: 'Confirming' },
    ACTION: { ring: '#FFFFFF', dot: '#38BDF8', label: 'Action Click' },
    COOLDOWN: { ring: '#64748B', dot: '#475569', label: 'Cooldown' },
    PAUSED: { ring: '#F59E0B', dot: '#D97706', label: 'Paused' },
    TRACKING_LOST: { ring: '#EF4444', dot: '#DC2626', label: 'Tracking Lost' },
  };

  const currentColor = isPaused ? stateColors.PAUSED : stateColors[safetyState];

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Top Scroll Indicator Zone */}
      <div
        className={`absolute top-0 left-0 right-0 h-16 flex items-center justify-center transition-colors duration-200 ${
          isInTopScrollZone
            ? 'bg-cyan-500/25 border-b-2 border-cyan-400 text-cyan-300 font-semibold'
            : 'border-b border-white/5 text-transparent'
        }`}
      >
        <span className="text-xs tracking-wider flex items-center gap-1.5 uppercase font-mono">
          ▲ Scroll Up Zone
        </span>
      </div>

      {/* Bottom Scroll Indicator Zone */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center transition-colors duration-200 ${
          isInBottomScrollZone
            ? 'bg-cyan-500/25 border-t-2 border-cyan-400 text-cyan-300 font-semibold'
            : 'border-t border-white/5 text-transparent'
        }`}
      >
        <span className="text-xs tracking-wider flex items-center gap-1.5 uppercase font-mono">
          ▼ Scroll Down Zone
        </span>
      </div>

      {/* Emergency Pause Top Alert Banner */}
      {isPaused && (
        <div className="absolute top-3 left-6 right-6 py-2 px-4 rounded-xl bg-amber-500/90 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg backdrop-blur-md animate-pulse">
          <span>⚠️ EYE CONTROL PAUSED (Hold Long Blink 850ms to Resume)</span>
        </div>
      )}

      {/* Gaze Virtual Cursor */}
      {!isPaused && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
          style={{ left: `${cursorX}px`, top: `${cursorY}px` }}
        >
          {/* Action Ripple Shockwave */}
          {actionFlash && (
            <div className="absolute -inset-6 rounded-full border-2 border-cyan-300 animate-ping opacity-75 pointer-events-none" />
          )}

          {/* Dwell Circular Progress Ring */}
          <svg className="w-16 h-16 -m-2 -rotate-90" viewBox="0 0 60 60">
            {/* Background ring */}
            <circle
              cx="30"
              cy="30"
              r={radius}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="4"
              fill="rgba(15, 23, 42, 0.45)"
            />
            {/* Active progress arc */}
            {dwellProgress > 0 && (
              <circle
                cx="30"
                cy="30"
                r={radius}
                stroke="#22C55E"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            )}
          </svg>

          {/* Center Gaze Dot */}
          <div
            className="absolute top-1/2 left-1/2 w-3.5 h-3.5 -mt-[7px] -ml-[7px] rounded-full shadow-md shadow-cyan-500/50 transition-colors"
            style={{ backgroundColor: currentColor.dot }}
          />

          {/* Micro status label tag */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-11 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-tight whitespace-nowrap shadow-sm backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              color: currentColor.ring,
              border: `1px solid ${currentColor.ring}40`,
            }}
          >
            {currentColor.label}
          </div>
        </div>
      )}
    </div>
  );
};
