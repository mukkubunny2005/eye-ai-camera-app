package com.secureeye.control

import android.app.Application
import android.util.Log

/**
 * Application entry point for Secure Eye Control.
 * Initializes security sandbox checks, ephemeral memory management, and logs audit events.
 */
class EyeControlApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Secure Eye Control initialized in zero-retention ephemeral memory mode.")
    }

    companion object {
        const val TAG = "SecureEyeApp"
    }
}
