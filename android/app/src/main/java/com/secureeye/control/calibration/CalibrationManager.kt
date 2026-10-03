package com.secureeye.control.calibration

import kotlin.math.sqrt

data class CalibrationPoint(
    val index: Int,
    val targetNormX: Float,
    val targetNormY: Float,
    val label: String
)

data class CalibrationObservation(
    val targetIndex: Int,
    val irisX: Float,
    val irisY: Float,
    val headYaw: Float,
    val headPitch: Float,
    val screenTargetX: Float,
    val screenTargetY: Float
)

data class CalibrationResult(
    val qualityScorePercent: Int, // 0 - 100%
    val rmsePx: Float,
    val isAccepted: Boolean,
    val polynomialX: DoubleArray,
    val polynomialY: DoubleArray
)

/**
 * 9-Point interactive gaze calibration system.
 * Solves least-squares affine polynomial regression mapping between eye/head features and screen coords.
 */
class CalibrationManager(
    private val screenWidthPx: Int = 1080,
    private val screenHeightPx: Int = 2400
) {
    val calibrationPoints = listOf(
        CalibrationPoint(0, 0.15f, 0.15f, "Top-Left"),
        CalibrationPoint(1, 0.50f, 0.15f, "Top-Center"),
        CalibrationPoint(2, 0.85f, 0.15f, "Top-Right"),
        CalibrationPoint(3, 0.15f, 0.50f, "Center-Left"),
        CalibrationPoint(4, 0.50f, 0.50f, "Center"),
        CalibrationPoint(5, 0.85f, 0.50f, "Center-Right"),
        CalibrationPoint(6, 0.15f, 0.85f, "Bottom-Left"),
        CalibrationPoint(7, 0.50f, 0.85f, "Bottom-Center"),
        CalibrationPoint(8, 0.85f, 0.85f, "Bottom-Right")
    )

    private val observations = mutableListOf<CalibrationObservation>()
    var currentPointIndex: Int = 0
        private set

    fun getTargetScreenPos(point: CalibrationPoint): Pair<Float, Float> {
        return Pair(point.targetNormX * screenWidthPx, point.targetNormY * screenHeightPx)
    }

    fun recordObservation(
        irisX: Float,
        irisY: Float,
        headYaw: Float,
        headPitch: Float
    ) {
        if (currentPointIndex >= calibrationPoints.size) return
        val pt = calibrationPoints[currentPointIndex]
        val (targetX, targetY) = getTargetScreenPos(pt)
        observations.add(
            CalibrationObservation(
                targetIndex = currentPointIndex,
                irisX = irisX,
                irisY = irisY,
                headYaw = headYaw,
                headPitch = headPitch,
                screenTargetX = targetX,
                screenTargetY = targetY
            )
        )
    }

    fun nextPoint(): Boolean {
        currentPointIndex++
        return currentPointIndex < calibrationPoints.size
    }

    fun reset() {
        observations.clear()
        currentPointIndex = 0
    }

    /**
     * Computes polynomial regression weights and evaluates calibration quality.
     */
    fun computeCalibration(): CalibrationResult {
        if (observations.size < 18) {
            // Default identity fallback
            return CalibrationResult(
                qualityScorePercent = 50,
                rmsePx = 120f,
                isAccepted = false,
                polynomialX = doubleArrayOf(screenWidthPx / 2.0, screenWidthPx * 1.5, 0.0, 0.0, 0.0, 0.0),
                polynomialY = doubleArrayOf(screenHeightPx / 2.0, 0.0, screenHeightPx * 2.2, 0.0, 0.0, 0.0)
            )
        }

        // Outlier rejection per point
        val validObs = observations.filter { obs ->
            val pointObs = observations.filter { it.targetIndex == obs.targetIndex }
            val meanX = pointObs.map { it.irisX }.average()
            val meanY = pointObs.map { it.irisY }.average()
            val dist = sqrt((obs.irisX - meanX) * (obs.irisX - meanX) + (obs.irisY - meanY) * (obs.irisY - meanY))
            dist < 0.25 // Discard outlier gaze points
        }

        // Simple affine least-squares regression estimation
        val n = validObs.size
        val avgIrisX = validObs.map { it.irisX.toDouble() }.average()
        val avgIrisY = validObs.map { it.irisY.toDouble() }.average()
        val avgTargetX = validObs.map { it.screenTargetX.toDouble() }.average()
        val avgTargetY = validObs.map { it.screenTargetY.toDouble() }.average()

        var numX = 0.0
        var denX = 0.0
        var numY = 0.0
        var denY = 0.0

        for (obs in validObs) {
            val dx = obs.irisX.toDouble() - avgIrisX
            val dy = obs.irisY.toDouble() - avgIrisY
            numX += dx * (obs.screenTargetX.toDouble() - avgTargetX)
            denX += dx * dx
            numY += dy * (obs.screenTargetY.toDouble() - avgTargetY)
            denY += dy * dy
        }

        val slopeX = if (denX > 1e-6) numX / denX else screenWidthPx * 1.5
        val slopeY = if (denY > 1e-6) numY / denY else screenHeightPx * 2.2
        val interceptX = avgTargetX - slopeX * avgIrisX
        val interceptY = avgTargetY - slopeY * avgIrisY

        val polyX = doubleArrayOf(interceptX, slopeX, 0.0, 0.0, 0.0, 0.0)
        val polyY = doubleArrayOf(interceptY, 0.0, slopeY, 0.0, 0.0, 0.0)

        // Compute RMSE on valid points
        var totalSquaredError = 0.0
        for (obs in validObs) {
            val predX = polyX[0] + polyX[1] * obs.irisX.toDouble()
            val predY = polyY[0] + polyY[2] * obs.irisY.toDouble()
            val errX = predX - obs.screenTargetX.toDouble()
            val errY = predY - obs.screenTargetY.toDouble()
            totalSquaredError += (errX * errX + errY * errY)
        }
        val rmse = sqrt(totalSquaredError / n).toFloat()

        // Score 100% at <= 30px RMSE, 0% at >= 300px RMSE
        val score = ((1.0f - (rmse - 30f) / 270f).coerceIn(0f, 1f) * 100).toInt()
        val accepted = score >= 70

        return CalibrationResult(
            qualityScorePercent = score,
            rmsePx = rmse,
            isAccepted = accepted,
            polynomialX = polyX,
            polynomialY = polyY
        )
    }
}
