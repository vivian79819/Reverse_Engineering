# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Security (SSL pinning + Frida detection)

Requires a [development build](https://docs.expo.dev/develop/development-builds/introduction/) (`npx expo run:android`). **Expo Go does not load custom native modules** (pinning, Frida detection, or `ApiKeyModule`).

### SSL pinning

- Host: `https://ai.elliottwen.info`
- Config: `lib/sslPinning.ts`
- All API and image downloads go through `lib/apiClient.ts` and `lib/secureDownload.ts` so traffic stays on the pinned host.

### Frida detection

- Native module: `modules/frida-detection` (`FridaDetector.kt`). **Blocks when total score ≥ 2** (any single +2 signal is enough).
- Fail-closed: native/bridge errors are treated as detected (custom Android build only; Expo Go skips).
- JS wrapper: `lib/fridaDetection.ts`
- Startup + every 45s + on app foreground: recheck in `app/_layout.tsx`.
- Before each generate/save: `assertSafeEnvironment()` in `app/(tabs)/index.tsx`.
- Images: only `file://` URIs after `secureDownload` (no remote `Image` / https save path).

#### Detection signals (Android)

| Signal | Source | Score |
|--------|--------|------:|
| Maps keyword hit | `/proc/self/maps` (`frida`, `gadget`, `gum-js-loop`, …) | +2 |
| Maps unreadable | `/proc/self/maps` read fails | +2 |
| Frida port (TCP connect) | `127.0.0.1` : `27042` / `27043` / `23946` | +2 |
| Frida port (LISTEN) | `/proc/net/tcp`, `/proc/net/tcp6` state `0A` | +2 |
| Process name | `/proc/*/cmdline` (`frida-server`, `linjector`, …) | +2 |
| Thread name | `/proc/self/task/*/comm` (`gum-js-loop`, …) | +2 |
| Debugger attached | `/proc/self/status` → `TracerPid` > 0 | +2 |
| Anonymous executable maps | ≥ 3 `r-x` lines in maps with no path | +1 |

Port checks (connect vs `/proc/net`) share one +2 bucket. Anonymous executable maps alone do not block.

### ProGuard (R8)

- `plugins/withSecurityProguard.js` appends keep rules on `npx expo prebuild` for Frida detection, SSL pinning, React Native modules, and `ApiKeyModule`.
- Re-run prebuild after cloning so `android/app/proguard-rules.pro` includes the security block.

### Verify

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

1. Normal device, no Frida → app runs, image generation works.
2. MITM proxy with custom CA → API should fail (pinning).
3. `frida-server` on default port → blocked at launch or before API.
4. `frida-server` on custom port but process still named `frida-server` → blocked (process scan).
5. Attach-only / `TracerPid` > 0 while debugging → may block (+2); use a non-debugged release build for baseline tests.
