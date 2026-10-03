package com.secureeye.control.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.secureeye.control.security.SecurityManager
import com.secureeye.control.ui.theme.Cyan400
import com.secureeye.control.ui.theme.Emerald500
import com.secureeye.control.ui.theme.Slate900

@Composable
fun SecurityPrivacyScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("SECURITY & LEAST-PRIVILEGE AUDIT", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8), letterSpacing = 1.sp)

        // Privacy Guarantee Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Shield, contentDescription = null, tint = Emerald500)
                    Text(" On-Device Security Model", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "All camera processing, face mesh detection, iris localization, and neural inference occur strictly in local RAM on your phone. No camera frames or biometric data ever leave this device.",
                    fontSize = 13.sp,
                    color = Color(0xFFCBD5E1),
                    lineHeight = 18.sp
                )
            }
        }

        // Ephemeral Frame Guarantee
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Lock, contentDescription = null, tint = Cyan400)
                    Text(" Ephemeral Frame Lifecycle", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = """
                    1. Camera Hardware -> Android ImageProxy (YUV_420_888).
                    2. Ephemeral RAM -> MediaPipe Landmarker extracts 16 scalar features.
                    3. ImageProxy is IMMEDIATELY closed and memory released.
                    4. Raw pixels are NEVER written to flash storage or cache.
                    5. Network permissions: Zero Internet permission declared in manifest.
                    """.trimIndent(),
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    color = Color(0xFF94A3B8),
                    lineHeight = 16.sp
                )
            }
        }

        // Accessibility Sandboxing
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text("Accessibility Service Sandboxing", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "canRetrieveWindowContent is permanently disabled in the service configuration. The eye control service cannot read text, passwords, or personal messages in any app. It only possesses gesture dispatch permissions (canPerformGestures=true) to move the cursor and tap.",
                    fontSize = 13.sp,
                    color = Color(0xFFCBD5E1),
                    lineHeight = 18.sp
                )
            }
        }

        // Formal Specification Report
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF030712)),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = SecurityManager.PRIVACY_AUDIT_REPORT,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
                color = Color(0xFF38BDF8),
                modifier = Modifier.padding(14.dp),
                lineHeight = 16.sp
            )
        }
    }
}
