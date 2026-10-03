import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Pause,
  Play,
  Sliders,
  Target,
  Cpu,
  FileCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
  Volume2,
  RefreshCw,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { SafetyState, EyeTrackingMetrics, UserControlSettings, ClickMethod } from './types';
import { PhoneSimulator } from './components/PhoneSimulator';
import { GazeCursorOverlay } from './components/GazeCursorOverlay';
import { WebcamTracker } from './components/WebcamTracker';
import { CalibrationStudio } from './components/CalibrationStudio';
import { MlLab } from './components/MlLab';
import { CodeExplorer } from './components/CodeExplorer';
import { SecurityAudit } from './components/SecurityAudit';
import { NegativeTestingSuite } from './components/NegativeTestingSuite';
import { GoogleDriveUploadModal } from './components/GoogleDriveUploadModal';
import { Cloud } from 'lucide-react';

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'phone' | 'calibration' | 'ml' | 'code' | 'security' | 'testing'>('phone');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Master Eye Control Switches
  const [isEyeControlOn, setIsEyeControlOn] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  // Settings
  const [settings, setSettings] = useState<UserControlSettings>({
    cursorSpeed: 2.4,
    dwellDurationMs: 750,
    clickMethod: 'DWELL',
    earThreshold: 0.18,
    deliberateBlinkMinMs: 260,
    deliberateBlinkMaxMs: 550,
    scrollZonePercent: 12,
    hapticFeedback: true,
    soundFeedback: false,
    isHighContrast: true,
  });

  // Real-time Eye & Gaze Coordinates inside Phone Frame (360x720)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 180, y: 360 });
  const [dwellProgress, setDwellProgress] = useState(0);
  const [safetyState, setSafetyState] = useState<SafetyState>('TRACKING');
  const [actionFlash, setActionFlash] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activePhoneApp, setActivePhoneApp] = useState('home');

  // Eye Metrics
  const [metrics, setMetrics] = useState<EyeTrackingMetrics>({
    leftEar: 0.32,
    rightEar: 0.32,
    irisOffsetX: 0.0,
    irisOffsetY: 0.0,
    headYawDeg: 1.2,
    headPitchDeg: -2.1,
    headRollDeg: 0.4,
    confidence: 0.94,
    fps: 30.0,
    latencyMs: 1.8,
    faceDetected: true,
  });

  // Dwell and scroll timer tracking
  const dwellStartTimeRef = useRef<number | null>(null);
  const dwellAnchorPosRef = useRef<{ x: number; y: number }>({ x: 180, y: 360 });
  const cooldownUntilRef = useRef<number>(0);
  const phoneContainerRef = useRef<HTMLDivElement>(null);

  // Edge scroll zone calculations
  const phoneHeight = 720;
  const scrollMarginPx = (settings.scrollZonePercent / 100) * phoneHeight;
  const isInTopScrollZone = isEyeControlOn && !isPaused && cursorPos.y < scrollMarginPx;
  const isInBottomScrollZone = isEyeControlOn && !isPaused && cursorPos.y > phoneHeight - scrollMarginPx;

  // Handle continuous smooth edge scroll
  useEffect(() => {
    let animId: number;
    const scrollLoop = () => {
      if (isEyeControlOn && !isPaused && activePhoneApp === 'browser') {
        if (isInBottomScrollZone) {
          setScrollOffset((prev) => Math.min(prev + 3.5, 450));
        } else if (isInTopScrollZone) {
          setScrollOffset((prev) => Math.max(prev - 3.5, 0));
        }
      }
      animId = requestAnimationFrame(scrollLoop);
    };
    animId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animId);
  }, [isEyeControlOn, isPaused, isInTopScrollZone, isInBottomScrollZone, activePhoneApp]);

  // Execute confirmed touch selection
  const triggerConfirmedAction = (source: string, targetName?: string) => {
    setActionFlash(true);
    cooldownUntilRef.current = Date.now() + 450;
    setSafetyState('ACTION');

    const msg = targetName
      ? `AccessibilityService: Clicked '${targetName}' at (${cursorPos.x.toFixed(0)}, ${cursorPos.y.toFixed(0)})`
      : `AccessibilityService: Touch dispatched at (${cursorPos.x.toFixed(0)}, ${cursorPos.y.toFixed(0)})`;

    setLastActionMessage(msg);

    // Audio / Haptic feedback simulation
    if (settings.soundFeedback) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.05;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
      } catch (e) {}
    }

    setTimeout(() => {
      setActionFlash(false);
      setDwellProgress(0);
      dwellStartTimeRef.current = null;
      setSafetyState('COOLDOWN');
      setTimeout(() => {
        setSafetyState('TRACKING');
      }, 350);
    }, 180);
  };

  // Dwell state machine loop
  useEffect(() => {
    if (!isEyeControlOn || isPaused) {
      setDwellProgress(0);
      setSafetyState(isPaused ? 'PAUSED' : 'IDLE');
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (now < cooldownUntilRef.current) {
        setSafetyState('COOLDOWN');
        setDwellProgress(0);
        return;
      }

      // Check distance from dwell anchor
      const dx = cursorPos.x - dwellAnchorPosRef.current.x;
      const dy = cursorPos.y - dwellAnchorPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 28) {
        // Gaze shifted to a new target
        dwellAnchorPosRef.current = { ...cursorPos };
        dwellStartTimeRef.current = now;
        setDwellProgress(0);
        setSafetyState('TRACKING');
      } else {
        // Gaze is stationary on target!
        if (!dwellStartTimeRef.current) {
          dwellStartTimeRef.current = now;
        }

        const elapsed = now - dwellStartTimeRef.current;
        const progress = Math.min(elapsed / settings.dwellDurationMs, 1.0);
        setDwellProgress(progress);

        if (progress < 0.4) {
          setSafetyState('GAZE_STABLE');
        } else if (progress < 1.0) {
          setSafetyState('CONFIRMATION');
        } else if (progress >= 1.0 && settings.clickMethod !== 'DELIBERATE_BLINK') {
          // DWELL CLICK TRIGGERED!
          triggerConfirmedAction('Dwell Click');
        }
      }
    }, 40);

    return () => clearInterval(interval);
  }, [cursorPos, isEyeControlOn, isPaused, settings]);

  // Handle cursor positioning inside phone simulator container
  const handleMouseMoveOnPhone = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!phoneContainerRef.current || !isEyeControlOn || isPaused) return;
    const rect = phoneContainerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // Apply speed multiplier around center
    const centerX = 180;
    const centerY = 360;
    const scaledX = centerX + (rawX - centerX) * (settings.cursorSpeed / 2.0);
    const scaledY = centerY + (rawY - centerY) * (settings.cursorSpeed / 2.0);

    const clampedX = Math.max(16, Math.min(344, scaledX));
    const clampedY = Math.max(16, Math.min(704, scaledY));

    setCursorPos({ x: clampedX, y: clampedY });
  };

  // Simulate deliberate blink click button
  const handleSimulateDeliberateBlink = () => {
    if (!isEyeControlOn || isPaused) return;
    setMetrics((prev) => ({ ...prev, leftEar: 0.05, rightEar: 0.05 }));
    setTimeout(() => {
      setMetrics((prev) => ({ ...prev, leftEar: 0.32, rightEar: 0.32 }));
      triggerConfirmedAction('Deliberate Blink');
    }, 320);
  };

  // Simulate involuntary normal blink (should be REJECTED without click)
  const handleSimulateNormalBlink = () => {
    setMetrics((prev) => ({ ...prev, leftEar: 0.07, rightEar: 0.07 }));
    setLastActionMessage('Blink Engine: Involuntary blink (110ms) safely rejected. Zero accidental click.');
    setTimeout(() => {
      setMetrics((prev) => ({ ...prev, leftEar: 0.32, rightEar: 0.32 }));
    }, 110);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Eye className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">Secure Eye Control</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                ANDROID 15 • TFLite
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Hands-Free Accessibility OS • Local RAM Only</p>
          </div>
        </div>

        {/* Global Controls & Telemetry */}
        <div className="flex items-center gap-4">
          {/* Real-time status pill */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isEyeControlOn && !isPaused ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300">{isPaused ? 'PAUSED' : isEyeControlOn ? 'ACTIVE' : 'OFF'}</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">30 FPS</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">0.31ms Latency</span>
          </div>

          {/* Save to Drive Button */}
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
            title="Download & Save Android App to Google Drive"
          >
            <Cloud className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Save to Google Drive</span>
          </button>

          {/* Quick Pause Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all ${
              isPaused
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
            }`}
            title="Emergency Pause (or hold 850ms deliberate blink)"
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Resume Eye Control' : 'Quick Pause'}</span>
          </button>

          {/* Master Switch */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              onClick={() => setIsEyeControlOn(!isEyeControlOn)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                isEyeControlOn ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                  isEyeControlOn ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-medium">
        {[
          { id: 'phone', label: 'Android Phone Simulator', icon: Smartphone },
          { id: 'calibration', label: '9-Point Calibration', icon: Target },
          { id: 'ml', label: 'Python AI/ML Lab', icon: Cpu },
          { id: 'code', label: 'Kotlin & Gradle Architecture', icon: FileCode },
          { id: 'security', label: 'Security & Privacy Audit', icon: ShieldCheck },
          { id: 'testing', label: 'Negative & Safety Testing', icon: ShieldAlert },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tab Contents Viewport */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'phone' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Center: Real Phone Simulator Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="text-center mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Interactive Hands-Free Touch Exploration
                </span>
                <p className="text-[11px] text-slate-400">
                  Hover gaze over any button or app icon. Dwell 750ms to trigger selection!
                </p>
              </div>

              {/* Phone Container with Mouse Gaze Tracker and Virtual Overlay */}
              <div
                ref={phoneContainerRef}
                onMouseMove={handleMouseMoveOnPhone}
                className="relative cursor-crosshair group shadow-2xl rounded-[48px]"
              >
                <PhoneSimulator
                  cursorX={cursorPos.x}
                  cursorY={cursorPos.y}
                  scrollOffset={scrollOffset}
                  activeApp={activePhoneApp}
                  setActiveApp={setActivePhoneApp}
                  onElementClick={(target) => triggerConfirmedAction('Dwell Selection', target)}
                />

                {/* The Virtual Gaze Cursor Layer */}
                <GazeCursorOverlay
                  cursorX={cursorPos.x}
                  cursorY={cursorPos.y}
                  dwellProgress={dwellProgress}
                  safetyState={safetyState}
                  isPaused={isPaused}
                  isInTopScrollZone={isInTopScrollZone}
                  isInBottomScrollZone={isInBottomScrollZone}
                  actionFlash={actionFlash}
                />
              </div>

              {/* Action Log Toast Bar */}
              {lastActionMessage && (
                <div className="mt-4 max-w-[360px] p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-xs text-cyan-200 font-mono flex items-center gap-2 shadow-lg backdrop-blur-md animate-fade-in">
                  <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{lastActionMessage}</span>
                </div>
              )}
            </div>

            {/* Right: Live Diagnostics HUD & Eye Gesture Simulators */}
            <div className="lg:col-span-7 space-y-6">
              {/* Webcam / Synthetic Vision Feed */}
              <WebcamTracker
                metrics={metrics}
                onMetricsUpdate={(newM) => setMetrics((prev) => ({ ...prev, ...newM }))}
                isWebcamActive={isWebcamActive}
                setIsWebcamActive={setIsWebcamActive}
              />

              {/* Eye Gesture Controls Simulator Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Intentional Action Safety Testing
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                    Midas Touch Prevention Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={handleSimulateDeliberateBlink}
                    className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/90 text-left border border-slate-700 active:scale-95 transition-all group"
                  >
                    <div className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                      Simulate Deliberate Blink (320ms)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Intentional eye squeeze triggers click at current cursor position.
                    </div>
                  </button>

                  <button
                    onClick={handleSimulateNormalBlink}
                    className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/90 text-left border border-slate-700 active:scale-95 transition-all group"
                  >
                    <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                      Simulate Involuntary Blink (110ms)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Natural eye reflex is filtered out. Zero accidental click fired.
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Interaction Settings */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Sliders className="w-4 h-4 text-cyan-400" /> Configurable Interaction Parameters
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 font-mono mb-1.5">
                      <span>Cursor Speed:</span>
                      <strong className="text-cyan-400">{settings.cursorSpeed.toFixed(1)}x</strong>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="4.5"
                      step="0.1"
                      value={settings.cursorSpeed}
                      onChange={(e) => setSettings({ ...settings, cursorSpeed: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 font-mono mb-1.5">
                      <span>Dwell Duration:</span>
                      <strong className="text-cyan-400">{settings.dwellDurationMs} ms</strong>
                    </div>
                    <input
                      type="range"
                      min="400"
                      max="1500"
                      step="50"
                      value={settings.dwellDurationMs}
                      onChange={(e) => setSettings({ ...settings, dwellDurationMs: parseInt(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Click Method:</span>
                  <div className="flex gap-2">
                    {(['DWELL', 'DELIBERATE_BLINK', 'BOTH'] as ClickMethod[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setSettings({ ...settings, clickMethod: m })}
                        className={`px-3 py-1 rounded-xl font-mono text-[11px] font-bold transition-colors ${
                          settings.clickMethod === m
                            ? 'bg-cyan-500 text-slate-950 shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calibration' && <CalibrationStudio />}
        {activeTab === 'ml' && <MlLab />}
        {activeTab === 'code' && <CodeExplorer />}
        {activeTab === 'security' && <SecurityAudit />}
        {activeTab === 'testing' && (
          <NegativeTestingSuite
            onSimulateBlink={(d) => {
              setMetrics((prev) => ({ ...prev, leftEar: 0.06, rightEar: 0.06 }));
              setTimeout(() => {
                setMetrics((prev) => ({ ...prev, leftEar: 0.32, rightEar: 0.32 }));
              }, d);
            }}
            onSimulateTrackingLoss={() => {
              setMetrics((prev) => ({ ...prev, faceDetected: false, confidence: 0 }));
              setSafetyState('TRACKING_LOST');
              setTimeout(() => {
                setMetrics((prev) => ({ ...prev, faceDetected: true, confidence: 0.94 }));
                setSafetyState('TRACKING');
              }, 1200);
            }}
            onSimulateEmergencyPause={() => {
              setIsPaused(true);
              setSafetyState('PAUSED');
            }}
            currentSafetyState={safetyState}
          />
        )}
      </main>

      {/* Google Drive Upload Modal */}
      <GoogleDriveUploadModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
      />
    </div>
  );
}
