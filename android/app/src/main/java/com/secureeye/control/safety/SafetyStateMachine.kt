package com.secureeye.control.safety

import android.os.SystemClock
import kotlin.math.sqrt

enum class SafetyState {
    IDLE,
    TRACKING,
    GAZE_STABLE,
    ACTION_CANDIDATE,
    CONFIRMATION,
    ACTION,
    COOLDOWN,
    PAUSED,
    TRACKING_LOST
}

data class SafetySnapshot(
    val state: SafetyState,
    val dwellProgress: Float, // 0.0 to 1.0 for UI progress ring
    val isActionTriggered: Boolean,
    val isPaused: Boolean,
    val statusMessage: String
)

/**
 * Robust temporal safety state machine preventing accidental phone actions.
 */
class SafetyStateMachine(
    var dwellDurationMs: Long = 750L,
    var stabilityRadiusPx: Float = 32.0f,
    var cooldownDurationMs: Long = 400L,
    var trackingLostTimeoutMs: Long = 180L
) {
    var currentState: SafetyState = SafetyState.IDLE
        private set

    var isPaused: Boolean = false
        private set

    private var stableAnchorX: Float = 0f
    private var stableAnchorY: Float = 0f
    private var stableStartTimeMs: Long = 0L
    private var lastActionTimeMs: Long = 0L
    private var lastTrackingSeenTimeMs: Long = 0L
    private var consecutiveStableFrames: Int = 0

    fun togglePause(): Boolean {
        isPaused = !isPaused
        currentState = if (isPaused) SafetyState.PAUSED else SafetyState.IDLE
        return isPaused
    }

    fun setPauseState(paused: Boolean) {
        isPaused = paused
        currentState = if (paused) SafetyState.PAUSED else SafetyState.IDLE
    }

    /**
     * Updates the safety state machine with latest gaze coordinate and tracking confidence.
     */
    fun update(
        cursorX: Float,
        cursorY: Float,
        faceDetected: Boolean,
        confidence: Float,
        timestampMs: Long = SystemClock.uptimeMillis()
    ): SafetySnapshot {
        if (isPaused) {
            return SafetySnapshot(SafetyState.PAUSED, 0f, false, true, "Eye Control Paused")
        }

        // Handle Tracking Loss Safety Gate
        if (!faceDetected || confidence < 0.60f) {
            if (timestampMs - lastTrackingSeenTimeMs > trackingLostTimeoutMs) {
                currentState = SafetyState.TRACKING_LOST
                consecutiveStableFrames = 0
                return SafetySnapshot(SafetyState.TRACKING_LOST, 0f, false, false, "Face Tracking Lost")
            }
        } else {
            lastTrackingSeenTimeMs = timestampMs
        }

        // Handle Cooldown after an action has fired
        if (timestampMs - lastActionTimeMs < cooldownDurationMs) {
            currentState = SafetyState.COOLDOWN
            return SafetySnapshot(SafetyState.COOLDOWN, 0f, false, false, "Action Cooldown")
        }

        // Measure spatial stability relative to anchor
        val dx = cursorX - stableAnchorX
        val dy = cursorY - stableAnchorY
        val dist = sqrt(dx * dx + dy * dy)

        if (dist > stabilityRadiusPx) {
            // User moved gaze to a new location -> reset dwell anchor
            stableAnchorX = cursorX
            stableAnchorY = cursorY
            stableStartTimeMs = timestampMs
            consecutiveStableFrames = 0
            currentState = SafetyState.TRACKING
            return SafetySnapshot(SafetyState.TRACKING, 0f, false, false, "Tracking Gaze")
        } else {
            consecutiveStableFrames++
            val elapsedDwell = timestampMs - stableStartTimeMs

            if (consecutiveStableFrames >= 3 && elapsedDwell < dwellDurationMs * 0.4f) {
                currentState = SafetyState.GAZE_STABLE
            } else if (elapsedDwell in (dwellDurationMs * 0.4f).toLong()..dwellDurationMs) {
                currentState = SafetyState.CONFIRMATION
            } else if (elapsedDwell > dwellDurationMs) {
                // ACTION FIRED!
                currentState = SafetyState.ACTION
                lastActionTimeMs = timestampMs
                stableStartTimeMs = timestampMs + cooldownDurationMs
                return SafetySnapshot(SafetyState.ACTION, 1.0f, true, false, "Intentional Action Confirmed")
            }

            val progress = (elapsedDwell.toFloat() / dwellDurationMs).coerceIn(0f, 1f)
            return SafetySnapshot(currentState, progress, false, false, "Dwelling ($consecutiveStableFrames frames)")
        }
    }

    fun reset() {
        currentState = SafetyState.IDLE
        stableStartTimeMs = 0L
        consecutiveStableFrames = 0
    }
}
