package com.secureeye.control.service

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
import com.secureeye.control.safety.SafetyState

/**
 * System-wide Accessibility Service for hands-free eye control.
 * Dispatches simulated touches, swipes, scrolls, and global navigation actions
 * based on verified eye gaze dwells and deliberate blinks.
 */
class EyeAccessibilityService : AccessibilityService() {

    private var windowManager: WindowManager? = null
    private var overlayCursorView: OverlayCursorView? = null
    private var isOverlayAdded = false

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "EyeAccessibilityService connected to system.")
        instance = this
        initOverlay()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Zero inspection of third-party window content (least-privilege compliance)
    }

    override fun onInterrupt() {
        Log.w(TAG, "EyeAccessibilityService interrupted by system.")
    }

    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
        instance = null
    }

    private fun initOverlay() {
        try {
            windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
            overlayCursorView = OverlayCursorView(this)

            val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }

            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
            }

            windowManager?.addView(overlayCursorView, params)
            isOverlayAdded = true
            Log.i(TAG, "Overlay cursor view successfully bound to window manager.")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to attach overlay cursor view", e)
        }
    }

    private fun removeOverlay() {
        if (isOverlayAdded && overlayCursorView != null) {
            try {
                windowManager?.removeView(overlayCursorView)
                isOverlayAdded = false
            } catch (e: Exception) {
                Log.e(TAG, "Error removing overlay", e)
            }
        }
    }

    fun updateOverlay(x: Float, y: Float, snapshot: SafetySnapshot) {
        overlayCursorView?.updateCursor(
            x = x,
            y = y,
            progress = snapshot.dwellProgress,
            state = snapshot.state,
            paused = snapshot.isPaused
        )
    }

    /**
     * Dispatches simulated tap at given screen pixel coordinates.
     */
    fun performClick(x: Float, y: Float) {
        val clickPath = Path().apply {
            moveTo(x, y)
        }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(clickPath, 0, 50))
            .build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                Log.d(TAG, "Click gesture completed at ($x, $y)")
            }
            override fun onCancelled(gestureDescription: GestureDescription?) {
                Log.w(TAG, "Click gesture cancelled at ($x, $y)")
            }
        }, null)
    }

    /**
     * Dispatches scroll swipe gesture.
     */
    fun performScroll(directionUp: Boolean, screenWidth: Int, screenHeight: Int) {
        val startY = if (directionUp) screenHeight * 0.75f else screenHeight * 0.25f
        val endY = if (directionUp) screenHeight * 0.25f else screenHeight * 0.75f
        val x = screenWidth * 0.5f

        val scrollPath = Path().apply {
            moveTo(x, startY)
            lineTo(x, endY)
        }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(scrollPath, 0, 250))
            .build()

        dispatchGesture(gesture, null, null)
    }

    fun triggerGlobalBack(): Boolean = performGlobalAction(GLOBAL_ACTION_BACK)
    fun triggerGlobalHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)
    fun triggerGlobalRecents(): Boolean = performGlobalAction(GLOBAL_ACTION_RECENTS)
    fun triggerGlobalNotifications(): Boolean = performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)

    companion object {
        const val TAG = "EyeAccessibilitySvc"
        var instance: EyeAccessibilityService? = null
            private set
    }
}
