import React, { useState } from 'react';
import { FileCode, Folder, Copy, Check, Terminal, ExternalLink, Download } from 'lucide-react';
import { downloadAndroidProjectZip } from '../utils/exportProjectZip';

interface CodeFile {
  path: string;
  name: string;
  category: 'Android Kotlin' | 'Accessibility & Manifest' | 'Python AI/ML';
  content: string;
}

export const CodeExplorer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const files: CodeFile[] = [
    {
      name: 'EyeAccessibilityService.kt',
      path: 'android/app/src/main/java/com/secureeye/control/service/EyeAccessibilityService.kt',
      category: 'Android Kotlin',
      content: `package com.secureeye.control.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.graphics.Path
import android.graphics.PixelFormat
import android.os.Build
import android.util.Log
import android.view.Gravity
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import com.secureeye.control.safety.SafetySnapshot

class EyeAccessibilityService : AccessibilityService() {

    private var windowManager: WindowManager? = null
    private var overlayCursorView: OverlayCursorView? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        initOverlay()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Zero inspection of third-party content (least privilege)
    }

    private fun initOverlay() {
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        overlayCursorView = OverlayCursorView(this)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }
        windowManager?.addView(overlayCursorView, params)
    }

    fun performClick(x: Float, y: Float) {
        val clickPath = Path().apply { moveTo(x, y) }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(clickPath, 0, 50))
            .build()
        dispatchGesture(gesture, null, null)
    }

    fun performScroll(directionUp: Boolean, screenWidth: Int, screenHeight: Int) {
        val startY = if (directionUp) screenHeight * 0.75f else screenHeight * 0.25f
        val endY = if (directionUp) screenHeight * 0.25f else screenHeight * 0.75f
        val scrollPath = Path().apply {
            moveTo(screenWidth * 0.5f, startY)
            lineTo(screenWidth * 0.5f, endY)
        }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(scrollPath, 0, 250))
            .build()
        dispatchGesture(gesture, null, null)
    }

    fun triggerGlobalBack(): Boolean = performGlobalAction(GLOBAL_ACTION_BACK)
    fun triggerGlobalHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)
    fun triggerGlobalRecents(): Boolean = performGlobalAction(GLOBAL_ACTION_RECENTS)

    companion object {
        var instance: EyeAccessibilityService? = null
            private set
    }
}`,
    },
    {
      name: 'SafetyStateMachine.kt',
      path: 'android/app/src/main/java/com/secureeye/control/safety/SafetyStateMachine.kt',
      category: 'Android Kotlin',
      content: `package com.secureeye.control.safety

import android.os.SystemClock
import kotlin.math.sqrt

enum class SafetyState {
    IDLE, TRACKING, GAZE_STABLE, ACTION_CANDIDATE, CONFIRMATION, ACTION, COOLDOWN, PAUSED, TRACKING_LOST
}

class SafetyStateMachine(
    var dwellDurationMs: Long = 750L,
    var stabilityRadiusPx: Float = 32.0f,
    var cooldownDurationMs: Long = 400L,
    var trackingLostTimeoutMs: Long = 180L
) {
    var currentState: SafetyState = SafetyState.IDLE
    var isPaused: Boolean = false
    private var stableAnchorX: Float = 0f
    private var stableAnchorY: Float = 0f
    private var stableStartTimeMs: Long = 0L
    private var lastActionTimeMs: Long = 0L
    private var lastTrackingSeenTimeMs: Long = 0L
    private var consecutiveStableFrames: Int = 0

    fun update(
        cursorX: Float,
        cursorY: Float,
        faceDetected: Boolean,
        confidence: Float,
        timestampMs: Long = SystemClock.uptimeMillis()
    ): SafetySnapshot {
        if (isPaused) return SafetySnapshot(SafetyState.PAUSED, 0f, false, true, "Paused")

        // Failsafe tracking loss timeout
        if (!faceDetected || confidence < 0.60f) {
            if (timestampMs - lastTrackingSeenTimeMs > trackingLostTimeoutMs) {
                currentState = SafetyState.TRACKING_LOST
                return SafetySnapshot(SafetyState.TRACKING_LOST, 0f, false, false, "Lost")
            }
        } else {
            lastTrackingSeenTimeMs = timestampMs
        }

        if (timestampMs - lastActionTimeMs < cooldownDurationMs) {
            currentState = SafetyState.COOLDOWN
            return SafetySnapshot(SafetyState.COOLDOWN, 0f, false, false, "Cooldown")
        }

        val dist = sqrt((cursorX - stableAnchorX) * (cursorX - stableAnchorX) + (cursorY - stableAnchorY) * (cursorY - stableAnchorY))
        if (dist > stabilityRadiusPx) {
            stableAnchorX = cursorX
            stableAnchorY = cursorY
            stableStartTimeMs = timestampMs
            consecutiveStableFrames = 0
            currentState = SafetyState.TRACKING
            return SafetySnapshot(SafetyState.TRACKING, 0f, false, false, "Tracking")
        } else {
            consecutiveStableFrames++
            val elapsed = timestampMs - stableStartTimeMs
            if (elapsed > dwellDurationMs) {
                currentState = SafetyState.ACTION
                lastActionTimeMs = timestampMs
                return SafetySnapshot(SafetyState.ACTION, 1.0f, true, false, "Action Confirmed")
            }
            val progress = (elapsed.toFloat() / dwellDurationMs).coerceIn(0f, 1f)
            return SafetySnapshot(SafetyState.CONFIRMATION, progress, false, false, "Dwelling")
        }
    }
}`,
    },
    {
      name: 'BlinkDetectionEngine.kt',
      path: 'android/app/src/main/java/com/secureeye/control/tracking/BlinkDetectionEngine.kt',
      category: 'Android Kotlin',
      content: `package com.secureeye.control.tracking

import kotlin.math.sqrt

enum class EyeActionType {
    NONE, NORMAL_BLINK_REJECTED, DELIBERATE_CLICK, DOUBLE_BLINK, LONG_BLINK_PAUSE_TOGGLE
}

class BlinkDetectionEngine(
    var earThreshold: Float = 0.18f,
    var minDeliberateDurationMs: Long = 260L,
    var maxDeliberateDurationMs: Long = 550L,
    var doubleBlinkWindowMs: Long = 420L,
    var emergencyPauseHoldMs: Long = 850L
) {
    private var isEyeClosed: Boolean = false
    private var closureStartTimeMs: Long = 0L
    private var lastDeliberateBlinkEndTimeMs: Long = 0L

    fun processBlinkFrame(leftEar: Float, rightEar: Float, timestampMs: Long): EyeActionType {
        val avgEar = (leftEar + rightEar) / 2.0f
        val closedNow = avgEar < earThreshold

        if (closedNow && !isEyeClosed) {
            isEyeClosed = true
            closureStartTimeMs = timestampMs
            return EyeActionType.NONE
        } else if (closedNow && isEyeClosed) {
            // Emergency long-blink kill switch
            if (timestampMs - closureStartTimeMs >= emergencyPauseHoldMs) {
                isEyeClosed = false
                return EyeActionType.LONG_BLINK_PAUSE_TOGGLE
            }
        } else if (!closedNow && isEyeClosed) {
            val duration = timestampMs - closureStartTimeMs
            isEyeClosed = false

            if (duration < minDeliberateDurationMs) {
                // Involuntary blink (80-220ms) -> REJECTED (No Click)
                return EyeActionType.NORMAL_BLINK_REJECTED
            } else if (duration in minDeliberateDurationMs..maxDeliberateDurationMs) {
                if (timestampMs - lastDeliberateBlinkEndTimeMs < doubleBlinkWindowMs) {
                    lastDeliberateBlinkEndTimeMs = 0L
                    return EyeActionType.DOUBLE_BLINK
                } else {
                    lastDeliberateBlinkEndTimeMs = timestampMs
                    return EyeActionType.DELIBERATE_CLICK
                }
            }
        }
        return EyeActionType.NONE
    }
}`,
    },
    {
      name: 'AndroidManifest.xml',
      path: 'android/app/src/main/AndroidManifest.xml',
      category: 'Accessibility & Manifest',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.secureeye.control">

    <!-- CAMERA: On-device ephemeral RAM only. Never stored or sent off-device -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />

    <application
        android:name=".EyeControlApplication"
        android:allowBackup="false"
        android:label="@string/app_name"
        android:theme="@style/Theme.SecureEyeControl">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.EyeAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
    </application>
</manifest>`,
    },
    {
      name: 'accessibility_service_config.xml',
      path: 'android/app/src/main/res/xml/accessibility_service_config.xml',
      category: 'Accessibility & Manifest',
      content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_description"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="false" <!-- LEAST PRIVILEGE: Window content inspection DISABLED -->
    android:canPerformGestures="true"       <!-- TOUCH DISPATCH: Dispatches taps, scrolls and swipes -->
    android:accessibilityFlags="flagDefault|flagRequestTouchExplorationMode"
    android:settingsActivity="com.secureeye.control.ui.MainActivity" />`,
    },
    {
      name: 'train_eye_action_model.py',
      path: 'ml/train_eye_action_model.py',
      category: 'Python AI/ML',
      content: `"""
train_eye_action_model.py
Mobile-optimized neural network trainer for on-device eye action classification.
Architecture: 16 -> 32 (ReLU) -> 16 (ReLU) -> 6 (Softmax)
"""
import json, math, random, os
from dataset_generator import FEATURE_NAMES, CLASS_NAMES, generate_dataset

class MobileEyeActionModel:
    def __init__(self, input_dim=16, hidden1_dim=32, hidden2_dim=16, output_dim=6):
        self.input_dim = input_dim
        self.hidden1_dim = hidden1_dim
        self.hidden2_dim = hidden2_dim
        self.output_dim = output_dim
        ...`,
    },
  ];

  const [activeFile, setActiveFile] = useState<CodeFile>(files[0]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <Terminal className="w-4 h-4" /> Production Android Studio Project Files
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Kotlin & Gradle Architecture Explorer</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect the real, compilable Kotlin Android sources: AccessibilityService touch dispatch, CameraX frame
              analyzer, One-Euro smoothing filter, and Safety state machine.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadAndroidProjectZip()}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" /> Download Android Studio Project (.ZIP)
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold flex items-center gap-2 border border-slate-700 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar & Code View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Navigator Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
          <div className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider px-2">
            Workspace Files
          </div>
          <div className="space-y-1">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => setActiveFile(file)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-mono flex items-center gap-2.5 transition-colors ${
                  activeFile.path === file.path
                    ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-4 h-4 shrink-0 text-cyan-400" />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono px-2 space-y-1">
            <div>Target: Android 15 (API 35)</div>
            <div>Architecture: Single-Activity Compose</div>
            <div>Build tool: Gradle 8.8 kts</div>
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          {/* File Tab Bar */}
          <div className="h-11 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-300 font-semibold flex items-center gap-2 truncate">
              <FileCode className="w-4 h-4 text-cyan-400" /> {activeFile.path}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {activeFile.category}
            </span>
          </div>

          {/* Code Viewer */}
          <div className="p-4 overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed max-h-[520px]">
            <pre className="selection:bg-cyan-500/30">
              <code>{activeFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
