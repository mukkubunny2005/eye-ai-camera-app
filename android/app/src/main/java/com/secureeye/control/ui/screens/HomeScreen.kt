package com.secureeye.control.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PauseCircle
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.secureeye.control.ui.theme.Cyan400
import com.secureeye.control.ui.theme.Emerald500
import com.secureeye.control.ui.theme.Rose500
import com.secureeye.control.ui.theme.Slate800
import com.secureeye.control.ui.theme.Slate900

@Composable
fun HomeScreen(
    isPaused: Boolean,
    onTogglePause: () -> Unit,
    hasCameraPermission: Boolean,
    hasAccessibilityPermission: Boolean,
    onRequestCamera: () -> Unit,
    onOpenAccessibilitySettings: () -> Unit,
    onNavigateToCalibration: () -> Unit
) {
    var isEyeControlMasterOn by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hero Master Switch Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Eye Control Engine",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = if (isEyeControlMasterOn && !isPaused) "Active & Tracking Gaze" else if (isPaused) "Quick Paused" else "Disabled",
                            fontSize = 14.sp,
                            color = if (isEyeControlMasterOn && !isPaused) Emerald500 else Color.LightGray
                        )
                    }
                    Switch(
                        checked = isEyeControlMasterOn,
                        onCheckedChange = { isEyeControlMasterOn = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Cyan400,
                            checkedTrackColor = Color(0xFF0E3A52)
                        )
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = onTogglePause,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isPaused) Emerald500 else Color(0xFF334155)
                        )
                    ) {
                        Icon(
                            imageVector = if (isPaused) Icons.Default.PlayCircle else Icons.Default.PauseCircle,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (isPaused) "Resume" else "Quick Pause")
                    }

                    FilledTonalButton(
                        onClick = onNavigateToCalibration,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Calibrate")
                    }
                }
            }
        }

        // Live Diagnostic Telemetry Grid
        Text(
            text = "SYSTEM TELEMETRY",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF94A3B8),
            letterSpacing = 1.sp
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricBadge(
                title = "Camera FPS",
                value = "30.0 fps",
                subtitle = "640x480 RAM",
                color = Emerald500,
                modifier = Modifier.weight(1f)
            )
            MetricBadge(
                title = "Confidence",
                value = "94.2%",
                subtitle = "MediaPipe Mesh",
                color = Cyan400,
                modifier = Modifier.weight(1f)
            )
            MetricBadge(
                title = "Gaze State",
                value = if (isPaused) "PAUSED" else "STABLE",
                subtitle = "One-Euro Filter",
                color = if (isPaused) Color(0xFFFBBF24) else Emerald500,
                modifier = Modifier.weight(1f)
            )
        }

        // Permissions Status Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "System Permissions",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(12.dp))

                PermissionRow(
                    name = "Camera (On-Device Vision)",
                    isGranted = hasCameraPermission,
                    onFix = onRequestCamera
                )

                Spacer(modifier = Modifier.height(10.dp))

                PermissionRow(
                    name = "Accessibility Service (Touch / Gestures)",
                    isGranted = hasAccessibilityPermission,
                    onFix = onOpenAccessibilitySettings
                )
            }
        }
    }
}

@Composable
fun MetricBadge(
    title: String,
    value: String,
    subtitle: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Slate900),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(title, fontSize = 11.sp, color = Color(0xFF94A3B8))
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = color)
            Spacer(modifier = Modifier.height(2.dp))
            Text(subtitle, fontSize = 10.sp, color = Color(0xFF64748B))
        }
    }
}

@Composable
fun PermissionRow(
    name: String,
    isGranted: Boolean,
    onFix: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = if (isGranted) Icons.Default.CheckCircle else Icons.Default.Warning,
                contentDescription = null,
                tint = if (isGranted) Emerald500 else Rose500,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(name, fontSize = 13.sp, color = Color(0xFFE2E8F0))
        }
        if (!isGranted) {
            Button(
                onClick = onFix,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 4.dp)
            ) {
                Text("Enable", fontSize = 12.sp)
            }
        }
    }
}
