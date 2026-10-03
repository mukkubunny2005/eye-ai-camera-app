package com.secureeye.control.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore by preferencesDataStore(name = "eye_control_settings")

enum class ClickMethod {
    DWELL,
    DELIBERATE_BLINK,
    BOTH
}

data class UserEyeSettings(
    val isEyeControlEnabled: Boolean = true,
    val cursorSpeed: Float = 2.4f,
    val dwellDurationMs: Long = 750L,
    val clickMethod: ClickMethod = ClickMethod.DWELL,
    val earBlinkThreshold: Float = 0.18f,
    val deliberateBlinkMinMs: Long = 260L,
    val deliberateBlinkMaxMs: Long = 550L,
    val scrollEdgeMarginPercent: Float = 0.12f,
    val isHapticFeedbackEnabled: Boolean = true,
    val isSoundFeedbackEnabled: Boolean = false,
    val isHighContrastCursor: Boolean = true
)

class UserPreferencesRepository(private val context: Context) {

    private object Keys {
        val EYE_CONTROL_ENABLED = booleanPreferencesKey("eye_control_enabled")
        val CURSOR_SPEED = floatPreferencesKey("cursor_speed")
        val DWELL_DURATION_MS = longPreferencesKey("dwell_duration_ms")
        val CLICK_METHOD = stringPreferencesKey("click_method")
        val EAR_BLINK_THRESHOLD = floatPreferencesKey("ear_blink_threshold")
        val SCROLL_EDGE_MARGIN = floatPreferencesKey("scroll_edge_margin")
        val HAPTIC_FEEDBACK = booleanPreferencesKey("haptic_feedback")
    }

    val settingsFlow: Flow<UserEyeSettings> = context.dataStore.data.map { prefs ->
        UserEyeSettings(
            isEyeControlEnabled = prefs[Keys.EYE_CONTROL_ENABLED] ?: true,
            cursorSpeed = prefs[Keys.CURSOR_SPEED] ?: 2.4f,
            dwellDurationMs = prefs[Keys.DWELL_DURATION_MS] ?: 750L,
            clickMethod = try {
                ClickMethod.valueOf(prefs[Keys.CLICK_METHOD] ?: "DWELL")
            } catch (e: Exception) {
                ClickMethod.DWELL
            },
            earBlinkThreshold = prefs[Keys.EAR_BLINK_THRESHOLD] ?: 0.18f,
            scrollEdgeMarginPercent = prefs[Keys.SCROLL_EDGE_MARGIN] ?: 0.12f,
            isHapticFeedbackEnabled = prefs[Keys.HAPTIC_FEEDBACK] ?: true
        )
    }

    suspend fun setEyeControlEnabled(enabled: Boolean) {
        context.dataStore.edit { it[Keys.EYE_CONTROL_ENABLED] = enabled }
    }

    suspend fun setCursorSpeed(speed: Float) {
        context.dataStore.edit { it[Keys.CURSOR_SPEED] = speed }
    }

    suspend fun setDwellDuration(durationMs: Long) {
        context.dataStore.edit { it[Keys.DWELL_DURATION_MS] = durationMs }
    }

    suspend fun setClickMethod(method: ClickMethod) {
        context.dataStore.edit { it[Keys.CLICK_METHOD] = method.name }
    }
}
