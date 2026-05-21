# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Keep React Native classes needed at runtime
-keep class com.facebook.react.** { *; }

# Keep Expo modules needed at runtime
-keep class expo.modules.** { *; }

# Remove Android log calls in release builds
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Remove React Native log calls in release builds
-assumenosideeffects class com.facebook.common.logging.FLog {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Keep native method names if you later add JNI/native library code
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep annotations so libraries that depend on annotations do not break
-keepattributes *Annotation*

# Keep source file/line number info only if you need crash reports
# For stronger obfuscation, leave these OFF:
# -keepattributes SourceFile,LineNumberTable
