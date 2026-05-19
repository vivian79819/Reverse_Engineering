# Reverse Engineering Security Fortification Project (McDonald Manager)

This project is a React Native mobile application built using the Expo framework.

Expo was used to simplify React Native development and provide a faster development workflow for Android application testing and deployment. The project combines JavaScript/TypeScript frontend code with custom native Android security modules written in Kotlin.

The application was fortified with multiple Android security protections to make reverse engineering, runtime instrumentation, API interception, and APK tampering more difficult.

Implemented security protections include:
- ProGuard/R8 obfuscation
- API key hardening
- SSL pinning
- Frida detection
- Root detection

## Development Environment

This project requires a custom Android development build because Expo Go does not support custom native security modules such as:
- SSL pinning
- Frida detection
- Root detection
- ApiKeyModule

Development and testing were performed using:
- Node.js
- npm
- Expo CLI
- Android Studio Emulator
- React Native / Expo
- Kotlin native Android modules

## Installation

Install project dependencies:

```bash
npm install
```

## Android Prebuild

Generate the native Android project required for custom native security modules:

```bash
npx expo prebuild --platform android
```

This command generates the native Android folder and applies custom configurations such as:
- ProGuard/R8 rules
- Native module integration
- Android Gradle configuration
- Security plugin configuration

## Running the Application

Run the Android development build:

```bash
npx expo run:android
```

This command:
- Builds the Android APK
- Launches the Android emulator or connected device
- Installs the application
- Starts the Metro bundler for React Native

## Expo Go Limitation

Expo Go cannot load custom native security modules. Therefore, features such as:
- SSL pinning
- Frida detection
- Root detection
- ApiKeyModule

will not function correctly inside Expo Go.

A full Android development build is required for accurate security testing.

## Security Overview

The application uses layered security protections to increase resistance against:
- Reverse engineering
- Static APK analysis
- Runtime instrumentation
- Man-in-the-middle attacks
- API key extraction
- Rooted device tampering

Each protection layer is documented in the following sections.

### 1. ProGuard (R8)

ProGuard/R8 was implemented to make reverse engineering and static analysis of the APK significantly more difficult.
The protection works by shrinking, optimizing, and obfuscating the compiled application during the Android build process.
The following security improvements were added:

- Code obfuscation:
  - Class names, method names, and variable names are renamed into unreadable identifiers.
  - This makes JADX and APK decompilation output much harder to understand.

- Dead code removal:
  - Unused classes, methods, and resources are removed from the final APK.
  - This reduces APK size and minimizes exposed attack surface.

- Optimization:
  - Certain bytecode optimizations are applied during compilation to improve performance and reduce unnecessary code paths.

- Keep rules:
  - Custom keep rules were added to prevent important native modules and security-related classes from breaking during obfuscation.
  - This includes:
    - Frida detection module
    - SSL pinning module
    - React Native bridge modules
    - ApiKeyModule

Implementation details:
- `plugins/withSecurityProguard.js` was used to automatically append required ProGuard rules during Expo prebuild.
- `android/app/proguard-rules.pro` contains the custom security rules.
- R8 obfuscation is applied during release builds.

Example protections added:
```pro
-keep class expo.modules.** { *; }
-keep class com.anonymous.Reverse_Engineering.** { *; }
-dontwarn okhttp3.**
``` 
### 2. Key Hardening / API Key Protection

Additional key hardening techniques were implemented to reduce the risk of API key extraction through APK reverse engineering and static analysis.

The application avoids directly exposing sensitive API keys inside JavaScript source code or easily readable configuration files.

Security improvements implemented:

- Native key access:
  - Sensitive API keys are accessed through a custom Android native module (`ApiKeyModule`) instead of being fully exposed in React Native JavaScript code.
  - This increases the difficulty of extracting keys using simple React Native bundle inspection.

- Environment variable separation:
  - `.env` and `.env.example` were used to separate configuration values from application logic.
  - Example keys are stored separately from production secrets.

- Obfuscation support:
  - ProGuard/R8 obfuscation was applied to make native key-related logic harder to analyse in JADX or APKTool.

