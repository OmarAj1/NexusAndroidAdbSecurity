package com.example.nexus.interfaces;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
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
import java.util.List;
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

        // Initialize sub-interfaces
        this.common = new CommonInterface(activity);
        this.shield = new ShieldInterface(activity, common);
    }

    // --- Bridge Methods ---
    @JavascriptInterface public String getNativeCoreVersion() { return common.getNativeCoreVersion(); }
    @JavascriptInterface public void hapticFeedback(String type) { common.hapticFeedback(type); }
    @JavascriptInterface public void showToast(String toast) { common.showToast(toast); }
    @JavascriptInterface public void shareText(String t, String c) { common.shareText(t, c); }

    // --- ADB Pairing Methods ---
    @JavascriptInterface public void pairAdb(String ip, String p, String c) { pairingManager.pairAdb(ip, p, c); }
    @JavascriptInterface public boolean connectAdb(String ip, String p) { pairingManager.connectAdb(ip, p); return true; }
    @JavascriptInterface public void startMdnsDiscovery() { pairingManager.startMdnsDiscovery(); }
    @JavascriptInterface public void stopMdnsDiscovery() { pairingManager.stopMdnsDiscovery(); }
    @JavascriptInterface public void retrieveConnectionInfo() { pairingManager.retrieveConnectionInfo(); }

    // --- Shield Methods ---
    @JavascriptInterface public void startVpn() { shield.startVpn(); }
    @JavascriptInterface public void stopVpn() { shield.stopVpn(); }
    @JavascriptInterface public boolean getVpnStatus() { return shield.getVpnStatus(); }

    // --- App Management Methods ---
    @JavascriptInterface public void executeCommand(String a, String p, int userId) { executeCommandInternal(a, p, userId); }
    @JavascriptInterface public void getInstalledPackages() { fetchRealPackageListInternal(); }
    @JavascriptInterface public void getUsers() { fetchUsersInternal(); }

    private void executeCommandInternal(String action, String pkg, int userId) {
        executor.execute(() -> {
            MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();
            if (manager == null || !manager.isConnected()) { common.showToast("Not Connected"); return; }
            try {
                String cmd = "";
                if ("uninstall".equals(action)) cmd = "pm uninstall --user " + userId + " " + pkg;
                else if ("disable".equals(action)) cmd = "pm disable-user --user " + userId + " " + pkg;
                else if ("enable".equals(action)) cmd = "pm enable --user " + userId + " " + pkg;
                else if ("install-existing".equals(action)) cmd = "cmd package install-existing --user " + userId + " " + pkg;

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
            String base64Data;
            try {
                MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();

                if (manager != null && manager.isConnected()) {
                    // --- OPTIMIZATION ---
                    // Run ALL 4 commands in a SINGLE shell session to avoid handshake overhead.
                    // We use "====SECTION====" to separate the output of each command.
                    String cmd = "pm list packages -u; echo '====SECTION===='; pm list packages; echo '====SECTION===='; pm list packages -s -u; echo '====SECTION===='; pm list packages -d";

                    String rawOutput = manager.runShellCommand(cmd);

                    // Split the huge string by our separator
                    // Index 0: All Apps (-u)
                    // Index 1: Installed Apps
                    // Index 2: System Apps (-s -u)
                    // Index 3: Disabled Apps (-d)
                    String[] sections = rawOutput.split("====SECTION====");

                    // Ensure we have all sections (even if empty)
                    Set<String> allPkgs = (sections.length > 0) ? parsePackageList(sections[0]) : new HashSet<>();
                    Set<String> installedPkgs = (sections.length > 1) ? parsePackageList(sections[1]) : new HashSet<>();
                    Set<String> systemPkgs = (sections.length > 2) ? parsePackageList(sections[2]) : new HashSet<>();
                    Set<String> disabledPkgs = (sections.length > 3) ? parsePackageList(sections[3]) : new HashSet<>();

                    JSONArray jsonArray = new JSONArray();

                    for (String pkg : allPkgs) {
                        JSONObject obj = new JSONObject();
                        obj.put("pkg", pkg);

                        // 1. TYPE
                        boolean isSystem = systemPkgs.contains(pkg);
                        obj.put("type", isSystem ? "System" : "User");

                        // 2. STATUS
                        boolean isInstalled = installedPkgs.contains(pkg);
                        boolean isDisabled = disabledPkgs.contains(pkg);

                        String status = "Enabled";
                        if (!isInstalled) {
                            status = "Uninstalled";
                        } else if (isDisabled) {
                            status = "Disabled";
                        }
                        obj.put("status", status);

                        // 3. NAME
                        String simpleName = pkg;
                        if (simpleName.contains(".")) {
                            simpleName = simpleName.substring(simpleName.lastIndexOf('.') + 1);
                            if (simpleName.length() > 0) {
                                simpleName = simpleName.substring(0, 1).toUpperCase() + simpleName.substring(1);
                            }
                        }
                        obj.put("name", simpleName);

                        jsonArray.put(obj);
                    }
                    base64Data = Base64.encodeToString(jsonArray.toString().getBytes("UTF-8"), Base64.NO_WRAP);

                } else {
                    // FALLBACK: Standard PackageManager (Only sees installed apps)
                    PackageManager pm = activity.getPackageManager();
                    List<PackageInfo> packages = pm.getInstalledPackages(0);
                    JSONArray jsonArray = new JSONArray();
                    for (PackageInfo pInfo : packages) {
                        if (pInfo.packageName.equals(activity.getPackageName())) continue;
                        JSONObject obj = new JSONObject();
                        obj.put("pkg", pInfo.packageName);
                        obj.put("type", (pInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0 ? "System" : "User");
                        obj.put("status", pInfo.applicationInfo.enabled ? "Enabled" : "Disabled");
                        String simpleName = pInfo.packageName;
                        if (simpleName.contains(".")) {
                            simpleName = simpleName.substring(simpleName.lastIndexOf('.') + 1);
                            if (simpleName.length() > 0) simpleName = simpleName.substring(0, 1).toUpperCase() + simpleName.substring(1);
                        }
                        obj.put("name", simpleName);
                        jsonArray.put(obj);
                    }
                    base64Data = Base64.encodeToString(jsonArray.toString().getBytes("UTF-8"), Base64.NO_WRAP);
                }
            } catch (Exception e) {
                Log.e("NEXUS", "Error fetching apps", e);
                base64Data = "";
            }

            final String finalData = base64Data;
            activity.runOnUiThread(() -> webView.evaluateJavascript("if(window.receiveAppList) window.receiveAppList('" + finalData + "');", null));
        });
    }

    private Set<String> parsePackageList(String raw) {
        Set<String> set = new HashSet<>();
        if (raw == null) return set;
        String[] lines = raw.split("\n");
        for (String line : lines) {
            line = line.trim();
            if (line.startsWith("package:")) {
                set.add(line.substring(8).trim());
            }
        }
        return set;
    }
}