package com.secureeye.control.tracking

import kotlin.math.max
import kotlin.math.min

/**
 * High-precision mathematical gaze estimation engine.
 * Computes normalized iris displacement within the ocular palpebral aperture,
 * fuses head pose compensation, and projects to Android screen pixel coordinates.
 */
class GazeEstimationEngine(
    var screenWidthPx: Int = 1080,
    var screenHeightPx: Int = 2400,
    var cursorSensitivity: Float = 2.4f,
    var deadZoneMarginPx: Int = 24
) {
    // 6-term polynomial calibration matrix parameters:
    // ScreenX = a0 + a1*irisX + a2*irisY + a3*irisX^2 + a4*irisY^2 + a5*yaw
    // ScreenY = b0 + b1*irisX + b2*irisY + b3*irisX^2 + b4*irisY^2 + b5*pitch
    private var calibX = doubleArrayOf(screenWidthPx / 2.0, screenWidthPx * 1.5, 0.0, 0.0, 0.0, screenWidthPx * 0.02)
    private var calibY = doubleArrayOf(screenHeightPx / 2.0, 0.0, screenHeightPx * 2.2, 0.0, 0.0, screenHeightPx * 0.03)

    private val gazeFilter = GazeFilter()

    fun updateScreenDimensions(width: Int, height: Int) {
        this.screenWidthPx = width
        this.screenHeightPx = height
        if (calibX[0] == 540.0) {
            calibX[0] = width / 2.0
            calibX[1] = width * 1.5
            calibY[0] = height / 2.0
            calibY[2] = height * 2.2
        }
    }

    fun setCalibrationCoefficients(polyX: DoubleArray, polyY: DoubleArray) {
        if (polyX.size >= 6 && polyY.size >= 6) {
            calibX = polyX.copyOf()
            calibY = polyY.copyOf()
        }
    }

    /**
     * Estimates raw and smoothed screen cursor coordinates.
     * @param leftIrisOffset Normalized left eye iris offset (-1.0 to 1.0)
     * @param rightIrisOffset Normalized right eye iris offset (-1.0 to 1.0)
     * @param headYaw Head rotation in degrees (-30 to 30)
     * @param headPitch Head vertical tilt in degrees (-20 to 20)
     * @param timestampMs Current frame timestamp
     */
    fun estimateGazePoint(
        leftIrisOffset: Pair<Float, Float>,
        rightIrisOffset: Pair<Float, Float>,
        headYaw: Float,
        headPitch: Float,
        timestampMs: Long
    ): Pair<Float, Float> {
        val avgIrisX = ((leftIrisOffset.first + rightIrisOffset.first) / 2.0).toDouble()
        val avgIrisY = ((leftIrisOffset.second + rightIrisOffset.second) / 2.0).toDouble()
        val yaw = headYaw.toDouble()
        val pitch = headPitch.toDouble()

        // Evaluate bivariate polynomial regression mapping
        val rawX = calibX[0] +
                calibX[1] * avgIrisX * cursorSensitivity +
                calibX[2] * avgIrisY +
                calibX[3] * avgIrisX * avgIrisX +
                calibX[4] * avgIrisY * avgIrisY +
                calibX[5] * yaw

        val rawY = calibY[0] +
                calibY[1] * avgIrisX +
                calibY[2] * avgIrisY * cursorSensitivity +
                calibY[3] * avgIrisX * avgIrisX +
                calibY[4] * avgIrisY * avgIrisY +
                calibY[5] * pitch

        // Apply One-Euro filter + deadzone
        val (filteredX, filteredY) = gazeFilter.filter(rawX, rawY, timestampMs)

        // Clamp safely to screen boundaries
        val clampedX = max(deadZoneMarginPx.toDouble(), min((screenWidthPx - deadZoneMarginPx).toDouble(), filteredX))
        val clampedY = max(deadZoneMarginPx.toDouble(), min((screenHeightPx - deadZoneMarginPx).toDouble(), filteredY))

        return Pair(clampedX.toFloat(), clampedY.toFloat())
    }

    fun reset() {
        gazeFilter.reset()
    }
}
