package com.example.nexus.interfaces;

import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.appcompat.app.AppCompatActivity;

import com.example.nexus.managers.AdbPairingManager;
import com.example.nexus.managers.AdbSingleton;
import com.example.nexus.managers.MyAdbManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;

public class ConsolidatedWebAppInterface {
    public final CommonInterface common;
    public final ShieldInterface shield;
    private final AppCompatActivity activity;
    private final ExecutorService executor;
    private final AdbPairingManager pairingManager;
    private final WebView webView;

    public ConsolidatedWebAppInterface(AppCompatActivity activity, ExecutorService executor, WebView webView, AdbPairingManager pairingManager) {
        this.activity = activity;
        this.executor = executor;
        this.webView = webView;
        this.pairingManager = pairingManager;

        this.common = new CommonInterface(activity);
        this.shield = new ShieldInterface(activity, common);
    }

    @JavascriptInterface public String getNativeCoreVersion() { return common.getNativeCoreVersion(); }
    @JavascriptInterface public void hapticFeedback(String type) { common.hapticFeedback(type); }
    @JavascriptInterface public void showToast(String toast) { common.showToast(toast); }
    @JavascriptInterface public void shareText(String t, String c) { common.shareText(t, c); }

    @JavascriptInterface public void pairAdb(String ip, String p, String c) { pairingManager.pairAdb(ip, p, c); }
    @JavascriptInterface public boolean connectAdb(String ip, String p) { pairingManager.connectAdb(ip, p); return true; }
    @JavascriptInterface public void startMdnsDiscovery() { pairingManager.startMdnsDiscovery(); }
    @JavascriptInterface public void stopMdnsDiscovery() { pairingManager.stopMdnsDiscovery(); }
    @JavascriptInterface public void retrieveConnectionInfo() { pairingManager.retrieveConnectionInfo(); }

    @JavascriptInterface public void startVpn() { shield.startVpn(); }
    @JavascriptInterface public void stopVpn() { shield.stopVpn(); }
    @JavascriptInterface public boolean getVpnStatus() { return shield.getVpnStatus(); }

    @JavascriptInterface public void executeCommand(String a, String p, int userId) { executeCommandInternal(a, p, userId); }
    @JavascriptInterface public void getInstalledPackages() { fetchRealPackageListInternal(); }
    @JavascriptInterface public void getUsers() { fetchUsersInternal(); }

    /**
     * Forces the system to clear caches for all apps by requesting an impossible amount of free space.
     * This triggers the PackageManager's aggressive cache trimming mechanism.
     */
    @JavascriptInterface
    public void trimCaches() {
        executor.execute(() -> {
            MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();
            if (manager == null || !manager.isConnected()) {
                common.showToast("Not Connected");
                return;
            }
            try {
                // pm trim-caches <DESIRED_FREE_SPACE>
                // Asking for 999GB forces the system to delete everything it possibly can to free up space.
                String cmd = "pm trim-caches 999G";
                manager.runShellCommand(cmd);
                common.showToast("System Cache Wipe Executed");
            } catch (Exception e) {
                common.showToast("Cache Wipe Failed: " + e.getMessage());
            }
        });
    }

    private void executeCommandInternal(String action, String pkg, int userId) {
        executor.execute(() -> {
            MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();
            if (manager == null || !manager.isConnected()) { common.showToast("Not Connected"); return; }
            try {
                String cmd = "";
                if ("uninstall".equals(action)) cmd = "pm uninstall --user " + userId + " " + pkg;
                else if ("disable".equals(action)) cmd = "pm disable-user --user " + userId + " " + pkg;
                else if ("enable".equals(action)) cmd = "pm enable --user " + userId + " " + pkg;
                else if ("restore".equals(action)) cmd = "cmd package install-existing --user " + userId + " " + pkg;

                if (!cmd.isEmpty()) {
                    String output = manager.runShellCommand(cmd);
                    String cleanOutput = output != null ? output.trim().toLowerCase() : "";

                    if (cleanOutput.contains("success") || cleanOutput.contains("installed")) {
                        common.showToast(action + " Success");
                    } else {
                        common.showToast("Failed: " + (cleanOutput.length() > 50 ? cleanOutput.substring(0, 47) + "..." : cleanOutput));
                    }

                    fetchRealPackageListInternal();
                }
            } catch(Exception e) { common.showToast("Cmd Failed: " + e.getMessage()); }
        });
    }

