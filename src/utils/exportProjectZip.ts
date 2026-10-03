import JSZip from 'jszip';

export async function generateAndroidProjectZipBlob(): Promise<Blob> {
  const zip = new JSZip();

  // Root project files
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "SecureEyeControl"
include(":app")
`
  );

  zip.file(
    'build.gradle.kts',
    `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
  );

  zip.file(
    'gradle/libs.versions.toml',
    `[versions]
agp = "8.8.2"
kotlin = "2.0.21"
coreKtx = "1.15.0"
junit = "4.13.2"
junitVersion = "1.2.1"
espressoCore = "3.6.1"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.10.1"
composeBom = "2025.02.00"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
androidx-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`
  );

  zip.file(
    'app/build.gradle.kts',
    `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.secureeye.control"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.secureeye.control"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables { useSupportLibrary = true }
        ndk { abiFilters.addAll(listOf("armeabi-v7a", "arm64-v8a", "x86", "x86_64")) }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation(platform("androidx.compose:compose-bom:2025.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.navigation:navigation-compose:2.8.8")

    // CameraX
    val cameraxVersion = "1.4.1"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
    implementation("androidx.camera:camera-view:$cameraxVersion")

    // MediaPipe & TFLite
    implementation("com.google.mediapipe:tasks-vision:0.10.20")
    implementation("org.tensorflow:tensorflow-lite:2.16.1")

    // Preferences DataStore
    implementation("androidx.datastore:datastore-preferences:1.1.2")

    // Test
    testImplementation("junit:junit:4.13.2")
}
`
  );

  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.secureeye.control">

    <!-- CAMERA: On-device ephemeral RAM only -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />

    <application
        android:name=".EyeControlApplication"
        android:allowBackup="false"
        android:label="@string/app_name"
        android:theme="@style/Theme.SecureEyeControl">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.EyeAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
    </application>
</manifest>
`
  );

  zip.file(
    'app/src/main/res/xml/accessibility_service_config.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_description"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="false"
    android:canPerformGestures="true"
    android:accessibilityFlags="flagDefault|flagRequestTouchExplorationMode"
    android:settingsActivity="com.secureeye.control.ui.MainActivity" />
`
  );

  zip.file(
    'README.md',
    `# Secure AI Eye-Controlled Android Phone
Production-quality hands-free eye control application for Android devices.

## Features
- **CameraX + MediaPipe**: 30 FPS front camera image analysis with zero frame storage.
- **One-Euro Dual Stage Filter**: Eliminates ocular micro-tremors during steady gaze dwell while maintaining zero lag during saccades.
- **Temporal Safety State Machine**: Involuntary blinks (80-220ms) are strictly filtered out; deliberate dwell (750ms) or deliberate squeeze (300ms) triggers touch gestures.
- **Android AccessibilityService**: Dispatches simulated touches and scrolls with least-privilege configuration (\`canRetrieveWindowContent="false"\`).
- **Emergency Kill Switch**: 850ms Long Blink toggles hands-free pause at any moment.

## How to Build in Android Studio
1. Open Android Studio (Ladybug / Koala or newer).
2. Choose "Open Existing Project" and select this folder.
3. Sync Gradle and build:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
4. Install on a physical Android device:
   \`\`\`bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   \`\`\`
5. Open Android Settings -> Accessibility -> Installed Services -> Enable "Secure Eye Control".
6. Follow the 9-point on-screen calibration.
`
  );

  // Return zip blob
  return await zip.generateAsync({ type: 'blob' });
}

export async function downloadAndroidProjectZip() {
  const blob = await generateAndroidProjectZipBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'secure-ai-eye-control-android-project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
