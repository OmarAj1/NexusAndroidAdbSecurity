plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.example.nexus"
    compileSdk = 34 // CHANGED: 36 -> 34 (Stable for Android 14)

    tasks.register("npmInstall", Exec::class) {
        workingDir = rootProject.file("nexus-web")
        inputs.file(rootProject.file("nexus-web/package.json"))
        outputs.dir(rootProject.file("nexus-web/node_modules"))
        commandLine(
            if (System.getProperty("os.name").toLowerCase().contains("windows")) "npm.cmd" else "npm",
            "install",
            "--legacy-peer-deps"
        )
    }

    tasks.register("buildReactApp", Exec::class) {
        dependsOn("npmInstall")
        workingDir = rootProject.file("nexus-web")
        commandLine(if (System.getProperty("os.name").toLowerCase().contains("windows")) "npm.cmd" else "npm", "run", "build")
    }

    tasks.named("preBuild") {
        dependsOn("buildReactApp")
    }

    defaultConfig {
        applicationId = "com.example.nexus"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // --- ADD THIS BLOCK ---
        ndk {
            // Force include both standard architectures
            abiFilters += listOf("armeabi-v7a", "arm64-v8a")
        }
        // ----------------------

        externalNativeBuild {
            cmake {
                cppFlags += ""
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        // --- ADDED THIS BLOCK ---
        isCoreLibraryDesugaringEnabled = true

        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
    packaging {
        resources {
            excludes += "org/bouncycastle/x509/CertPathReviewerMessages_de.properties"
            excludes += "org/bouncycastle/x509/CertPathReviewerMessages.properties"
        }
    }
}

dependencies {
    // --- ADDED THIS LINE ---
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")

    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.constraintlayout)
    implementation(libs.libadb.android)
    implementation("org.conscrypt:conscrypt-android:2.5.3")
    implementation("org.bouncycastle:bcpkix-jdk15to18:1.81")
    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)
}