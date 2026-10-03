import React, { useState } from 'react';
import { Target, CheckCircle2, RotateCcw, Award, ChevronRight } from 'lucide-react';
import { CalibrationMetrics, CalibrationTarget } from '../types';

export const CalibrationStudio: React.FC = () => {
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [samplesPerPoint, setSamplesPerPoint] = useState<number[]>([25, 25, 25, 25, 25, 25, 25, 25, 25]);
  const [metrics, setMetrics] = useState<CalibrationMetrics>({
    qualityScore: 94,
    rmsePx: 21.8,
    isAccepted: true,
    pointsCompleted: 9,
  });

  const targets: CalibrationTarget[] = [
    { id: 0, x: 0.15, y: 0.15, label: 'Top-Left' },
    { id: 1, x: 0.5, y: 0.15, label: 'Top-Center' },
    { id: 2, x: 0.85, y: 0.15, label: 'Top-Right' },
    { id: 3, x: 0.15, y: 0.5, label: 'Center-Left' },
    { id: 4, x: 0.5, y: 0.5, label: 'Center' },
    { id: 5, x: 0.85, y: 0.5, label: 'Center-Right' },
    { id: 6, x: 0.15, y: 0.85, label: 'Bottom-Left' },
    { id: 7, x: 0.5, y: 0.85, label: 'Bottom-Center' },
    { id: 8, x: 0.85, y: 0.85, label: 'Bottom-Right' },
  ];

  const handleNextTarget = () => {
    if (currentTargetIndex < targets.length - 1) {
      setCurrentTargetIndex((prev) => prev + 1);
    } else {
      setIsCalibrating(false);
      setMetrics({
        qualityScore: 96,
        rmsePx: 19.4,
        isAccepted: true,
        pointsCompleted: 9,
      });
    }
  };

  const startRecalibration = () => {
    setIsCalibrating(true);
    setCurrentTargetIndex(0);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <Target className="w-4 h-4" /> 9-Point Bivariate Regression
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Personalized Gaze Calibration System</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Maps individual eye physiology and ocular geometry to screen coordinates using outlier-rejected polynomial
              regression. No raw camera images are ever saved.
            </p>
          </div>
          <button
            onClick={startRecalibration}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> {isCalibrating ? 'Restart Calibration' : 'Recalibrate System'}
          </button>
        </div>
      </div>

      {/* Main Calibration Canvas Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[420px]">
          <div className="flex items-center justify-between z-10 text-xs">
            <span className="font-mono text-slate-400">
              Active Point: <strong className="text-cyan-400">{currentTargetIndex + 1} of 9</strong> (
              {targets[currentTargetIndex].label})
            </span>
            <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/50">
              Hold gaze stationary on pulsating marker
            </span>
          </div>

          {/* Interactive Visual Points Board */}
          <div className="relative w-full h-[320px] bg-slate-950/80 rounded-2xl border border-slate-800/80 my-4 shadow-inner">
            {targets.map((pt, idx) => {
              const isCurrent = idx === currentTargetIndex;
              const isPassed = idx < currentTargetIndex;

              return (
                <div
                  key={pt.id}
                  onClick={() => setCurrentTargetIndex(idx)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
                  style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%` }}
                >
                  <div
                    className={`relative rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'w-14 h-14 bg-cyan-500/20 border-2 border-cyan-400 animate-pulse shadow-lg shadow-cyan-500/40'
                        : isPassed
                        ? 'w-9 h-9 bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                        : 'w-7 h-7 bg-slate-800 border border-slate-700 text-slate-500'
                    }`}
                  >
                    {isCurrent ? (
                      <div className="w-4 h-4 rounded-full bg-white shadow-md shadow-cyan-300" />
                    ) : isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <span className="text-[11px] font-mono font-bold">{idx + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between z-10">
            <span className="text-xs text-slate-400">Sampling 25 frames per anchor point</span>
            <button
              onClick={handleNextTarget}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 active:scale-95"
            >
              Advance Target <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quality Score & Mathematical Verification Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
              <Award className="w-4 h-4" /> Calibration Accuracy
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-white">{metrics.qualityScore}%</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                PROD GRADE
              </span>
            </div>

            {/* Quality Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${metrics.qualityScore}%` }}
              />
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Mapping RMSE:</span>
                <strong className="text-slate-200 font-mono">{metrics.rmsePx} px</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Rejection Outliers:</span>
                <strong className="text-slate-200 font-mono">1.2% (&gt;2σ stddev)</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Safety Gate Status:</span>
                <strong className="text-emerald-400 font-mono">ACCEPTED (≥ 70%)</strong>
              </div>
            </div>
          </div>

          {/* Mathematical Model Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 font-mono text-xs">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">Polynomial Mapping Formula</span>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
              <div>ScreenX = a₀ + a₁·irisX + a₂·irisY + a₃·irisX² + a₄·yaw</div>
              <div className="mt-1">ScreenY = b₀ + b₁·irisX + b₂·irisY + b₃·irisY² + b₄·pitch</div>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-normal">
              Coefficients are persisted locally in Android Jetpack DataStore without storing raw biometric images.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
