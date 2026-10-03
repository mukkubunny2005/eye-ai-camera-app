package com.secureeye.control.tracking

import kotlin.math.sqrt

/**
 * 2D Landmark coordinate representation.
 */
data class LandmarkPoint(val x: Float, val y: Float, val z: Float = 0f)

/**
 * Supported eye gesture action candidates.
 */
enum class EyeActionType {
    NONE,
    NORMAL_BLINK_REJECTED,
    DELIBERATE_CLICK,
    DOUBLE_BLINK,
    LONG_BLINK_PAUSE_TOGGLE,
    GAZE_DWELL_CLICK
}

/**
 * Blink and temporal eye action engine.
 * Computes EAR (Eye Aspect Ratio) and classifies eye closure duration against calibrated thresholds.
 */
class BlinkDetectionEngine(
    var earThreshold: Float = 0.18f,             // Below this is considered eye closed
    var minDeliberateDurationMs: Long = 260L,     // Intentional squeeze start threshold
    var maxDeliberateDurationMs: Long = 550L,     // Intentional squeeze max threshold
    var doubleBlinkWindowMs: Long = 420L,         // Maximum interval between two blinks for double blink
    var emergencyPauseHoldMs: Long = 850L,        // Long blink to toggle hands-free pause
    var debounceCooldownMs: Long = 350L           // Cooldown period after action execution
) {
    private var isEyeClosed: Boolean = false
    private var closureStartTimeMs: Long = 0L
    private var lastActionExecutedTimeMs: Long = 0L
    private var lastDeliberateBlinkEndTimeMs: Long = 0L

    /**
     * Calculates the Eye Aspect Ratio (EAR) given 6 standard landmarks:
     * p1: Outer corner, p4: Inner corner
     * p2, p3: Upper eyelid points
     * p5, p6: Lower eyelid points
     */
    fun calculateEAR(
        p1: LandmarkPoint, p2: LandmarkPoint, p3: LandmarkPoint,
        p4: LandmarkPoint, p5: LandmarkPoint, p6: LandmarkPoint
    ): Float {
        fun dist(a: LandmarkPoint, b: LandmarkPoint): Float {
            val dx = a.x - b.x
            val dy = a.y - b.y
            return sqrt(dx * dx + dy * dy)
        }

        val vertical1 = dist(p2, p6)
        val vertical2 = dist(p3, p5)
        val horizontal = dist(p1, p4)

        if (horizontal <= 0.0001f) return 0.3f
        return (vertical1 + vertical2) / (2.0f * horizontal)
    }

    /**
     * Processes instantaneous EAR measurements from left and right eyes.
     * Returns an EyeActionType candidate when a confirmed gesture finishes.
     */
    fun processBlinkFrame(
        leftEar: Float,
        rightEar: Float,
        timestampMs: Long
    ): EyeActionType {
        val avgEar = (leftEar + rightEar) / 2.0f
        val closedNow = avgEar < earThreshold

        // In cooldown state: reject actions to prevent double-firing
        if (timestampMs - lastActionExecutedTimeMs < debounceCooldownMs) {
            isEyeClosed = closedNow
            return EyeActionType.NONE
        }

        if (closedNow && !isEyeClosed) {
            // Eye just closed
            isEyeClosed = true
            closureStartTimeMs = timestampMs
            return EyeActionType.NONE
        } else if (closedNow && isEyeClosed) {
            // Eye remains closed - check for emergency pause gesture
            val closedDuration = timestampMs - closureStartTimeMs
            if (closedDuration >= emergencyPauseHoldMs) {
                lastActionExecutedTimeMs = timestampMs
                isEyeClosed = false // Consume state
                return EyeActionType.LONG_BLINK_PAUSE_TOGGLE
            }
            return EyeActionType.NONE
        } else if (!closedNow && isEyeClosed) {
            // Eye just opened! Evaluate closure duration
            val duration = timestampMs - closureStartTimeMs
            isEyeClosed = false

            if (duration < 60L) {
                // False positive noise / artifact
                return EyeActionType.NONE
            } else if (duration < minDeliberateDurationMs) {
                // Natural involuntary blink (80-220ms) -> REJECTED for click safety
                return EyeActionType.NORMAL_BLINK_REJECTED
            } else if (duration in minDeliberateDurationMs..maxDeliberateDurationMs) {
                // Check if this forms a double blink with a recent deliberate blink
                if (timestampMs - lastDeliberateBlinkEndTimeMs < doubleBlinkWindowMs) {
                    lastActionExecutedTimeMs = timestampMs
                    lastDeliberateBlinkEndTimeMs = 0L
                    return EyeActionType.DOUBLE_BLINK
                } else {
                    lastDeliberateBlinkEndTimeMs = timestampMs
                    lastActionExecutedTimeMs = timestampMs
                    return EyeActionType.DELIBERATE_CLICK
                }
            }
        }

        return EyeActionType.NONE
    }

    fun reset() {
        isEyeClosed = false
        closureStartTimeMs = 0L
        lastActionExecutedTimeMs = 0L
        lastDeliberateBlinkEndTimeMs = 0L
    }
}
