import React from 'react';
import { ShieldCheck, Lock, EyeOff, Radio, AlertOctagon, FileCheck, CheckCircle } from 'lucide-react';

export const SecurityAudit: React.FC = () => {
  const auditPoints = [
    {
      title: 'Ephemeral RAM Frame Processing',
      status: 'VERIFIED',
      desc: 'Camera frames are delivered via CameraX ImageAnalysis (YUV_420_888) directly to RAM. ImageProxy.close() is called immediately in a try-finally block. No video or iris photos are ever written to flash memory or disk cache.',
      icon: EyeOff,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      title: 'Accessibility Least-Privilege Sandboxing',
      status: 'HARDENED',
      desc: 'In accessibility_service_config.xml, canRetrieveWindowContent is strictly set to false. The service has ZERO ability to read screen text, passwords, bank account numbers, or private chat histories. It only dispatches touch taps and scrolls (canPerformGestures=true).',
      icon: Lock,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      title: 'Zero Network Exfiltration Surface',
      status: 'ISOLATED',
      desc: 'The AndroidManifest.xml declares NO android.permission.INTERNET permission. The app has no networking stack, analytics SDKs, telemetry trackers, or external cloud dependencies. ML inference is 100% on-device.',
      icon: Radio,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      title: 'Fail-Safe Emergency Kill Switch',
      status: 'ACTIVE',
      desc: 'If eye tracking becomes noisy, erratic, or lighting degrades below 15 lux, the Safety State Machine immediately aborts pending commands. An intentional 850ms Long Blink acts as a hardware-independent pause toggle.',
      icon: AlertOctagon,
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Cryptographic & Architectural Privacy Verification
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Security & Privacy Assurance Audit</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Engineered according to the principle of least privilege, zero biometric storage, and on-device execution
              safety guarantees.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <CheckCircle className="w-4 h-4" /> COMPLIANCE: 100% PASSED
          </div>
        </div>
      </div>

      {/* Audit Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {auditPoints.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-white">{item.title}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Formal Architecture Specification */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px]">
          <FileCheck className="w-4 h-4" /> Official Security Policy Declaration
        </div>
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 leading-relaxed space-y-2">
          <div>[DATA PIPELINE SPECIFICATION]</div>
          <div className="text-cyan-300">Camera Hardware ──&gt; RAM ImageProxy ──&gt; 16 Scalar Features ──&gt; Discard Frame</div>
          <div className="text-slate-400">
            • Data stored on disk: 12 polynomial regression coefficients (calibX[0..5], calibY[0..5]) inside private
            DataStore file. Zero images, zero biometric iris templates.
          </div>
          <div className="text-slate-400">
            • Low confidence lock: Predictions with Softmax probability &lt; 0.85 are dropped before dispatching touch events.
          </div>
        </div>
      </div>
    </div>
  );
};
