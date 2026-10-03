package com.secureeye.control.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Slate950 = Color(0xFF020617)
val Slate900 = Color(0xFF0F172A)
val Slate800 = Color(0xFF1E293B)
val Cyan500 = Color(0xFF06B6D4)
val Cyan400 = Color(0xFF22D3EE)
val Emerald500 = Color(0xFF10B981)
val Rose500 = Color(0xFFF43F5E)
val Amber500 = Color(0xFFF59E0B)

private val DarkColorScheme = darkColorScheme(
    primary = Cyan400,
    onPrimary = Slate950,
    primaryContainer = Color(0xFF0E3A52),
    onPrimaryContainer = Color(0xFFE0F2FE),
    secondary = Emerald500,
    onSecondary = Slate950,
    background = Slate950,
    surface = Slate900,
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF1F5F9),
    error = Rose500
)

@Composable
fun SecureEyeControlTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
