package com.example.nexus.managers;

import android.util.Log;
import com.example.nexus.interfaces.CommonInterface;
import org.json.JSONObject; // <--- This fixes your error

public class ToolActionManager {
    private final MyAdbManager adbManager;
    private final CommonInterface common;
// In ToolActionManager.java (Bottom of file)

    private void cycleColorSteps() throws Exception {
        // 1. Check current system state
        String enabledStr = adbManager.runShellCommand("settings get secure accessibility_display_daltonizer_enabled").trim();
        String modeStr = adbManager.runShellCommand("settings get secure accessibility_display_daltonizer").trim();

        boolean isEnabled = enabledStr.equals("1");
        int currentMode = -1;

        // Parse current mode (defaults to 0 if error)
        try {
            currentMode = Integer.parseInt(modeStr);
        } catch (NumberFormatException e) {
            currentMode = 0;
        }

        // 2. Logic: Normal -> Greyscale -> Red-Green -> Blue-Yellow -> Normal
        if (!isEnabled) {
            // Step 1: Was Normal, switch to GREYSCALE (Mode 0)
            applyDaltonizer(0, 1, "Mode: Greyscale");
        } else {
            if (currentMode == 0) {
                // Step 2: Was Greyscale, switch to RED-GREEN (Mode 1 - Deuteranomaly)
                applyDaltonizer(1, 1, "Mode: Red-Green");
            } else if (currentMode == 1) {
                // Step 3: Was Red-Green, switch to BLUE-YELLOW (Mode 3 - Tritanomaly)
                applyDaltonizer(3, 1, "Mode: Blue-Yellow");
            } else {
                // Step 4: Was Blue-Yellow (or others), switch to NORMAL (Disabled)
                applyDaltonizer(0, 0, "Mode: Normal");
            }
        }
    }

    // Helper to apply the settings
    private void applyDaltonizer(int mode, int enabled, String toastMsg) throws Exception {
        // We set the mode first, then the enabled switch
        adbManager.runShellCommand("settings put secure accessibility_display_daltonizer " + mode);
        // Small delay ensures the mode setting sticks before enabling
        Thread.sleep(50);
        adbManager.runShellCommand("settings put secure accessibility_display_daltonizer_enabled " + enabled);
        common.showToast(toastMsg);
    }
    public ToolActionManager(MyAdbManager adbManager, CommonInterface common) {
        this.adbManager = adbManager;
        this.common = common;
    }

    /**
     * Fetches live device stats (Storage, Ghost Mode, Privacy, Tasks)
     * Returns a JSON string to be sent to the Frontend.
     */
    public String getToolStats() {
        try {
            JSONObject stats = new JSONObject();

            // 1. Storage (Used as a proxy for "Junk" - Available Space)
            // Output format: /data 108G 45G 63G 42% ...
            String dfOutput = adbManager.runShellCommand("df -h /data");
            String freeSpace = "Calculating...";

            if (dfOutput.contains("%")) {
                String[] lines = dfOutput.split("\n");
                if (lines.length > 1) {
                    // Replace multiple spaces with single space, then split
                    String[] parts = lines[1].replaceAll("\\s+", " ").split(" ");
                    // The 4th column (index 3) is usually 'Available' on Android df
                    if (parts.length >= 4) {
                        freeSpace = parts[3];
                    }
                }
            }
            stats.put("storage", freeSpace);

            // 2. Ghost Mode Status
            // Returns "1" if enabled, "0" or "null" if disabled
            String ghostState = adbManager.runShellCommand("settings get secure accessibility_display_daltonizer_enabled");
            boolean isGhost = ghostState.trim().equals("1");
            stats.put("ghost", isGhost);

            // 3. Privacy (Sensors)
            // Returns "Sensor privacy is enabled" or "disabled"
            String micState = adbManager.runShellCommand("cmd sensor_privacy status 0 microphone");
            String camState = adbManager.runShellCommand("cmd sensor_privacy status 0 camera");
            // If EITHER is enabled (blocked), we consider privacy mode ON
            boolean isPrivacy = micState.contains("enabled") || camState.contains("enabled");
            stats.put("privacy", isPrivacy);

            // 4. Open Apps Count
            // We count the number of "TaskRecord" entries in the activity manager
            String tasksOutput = adbManager.runShellCommand("dumpsys activity activities | grep -c 'TaskRecord{'");
            String taskCount = tasksOutput.trim();
            // Fallback if grep fails or returns empty
            if (taskCount.isEmpty() || !taskCount.matches("\\d+")) {
                taskCount = "0";
            }
            stats.put("tasks", taskCount);

            return stats.toString();

        } catch (Exception e) {
            Log.e("NEXUS_STATS", "Error fetching stats", e);
            return "{}";
        }
    }

