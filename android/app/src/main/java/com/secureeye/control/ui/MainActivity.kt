package com.secureeye.control.ui

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Adjust
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.secureeye.control.security.SecurityManager
import com.secureeye.control.ui.screens.AiModelScreen
import com.secureeye.control.ui.screens.CalibrationScreen
import com.secureeye.control.ui.screens.ControlsScreen
import com.secureeye.control.ui.screens.HelpScreen
import com.secureeye.control.ui.screens.HomeScreen
import com.secureeye.control.ui.screens.SecurityPrivacyScreen
import com.secureeye.control.ui.theme.Cyan400
import com.secureeye.control.ui.theme.SecureEyeControlTheme
import com.secureeye.control.ui.theme.Slate900

sealed class Screen(val route: String, val title: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    object Home : Screen("home", "Home", Icons.Default.Home)
    object Calibration : Screen("calibration", "Calibration", Icons.Default.Adjust)
    object Controls : Screen("controls", "Controls", Icons.Default.Tune)
    object AI : Screen("ai", "AI Model", Icons.Default.Memory)
    object Security : Screen("security", "Security", Icons.Default.Security)
    object Help : Screen("help", "Help", Icons.Default.HelpOutline)
}

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SecureEyeControlTheme {
                MainAppLayout()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppLayout() {
    val navController = rememberNavController()
    val context = LocalContext.current
    var currentRoute by remember { mutableStateOf(Screen.Home.route) }
    var isPaused by remember { mutableStateOf(false) }
    var hasCameraPerm by remember { mutableStateOf(SecurityManager.hasCameraPermission(context)) }
    var hasA11yPerm by remember { mutableStateOf(SecurityManager.isAccessibilityServiceEnabled(context)) }

    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasCameraPerm = granted
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPerm) {
            cameraLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    val navItems = listOf(
        Screen.Home,
        Screen.Calibration,
        Screen.Controls,
        Screen.AI,
        Screen.Security,
        Screen.Help
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Secure Eye Control", color = Cyan400) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate900),
                actions = {
                    IconButton(onClick = { isPaused = !isPaused }) {
                        Icon(
                            imageVector = if (isPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                            contentDescription = if (isPaused) "Resume Eye Control" else "Quick Pause",
                            tint = if (isPaused) Cyan400 else androidx.compose.ui.graphics.Color.LightGray
                        )
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Slate900) {
                navItems.forEach { item ->
                    NavigationBarItem(
                        selected = currentRoute == item.route,
                        onClick = {
                            currentRoute = item.route
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.startDestinationId)
                                launchSingleTop = true
                            }
                        },
                        icon = { Icon(item.icon, contentDescription = item.title) },
                        label = { Text(item.title) }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    isPaused = isPaused,
                    onTogglePause = { isPaused = !isPaused },
                    hasCameraPermission = hasCameraPerm,
                    hasAccessibilityPermission = hasA11yPerm,
                    onRequestCamera = { cameraLauncher.launch(Manifest.permission.CAMERA) },
                    onOpenAccessibilitySettings = {
                        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                        context.startActivity(intent)
                    },
                    onNavigateToCalibration = {
                        currentRoute = Screen.Calibration.route
                        navController.navigate(Screen.Calibration.route)
                    }
                )
            }
            composable(Screen.Calibration.route) {
                CalibrationScreen()
            }
            composable(Screen.Controls.route) {
                ControlsScreen()
            }
            composable(Screen.AI.route) {
                AiModelScreen()
            }
            composable(Screen.Security.route) {
                SecurityPrivacyScreen()
            }
            composable(Screen.Help.route) {
                HelpScreen()
            }
        }
    }
}
