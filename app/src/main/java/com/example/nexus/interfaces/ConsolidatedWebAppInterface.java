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

    // --- Standard Methods (Keep these) ---
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
    @JavascriptInterface public void executeCommand(String a, String p, int u) { executeCommandInternal(a, p, u); }

    // --- NEW: Shizuku-Style Notification Mode ---
    @JavascriptInterface
    public void startPairingNotificationMode() {
        // 1. Start Discovery (so we find the IP/Port)
        pairingManager.startMdnsDiscovery();

        // 2. Show the Notification UI
        activity.runOnUiThread(() -> {
            if (activity instanceof com.example.nexus.UserMainActivity) {
                ((com.example.nexus.UserMainActivity) activity).showPairingNotification();
            }
        });

        common.showToast("Notification ready. Go to Settings!");
    }

    // --- COMPATIBILITY FIX: Redirects old 1-argument calls to the new logic ---
    @JavascriptInterface
    public void executeCommand(String cmd) {
        executeShell(cmd);
    }
    @JavascriptInterface public void getInstalledPackages() { fetchRealPackageListInternal(); }
    @JavascriptInterface public void getUsers() { fetchUsersInternal(); }
    @JavascriptInterface
    public void fetchToolStats() {
        executor.execute(() -> {
            MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();
            if (manager == null || !manager.isConnected()) return;

            // Use the manager to get data
            com.example.nexus.managers.ToolActionManager toolManager =
                    new com.example.nexus.managers.ToolActionManager(manager, common);

            String json = toolManager.getToolStats();

            // Send back to React
            activity.runOnUiThread(() ->
                    webView.evaluateJavascript("if(window.updateToolStats) window.updateToolStats('" + json + "');", null)
            );
        });
    }

    @JavascriptInterface
    public void executeShell(String cmd) {
        executor.execute(() -> {
            MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();

            if (manager == null || !manager.isConnected()) {
                common.showToast("Error: ADB Not Connected");
                return;
            }

            // Create the manager on the fly
            com.example.nexus.managers.ToolActionManager toolManager =
                    new com.example.nexus.managers.ToolActionManager(manager, common);

            // 1. Try to handle it as a "Tool" first
            boolean handled = toolManager.handleCommand(cmd);

            // 2. If it wasn't a tool (or if handleCommand returned false), run as raw shell
            if (!handled) {
                try {
                    String output = manager.runShellCommand(cmd);
                    if (!output.isEmpty()) {
                        common.showToast(output);
                    } else {
                        common.showToast("Command Executed");
                    }
                } catch (Exception e) {
                    common.showToast("Error: " + e.getMessage());
                }
            }
        });
    }

    private void executeCommandInternal(String action, String pkg, int userId) {
        executor.execute(() -> {
            try {
                MyAdbManager m = AdbSingleton.getInstance().getAdbManager();
                if (m == null || !m.isConnected()) return;

                String cmd = "";
                if ("uninstall".equals(action)) cmd = "pm uninstall --user " + userId + " " + pkg;
                else if ("disable".equals(action)) cmd = "pm disable-user --user " + userId + " " + pkg;
                else if ("enable".equals(action)) cmd = "pm enable --user " + userId + " " + pkg;
                else if ("restore".equals(action)) cmd = "cmd package install-existing --user " + userId + " " + pkg;
                else if ("wipe".equals(action)) cmd = "pm clear --user " + userId + " " + pkg;

                if (!cmd.isEmpty()) {
                    m.runShellCommand(cmd);
                    common.showToast(action + " Done");
                    fetchRealPackageListInternal();
                }
            } catch(Exception e) { common.showToast("Error: " + e.getMessage()); }
        });
    }

    private void fetchUsersInternal() {
        executor.execute(() -> {
            try {
                MyAdbManager m = AdbSingleton.getInstance().getAdbManager();
                if (m != null && m.isConnected()) {
                    String raw = m.runShellCommand("pm list users");
                    String b64 = Base64.encodeToString(raw.getBytes(), Base64.NO_WRAP);
                    activity.runOnUiThread(() -> webView.evaluateJavascript("if(window.receiveUsers) window.receiveUsers('" + b64 + "');", null));
                }
            } catch (Exception e) {}
        });
    }

    private void fetchRealPackageListInternal() {
        executor.execute(() -> {
            String base64Data = "";
            try {
                MyAdbManager m = AdbSingleton.getInstance().getAdbManager();
                if (m != null && m.isConnected()) {
                    Set<String> all = fetchPackageSet(m, "pm list packages -u");
                    Set<String> installed = fetchPackageSet(m, "pm list packages");
                    Set<String> disabled = fetchPackageSet(m, "pm list packages -d");
                    Set<String> system = fetchPackageSet(m, "pm list packages -s");

                    if (!all.isEmpty()) {
                        JSONArray jsonArray = new JSONArray();
                        for (String pkg : all) {
                            JSONObject obj = new JSONObject();
                            obj.put("pkg", pkg);
                            obj.put("type", system.contains(pkg) ? "System" : "User");

                            if (!installed.contains(pkg)) obj.put("status", "Uninstalled");
                            else if (disabled.contains(pkg)) obj.put("status", "Disabled");
                            else obj.put("status", "Enabled");

                            String name = pkg;
                            if (name.contains(".")) {
                                name = name.substring(name.lastIndexOf('.') + 1);
                                if (name.length() > 0) name = name.substring(0, 1).toUpperCase() + name.substring(1);
                            }
                            obj.put("name", name);
                            jsonArray.put(obj);
                        }
                        base64Data = Base64.encodeToString(jsonArray.toString().getBytes("UTF-8"), Base64.NO_WRAP);
                    }
                }
            } catch (Exception e) { Log.e("NEXUS", "Fetch Error", e); }

            if (base64Data.isEmpty()) base64Data = Base64.encodeToString("[]".getBytes(), Base64.NO_WRAP);
            final String finalData = base64Data;
            activity.runOnUiThread(() -> webView.evaluateJavascript("if(window.receiveAppList) window.receiveAppList('" + finalData + "');", null));
        });
    }

    private Set<String> fetchPackageSet(MyAdbManager m, String cmd) {
        Set<String> set = new HashSet<>();
        try {
            String out = m.runShellCommand(cmd);
            if (out != null) {
                for (String line : out.split("\\n")) {
                    line = line.trim();
                    if (line.startsWith("package:")) set.add(line.substring(8).trim());
                    else if (!line.isEmpty()) set.add(line);
                }
            }
        } catch (Exception e) {}
        return set;
    }
}