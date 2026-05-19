import ExpoModulesCore

public class FridaDetectionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FridaDetection")

    AsyncFunction("isFridaDetected") {
      false
    }
  }
}
