package com.secureeye.control.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.secureeye.control.ui.theme.Cyan400
import com.secureeye.control.ui.theme.Slate900

@Composable
fun HelpScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("HOW TO USE EYE CONTROL", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8), letterSpacing = 1.sp)

        HelpStepCard(
            step = "1",
            title = "Device Positioning",
            description = "Prop your phone on a stand or table 35-50 cm (14-20 inches) from your face at eye level. Ensure even lighting on your face without direct backlighting behind you."
        )

        HelpStepCard(
            step = "2",
            title = "Personalized Calibration",
            description = "Navigate to the 'Calibration' tab. Look directly at each of the 9 glowing targets as they appear. Keep your head stationary and move only your eyes."
        )

        HelpStepCard(
            step = "3",
            title = "Moving the Cursor & Clicking",
            description = "The virtual cyan cursor follows your eye gaze in real time. To click any app or button, simply hold your gaze steady on the target (Dwell for 750ms) until the radial green ring completes."
        )

        HelpStepCard(
            step = "4",
            title = "Scrolling Hands-Free",
            description = "Look towards the top 12% of the screen to scroll upward, or look towards the bottom 12% of the screen to scroll downward."
        )

        HelpStepCard(
            step = "5",
            title = "Emergency Pause / Resume",
            description = "Close your eyes intentionally for 850 milliseconds (Long Blink) to toggle Hands-Free Pause at any moment. Repeat to resume control."
        )
    }
}

@Composable
fun HelpStepCard(step: String, title: String, description: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Slate900),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(text = "STEP $step: $title", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Cyan400)
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = description, fontSize = 13.sp, color = Color(0xFFCBD5E1), lineHeight = 18.sp)
        }
    }
}
