package com.secureeye.control

import com.secureeye.control.safety.SafetyState
import com.secureeye.control.safety.SafetyStateMachine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class SafetyStateMachineTest {

    private lateinit var machine: SafetyStateMachine

    @Before
    fun setUp() {
        machine = SafetyStateMachine(
            dwellDurationMs = 700L,
            stabilityRadiusPx = 25f,
            cooldownDurationMs = 400L,
            trackingLostTimeoutMs = 150L
        )
    }

    @Test
    fun testInitialState_isIdle() {
        assertEquals(SafetyState.IDLE, machine.currentState)
    }

    @Test
    fun testDwellLifecycle_triggersActionWhenStable() {
        var t = 1000L
        // Frame 1: new position
        var snap = machine.update(500f, 500f, true, 0.95f, t)
        assertEquals(SafetyState.TRACKING, snap.state)
        assertFalse(snap.isActionTriggered)

        // Hold steady at 502, 501 for 3 frames
        t += 40L
        snap = machine.update(502f, 501f, true, 0.95f, t)
        t += 40L
        snap = machine.update(501f, 500f, true, 0.95f, t)
        t += 40L
        snap = machine.update(500f, 502f, true, 0.95f, t)
        assertEquals(SafetyState.GAZE_STABLE, snap.state)

        // Continue holding past dwell threshold (700ms)
        t += 620L
        snap = machine.update(501f, 501f, true, 0.95f, t)
        assertEquals(SafetyState.ACTION, snap.state)
        assertTrue(snap.isActionTriggered)

        // Immediate next frame enters Cooldown
        t += 30L
        snap = machine.update(501f, 501f, true, 0.95f, t)
        assertEquals(SafetyState.COOLDOWN, snap.state)
        assertFalse(snap.isActionTriggered)
    }

    @Test
    fun testTrackingLoss_triggersFailsafe() {
        var t = 2000L
        machine.update(500f, 500f, true, 0.95f, t)

        // Face lost for 180ms
        t += 180L
        val snap = machine.update(500f, 500f, false, 0.0f, t)
        assertEquals(SafetyState.TRACKING_LOST, snap.state)
        assertFalse(snap.isActionTriggered)
    }

    @Test
    fun testPauseToggle_blocksActions() {
        machine.togglePause()
        assertTrue(machine.isPaused)
        val snap = machine.update(500f, 500f, true, 0.95f, 3000L)
        assertEquals(SafetyState.PAUSED, snap.state)
        assertFalse(snap.isActionTriggered)
    }
}