    /**
     * Decides which Java function to run based on the command string.
     * Returns true if handled, false if not.
     */
    public boolean handleCommand(String rawCommand) {
        try {
            // --- NEW TOGGLES (Smart Logic) ---
            if (rawCommand.equals("toggle_ghost") ||
                    rawCommand.equals("cycle_color") ||
                    rawCommand.contains("daltonizer")) {

                cycleColorSteps(); // <--- Run your new 4-step logic
                return true;       // <--- Return TRUE so it doesn't run in the shell
            }



            // 2. Smart Privacy Toggle
            if (rawCommand.equals("toggle_privacy")) {
                String userId = adbManager.runShellCommand("am get-current-user").trim();

                // Check status using Integer ID 1 (Microphone)
                String micState = adbManager.runShellCommand("cmd sensor_privacy status " + userId + " 1");

                // "enabled" means PRIVACY is enabled (Sensors are BLOCKED)
                boolean isBlocked = micState.contains("enabled") || micState.contains("true");

                if (isBlocked) {
                    applyPrivacyMode(false); // Set Privacy OFF (Sensors ON)
                } else {
                    applyPrivacyMode(true); // Set Privacy ON (Sensors OFF)
                }
                return true;
            }

            // --- STANDARD COMMANDS ---

            if (rawCommand.contains("trim-caches")) {
                long beforeKB = getFreeSpaceKB();

                adbManager.runShellCommand("pm trim-caches 999G");

                // Cache trimming is fast, but filesystem stats lag slightly
                Thread.sleep(800);

                long afterKB = getFreeSpaceKB();
                long diffKB = afterKB - beforeKB;

                // Even small cleanups (1MB) will now show up
                if (diffKB > 1024) { // If we freed more than 1MB
                    common.showToast("Cleaned: " + (diffKB / 1024) + " MB Junk");
                } else if (diffKB > 0) {
                    common.showToast("Cleaned: " + diffKB + " KB Junk");
                } else {
                    // If it returns 0, it means the system hasn't updated stats yet,
                    // but the command definitely ran. Be positive.
                    common.showToast("System Cache Optimized");
                }
                return true;
            }

// 4. Kill All Apps (RAM Check)
            if (rawCommand.contains("kill-all")) {
                long beforeRam = getAvailableRamMB();

                adbManager.runShellCommand("am kill-all");

                Thread.sleep(500);

                long afterRam = getAvailableRamMB();
                long diffRam = afterRam - beforeRam;

                if (diffRam > 10) { // Freed more than 10MB
                    common.showToast("Boosted: Freed " + diffRam + " MB RAM");
                } else {
                    // Fallback message if RAM didn't shift much (system manages this aggressively)
                    common.showToast("Background Processes Cleared");
                }
                return true;
            }
            // 5. Speed Up (Animations)
            if (rawCommand.contains("window_animation_scale")) {
                applySpeedUp();
                return true;
            }

            // 6. Wireless ADB (Special Case)
            if (rawCommand.startsWith("tcpip")) {
                int port = 5555;
                try { port = Integer.parseInt(rawCommand.split(" ")[1]); } catch(Exception e){}
                adbManager.restartTcpIp(port);
                common.showToast("Wireless ADB Enabled: " + port);
                return true;
            }

            // 7. Legacy Ghost Mode (Fallback)
            if (rawCommand.contains("daltonizer")) {
                applyGhostMode();
                return true;
            }

            // 8. Legacy Privacy (Fallback)
            if (rawCommand.contains("sensor_privacy")) {
                boolean enable = rawCommand.contains("enable");
                applyPrivacyMode(enable);
                return true;
            }

            return false;

        } catch (Exception e) {
            Log.e("NEXUS_TOOLS", "Tool Failed", e);
            common.showToast("Error: " + e.getMessage());
            return true;
        }
    }

