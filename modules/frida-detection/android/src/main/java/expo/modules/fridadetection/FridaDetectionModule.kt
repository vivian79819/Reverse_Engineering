package expo.modules.fridadetection

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FridaDetectionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FridaDetection")

    AsyncFunction("isFridaDetected") {
      FridaDetector.isDetected()
    }
  }
}
