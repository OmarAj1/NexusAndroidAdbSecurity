package com.example.nexus.managers;

import android.util.Log;
import com.example.nexus.interfaces.CommonInterface;
import org.json.JSONObject; // <--- This fixes your error

public class ToolActionManager {
    private final MyAdbManager adbManager;
    private final CommonInterface common;

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

            // 1. Smart Ghost Toggle
            if (rawCommand.equals("toggle_ghost")) {
                String current = adbManager.runShellCommand("settings get secure accessibility_display_daltonizer_enabled");
                boolean isOn = current.trim().equals("1");

                if (isOn) {
                    // Turn OFF
                    adbManager.runShellCommand("settings put secure accessibility_display_daltonizer_enabled 0");
                    common.showToast("Ghost Mode: OFF");
                } else {
                    // Turn ON (Force Monochrome)
                    applyGhostMode();
                }
                return true;
            }

            // 2. Smart Privacy Toggle
            if (rawCommand.equals("toggle_privacy")) {
                String micState = adbManager.runShellCommand("cmd sensor_privacy status 0 microphone");
                boolean isBlocked = micState.contains("enabled");

                if (isBlocked) {
                    applyPrivacyMode(false); // Unblock (Allow)
                } else {
                    applyPrivacyMode(true); // Block (Secure)
                }
                return true;
            }

            // --- STANDARD COMMANDS ---

            // 3. Clean Space
            if (rawCommand.contains("trim-caches")) {
                runSimpleCommand("pm trim-caches 999G", "System Cache Cleaned");
                return true;
            }

            // 4. Kill All Apps
            if (rawCommand.contains("kill-all")) {
                // 'am kill-all' kills background processes
                runSimpleCommand("am kill-all", "Background Apps Closed");
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

            return false; // Not a recognised tool

        } catch (Exception e) {
            Log.e("NEXUS_TOOLS", "Tool Failed", e);
            common.showToast("Error: " + e.getMessage());
            return true; // We tried to handle it but failed
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

    private void applyPrivacyMode(boolean enableBlock) throws Exception {
        String action = enableBlock ? "enable" : "disable";
        String msg = enableBlock ? "Sensors Blocked (Secure)" : "Sensors Allowed";

        // Handles Microphone and Camera separately
        adbManager.runShellCommand("cmd sensor_privacy " + action + " 0 microphone");
        Thread.sleep(100);
        adbManager.runShellCommand("cmd sensor_privacy " + action + " 0 camera");
        common.showToast(msg);
    }

    private void runSimpleCommand(String cmd, String successMsg) throws Exception {
        adbManager.runShellCommand(cmd);
        common.showToast(successMsg);
    }
}