- Reduced plaintext exposure:
  - Key-related operations were moved away from easily searchable frontend files where possible.
  - This reduces the chance of attackers immediately locating sensitive values through static string searches.

Implementation details:
- Native module:
  ```text
  modules/api-key-module/
  ```

- React Native bridge usage:
  ```text
  ApiKeyModule
  ```

- Environment configuration:
  ```text
  .env
  .env.example
  ```

Security impact:
- Increases effort required to extract API keys
- Makes automated APK analysis more difficult
- Reduces exposure of sensitive credentials in frontend source code

Limitations:
- Keys stored on client devices can never be completely secure.
- Skilled attackers may still recover secrets using dynamic instrumentation tools such as Frida or memory dumping techniques.
- Therefore, key hardening should be combined with SSL pinning, Frida detection, ProGuard/R8, and root detection for stronger layered security.

### 3. SSL Pinning

SSL pinning was implemented to protect the app’s network communication from man-in-the-middle attacks.
The protection works by making the app trust only the expected certificate/public key for the pinned backend host. This means that even if an attacker installs a custom certificate authority on the device or uses a proxy tool to intercept traffic, the app should reject the connection if the certificate does not match the pinned configuration.

Security improvements implemented:

Host pinning:
- The app pins traffic to the expected backend host:
  `https://ai.elliottwen.info`
- This helps prevent the app from accidentally sending sensitive requests to an untrusted or modified server.

Centralised API client:
- API requests go through:
  `lib/apiClient.ts`
- This helps ensure network requests use the protected pinned connection instead of random unprotected fetch calls.

Secure image download path:
- Image downloads go through:
  `lib/secureDownload.ts`
- This helps ensure generated images are downloaded through the pinned host and saved securely as local files.

Reduced remote image exposure:
- The app uses only `file://` URIs after `secureDownload`.
- This avoids directly displaying or saving remote `https://` image URLs in the app.

Implementation details:

Pinned host:
```text
https://ai.elliottwen.info
```

SSL pinning configuration:
```text
lib/sslPinning.ts
```

API client:
```text
lib/apiClient.ts
```

Secure download helper:
```text
lib/secureDownload.ts
```

Security impact:
- Helps prevent man-in-the-middle interception
- Protects API and image download traffic
- Reduces the risk of attackers using proxy tools to inspect or modify app traffic
- Strengthens communication security when combined with Frida detection and root detection

Limitations:
- SSL pinning does not protect data after it has already reached the device.
- Skilled attackers may still try to bypass pinning using runtime instrumentation tools.
- Therefore, SSL pinning should be combined with Frida detection, root detection, ProGuard/R8, and key hardening for stronger layered security.

### 4. Frida Detection

Frida detection was implemented to reduce the risk of runtime instrumentation, dynamic analysis, and live app tampering.
The protection works by checking for common indicators that Frida or similar instrumentation tools are running on the Android device. If the total detection score reaches the blocking threshold, the app treats the environment as unsafe and blocks execution.

Security improvements implemented:

Native Frida detection:
- A custom native Android module was added:
  `modules/frida-detection`
- The detector logic is implemented in:
  `FridaDetector.kt`
- Native detection makes the protection harder to bypass compared with JavaScript-only checks.

Score-based detection:
- The app blocks when the total detection score is greater than or equal to 2.
- Any single strong `+2` signal is enough to trigger blocking.
- Weaker signals, such as anonymous executable memory maps, are treated with lower score to reduce false positives.

Fail-closed behaviour:
- Native or bridge errors are treated as detected in custom Android builds.
- This means if the security check fails unexpectedly, the app chooses the safer option and blocks instead of allowing execution.
- Expo Go skips this because Expo Go does not load custom native modules.

Repeated safety checks:
- The app checks for Frida at startup.
- It rechecks every 45 seconds.
- It also rechecks when the app returns to the foreground.
- Before sensitive actions such as generate or save, the app calls `assertSafeEnvironment()`.

Implementation details:

Native module:
```text
modules/frida-detection
```

