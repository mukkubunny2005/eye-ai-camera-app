import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  Globe,
  Image as ImageIcon,
  Settings,
  Camera,
  Clock,
  Calculator,
  Search,
  ArrowLeft,
  Circle,
  Square,
  ChevronLeft,
  Send,
  Volume2,
  Shield,
  Eye,
  Sliders,
  Battery,
  Wifi,
  Sparkles,
} from 'lucide-react';

interface PhoneSimulatorProps {
  cursorX: number; // Inside phone viewport coordinates
  cursorY: number;
  onElementClick?: (targetName: string) => void;
  scrollOffset: number;
  activeApp: string;
  setActiveApp: (app: string) => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  onElementClick,
  scrollOffset,
  activeApp,
  setActiveApp,
}) => {
  const [dialerNumber, setDialerNumber] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'Dr. Sarah Lin (Neurology)', text: 'Your eye-tracking calibration score looks optimal for daily typing.', time: '10:42 AM' },
    { sender: 'Accessibility Team', text: 'New One-Euro jitter filter update applied on-device.', time: '09:15 AM' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleAction = (label: string, callback?: () => void) => {
    if (onElementClick) {
      onElementClick(label);
    }
    if (callback) callback();
  };

  return (
    <div className="relative w-[360px] h-[720px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-[6px] border-slate-800 shadow-cyan-950/20 select-none overflow-hidden flex flex-col">
      {/* Front Camera Punch-hole & Speaker Grill */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-900/60" />
        </div>
      </div>

      {/* Screen Frame */}
      <div className="relative w-full h-full bg-slate-900 rounded-[38px] overflow-hidden flex flex-col text-slate-100">
        {/* Status Bar */}
        <div className="h-8 px-6 flex items-center justify-between text-[11px] font-medium text-slate-300 z-30 bg-slate-900/80 backdrop-blur-sm">
          <span>09:41</span>
          <div className="flex items-center gap-2">
            <Wifi className="w-3 h-3" />
            <span className="text-[10px] font-bold">5G</span>
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">98%</span>
              <Battery className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        </div>

        {/* Dynamic App Content Viewport */}
        <div className="flex-1 overflow-hidden relative">
          {/* HOME SCREEN */}
          {activeApp === 'home' && (
            <div className="h-full p-4 flex flex-col justify-between">
              {/* Top Search & Glance Widget */}
              <div className="space-y-4 pt-4">
                <div
                  id="widget-glance"
                  onClick={() => handleAction('Glance Widget')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/50 shadow-sm cursor-pointer hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-cyan-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Hands-Free OS
                    </span>
                    <span>OCT 2</span>
                  </div>
                  <div className="text-xl font-bold mt-1 text-white">72°F Sunny • Safe Eye Mode</div>
                  <div className="text-xs text-slate-400 mt-1">Dwell 750ms to activate any button</div>
                </div>

                {/* Google Search Bar Mock */}
                <div
                  id="search-bar"
                  onClick={() => handleAction('Search Bar')}
                  className="h-11 px-4 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-between text-slate-400 text-xs shadow-inner cursor-pointer hover:border-cyan-500/50"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>Search apps, web, eye commands...</span>
                  </div>
                </div>
              </div>

              {/* App Icon Grid */}
              <div className="grid grid-cols-4 gap-y-6 gap-x-2 my-auto px-2">
                {[
                  { id: 'app-phone', name: 'Phone', icon: Phone, color: 'from-emerald-500 to-teal-600', app: 'phone' },
                  { id: 'app-messages', name: 'Messages', icon: MessageSquare, color: 'from-blue-500 to-indigo-600', app: 'messages' },
                  { id: 'app-browser', name: 'Browser', icon: Globe, color: 'from-amber-500 to-orange-600', app: 'browser' },
                  { id: 'app-photos', name: 'Photos', icon: ImageIcon, color: 'from-rose-500 to-pink-600', app: 'photos' },
                  { id: 'app-settings', name: 'Settings', icon: Settings, color: 'from-slate-600 to-slate-700', app: 'settings' },
                  { id: 'app-camera', name: 'Camera', icon: Camera, color: 'from-purple-500 to-violet-600', app: 'camera' },
                  { id: 'app-clock', name: 'Clock', icon: Clock, color: 'from-cyan-500 to-blue-600', app: 'clock' },
                  { id: 'app-calculator', name: 'Calculator', icon: Calculator, color: 'from-amber-600 to-yellow-600', app: 'calc' },
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.id}
                      id={item.id}
                      onClick={() => handleAction(item.name, () => setActiveApp(item.app))}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${item.color} p-3 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95`}>
                        <IconComp className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-200">{item.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Dock Bar */}
              <div className="p-3 bg-slate-800/40 rounded-3xl border border-white/5 flex justify-around">
                <div
                  id="dock-phone"
                  onClick={() => handleAction('Dock Phone', () => setActiveApp('phone'))}
                  className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center cursor-pointer shadow-md"
                >
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div
                  id="dock-messages"
                  onClick={() => handleAction('Dock Messages', () => setActiveApp('messages'))}
                  className="w-11 h-11 rounded-2xl bg-blue-500 flex items-center justify-center cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div
                  id="dock-browser"
                  onClick={() => handleAction('Dock Browser', () => setActiveApp('browser'))}
                  className="w-11 h-11 rounded-2xl bg-orange-500 flex items-center justify-center cursor-pointer shadow-md"
                >
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div
                  id="dock-settings"
                  onClick={() => handleAction('Dock Settings', () => setActiveApp('settings'))}
                  className="w-11 h-11 rounded-2xl bg-slate-600 flex items-center justify-center cursor-pointer shadow-md"
                >
                  <Settings className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* PHONE DIALER APP */}
          {activeApp === 'phone' && (
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center gap-3 py-2 border-b border-slate-800">
                <button
                  id="btn-back-phone"
                  onClick={() => handleAction('Back to Home', () => setActiveApp('home'))}
                  className="p-1.5 rounded-full hover:bg-slate-800"
                >
                  <ChevronLeft className="w-5 h-5 text-cyan-400" />
                </button>
                <span className="text-base font-bold text-white">Phone Dialer</span>
              </div>

              {/* Number display */}
              <div className="h-14 flex items-center justify-center text-2xl font-mono tracking-widest text-cyan-300 font-bold border-b border-slate-800/80 my-2">
                {dialerNumber || <span className="text-slate-600 text-lg">Dwell numbers to dial</span>}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-3 my-auto px-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                  <button
                    key={d}
                    id={`dial-${d}`}
                    onClick={() => handleAction(`Digit ${d}`, () => setDialerNumber((prev) => prev + d))}
                    className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xl font-bold text-white shadow-sm flex items-center justify-center active:bg-cyan-500/20"
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Call button */}
              <div className="flex justify-center items-center gap-4 py-3">
                <button
                  id="btn-dial-call"
                  onClick={() => handleAction('Call Button', () => alert(`Initiating hands-free call to: ${dialerNumber || 'Emergency Contact'}`))}
                  className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <Phone className="w-6 h-6 text-white" />
                </button>
                {dialerNumber && (
                  <button
                    id="btn-dial-clear"
                    onClick={() => handleAction('Clear', () => setDialerNumber(''))}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-rose-400 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MESSAGES APP */}
          {activeApp === 'messages' && (
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center gap-3 py-2 border-b border-slate-800">
                <button
                  id="btn-back-messages"
                  onClick={() => handleAction('Back to Home', () => setActiveApp('home'))}
                  className="p-1.5 rounded-full hover:bg-slate-800"
                >
                  <ChevronLeft className="w-5 h-5 text-cyan-400" />
                </button>
                <span className="text-base font-bold text-white">Hands-Free Messages</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 py-3">
                {messages.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                    <div className="flex justify-between text-[11px] text-cyan-400 font-semibold mb-1">
                      <span>{m.sender}</span>
                      <span className="text-slate-500">{m.time}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>

              {/* Live Typed Message Composer */}
              <div className="py-2 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-3 py-1.5 border border-slate-700">
                  <span className="text-xs text-white font-mono flex-1 truncate">
                    {newMessage || <span className="text-slate-500 italic">Dwell letters to type...</span>}
                  </span>
                  {newMessage && (
                    <button
                      id="btn-send-msg"
                      onClick={() =>
                        handleAction('Send Message', () => {
                          setMessages((prev) => [
                            ...prev,
                            { sender: 'You (Eye Typing)', text: newMessage, time: 'Just now' },
                          ]);
                          setNewMessage('');
                        })
                      }
                      className="p-1 rounded-lg bg-cyan-500 text-slate-950 font-bold"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Gaze QWERTY Keyboard */}
                <div className="bg-slate-950/90 rounded-2xl p-2 border border-slate-800 space-y-1">
                  {/* Suggestions */}
                  <div className="flex gap-1.5 justify-between pb-1 border-b border-slate-800/60 text-[10px] font-mono text-cyan-400">
                    {['Thanks', 'Yes', 'No', 'Wait'].map((s) => (
                      <button
                        key={s}
                        id={`suggest-${s}`}
                        onClick={() => handleAction(`Suggest ${s}`, () => setNewMessage((prev) => prev + (prev ? ' ' : '') + s))}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 hover:border-cyan-500/50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Row 1 */}
                  <div className="flex gap-1 justify-center">
                    {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((k) => (
                      <button
                        key={k}
                        id={`key-${k}`}
                        onClick={() => handleAction(`Key ${k}`, () => setNewMessage((prev) => prev + k))}
                        className="w-7 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-mono font-bold text-white flex items-center justify-center border border-slate-700/60 active:bg-cyan-500/30"
                      >
                        {k}
                      </button>
                    ))}
                  </div>

                  {/* Row 2 */}
                  <div className="flex gap-1 justify-center">
                    {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((k) => (
                      <button
                        key={k}
                        id={`key-${k}`}
                        onClick={() => handleAction(`Key ${k}`, () => setNewMessage((prev) => prev + k))}
                        className="w-7 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-mono font-bold text-white flex items-center justify-center border border-slate-700/60 active:bg-cyan-500/30"
                      >
                        {k}
                      </button>
                    ))}
                  </div>

                  {/* Row 3 */}
                  <div className="flex gap-1 justify-center">
                    {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((k) => (
                      <button
                        key={k}
                        id={`key-${k}`}
                        onClick={() => handleAction(`Key ${k}`, () => setNewMessage((prev) => prev + k))}
                        className="w-7 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-mono font-bold text-white flex items-center justify-center border border-slate-700/60 active:bg-cyan-500/30"
                      >
                        {k}
                      </button>
                    ))}
                    <button
                      id="key-backspace"
                      onClick={() => handleAction('Backspace', () => setNewMessage((prev) => prev.slice(0, -1)))}
                      className="w-10 h-8 rounded-lg bg-slate-800/90 hover:bg-rose-950 text-xs font-mono font-bold text-rose-300 flex items-center justify-center border border-slate-700/60 active:bg-rose-500/30"
                    >
                      ⌫
                    </button>
                  </div>

                  {/* Row 4: Space bar */}
                  <div className="flex gap-2 justify-center pt-0.5">
                    <button
                      id="key-space"
                      onClick={() => handleAction('Space', () => setNewMessage((prev) => prev + ' '))}
                      className="w-40 h-7 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 flex items-center justify-center border border-slate-700/60 active:bg-cyan-500/30 uppercase"
                    >
                      Space
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BROWSER ARTICLE (SCROLL TESTING) */}
          {activeApp === 'browser' && (
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center gap-3 py-2 border-b border-slate-800">
                <button
                  id="btn-back-browser"
                  onClick={() => handleAction('Back to Home', () => setActiveApp('home'))}
                  className="p-1.5 rounded-full hover:bg-slate-800"
                >
                  <ChevronLeft className="w-5 h-5 text-cyan-400" />
                </button>
                <div className="flex-1 bg-slate-800 rounded-full px-3 py-1 text-xs text-slate-300 font-mono truncate">
                  https://nature.org/neuro-accessibility
                </div>
              </div>

              {/* Scrollable Container with simulated offset */}
              <div
                className="flex-1 overflow-y-auto pt-2 space-y-4 transition-transform duration-300 ease-out"
                style={{ transform: `translateY(-${scrollOffset}px)` }}
              >
                <h1 className="text-lg font-bold text-white leading-snug">
                  Breakthrough in High-Precision Gaze Control for Mobile Operating Systems
                </h1>
                <p className="text-xs text-slate-400">By Neuroscience Research Institute • Oct 2026</p>
                <div className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-800/40 text-xs text-cyan-200">
                  Tip: Look at the top or bottom edge of the phone to trigger hands-free automatic scrolling!
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Recent advances in on-device deep learning combined with modern front-facing camera sensors have unlocked
                  sub-millimeter iris localization. Rather than sending video frames to distant cloud servers, modern
                  ephemeral pipelines analyze frames directly in device RAM using MediaPipe and TensorFlow Lite.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Crucially, distinguishing natural involuntary blinks (80 to 200 milliseconds) from deliberate selections
                  (250 to 500 milliseconds) resolves the historic "Midas Touch" problem where users accidentally tapped every
                  item they glanced at.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  With Android's AccessibilityService framework, developers can dispatch programmatic touch gestures and
                  manage virtual overlays with zero latency, empowering individuals with ALS, spinal cord injuries, or motor
                  impairments to operate smartphones completely independently.
                </p>
                <div className="h-20" />
              </div>
            </div>
          )}

          {/* SETTINGS APP */}
          {activeApp === 'settings' && (
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center gap-3 py-2 border-b border-slate-800">
                <button
                  id="btn-back-settings"
                  onClick={() => handleAction('Back to Home', () => setActiveApp('home'))}
                  className="p-1.5 rounded-full hover:bg-slate-800"
                >
                  <ChevronLeft className="w-5 h-5 text-cyan-400" />
                </button>
                <span className="text-base font-bold text-white">System Settings</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-3">
                {[
                  { name: 'Eye Control Accessibility', desc: 'Gaze cursor, dwell timing, and blink sensitivity', icon: Eye },
                  { name: 'Security & Privacy', desc: 'Ephemeral memory policy & permission audit', icon: Shield },
                  { name: 'Sound & Haptic Feedback', desc: 'Vibrate on deliberate click confirmation', icon: Volume2 },
                  { name: 'Display & Gestures', desc: 'Edge scroll zones and high-contrast cursor', icon: Sliders },
                ].map((s, idx) => {
                  const IconComp = s.icon;
                  return (
                    <div
                      key={idx}
                      id={`setting-row-${idx}`}
                      onClick={() => handleAction(s.name)}
                      className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 cursor-pointer flex items-center gap-3.5 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-white">{s.name}</div>
                        <div className="text-[11px] text-slate-400">{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* System Navigation Bar (Accessibility Global Actions) */}
        <div className="h-12 px-8 flex items-center justify-between border-t border-slate-800/80 bg-slate-900/90 z-30">
          <button
            id="nav-back"
            onClick={() => handleAction('Global Back Action', () => setActiveApp('home'))}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 active:scale-90"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            id="nav-home"
            onClick={() => handleAction('Global Home Action', () => setActiveApp('home'))}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 active:scale-90"
            title="Home"
          >
            <Circle className="w-4 h-4 fill-current" />
          </button>
          <button
            id="nav-recents"
            onClick={() => handleAction('Global Recents Action')}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 active:scale-90"
            title="Recent Apps"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
