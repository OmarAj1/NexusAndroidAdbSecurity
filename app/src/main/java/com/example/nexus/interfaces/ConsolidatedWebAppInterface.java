package com.example.nexus.interfaces;

import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatActivity;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;
import com.example.nexus.managers.AdbPairingManager;
import com.example.nexus.managers.AdbSingleton;
import com.example.nexus.managers.MyAdbManager;
import com.example.nexus.managers.CorpseFinderManager;
import com.example.nexus.managers.ToolActionManager;
import com.example.nexus.services.MockLocationService;

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
    private Context context;
    private MyAdbManager adbManager;
    private ToolActionManager toolManager;
    private CorpseFinderManager corpseManager;

    public ConsolidatedWebAppInterface(AppCompatActivity activity, ExecutorService executor, WebView webView, AdbPairingManager pairingManager) {
        this.activity = activity;
        this.context = activity;
        this.executor = executor;
        this.webView = webView;
        this.pairingManager = pairingManager;
        this.common = new CommonInterface(activity);
        this.shield = new ShieldInterface(activity, common);
        this.corpseManager = new CorpseFinderManager(context, common);
    }

    // --- GPS SPOOFING METHODS ---

    @JavascriptInterface
    public void setFakeLocation(double lat, double lon) {
        try {
            Intent intent = new Intent(context, MockLocationService.class);
            intent.setAction(MockLocationService.ACTION_START);
            intent.putExtra(MockLocationService.EXTRA_LAT, lat);
            intent.putExtra(MockLocationService.EXTRA_LON, lon);
            context.startService(intent);
            Toast.makeText(context, "Fake GPS Started", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Log.e("NexusNative", "Failed to start GPS service", e);
            Toast.makeText(context, "Error starting GPS: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    @JavascriptInterface
    public void stopFakeLocation() {
        try {
            Intent intent = new Intent(context, MockLocationService.class);
            intent.setAction(MockLocationService.ACTION_STOP);
            context.startService(intent);
            Toast.makeText(context, "Fake GPS Stopped", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Log.e("NexusNative", "Failed to stop GPS service", e);
        }
    }

    // --- EXISTING METHODS ---

    @JavascriptInterface
    public void scanForCorpses() {
        corpseManager.scanForCorpses();
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

    @JavascriptInterface public void getInstalledPackages() { fetchRealPackageListInternal(); }
    @JavascriptInterface public void getUsers() { fetchUsersInternal(); }

    @JavascriptInterface public void executeCommand(String a, String p, int u) { executeCommandInternal(a, p, u); }

    @JavascriptInterface
    public void checkConnectionStatus() {
        executor.execute(() -> {
            MyAdbManager m = AdbSingleton.getInstance().getAdbManager();
            boolean isConnected = (m != null && m.isConnected());

            activity.runOnUiThread(() -> {
                if (isConnected) {
                    webView.evaluateJavascript("window.adbStatus('Connected');", null);
                    // RESTORED: This is needed so the list loads on app start!
                    // Since we removed the polling loop in React, this is safe and won't spam.
                    fetchRealPackageListInternal();
                } else {
                    webView.evaluateJavascript("window.adbStatus('Disconnected');", null);
                }
            });
        });
    }

    @JavascriptInterface
    public void startZeroTouchPairing() {
        activity.runOnUiThread(() -> {
            if (activity instanceof com.example.nexus.UserMainActivity) {
                ((com.example.nexus.UserMainActivity) activity).startZeroTouchPairing();
            }
        });
    }

    @JavascriptInterface
    public void startPairingNotificationMode() {
        pairingManager.startMdnsDiscovery();
        activity.runOnUiThread(() -> {
            if (activity instanceof com.example.nexus.UserMainActivity) {
                ((com.example.nexus.UserMainActivity) activity).showPairingNotification();
            }
        });
        common.showToast("Notification ready. Go to Settings!");
    }

    @JavascriptInterface
    public void executeShell(String cmd) {
        executor.execute(() -> {
            MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();
            if (manager == null || !manager.isConnected()) {
                common.showToast("Error: ADB Not Connected");
                return;
            }
            com.example.nexus.managers.ToolActionManager toolManager =
                    new com.example.nexus.managers.ToolActionManager(manager, common);

            boolean handled = toolManager.handleCommand(cmd);
            if (!handled) {
                try {
                    String output = manager.runShellCommand(cmd);
                    if (!output.isEmpty()) common.showToast(output);
                    else common.showToast("Command Executed");
                } catch (Exception e) {
                    common.showToast("Error: " + e.getMessage());
                }
            }
        });
    }

    @JavascriptInterface
    public void fetchToolStats() {
        executor.execute(() -> {
            MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();
            if (manager == null || !manager.isConnected()) return;
            com.example.nexus.managers.ToolActionManager toolManager =
                    new com.example.nexus.managers.ToolActionManager(manager, common);
            String json = toolManager.getToolStats();
            activity.runOnUiThread(() ->
                    webView.evaluateJavascript("if(window.updateToolStats) window.updateToolStats('" + json + "');", null)
            );
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