package com.secureeye.control.tracking

import kotlin.math.abs
import kotlin.math.sqrt

/**
 * High-performance dual-stage gaze smoothing filter.
 * Combines an adaptive 1€ (One-Euro) filter with dead-zone thresholding to eliminate
 * micro-tremors during steady gaze dwell while maintaining zero lag during rapid saccades.
 */
class OneEuroFilter(
    private val minCutoff: Double = 1.0,  // Minimum cutoff frequency in Hz (stability at low speed)
    private val beta: Double = 0.05,      // Speed coefficient (responsiveness at high speed)
    private val dCutoff: Double = 1.0     // Derivative cutoff frequency in Hz
) {
    private var xPrev: Double? = null
    private var dxPrev: Double = 0.0
    private var tPrev: Long? = null

    private fun alpha(cutoff: Double, dt: Double): Double {
        val tau = 1.0 / (2.0 * Math.PI * cutoff)
        return 1.0 / (1.0 + tau / dt)
    }

    fun filter(x: Double, timestampMs: Long): Double {
        if (xPrev == null || tPrev == null) {
            xPrev = x
            dxPrev = 0.0
            tPrev = timestampMs
            return x
        }

        val dt = (timestampMs - tPrev!!) / 1000.0
        if (dt <= 0.0 || dt > 1.0) {
            xPrev = x
            tPrev = timestampMs
            return x
        }

        // Estimate derivative (velocity)
        val dx = (x - xPrev!!) / dt
        val aD = alpha(dCutoff, dt)
        val dxHat = aD * dx + (1.0 - aD) * dxPrev

        // Adaptive cutoff based on speed
        val cutoff = minCutoff + beta * abs(dxHat)
        val a = alpha(cutoff, dt)
        val xHat = a * x + (1.0 - a) * xPrev!!

        xPrev = xHat
        dxPrev = dxHat
        tPrev = timestampMs

        return xHat
    }

    fun reset() {
        xPrev = null
        dxPrev = 0.0
        tPrev = null
    }
}

/**
 * 2D Gaze point smoother with dead-zone stabilization.
 */
class GazeFilter(
    minCutoff: Double = 1.2,
    beta: Double = 0.06,
    private val deadZoneRadiusPx: Double = 8.0
) {
    private val filterX = OneEuroFilter(minCutoff, beta)
    private val filterY = OneEuroFilter(minCutoff, beta)
    private var lastStableX: Double = 0.0
    private var lastStableY: Double = 0.0

    fun filter(rawX: Double, rawY: Double, timestampMs: Long): Pair<Double, Double> {
        val smoothX = filterX.filter(rawX, timestampMs)
        val smoothY = filterY.filter(rawY, timestampMs)

        // Dead-zone calculation to stop cursor jitter when dwelling
        val dist = sqrt((smoothX - lastStableX) * (smoothX - lastStableX) + (smoothY - lastStableY) * (smoothY - lastStableY))
        return if (dist < deadZoneRadiusPx) {
            Pair(lastStableX, lastStableY)
        } else {
            lastStableX = smoothX
            lastStableY = smoothY
            Pair(smoothX, smoothY)
        }
    }

    fun reset() {
        filterX.reset()
        filterY.reset()
    }
}
