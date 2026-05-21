package com.anonymous.Reverse_Engineering

object RootDetectionHelper {

    fun isDeviceRooted(context: android.content.Context): Boolean {
        return checkRootFiles() ||
               checkSuCommand() ||
               checkDangerousApps(context) ||
               checkBuildTags()
    }

    private fun checkRootFiles(): Boolean {
        val paths = arrayOf(
            "/system/bin/su",
            "/system/xbin/su",
            "/sbin/su",
            "/system/app/Superuser.apk"
        )

        return paths.any { java.io.File(it).exists() }
    }

    private fun checkSuCommand(): Boolean {
        return try {
            val process = Runtime.getRuntime().exec(arrayOf("which", "su"))
            process.inputStream.bufferedReader().readLine() != null
        } catch (e: Exception) {
            false
        }
    }

    private fun checkDangerousApps(context: android.content.Context): Boolean {
        val packages = arrayOf(
            "com.topjohnwu.magisk",
            "eu.chainfire.supersu",
            "com.noshufou.android.su"
        )

        return packages.any {
            try {
                context.packageManager.getPackageInfo(it, 0)
                true
            } catch (e: Exception) {
                false
            }
        }
    }

    private fun checkBuildTags(): Boolean {
        return android.os.Build.TAGS?.contains("test-keys") == true
    }
}