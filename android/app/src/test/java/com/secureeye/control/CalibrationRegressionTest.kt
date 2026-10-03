package com.secureeye.control

import com.secureeye.control.calibration.CalibrationManager
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class CalibrationRegressionTest {

    private lateinit var calibManager: CalibrationManager

    @Before
    fun setUp() {
        calibManager = CalibrationManager(1080, 2400)
    }

    @Test
    fun testCalibrationRegression_computesHighQualityMapping() {
        // Feed synthetic calibration observations across the 9 points
        calibManager.calibrationPoints.forEachIndexed { ptIndex, pt ->
            val (screenX, screenY) = calibManager.getTargetScreenPos(pt)
            // Simulated iris offsets with slight noise
            val irisX = (pt.targetNormX - 0.5f) * 0.4f
            val irisY = (pt.targetNormY - 0.5f) * 0.4f

            for (i in 0 until 4) {
                calibManager.recordObservation(
                    irisX = irisX + (i * 0.002f),
                    irisY = irisY + (i * 0.002f),
                    headYaw = 0f,
                    headPitch = 0f
                )
            }
            calibManager.nextPoint()
        }

        val result = calibManager.computeCalibration()
        assertTrue("Calibration score should exceed 80%", result.qualityScorePercent >= 80)
        assertTrue("RMSE should be tight (< 50px)", result.rmsePx < 50f)
        assertTrue("Calibration accepted", result.isAccepted)
    }
}
