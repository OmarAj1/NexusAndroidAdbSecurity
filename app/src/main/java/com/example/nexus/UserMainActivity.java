package com.example.nexus;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
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
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;

import com.example.nexus.interfaces.AdbPairingListener;
import com.example.nexus.interfaces.ConsolidatedWebAppInterface;
import com.example.nexus.managers.AdbPairingManager;
import com.example.nexus.managers.AdbSingleton;
import com.example.nexus.managers.MyAdbManager;
import com.example.nexus.services.ShieldVpnService;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class UserMainActivity extends AppCompatActivity implements AdbPairingListener {

    private WebView webView;
    private ProgressBar loader;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private ConsolidatedWebAppInterface mInterface;
    private AdbPairingManager pairingManager;

    public static final int VPN_REQUEST_CODE = 0x0F;
    private static final int NOTIFICATION_REQUEST_CODE = 0x10;

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

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Thread.setDefaultUncaughtExceptionHandler((thread, e) -> handleFatalError(e));

        super.onCreate(savedInstanceState);

        try {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            setContentView(R.layout.activity_main);

            // Find views from XML
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
            // Check for missing WebView specifically
            if (e.getClass().getName().contains("MissingWebViewPackageException") ||
                    (e.getMessage() != null && e.getMessage().contains("No WebView installed"))) {
                showMissingWebViewDialog();
            } else {
                handleFatalError(e);
            }
        } catch (Exception e) {
            handleFatalError(e);
        }
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

        // Force Software Mode for Samsung A30 Stability
        webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
    }

    private void checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_REQUEST_CODE);
            }
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
        if (pairingManager != null) pairingManager.startMdnsDiscovery();
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
        if (pairingManager != null) pairingManager.stopMdnsDiscovery();
        try { unregisterReceiver(blockReceiver); } catch (IllegalArgumentException e) { }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (pairingManager != null) pairingManager.stopMdnsDiscovery();
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
            if (success && webView!=null) webView.evaluateJavascript("window.adbStatus('Connected');", null);
            else if (message != null && message.contains("Connection Failed") && webView!=null) webView.evaluateJavascript("window.adbStatus('Connection Failed');", null);
        });
    }
}