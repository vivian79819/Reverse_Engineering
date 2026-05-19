const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# --- reverse-engineering security keep rules ---';

const SECURITY_PROGUARD_RULES = `
${MARKER}
# Frida detection (Expo module)
-keep class expo.modules.fridadetection.** { *; }

# React Native bridge modules (ApiKeyModule, etc.)
-keep @com.facebook.react.module.annotations.ReactModule class * { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod <methods>; }

# SSL public key pinning
-keep class com.sslpublickeypinning.** { *; }

# Teammate key hardening — adjust package if ApiKeyModule lives elsewhere
-keep class **.ApiKeyModule { *; }
-keep class **.ApiKeyPackage { *; }
`.trim();

/**
 * Appends shared ProGuard keep rules so R8 does not strip security native modules.
 */
function withSecurityProguard(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro',
      );

      if (!fs.existsSync(proguardPath)) {
        return config;
      }

      const existing = fs.readFileSync(proguardPath, 'utf8');
      if (!existing.includes(MARKER)) {
        const separator = existing.endsWith('\n') ? '' : '\n';
        fs.writeFileSync(proguardPath, `${existing}${separator}\n${SECURITY_PROGUARD_RULES}\n`);
      }

      return config;
    },
  ]);
}

module.exports = withSecurityProguard;
