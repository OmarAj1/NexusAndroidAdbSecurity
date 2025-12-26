package com.example.nexus;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;

import com.example.nexus.interfaces.AdbPairingListener;
import com.example.nexus.interfaces.CommonInterface;
import com.example.nexus.interfaces.ConsolidatedWebAppInterface;
import com.example.nexus.managers.AdbPairingManager;
import com.example.nexus.managers.AdbSingleton;
import com.example.nexus.managers.MyAdbManager;
import com.example.nexus.services.NexusAutomationService;
import com.example.nexus.services.ShieldVpnService;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class UserMainActivity extends AppCompatActivity implements AdbPairingListener {

    private WebView webView;
    private ProgressBar loader;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private ConsolidatedWebAppInterface mInterface;
    private AdbPairingManager pairingManager;

    private boolean isPairingMode = false;

    public static final int VPN_REQUEST_CODE = 0x0F;
    private static final int PERMISSION_REQUEST_CODE = 0x10;

    private static final String CHANNEL_ID = "nexus_pairing_channel";
    private static final String KEY_TEXT_REPLY = "key_text_reply";

    public static final String ACTION_PAIR_REPLY = "com.example.nexus.ACTION_PAIR_REPLY";

    private void checkBatteryOptimizations() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                new AlertDialog.Builder(this)
                        .setTitle("Prevent Service Death")
                        .setMessage("To keep the 'Zero-Touch' feature running in the background, Nexus needs to be excluded from Battery Optimizations.\n\nPlease select 'Allow' or 'No Restrictions' in the next screen.")
                        .setPositiveButton("Fix Now", (d, w) -> {
                            try {
                                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                                intent.setData(Uri.parse("package:" + getPackageName()));
                                startActivity(intent);
                            } catch (Exception e) {
                                startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
                            }
                        })
                        .setNegativeButton("Later", null)
                        .show();
            }
        }
    }

    private final BroadcastReceiver blockReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (ShieldVpnService.ACTION_VPN_BLOCK.equals(intent.getAction())) {
                String domain = intent.getStringExtra(ShieldVpnService.EXTRA_BLOCKED_DOMAIN);
                if (domain != null && webView != null) {
                    webView.evaluateJavascript("if(window.onShieldBlock) window.onShieldBlock('" + domain + "');", null);
                }
            }
        }
    };

    private final BroadcastReceiver pairingReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (ACTION_PAIR_REPLY.equals(intent.getAction())) {
                String code = null;
                String fullAddr = null;

                if (intent.hasExtra("auto_code")) {
                    code = intent.getStringExtra("auto_code");
                    fullAddr = intent.getStringExtra("auto_addr");
                } else {
                    Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
                    if (remoteInput != null) {
                        code = remoteInput.getCharSequence(KEY_TEXT_REPLY).toString();
                    }
                }

                if (code != null) {
                    CommonInterface common = new CommonInterface(UserMainActivity.this);
                    if (fullAddr != null && fullAddr.contains(":")) {
                        String[] parts = fullAddr.split(":");
                        common.showToast("Auto-Detected: " + parts[0] + ":" + parts[1]);
                        pairingManager.pairAdb(parts[0], parts[1], code);
                    } else {
                        pairingManager.pairWithSavedService(code, common);
                    }
                    isPairingMode = false;
                    NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                    nm.cancel(999);
                }
            }
        }
    };

    public void startZeroTouchPairing() {
        if (!isAccessibilityServiceEnabled()) {
            new AlertDialog.Builder(this)
                    .setTitle("Enable Zero-Touch?")
                    .setMessage("Nexus needs 'Accessibility' permission to tap the pairing buttons for you.\n\nEnable 'Nexus' in the next screen.")
                    .setPositiveButton("Enable", (d, w) -> {
                        startActivity(new Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS));
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
            return;
        }

        if (pairingManager != null) pairingManager.startMdnsDiscovery();

        try {
            Intent intent = new Intent("android.settings.WIRELESS_DEBUGGING_SETTINGS");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
            new CommonInterface(this).showToast("Watch the magic...");
        } catch (Exception e) {
            try {
                Intent devIntent = new Intent(android.provider.Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS);
                devIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(devIntent);
                new CommonInterface(this).showToast("Finding Wireless Debugging...");
            } catch (Exception ex) {
                new CommonInterface(this).showToast("Error: Please open Developer Options manually.");
            }
        }
    }

    private boolean isAccessibilityServiceEnabled() {
        int accessibilityEnabled = 0;
        try {
            accessibilityEnabled = android.provider.Settings.Secure.getInt(
                    getContentResolver(),
                    android.provider.Settings.Secure.ACCESSIBILITY_ENABLED);
        } catch (android.provider.Settings.SettingNotFoundException e) { return false; }

        if (accessibilityEnabled == 1) {
            String services = android.provider.Settings.Secure.getString(
                    getContentResolver(),
                    android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            return services != null && services.toLowerCase().contains(getPackageName().toLowerCase());
        }
        return false;
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Thread.setDefaultUncaughtExceptionHandler((thread, e) -> handleFatalError(e));

        super.onCreate(savedInstanceState);

        try {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            setContentView(R.layout.activity_main);

            registerPairingReceiver();

            webView = findViewById(R.id.webview);
            loader = findViewById(R.id.loader);

            if (webView != null) {
                setupWebViewUI();

                try {
                    AdbSingleton.getInstance().init(getApplicationContext(), new AdbSingleton.AdbInitListener() {
                        @Override
                        public void onInitComplete() {
                            mainHandler.post(() -> {
                                if (webView != null) webView.evaluateJavascript("console.log('ADB Native Init Complete');", null);
                            });
                        }
                    });
                } catch (Throwable t) {
                    Log.e("NEXUS", "ADB Init Failed", t);
                }

                pairingManager = new AdbPairingManager(this, this);
                mInterface = new ConsolidatedWebAppInterface(this, executor, webView, pairingManager);
                webView.addJavascriptInterface(mInterface, "AndroidNative");

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        mainHandler.postDelayed(() -> {
                            if (loader != null) loader.setVisibility(View.GONE);
                            view.setAlpha(1.0f);
                            try {
                                MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();
                                if (manager != null && manager.isConnected()) {
                                    webView.evaluateJavascript("window.adbStatus('Connected');", null);
                                    mInterface.getInstalledPackages();
                                }
                            } catch (Exception ignored) {}
                        }, 200);
                    }
                });

                webView.setWebChromeClient(new WebChromeClient());
                webView.loadUrl("file:///android_asset/web/index.html");
            }

            checkPermissions();

        } catch (RuntimeException e) {
            if (e.getClass().getName().contains("MissingWebViewPackageException") ||
                    (e.getMessage() != null && e.getMessage().contains("No WebView installed"))) {
                showMissingWebViewDialog();
            } else {
                handleFatalError(e);
            }
        } catch (Exception e) {
            handleFatalError(e);
        }
        checkBatteryOptimizations();
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    private void registerPairingReceiver() {
        IntentFilter filter = new IntentFilter(ACTION_PAIR_REPLY);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(pairingReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(pairingReceiver, filter);
        }
    }

    public void showPairingNotification() {
        isPairingMode = true;
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Pairing Service", NotificationManager.IMPORTANCE_HIGH);
            notificationManager.createNotificationChannel(channel);
        }

        RemoteInput remoteInput = new RemoteInput.Builder(KEY_TEXT_REPLY)
                .setLabel("Enter 6-digit Code")
                .build();

        Intent replyIntent = new Intent(ACTION_PAIR_REPLY);
        replyIntent.setPackage(getPackageName());

        PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
                this,
                0,
                replyIntent,
                PendingIntent.FLAG_MUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        NotificationCompat.Action action = new NotificationCompat.Action.Builder(
                android.R.drawable.ic_menu_send, "ENTER CODE", replyPendingIntent)
                .addRemoteInput(remoteInput)
                .build();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Wireless Debugging Pairing")
                .setContentText("Tap 'Enter Code' and type the code from Settings")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setOngoing(true)
                .addAction(action);

        notificationManager.notify(999, builder.build());
    }

    private void showMissingWebViewDialog() {
        new AlertDialog.Builder(this)
                .setTitle("System Component Missing")
                .setMessage("This app requires 'Android System WebView' to run, but it is missing or disabled on your device.\n\nPlease update it in the Play Store.")
                .setPositiveButton("Fix in Play Store", (d, w) -> {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.google.android.webview")));
                    } catch (Exception e) {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.webview")));
                    }
                    finish();
                })
                .setNegativeButton("Close", (d, w) -> finish())
                .setCancelable(false)
                .show();
    }

    private void handleFatalError(Throwable e) {
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        String stackTrace = sw.toString();

        new Handler(Looper.getMainLooper()).post(() -> {
            new AlertDialog.Builder(this)
                    .setTitle("CRASH DETECTED")
                    .setMessage("Error: " + e.getMessage() + "\n\n" + stackTrace.substring(0, Math.min(500, stackTrace.length())))
                    .setPositiveButton("Close", (d, w) -> finish())
                    .setCancelable(false)
                    .show();
        });
    }

    private void setupWebViewUI() {
        if (webView == null) return;
        webView.setBackgroundColor(0xFF020617);
        webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
    }

    private void checkPermissions() {
        List<String> permissions = new ArrayList<>();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        }

        if (!permissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == VPN_REQUEST_CODE && resultCode == RESULT_OK) {
            mInterface.shield.startShieldServiceInternal();
        }
    }

    @Override
    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    protected void onResume() {
        super.onResume();

        MyAdbManager m = AdbSingleton.getInstance().getAdbManager();
        boolean isConnected = (m != null && m.isConnected());

        if (isConnected) {
            if (pairingManager != null) pairingManager.stopMdnsDiscovery();
            updateAutomationState(true);
        } else {
            if (pairingManager != null) pairingManager.startMdnsDiscovery();
            updateAutomationState(false);
        }

        IntentFilter filter = new IntentFilter(ShieldVpnService.ACTION_VPN_BLOCK);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(blockReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(blockReceiver, filter);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (pairingManager != null && !isPairingMode) {
            pairingManager.stopMdnsDiscovery();
        }
        try { unregisterReceiver(blockReceiver); } catch (IllegalArgumentException e) { }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (pairingManager != null) pairingManager.stopMdnsDiscovery();
        try { unregisterReceiver(pairingReceiver); } catch (Exception e) { }
    }

    @Override
    public void onPairingServiceFound(String ip, int port) {
        runOnUiThread(() -> { if(webView!=null) webView.evaluateJavascript(String.format("if(window.onPairingServiceFound) window.onPairingServiceFound('%s', '%d');", ip, port), null); });
    }

    @Override
    public void onConnectServiceFound(String ip, int port) {
        runOnUiThread(() -> { if(webView!=null) webView.evaluateJavascript(String.format("if(window.onConnectServiceFound) window.onConnectServiceFound('%s', '%d');", ip, port), null); });
    }

    @Override
    public void onPairingResult(boolean success, String message) {
        runOnUiThread(() -> { if (mInterface != null && mInterface.common != null) mInterface.common.showToast(message); });
    }

    @Override
    public void onConnectionResult(boolean success, String message) {
        runOnUiThread(() -> {
            if (mInterface != null && mInterface.common != null) mInterface.common.showToast(message);

            if (success) {
                if (webView != null) webView.evaluateJavascript("window.adbStatus('Connected');", null);
                if (pairingManager != null) pairingManager.stopMdnsDiscovery();

                // --- FIX: Fetch apps immediately on connection success ---
                if (mInterface != null) mInterface.getInstalledPackages();

                updateAutomationState(true);
            } else if (message != null && message.contains("Connection Failed") && webView != null) {
                webView.evaluateJavascript("window.adbStatus('Connection Failed');", null);
                updateAutomationState(false);
            }
        });
    }

    private void updateAutomationState(boolean isConnected) {
        try {
            Intent intent = new Intent(this, NexusAutomationService.class);
            intent.putExtra("SHIELD_STATUS", isConnected);
            startService(intent);
        } catch (Exception e) {
            Log.e("NEXUS_MAIN", "Failed to update automation state", e);
        }
    }
}