package com.secureeye.control.tracking

import android.content.Context
import android.util.Log
import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * CameraX Manager for hands-free eye control.
 * Features:
 * - Front camera lifecycle binding
 * - ImageAnalysis at 640x480 resolution (optimized for CV latency)
 * - STRATEGY_KEEP_ONLY_LATEST to prevent frame buffering lag
 * - Immediate imageProxy.close() for zero frame retention
 */
class CameraManager(
    private val context: Context,
    private val onFrameAnalyzed: (ImageProxy) -> Unit
) {
    private var cameraExecutor: ExecutorService? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var isStreaming = false

    fun startCamera(lifecycleOwner: LifecycleOwner, previewSurface: Preview.SurfaceProvider? = null) {
        if (isStreaming) return

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraExecutor = Executors.newSingleThreadExecutor()

        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()

                val cameraSelector = CameraSelector.Builder()
                    .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
                    .build()

                val imageAnalysis = ImageAnalysis.Builder()
                    .setTargetResolution(Size(640, 480))
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888)
                    .build()

                imageAnalysis.setAnalyzer(cameraExecutor!!) { imageProxy ->
                    try {
                        onFrameAnalyzed(imageProxy)
                    } finally {
                        // CRITICAL: Always close ImageProxy immediately to free camera buffer
                        imageProxy.close()
                    }
                }

                cameraProvider?.unbindAll()

                if (previewSurface != null) {
                    val preview = Preview.Builder().build().also {
                        it.surfaceProvider = previewSurface
                    }
                    cameraProvider?.bindToLifecycle(lifecycleOwner, cameraSelector, preview, imageAnalysis)
                } else {
                    cameraProvider?.bindToLifecycle(lifecycleOwner, cameraSelector, imageAnalysis)
                }

                isStreaming = true
                Log.d(TAG, "CameraX front camera started successfully.")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to bind CameraX lifecycle", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    fun stopCamera() {
        if (!isStreaming) return
        try {
            cameraProvider?.unbindAll()
            cameraExecutor?.shutdown()
            cameraExecutor = null
            isStreaming = false
            Log.d(TAG, "CameraX front camera stopped. Privacy guarantees active.")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping CameraX", e)
        }
    }

    fun isCameraActive(): Boolean = isStreaming

    companion object {
        const val TAG = "EyeCameraManager"
    }
}