    private void fetchUsersInternal() {
        executor.execute(() -> {
            try {
                MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();
                if (manager != null && manager.isConnected()) {
                    String raw = manager.runShellCommand("pm list users");
                    String b64 = Base64.encodeToString(raw.getBytes(), Base64.NO_WRAP);
                    activity.runOnUiThread(() -> webView.evaluateJavascript("if(window.receiveUsers) window.receiveUsers('" + b64 + "');", null));
                }
            } catch (Exception e) { Log.e("NEXUS", "User Fetch Error", e); }
        });
    }

    private void fetchRealPackageListInternal() {
        executor.execute(() -> {
            String base64Data = Base64.encodeToString("[]".getBytes(), Base64.NO_WRAP);
            try {
                MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();
                if (manager != null && manager.isConnected()) {
                    // 1. Fetch MASTER list (All packages including uninstalled ones)
                    String rawAll = manager.runShellCommand("pm list packages -f -u");
                    // 2. Fetch DISABLED list
                    String rawDisabled = manager.runShellCommand("pm list packages -d");
                    // 3. Fetch ENABLED list
                    String rawEnabled = manager.runShellCommand("pm list packages -e");

                    // Parse Status Lists
                    Set<String> disabledSet = new HashSet<>();
                    if (rawDisabled != null) {
                        for (String s : rawDisabled.split("\\n")) {
                            if (s.contains(":")) disabledSet.add(s.substring(s.indexOf(":") + 1).trim());
                        }
                    }

                    Set<String> enabledSet = new HashSet<>();
                    if (rawEnabled != null) {
                        for (String s : rawEnabled.split("\\n")) {
                            if (s.contains(":")) enabledSet.add(s.substring(s.indexOf(":") + 1).trim());
                        }
                    }

                    if (rawAll != null && !rawAll.isEmpty()) {
                        JSONArray jsonArray = new JSONArray();
                        String[] lines = rawAll.split("\\n");

                        for (String line : lines) {
                            line = line.trim();
                            if (line.isEmpty()) continue;

                            // Format: package:/path/to/apk=com.package.name
                            int equalsIndex = line.lastIndexOf('=');
                            int packageIndex = line.indexOf("package:");

                            if (equalsIndex > -1 && packageIndex > -1) {
                                String path = line.substring(packageIndex + 8, equalsIndex);
                                String pkgName = line.substring(equalsIndex + 1);

                                JSONObject obj = new JSONObject();
                                obj.put("pkg", pkgName);

                                // Determine Type (System/User) based on Path
                                boolean isSystem = path.startsWith("/system") || path.startsWith("/product") || path.startsWith("/vendor") || path.startsWith("/apex");
                                obj.put("type", isSystem ? "System" : "User");

                                // Determine Status (Enabled/Disabled/Uninstalled)
                                if (enabledSet.contains(pkgName)) {
                                    obj.put("status", "Enabled");
                                } else if (disabledSet.contains(pkgName)) {
                                    obj.put("status", "Disabled");
                                } else {
                                    obj.put("status", "Uninstalled");
                                }

                                String simpleName = pkgName;
                                if (simpleName.contains(".")) {
                                    simpleName = simpleName.substring(simpleName.lastIndexOf('.') + 1);
                                    if (simpleName.length() > 0) {
                                        simpleName = simpleName.substring(0, 1).toUpperCase() + simpleName.substring(1);
                                    }
                                }
                                obj.put("name", simpleName);

                                jsonArray.put(obj);
                            }
                        }
                        base64Data = Base64.encodeToString(jsonArray.toString().getBytes("UTF-8"), Base64.NO_WRAP);
                    }
                }
            } catch (Exception e) {
                Log.e("NEXUS", "Error fetching ADB apps", e);
            }

            final String finalData = base64Data;
            activity.runOnUiThread(() -> webView.evaluateJavascript("if(window.receiveAppList) window.receiveAppList('" + finalData + "');", null));
        });
    }
}