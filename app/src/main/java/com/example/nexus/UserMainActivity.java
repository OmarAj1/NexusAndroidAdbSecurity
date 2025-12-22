package com.example.nexus;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
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

import java.security.Security;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.bouncycastle.jce.provider.BouncyCastleProvider;

public class UserMainActivity extends AppCompatActivity implements AdbPairingListener {

    private WebView webView;
    private ProgressBar loader;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private ConsolidatedWebAppInterface mInterface;
    private AdbPairingManager pairingManager;

    public static final int VPN_REQUEST_CODE = 0x0F;
    private static final int NOTIFICATION_REQUEST_CODE = 0x10;

    // NEW RECEIVER
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
        super.onCreate(savedInstanceState);

        try {
            Security.removeProvider("BC");
            Security.addProvider(new BouncyCastleProvider());
        } catch (Exception e) {
            Log.e("NEXUS", "Error setting up Security Provider", e);
        }

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        loader = findViewById(R.id.loader);

        setupWebViewUI();

        AdbSingleton.getInstance().init(getApplicationContext(), new AdbSingleton.AdbInitListener() {
            @Override
            public void onInitComplete() {
                mainHandler.post(() -> {
                    Log.d("NEXUS", "ADB Initialization Sequence Complete");
                    if (webView != null) {
                        webView.evaluateJavascript("console.log('ADB Native Init Complete');", null);
                    }
                });
            }
        });

        pairingManager = new AdbPairingManager(this, this);

        mInterface = new ConsolidatedWebAppInterface(this, executor, webView, pairingManager);
        webView.addJavascriptInterface(mInterface, "AndroidNative");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                mainHandler.postDelayed(() -> {
                    if (loader != null) loader.setVisibility(View.GONE);
                    view.setAlpha(1.0f);

                    MyAdbManager manager = AdbSingleton.getInstance().getAdbManager();

                    if (manager != null && manager.isConnected()) {
                        webView.evaluateJavascript("window.adbStatus('Connected');", null);
                        mInterface.getInstalledPackages();
                    }
                }, 200);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                Log.d("NEXUS_WEB", cm.message());
                return true;
            }
        });

        webView.loadUrl("file:///android_asset/web/index.html");
        checkPermissions();
    }

    private void setupWebViewUI() {
        webView.setBackgroundColor(0xFF020617);
        // NOTE: Insets Listener removed for Edge-to-Edge effect

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
    protected void onResume() {
        super.onResume();
        if (pairingManager != null) pairingManager.startMdnsDiscovery();

        // REGISTER RECEIVER
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(blockReceiver, new IntentFilter(ShieldVpnService.ACTION_VPN_BLOCK), Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(blockReceiver, new IntentFilter(ShieldVpnService.ACTION_VPN_BLOCK));
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (pairingManager != null) pairingManager.stopMdnsDiscovery();

        // UNREGISTER RECEIVER
        try {
            unregisterReceiver(blockReceiver);
        } catch (IllegalArgumentException e) {
            // Receiver not registered
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (pairingManager != null) pairingManager.stopMdnsDiscovery();
    }

    @Override
    public void onPairingServiceFound(String ip, int port) {
        runOnUiThread(() -> {
            webView.evaluateJavascript(String.format("if(window.onPairingServiceFound) window.onPairingServiceFound('%s', '%d');", ip, port), null);
        });
    }

    @Override
    public void onConnectServiceFound(String ip, int port) {
        runOnUiThread(() -> {
            webView.evaluateJavascript(String.format("if(window.onConnectServiceFound) window.onConnectServiceFound('%s', '%d');", ip, port), null);
        });
    }

    @Override
    public void onPairingResult(boolean success, String message) {
        runOnUiThread(() -> {
            if (mInterface != null && mInterface.common != null) {
                mInterface.common.showToast(message);
            }
        });
    }

    @Override
    public void onConnectionResult(boolean success, String message) {
        runOnUiThread(() -> {
            if (mInterface != null && mInterface.common != null) {
                mInterface.common.showToast(message);
            }

            if (success) {
                webView.evaluateJavascript("window.adbStatus('Connected');", null);
            } else if (message != null && message.contains("Connection Failed")) {
                webView.evaluateJavascript("window.adbStatus('Connection Failed');", null);
            }
        });
    }
}