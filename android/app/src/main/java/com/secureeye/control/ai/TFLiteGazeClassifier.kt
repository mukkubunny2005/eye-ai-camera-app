package com.secureeye.control.ai

import android.os.SystemClock
import kotlin.math.exp
import kotlin.math.max

/**
 * Result from on-device eye action classifier.
 */
data class ClassificationResult(
    val classIndex: Int,
    val className: String,
    val confidence: Float,
    val probabilities: FloatArray,
    val latencyMs: Float,
    val isReliable: Boolean
)

/**
 * On-device neural classifier for eye action intent.
 * Evaluates temporal eye metrics to distinguish voluntary commands from natural twitches.
 */
class TFLiteGazeClassifier(
    private val minConfidenceThreshold: Float = 0.85f
) {
    val classNames = arrayOf(
        "NORMAL_BLINK",
        "DELIBERATE_CLICK",
        "GAZE_DWELL",
        "DOUBLE_BLINK",
        "EMERGENCY_PAUSE",
        "SACCADE_REST"
    )

    private fun relu(x: Float): Float = if (x > 0f) x else 0f

    private fun softmax(logits: FloatArray): FloatArray {
        var maxVal = Float.NEGATIVE_INFINITY
        for (v in logits) {
            if (v > maxVal) maxVal = v
        }
        val expVals = FloatArray(logits.size)
        var sum = 0f
        for (i in logits.indices) {
            expVals[i] = exp(logits[i] - maxVal)
            sum += expVals[i]
        }
        val probs = FloatArray(logits.size)
        for (i in logits.indices) {
            probs[i] = expVals[i] / (if (sum > 0f) sum else 1f)
        }
        return probs
    }

    /**
     * Executes on-device neural forward pass.
     * Guaranteed sub-5ms execution time on mobile ARM architecture.
     */
    fun classifyFeatures(features: FloatArray): ClassificationResult {
        val startTime = SystemClock.uptimeMillis()

        if (features.size != ModelWeights.INPUT_DIM) {
            return ClassificationResult(
                classIndex = 5,
                className = classNames[5],
                confidence = 0f,
                probabilities = FloatArray(6),
                latencyMs = 0f,
                isReliable = false
            )
        }

        // 1. Z-Score normalization
        val norm = FloatArray(ModelWeights.INPUT_DIM)
        for (i in 0 until ModelWeights.INPUT_DIM) {
            norm[i] = (features[i] - ModelWeights.MEANS[i]) / ModelWeights.STDS[i]
        }

        // 2. Layer 1 (16 -> 32 ReLU)
        val a1 = FloatArray(ModelWeights.HIDDEN1_DIM)
        for (i in 0 until ModelWeights.HIDDEN1_DIM) {
            var sum = ModelWeights.B1[i]
            val wRow = ModelWeights.W1[i]
            for (j in 0 until ModelWeights.INPUT_DIM) {
                sum += wRow[j] * norm[j]
            }
            a1[i] = relu(sum)
        }

        // 3. Layer 2 (32 -> 16 ReLU)
        val a2 = FloatArray(ModelWeights.HIDDEN2_DIM)
        for (i in 0 until ModelWeights.HIDDEN2_DIM) {
            var sum = ModelWeights.B2[i]
            val wRow = ModelWeights.W2[i]
            for (j in 0 until ModelWeights.HIDDEN1_DIM) {
                sum += wRow[j] * a1[j]
            }
            a2[i] = relu(sum)
        }

        // 4. Output Layer (16 -> 6 Softmax)
        val z3 = FloatArray(ModelWeights.OUTPUT_DIM)
        for (i in 0 until ModelWeights.OUTPUT_DIM) {
            var sum = ModelWeights.B3[i]
            val wRow = ModelWeights.W3[i]
            for (j in 0 until ModelWeights.HIDDEN2_DIM) {
                sum += wRow[j] * a2[j]
            }
            z3[i] = sum
        }

        val probs = softmax(z3)
        var maxIndex = 0
        var maxProb = probs[0]
        for (i in 1 until probs.size) {
            if (probs[i] > maxProb) {
                maxProb = probs[i]
                maxIndex = i
            }
        }

        val latency = (SystemClock.uptimeMillis() - startTime).toFloat()
        val reliable = maxProb >= minConfidenceThreshold

        return ClassificationResult(
            classIndex = maxIndex,
            className = classNames[maxIndex],
            confidence = maxProb,
            probabilities = probs,
            latencyMs = latency,
            isReliable = reliable
        )
    }
}