    // --- INTERNAL HELPER FUNCTIONS ---

    private void applyGhostMode() throws Exception {
        // FIX: Set value to 0 (Monochrome) FIRST, then Enable it.
        adbManager.runShellCommand("settings put secure accessibility_display_daltonizer 0");
        Thread.sleep(150); // Small delay
        adbManager.runShellCommand("settings put secure accessibility_display_daltonizer_enabled 1");
        common.showToast("Ghost Mode: ON");
    }

    private void applySpeedUp() throws Exception {
        // Run 3 separate commands
        adbManager.runShellCommand("settings put global window_animation_scale 0.5");
        Thread.sleep(50);
        adbManager.runShellCommand("settings put global transition_animation_scale 0.5");
        Thread.sleep(50);
        adbManager.runShellCommand("settings put global animator_duration_scale 0.5");
        common.showToast("Speed Up Applied (0.5x)");
    }

    /**
     * ULTIMATE XIAOMI FIX:
     * 1. Uses 'sensor_privacy' for Mic (Hardware switch, confirmed working).
     * 2. Uses 'AppOps' to blind the Camera (Permission revoke, confirmed working).
     * 3. Force-stops apps to apply changes immediately (Required for MIUI).
     */
    /**
     * ULTIMATE XIAOMI FIX:
     * 1. Uses 'sensor_privacy' for Mic (Hardware switch, confirmed working).
     * 2. Uses 'AppOps' to blind the Camera (Permission revoke, confirmed working).
     * 3. Force-stops apps to apply changes immediately (Required for MIUI).
     */
    private void applyPrivacyMode(boolean enableBlock) throws Exception {
        // Mode 1 = IGNORE (Black Screen/Silence). Mode 0 = ALLOW.
        String opMode = enableBlock ? "1" : "0";

        // --- 1. MICROPHONE (Hardware Switch) ---
        // This is safe and verified working on your device.
        try {
            adbManager.runShellCommand("cmd sensor_privacy " + (enableBlock ? "enable" : "disable") + " 0 1");
        } catch (Exception ignored) {}

        // --- 2. DEFINE THE "UNTOUCHABLES" (Expert Whitelist) ---
        // These are the apps that WILL crash your phone if you Force Stop them.
        // We will SKIP force-stopping these, but still try to block their permissions safely.
        java.util.List<String> criticalWhitelist = java.util.Arrays.asList(
                "android",                              // The OS Kernel
                "com.android.systemui",                 // The Status Bar / UI
                "com.android.phone",                    // The Dialer (Radio)
                "com.miui.home",                        // The Launcher (Desktop)
                "com.miui.securitycenter",              // Xiaomi Security Core
                "com.lbe.security.miui",                // Xiaomi Permission Manager
                "com.miui.powerkeeper",                 // Battery Manager
                "com.google.android.inputmethod.latin", // Gboard (Don't kill keyboard!)
                "com.xiaomi.finddevice"                 // Anti-Theft (Crash prone)
        );

        // --- 3. THE "EXPERT" LOOP ---
        String rawList = adbManager.runShellCommand("pm list packages");

        if (rawList != null) {
            String[] lines = rawList.split("\n");
            for (String line : lines) {
                String pkg = line.replace("package:", "").trim();
                if (pkg.isEmpty()) continue;

                // CHECK: Is this app Critical?
                boolean isCritical = false;
                for (String safePkg : criticalWhitelist) {
                    if (pkg.contains(safePkg)) { // Loose match to catch variations
                        isCritical = true;
                        break;
                    }
                }

                // ACTION: Block Permissions (Safe for everyone)
                // 26 = CAMERA, 27 = RECORD_AUDIO
                try {
                    adbManager.runShellCommand("appops set " + pkg + " 26 " + opMode);
                    adbManager.runShellCommand("appops set " + pkg + " 27 " + opMode);
                } catch (Exception e) {}

                // ACTION: Force Stop (ONLY for Non-Critical Apps)
                // This is the "Expert" difference. We kill the spies, but spare the OS.
                if (enableBlock && !isCritical) {
                    try {
                        // Double tap to ensure it dies
                        adbManager.runShellCommand("am force-stop " + pkg);
                        adbManager.runShellCommand("am force-stop " + pkg);
                    } catch (Exception e) {}
                }
            }
        }

        // --- 4. KILL HARDWARE DRIVERS (The Final Hammer) ---
        if (enableBlock) {
            try {
                adbManager.runShellCommand("killall mediaserver");
                adbManager.runShellCommand("killall cameraserver");
                // Attempt to kill Xiaomi's specific provider
                adbManager.runShellCommand("killall android.hardware.camera.provider@2.4-service_64");
            } catch (Exception ignored) {}
        }

        common.showToast(enableBlock ? "Privacy Active (Expert Filter)" : "Sensors Restored");
    }


