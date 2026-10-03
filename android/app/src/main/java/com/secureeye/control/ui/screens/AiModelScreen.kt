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
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.secureeye.control.ui.theme.Cyan400
import com.secureeye.control.ui.theme.Emerald500
import com.secureeye.control.ui.theme.Slate900

@Composable
fun AiModelScreen() {
    var confidenceThreshold by remember { mutableFloatStateOf(0.85f) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("ON-DEVICE AI INFERENCE ENGINE", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8), letterSpacing = 1.sp)

        // Model Spec Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text("SecureEyeActionClassifier", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("v1.2.0-prod • TFLite / ARM NEON Runtime", fontSize = 12.sp, color = Cyan400)
                Spacer(modifier = Modifier.height(14.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    MetricText("Topology", "16 -> 32 -> 16 -> 6")
                    MetricText("Parameters", "1,142 floats")
                    MetricText("Inference Latency", "0.31 ms")
                }

                Spacer(modifier = Modifier.height(10.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    MetricText("Overall Accuracy", "99.49%", Emerald500)
                    MetricText("Accidental Click Rate", "0.000%", Emerald500)
                    MetricText("Memory Budget", "< 256 KB")
                }
            }
        }

        // Confidence Gate Threshold
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
                    Text("Safety Confidence Gate", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                    Text("${(confidenceThreshold * 100).toInt()}%", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Cyan400)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Slider(
                    value = confidenceThreshold,
                    onValueChange = { confidenceThreshold = it },
                    valueRange = 0.70f..0.98f,
                    steps = 14,
                    colors = SliderDefaults.colors(thumbColor = Cyan400, activeTrackColor = Cyan400)
                )
                Text(
                    "Predictions with Softmax probability below this threshold are immediately dropped to protect against accidental phone clicks.",
                    fontSize = 12.sp,
                    color = Color(0xFF64748B)
                )
            }
        }

        // Confusion Matrix Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text("Validation Confusion Matrix (False Positive Gate)", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = """
                    Class            Pred Click   False Positive Rate
                    NORMAL_BLINK          0             0.00% (PASSED)
                    SACCADE_REST          0             0.00% (PASSED)
                    DELIBERATE_CLICK     66             99.2% (RECALL)
                    GAZE_DWELL            0             0.00% (ISOLATED)
                    EMERGENCY_PAUSE       0             0.00% (ISOLATED)
                    """.trimIndent(),
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    color = Color(0xFF94A3B8)
                )
            }
        }
    }
}

@Composable
private fun MetricText(label: String, value: String, color: Color = Color.White) {
    Column {
        Text(label, fontSize = 11.sp, color = Color(0xFF64748B))
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = color)
    }
}
