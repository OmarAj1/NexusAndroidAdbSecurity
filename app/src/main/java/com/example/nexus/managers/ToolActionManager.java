package com.example.nexus.managers;

import android.util.Log;

import com.example.nexus.interfaces.CommonInterface;

import org.json.JSONObject;

import java.util.Arrays;
import java.util.List;

public class ToolActionManager {
    private final MyAdbManager adbManager;
    private final CommonInterface common;

    public ToolActionManager(MyAdbManager adbManager, CommonInterface common) {
        this.adbManager = adbManager;
        this.common = common;
    }

    private void cycleColorSteps() throws Exception {
        String enabledStr = adbManager.runShellCommand("settings get secure accessibility_display_daltonizer_enabled").trim();
        String modeStr = adbManager.runShellCommand("settings get secure accessibility_display_daltonizer").trim();

        boolean isEnabled = enabledStr.equals("1");
        int currentMode = 0;

        try {
            currentMode = Integer.parseInt(modeStr);
        } catch (NumberFormatException e) {
            Log.e("NEXUS_TOOLS", "Failed to parse current mode", e);
        }

        if (!isEnabled) {
            applyDaltonizer(0, 1, "Mode: Greyscale");
        } else if (currentMode == 0) {
            applyDaltonizer(1, 1, "Mode: Red-Green");
        } else if (currentMode == 1) {
            applyDaltonizer(3, 1, "Mode: Blue-Yellow");
        } else {
            applyDaltonizer(0, 0, "Mode: Normal");
        }
    }

    private void applyDaltonizer(int mode, int enabled, String toastMsg) throws Exception {
        adbManager.runShellCommand("settings put secure accessibility_display_daltonizer " + mode);
        Thread.sleep(50);
        adbManager.runShellCommand("settings put secure accessibility_display_daltonizer_enabled " + enabled);
        common.showToast(toastMsg);
    }

    public String getToolStats() {
        try {
            JSONObject stats = new JSONObject();
            stats.put("storage", getFreeSpace());

            String ghostState = adbManager.runShellCommand("settings get secure accessibility_display_daltonizer_enabled");
            stats.put("ghost", ghostState.trim().equals("1"));

            String micState = adbManager.runShellCommand("cmd sensor_privacy status 0 microphone");
            String camState = adbManager.runShellCommand("cmd sensor_privacy status 0 camera");
            stats.put("privacy", micState.contains("enabled") || camState.contains("enabled"));

            String tasksOutput = adbManager.runShellCommand("dumpsys activity activities | grep -c 'TaskRecord{'");
            String taskCount = tasksOutput.trim();
            if (taskCount.isEmpty() || !taskCount.matches("\\d+")) {
                taskCount = "0";
            }
            stats.put("tasks", taskCount);

            // NEW: Fetch current animation scale
            String animScale = adbManager.runShellCommand("settings get global window_animation_scale").trim();
            stats.put("speed", animScale.isEmpty() ? "1" : animScale);

            return stats.toString();
        } catch (Exception e) {
            Log.e("NEXUS_STATS", "Error fetching stats", e);
            return "{}";
        }
    }

    private String getFreeSpace() {
        try {
            String dfOutput = adbManager.runShellCommand("df -h /data");
            if (dfOutput.contains("%")) {
                String[] lines = dfOutput.split("\n");
                if (lines.length > 1) {
                    String[] parts = lines[1].replaceAll("\\s+", " ").split(" ");
                    if (parts.length >= 4) {
                        return parts[3];
                    }
                }
            }
        } catch (Exception e) {
            Log.e("NEXUS_TOOLS", "Failed to get free space", e);
        }
        return "Calculating...";
    }