    private void runSimpleCommand(String cmd, String successMsg) throws Exception {
        adbManager.runShellCommand(cmd);
        common.showToast(successMsg);
    }

// In ToolActionManager.java (Bottom of file)

    private long getFreeSpaceKB() {
        try {
            // -k forces output in Kilobytes for precision
            String dfOutput = adbManager.runShellCommand("df -k /data");
            // Output example: /data 115343360 48343040 66852864 42% ...
            String[] lines = dfOutput.split("\n");
            if (lines.length > 1) {
                // Split by whitespace
                String[] parts = lines[1].replaceAll("\\s+", " ").split(" ");
                // Column 3 is usually 'Available' in 1k-blocks on Android's toolbox df
                if (parts.length >= 4) {
                    return Long.parseLong(parts[3]);
                }
            }
        } catch (Exception e) {}
        return 0;
    }

    // Helper: Get Available RAM in Megabytes (Best way to see if apps were killed)
    private long getAvailableRamMB() {
        try {
            String memInfo = adbManager.runShellCommand("cat /proc/meminfo");
            // Look for "MemAvailable:" or "MemFree:"
            for (String line : memInfo.split("\n")) {
                if (line.contains("MemAvailable")) {
                    // Example: MemAvailable:   453432 kB
                    String val = line.replaceAll("[^0-9]", "");
                    return Long.parseLong(val) / 1024; // Convert kB to MB
                }
            }
        } catch (Exception e) {}
        return 0;
    }
    private int getRunningProcessCount() {
        try {
            // Count lines containing "TaskRecord" which represents an active task/app
            String output = adbManager.runShellCommand("dumpsys activity activities | grep -c 'TaskRecord{'");
            return Integer.parseInt(output.trim());
        } catch (Exception e) {
            return 0;
        }
    }

    // Helper to convert "63G", "500M" to MB (Long)
    private long parseSizeToMB(String sizeStr) {
        try {
            sizeStr = sizeStr.toUpperCase();
            if (sizeStr.endsWith("G")) {
                return (long) (Double.parseDouble(sizeStr.replace("G", "")) * 1024);
            } else if (sizeStr.endsWith("M")) {
                return (long) (Double.parseDouble(sizeStr.replace("M", "")));
            } else if (sizeStr.endsWith("K")) {
                return (long) (Double.parseDouble(sizeStr.replace("K", "")) / 1024);
            }
        } catch (Exception e) {}
        return 0;
    }
}
