package expo.modules.fridadetection

import java.io.File
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Multi-signal Frida heuristics. Blocks when score >= [SCORE_THRESHOLD].
 * Maps read failure adds score (fail-closed: cannot verify process memory).
 */
object FridaDetector {
  private val MAP_HINTS = arrayOf(
    "frida",
    "frida-agent",
    "frida-agent.so",
    "frida-gadget",
    "frida:rpc",
    "gum-js-loop",
    "linjector",
    "re.frida.server",
    "libfrida",
    "LIBFRIDA",
    "/data/local/tmp/frida",
  )

  private val PROCESS_HINTS = arrayOf(
    "frida-server",
    "frida-helper",
    "frida-agent",
    "re.frida.server",
    "linjector",
    "frida",
  )

  private val THREAD_HINTS = arrayOf(
    "gum-js-loop",
    "gmain",
    "frida",
    "pool-frida",
  )

  private val FRIDA_PORTS = intArrayOf(27042, 27043, 23946)

  private const val SCORE_THRESHOLD = 2
  private const val SCORE_MAPS_HIT = 2
  private const val SCORE_MAPS_UNAVAILABLE = 2
  private const val SCORE_PORT_HIT = 2
  private const val SCORE_PROCESS_HIT = 2
  private const val SCORE_THREAD_HIT = 2
  private const val SCORE_TRACER_PID = 2
  private const val SCORE_ANON_RX = 1
  private const val ANON_RX_MIN_COUNT = 3
  private const val PROC_NET_LISTEN_STATE = "0A"
  private const val CONNECT_TIMEOUT_MS = 400

  private val MAPS_LINE =
    Regex("^([0-9a-f]+-[0-9a-f]+)\\s+(\\S+)\\s+(\\S+)\\s+(\\S+)\\s+(\\S+)\\s*(.*)$")

  fun isDetected(): Boolean = computeScore() >= SCORE_THRESHOLD

  fun computeScore(): Int {
    var score = 0
    score += scoreMaps()
    score += scorePorts()
    score += scoreProcesses()
    score += scoreThreads()
    score += scoreTracerPid()
    return score
  }

  private fun scoreMaps(): Int {
    return try {
      val maps = File("/proc/self/maps").readText()
      var score = 0
      if (MAP_HINTS.any { hint -> maps.contains(hint, ignoreCase = true) }) {
        score += SCORE_MAPS_HIT
      }
      score += scoreAnonRxFromMaps(maps)
      score
    } catch (_: Exception) {
      SCORE_MAPS_UNAVAILABLE
    }
  }

  /** +1 only; needs another signal to reach [SCORE_THRESHOLD]. */
  private fun scoreAnonRxFromMaps(maps: String): Int {
    var anonExecutable = 0
    for (line in maps.lineSequence()) {
      val match = MAPS_LINE.find(line.trim()) ?: continue
      val perms = match.groupValues[2]
      if (!perms.contains("r-x")) {
        continue
      }
      val path = match.groupValues[6].trim()
      if (path.isNotEmpty()) {
        continue
      }
      anonExecutable++
      if (anonExecutable >= ANON_RX_MIN_COUNT) {
        return SCORE_ANON_RX
      }
    }
    return 0
  }

  private fun scorePorts(): Int {
    if (isAnyFridaPortConnectable()) {
      return SCORE_PORT_HIT
    }
    if (isAnyFridaPortListeningInProcNet()) {
      return SCORE_PORT_HIT
    }
    return 0
  }

  private fun isAnyFridaPortConnectable(): Boolean {
    for (port in FRIDA_PORTS) {
      if (isPortOpen(port)) {
        return true
      }
    }
    return false
  }

  private fun isAnyFridaPortListeningInProcNet(): Boolean {
    for (path in arrayOf("/proc/net/tcp", "/proc/net/tcp6")) {
      if (isFridaPortListeningInProcNetFile(File(path))) {
        return true
      }
    }
    return false
  }

  private fun isFridaPortListeningInProcNetFile(file: File): Boolean {
    if (!file.exists()) {
      return false
    }
    return try {
      file.readLines().drop(1).any { line ->
        val parts = line.trim().split(Regex("\\s+"))
        if (parts.size < 4) {
          return@any false
        }
        if (parts[3] != PROC_NET_LISTEN_STATE) {
          return@any false
        }
        val port = parseProcNetLocalPort(parts[1]) ?: return@any false
        port in FRIDA_PORTS
      }
    } catch (_: Exception) {
      false
    }
  }

  /** Port in /proc/net/* is little-endian hex in the local_address field. */
  private fun parseProcNetLocalPort(localAddress: String): Int? {
    val colon = localAddress.lastIndexOf(':')
    if (colon < 0) {
      return null
    }
    val portHex = localAddress.substring(colon + 1)
    if (portHex.length != 4) {
      return null
    }
    return try {
      val high = portHex.substring(0, 2).toInt(16)
      val low = portHex.substring(2, 4).toInt(16)
      (low shl 8) or high
    } catch (_: Exception) {
      null
    }
  }

  private fun scoreProcesses(): Int {
    val procRoot = File("/proc")
    val entries = procRoot.listFiles() ?: return 0
    for (entry in entries) {
      if (!entry.isDirectory) {
        continue
      }
      if (!entry.name.all { it.isDigit() }) {
        continue
      }
      try {
        val raw = entry.resolve("cmdline").readBytes()
        if (raw.isEmpty()) {
          continue
        }
        val cmdline = raw
          .toString(Charsets.UTF_8)
          .replace('\u0000', ' ')
          .trim()
        if (cmdline.isEmpty()) {
          continue
        }
        if (PROCESS_HINTS.any { hint -> cmdline.contains(hint, ignoreCase = true) }) {
          return SCORE_PROCESS_HIT
        }
      } catch (_: Exception) {
        continue
      }
    }
    return 0
  }

  private fun scoreThreads(): Int {
    val taskRoot = File("/proc/self/task")
    val tasks = taskRoot.listFiles() ?: return 0
    for (task in tasks) {
      try {
        val comm = task.resolve("comm").readText().trim()
        if (THREAD_HINTS.any { hint -> comm.contains(hint, ignoreCase = true) }) {
          return SCORE_THREAD_HIT
        }
      } catch (_: Exception) {
        continue
      }
    }
    return 0
  }

  private fun scoreTracerPid(): Int {
    return try {
      val status = File("/proc/self/status").readText()
      val line = status.lineSequence().firstOrNull { it.startsWith("TracerPid:") } ?: return 0
      val tracerPid = line.substringAfter(":").trim().toIntOrNull() ?: 0
      if (tracerPid > 0) SCORE_TRACER_PID else 0
    } catch (_: Exception) {
      0
    }
  }

  private fun isPortOpen(port: Int): Boolean {
    return try {
      Socket().use { socket ->
        socket.connect(InetSocketAddress("127.0.0.1", port), CONNECT_TIMEOUT_MS)
        true
      }
    } catch (_: Exception) {
      false
    }
  }
}