Detector file:
```text
FridaDetector.kt
```

JavaScript wrapper:
```text
lib/fridaDetection.ts
```

Startup, foreground, and interval checks:
```text
app/_layout.tsx
```

Generate/save protection:
```text
app/(tabs)/index.tsx
```

Detection signals used:

| Signal | Source | Score |
|---|---|---|
| Maps keyword hit | `/proc/self/maps` (`frida`, `gadget`, `gum-js-loop`, etc.) | +2 |
| Maps unreadable | `/proc/self/maps` read fails | +2 |
| Frida port TCP connect | `127.0.0.1:27042`, `27043`, `23946` | +2 |
| Frida port LISTEN | `/proc/net/tcp`, `/proc/net/tcp6` state `0A` | +2 |
| Process name | `/proc/*/cmdline` (`frida-server`, `linjector`, etc.) | +2 |
| Thread name | `/proc/self/task/*/comm` (`gum-js-loop`, etc.) | +2 |
| Debugger attached | `/proc/self/status` → `TracerPid > 0` | +2 |
| Anonymous executable maps | Three or more `r-x` memory map lines with no path | +1 |

Additional notes:
- Port checks from TCP connect and `/proc/net` share one `+2` bucket.
- Anonymous executable maps alone do not block the app.
- Images are only handled as `file://` URIs after `secureDownload`, avoiding remote image save paths.

Security impact:
- Makes dynamic analysis harder
- Helps detect Frida server, injected Frida gadget, suspicious threads, and debugger attachment
- Reduces the chance of attackers modifying app behaviour at runtime
- Protects sensitive actions such as image generation and saving

Limitations:
- Frida detection can be bypassed by advanced attackers.
- Some debugging or custom testing environments may trigger detection.
- Therefore, Frida detection should be combined with SSL pinning, root detection, ProGuard/R8, and key hardening for stronger layered security.

Verify:
```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

Testing checklist:
1. Normal device, no Frida → app runs and image generation works.
2. MITM proxy with custom CA → API should fail because of SSL pinning.
3. `frida-server` on default port → app should block at launch or before API use.
4. `frida-server` on custom port but process still named `frida-server` → app should block because of process scan.
5. Attach-only / `TracerPid > 0` while debugging → may block; use a non-debugged release build for baseline testing.

### 5. Root Detection
Root detection was implemented to make the app harder to analyse, modify, or run in unsafe environments.
The protection works by checking whether the Android device shows common signs of root access. If root indicators are detected, the app displays a warning message and closes.

Security improvements implemented:

- Root binary detection:
  - The app checks common system paths where the `su` binary is usually found.
  - This helps identify devices where root access may be available.

- Root command detection:
  - The app checks whether the `su` command can be found on the device.
  - If the command exists, it may indicate that the device has root capabilities.

- Root management app detection:
  - The app checks for known root-related packages such as Magisk and SuperSU.
  - These apps are commonly used to manage root permissions.

- Insecure build tag detection:
  - The app checks Android build tags such as `test-keys`.
  - `test-keys` can indicate that the device is running a non-standard or insecure Android build.

Implementation details:
- Root detection helper:
  ```text
  android/app/src/main/java/com/anonymous/Reverse_Engineering/RootDetectionHelper.kt
  ```

- App startup check:
  ```text
  android/app/src/main/java/com/anonymous/Reverse_Engineering/MainActivity.kt
  ```

- The root check runs during `MainActivity.onCreate()`.
- If root indicators are detected, the app shows a toast warning and exits using `finish()`.

Security impact:
- Increases difficulty for attackers using rooted devices
- Helps reduce tampering and runtime inspection risks
- Adds another layer of protection alongside Frida detection and ProGuard/R8
- Makes the app less suitable for unsafe or modified Android environments

Limitations:
- Root detection can be bypassed by skilled attackers.
- Some rooted devices may hide root indicators.
- Some emulator or custom ROM environments may trigger false positives.
- Therefore, root detection should be combined with SSL pinning, Frida detection, ProGuard/R8, and key hardening for stronger layered security.