    public boolean handleCommand(String rawCommand) {
        try {
            if (rawCommand.equals("toggle_ghost") || rawCommand.equals("cycle_color") || rawCommand.contains("daltonizer")) {
                cycleColorSteps();
                return true;
            }

            if (rawCommand.equals("toggle_privacy")) {
                String userId = adbManager.runShellCommand("am get-current-user").trim();
                String micState = adbManager.runShellCommand("cmd sensor_privacy status " + userId + " 1");
                boolean isBlocked = micState.contains("enabled") || micState.contains("true");
                applyPrivacyMode(!isBlocked);
                return true;
            }

            // NEW: Handle speed cycle command
            if (rawCommand.equals("toggle_speed")) {
                cycleSpeedSteps();
                return true;
            }

            if (rawCommand.contains("trim-caches")) {
                long beforeKB = getFreeSpaceKB();
                adbManager.runShellCommand("pm trim-caches 999G");
                Thread.sleep(800);
                long afterKB = getFreeSpaceKB();
                long diffKB = afterKB - beforeKB;

                if (diffKB > 1024) {
                    common.showToast("Cleaned: " + (diffKB / 1024) + " MB Junk");
                } else if (diffKB > 0) {
                    common.showToast("Cleaned: " + diffKB + " KB Junk");
                } else {
                    common.showToast("System Cache Optimized");
                }
                return true;
            }

            if (rawCommand.contains("kill-all")) {
                long beforeRam = getAvailableRamMB();
                adbManager.runShellCommand("am kill-all");
                Thread.sleep(500);
                long afterRam = getAvailableRamMB();
                long diffRam = afterRam - beforeRam;

                if (diffRam > 10) {
                    common.showToast("Boosted: Freed " + diffRam + " MB RAM");
                } else {
                    common.showToast("Background Processes Cleared");
                }
                return true;
            }

            if (rawCommand.contains("window_animation_scale")) {
                applySpeedUp();
                return true;
            }

            if (rawCommand.startsWith("tcpip")) {
                int port = 5555;
                try {
                    port = Integer.parseInt(rawCommand.split(" ")[1]);
                } catch (Exception e) {
                    Log.e("NEXUS_TOOLS", "Error parsing port", e);
                }
                adbManager.restartTcpIp(port);
                common.showToast("Wireless ADB Enabled: " + port);
                return true;
            }

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

    // NEW: Cycle logic: 1.0 -> 0.5 -> 0.0 -> 1.0
    private void cycleSpeedSteps() throws Exception {
        String current = adbManager.runShellCommand("settings get global window_animation_scale").trim();

        if (current.isEmpty()) current = "1";

        if (current.equals("1") || current.equals("1.0")) {
            applyAnimationScale("0.5", "Speed: 0.5x (Fast)");
        } else if (current.equals("0.5")) {
            applyAnimationScale("0", "Speed: 0x (Instant)");
        } else {
            applyAnimationScale("1", "Speed: Normal (1.0x)");
        }
    }

    // NEW: Helper to apply scale to all animation settings
    private void applyAnimationScale(String scale, String msg) throws Exception {
        adbManager.runShellCommand("settings put global window_animation_scale " + scale);
        Thread.sleep(20);
        adbManager.runShellCommand("settings put global transition_animation_scale " + scale);
        Thread.sleep(20);
        adbManager.runShellCommand("settings put global animator_duration_scale " + scale);
        common.showToast(msg);
    }

    private void applySpeedUp() throws Exception {
        adbManager.runShellCommand("settings put global window_animation_scale 0.5");
        Thread.sleep(50);
        adbManager.runShellCommand("settings put global transition_animation_scale 0.5");
        Thread.sleep(50);
        adbManager.runShellCommand("settings put global animator_duration_scale 0.5");
        common.showToast("Speed Up Applied (0.5x)");
    }

    private void applyPrivacyMode(boolean enableBlock) throws Exception {
        String sdkOut = adbManager.runShellCommand("getprop ro.build.version.sdk");
        int sdkVer;
        try {
            sdkVer = Integer.parseInt(sdkOut.trim());
        } catch (NumberFormatException e) {
            sdkVer = 29;
        }

        int codeGlobal = -1;
        int codeIndividual = -1;

        if (sdkVer >= 33) {
            codeGlobal = 9;
            codeIndividual = 10;
        } else if (sdkVer >= 31) {
            codeGlobal = 8;
            codeIndividual = 9;
        } else if (sdkVer >= 29) {
            codeGlobal = 8;
        }

        String state = enableBlock ? "1" : "0";

        try {
            if (codeIndividual != -1) {
                adbManager.runShellCommand("service call sensor_privacy " + codeIndividual + " i32 0 i32 0 i32 1 i32 " + state);
                adbManager.runShellCommand("service call sensor_privacy " + codeIndividual + " i32 0 i32 0 i32 2 i32 " + state);
            }

            if (codeGlobal != -1) {
                adbManager.runShellCommand("service call sensor_privacy " + codeGlobal + " i32 " + state);
            }
        } catch (Exception e) {
            System.out.println("Service call failed: " + e.getMessage());
        }

        String brand = adbManager.runShellCommand("getprop ro.product.brand").toLowerCase();
        if (brand.contains("xiaomi") || brand.contains("poco") || brand.contains("redmi")) {
            List<String> cameraPackages = Arrays.asList(
                    "com.android.camera",
                    "com.miui.camera",
                    "com.google.android.GoogleCamera",
                    "com.android.server.telecom"
            );

            String cmdAction = enableBlock ? "disable-user --user 0" : "enable";

            for (String pkg : cameraPackages) {
                try {
                    adbManager.runShellCommand("pm " + cmdAction + " " + pkg);
                } catch (Exception e) {
                    Log.e("NEXUS_TOOLS", "Failed to run pm command", e);
                }
            }
        }

        if (enableBlock) {
            String opMode = "1";
            String rawList = adbManager.runShellCommand("pm list packages");

            List<String> criticalWhitelist = Arrays.asList(
                    "android", "com.android.systemui", "com.android.phone",
                    "com.miui.home", "com.miui.securitycenter"
            );

            if (rawList != null) {
                String[] lines = rawList.split("\n");
                for (String line : lines) {
                    String pkg = line.replace("package:", "").trim();
                    if (pkg.isEmpty()) continue;

                    boolean isCritical = false;
                    for (String safePkg : criticalWhitelist) {
                        if (pkg.contains(safePkg)) {
                            isCritical = true;
                            break;
                        }
                    }

                    if (!isCritical) {
                        try {
                            adbManager.runShellCommand("appops set " + pkg + " 26 " + opMode);
                            adbManager.runShellCommand("appops set " + pkg + " 27 " + opMode);
                        } catch (Exception e) {
                            Log.e("NEXUS_TOOLS", "Failed to set appops", e);
                        }
                    }
                }
            }
        } else {
            adbManager.runShellCommand("appops reset");
        }

        common.showToast(enableBlock ? "Privacy Mode Active (Deep Shield)" : "Sensors Restored");
    }

    private long getFreeSpaceKB() {
        try {
            String dfOutput = adbManager.runShellCommand("df -k /data");
            String[] lines = dfOutput.split("\n");
            if (lines.length > 1) {
                String[] parts = lines[1].replaceAll("\\s+", " ").split(" ");
                if (parts.length >= 4) {
                    return Long.parseLong(parts[3]);
                }
            }
        } catch (Exception e) {
            Log.e("NEXUS_TOOLS", "Failed to get free space", e);
        }
        return 0;
    }

    private long getAvailableRamMB() {
        try {
            String memInfo = adbManager.runShellCommand("cat /proc/meminfo");
            for (String line : memInfo.split("\n")) {
                if (line.contains("MemAvailable")) {
                    String val = line.replaceAll("[^0-9]", "");
                    return Long.parseLong(val) / 1024;
                }
            }
        } catch (Exception e) {
            Log.e("NEXUS_TOOLS", "Failed to get available ram", e);
        }
        return 0;
    }
}