package com.secureeye.control.ui.screens

import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.secureeye.control.ui.theme.Cyan400
import com.secureeye.control.ui.theme.Emerald500
import com.secureeye.control.ui.theme.Slate900

@Composable
fun CalibrationScreen() {
    var isCalibrating by remember { mutableStateOf(false) }
    var currentPointIndex by remember { mutableStateOf(4) } // Start center
    var qualityScore by remember { mutableStateOf(92) } // Calibrated score
    var rmsePx by remember { mutableStateOf(24.5f) }

    val points = listOf(
        Pair(0.15f, 0.15f), Pair(0.50f, 0.15f), Pair(0.85f, 0.15f),
        Pair(0.15f, 0.50f), Pair(0.50f, 0.50f), Pair(0.85f, 0.50f),
        Pair(0.15f, 0.85f), Pair(0.50f, 0.85f), Pair(0.85f, 0.85f)
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "9-Point Personalized Gaze Calibration",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        Text(
            text = "Follow the glowing cyan target with your eyes without moving your head.",
            fontSize = 13.sp,
            color = Color(0xFF94A3B8),
            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
        )

        // Calibration Interactive Viewport
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(Slate900, RoundedCornerShape(16.dp))
                .padding(16.dp)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height

                // Draw 9 target anchors
                points.forEachIndexed { idx, (nx, ny) ->
                    val cx = nx * w
                    val cy = ny * h
                    val isCurrent = idx == currentPointIndex

                    drawCircle(
                        color = if (isCurrent) Cyan400 else Color(0xFF334155),
                        radius = if (isCurrent) 28f else 10f,
                        center = Offset(cx, cy)
                    )
                    if (isCurrent) {
                        drawCircle(
                            color = Color.White,
                            radius = 10f,
                            center = Offset(cx, cy)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Calibration Metrics Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Calibration Quality", fontSize = 14.sp, color = Color.LightGray)
                    Text("$qualityScore% (Excellent)", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Emerald500)
                }

                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { qualityScore / 100f },
                    modifier = Modifier.fillMaxWidth().height(8.dp),
                    color = Emerald500,
                    trackColor = Color(0xFF1E293B)
                )

                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Gaze Mapping RMSE", fontSize = 12.sp, color = Color(0xFF64748B))
                    Text("${rmsePx} px", fontSize = 12.sp, color = Color.White)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = {
                currentPointIndex = (currentPointIndex + 1) % 9
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Cyan400),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Next Target Point (${currentPointIndex + 1}/9)", color = Color.Black, fontWeight = FontWeight.Bold)
        }
    }
}
