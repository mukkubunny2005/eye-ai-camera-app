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
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
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
import com.secureeye.control.ui.theme.Slate900

@Composable
fun ControlsScreen() {
    var cursorSpeed by remember { mutableFloatStateOf(2.4f) }
    var dwellDurationMs by remember { mutableFloatStateOf(750f) }
    var selectedClickMethod by remember { mutableStateOf("DWELL") }
    var hapticFeedback by remember { mutableStateOf(true) }
    var edgeScrollMargin by remember { mutableFloatStateOf(12f) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("INTERACTION CONTROLS", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8), letterSpacing = 1.sp)

        // Cursor Speed Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Cursor Sensitivity", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                    Text("${String.format("%.1f", cursorSpeed)}x", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Cyan400)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Slider(
                    value = cursorSpeed,
                    onValueChange = { cursorSpeed = it },
                    valueRange = 1.0f..5.0f,
                    steps = 19,
                    colors = SliderDefaults.colors(thumbColor = Cyan400, activeTrackColor = Cyan400)
                )
                Text("Controls the multiplier between physical iris displacement and screen movement.", fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }

        // Click Selection Method
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text("Selection / Click Method", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                Spacer(modifier = Modifier.height(10.dp))

                listOf(
                    Pair("DWELL", "Gaze Dwell (Recommended: Hold gaze steady on target)"),
                    Pair("DELIBERATE_BLINK", "Deliberate Blink (Intentional 300-500ms eye squeeze)"),
                    Pair("BOTH", "Hybrid (Allow both Dwell and Deliberate Blink)")
                ).forEach { (key, desc) ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedClickMethod == key,
                            onClick = { selectedClickMethod = key },
                            colors = RadioButtonDefaults.colors(selectedColor = Cyan400)
                        )
                        Text(desc, fontSize = 13.sp, color = Color(0xFFE2E8F0))
                    }
                }
            }
        }

        // Dwell Duration Slider
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Gaze Dwell Hold Time", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                    Text("${dwellDurationMs.toInt()} ms", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Cyan400)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Slider(
                    value = dwellDurationMs,
                    onValueChange = { dwellDurationMs = it },
                    valueRange = 400f..1500f,
                    steps = 11,
                    colors = SliderDefaults.colors(thumbColor = Cyan400, activeTrackColor = Cyan400)
                )
                Text("How long the eye must hold steady over a button before triggering a click.", fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }

        // Scroll Margin Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Edge Scroll Zone", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                    Text("${edgeScrollMargin.toInt()}%", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Cyan400)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Slider(
                    value = edgeScrollMargin,
                    onValueChange = { edgeScrollMargin = it },
                    valueRange = 5f..20f,
                    steps = 15,
                    colors = SliderDefaults.colors(thumbColor = Cyan400, activeTrackColor = Cyan400)
                )
                Text("Looking at the top or bottom edge triggers hands-free document scrolling.", fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }

        // Haptic Feedback Switch
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(18.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Haptic Click Feedback", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                    Text("Vibrates briefly when an eye action is confirmed.", fontSize = 12.sp, color = Color(0xFF64748B))
                }
                Switch(
                    checked = hapticFeedback,
                    onCheckedChange = { hapticFeedback = it },
                    colors = SwitchDefaults.colors(checkedThumbColor = Cyan400)
                )
            }
        }
    }
}
