package com.secureeye.control

import com.secureeye.control.tracking.BlinkDetectionEngine
import com.secureeye.control.tracking.EyeActionType
import com.secureeye.control.tracking.LandmarkPoint
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class BlinkDetectionTest {

    private lateinit var engine: BlinkDetectionEngine

    @Before
    fun setUp() {
        engine = BlinkDetectionEngine(
            earThreshold = 0.18f,
            minDeliberateDurationMs = 260L,
            maxDeliberateDurationMs = 550L,
            doubleBlinkWindowMs = 420L,
            emergencyPauseHoldMs = 850L,
            debounceCooldownMs = 350L
        )
    }

    @Test
    fun testEARCalculation_openEye() {
        // Typical open eye proportions
        val p1 = LandmarkPoint(0f, 0f)
        val p2 = LandmarkPoint(10f, 6f)
        val p3 = LandmarkPoint(20f, 6f)
        val p4 = LandmarkPoint(30f, 0f)
        val p5 = LandmarkPoint(20f, -6f)
        val p6 = LandmarkPoint(10f, -6f)

        val ear = engine.calculateEAR(p1, p2, p3, p4, p5, p6)
        // (12 + 12) / (2 * 30) = 24 / 60 = 0.40
        assertTrue("EAR should indicate open eye", ear > 0.35f)
    }

    @Test
    fun testNormalBlink_isRejectedWithoutClick() {
        var t = 1000L
        // Open
        assertEquals(EyeActionType.NONE, engine.processBlinkFrame(0.32f, 0.32f, t))

        // Closes for 120ms (involuntary blink)
        t += 30L
        assertEquals(EyeActionType.NONE, engine.processBlinkFrame(0.08f, 0.08f, t))
        t += 60L
        assertEquals(EyeActionType.NONE, engine.processBlinkFrame(0.08f, 0.08f, t))

        // Re-opens at 120ms
        t += 30L
        val action = engine.processBlinkFrame(0.32f, 0.32f, t)
        assertEquals(EyeActionType.NORMAL_BLINK_REJECTED, action)
    }

    @Test
    fun testDeliberateBlink_triggersClick() {
        var t = 2000L
        // Open
        engine.processBlinkFrame(0.32f, 0.32f, t)

        // Close intentionally for 350ms
        t += 30L
        engine.processBlinkFrame(0.06f, 0.06f, t)
        t += 320L
        engine.processBlinkFrame(0.06f, 0.06f, t)

        // Open after 350ms
        t += 30L
        val action = engine.processBlinkFrame(0.32f, 0.32f, t)
        assertEquals(EyeActionType.DELIBERATE_CLICK, action)
    }

    @Test
    fun testEmergencyPauseHold_triggersToggle() {
        var t = 5000L
        engine.processBlinkFrame(0.32f, 0.32f, t)

        // Close eye continuously for > 850ms
        t += 30L
        engine.processBlinkFrame(0.04f, 0.04f, t)
        t += 860L
        val action = engine.processBlinkFrame(0.04f, 0.04f, t)
        assertEquals(EyeActionType.LONG_BLINK_PAUSE_TOGGLE, action)
    }
}
