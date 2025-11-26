package com.example.myapplication;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

// --- BOUNCY CASTLE IMPORTS (Standard, works on Android) ---
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Security;
import java.security.cert.Certificate;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import io.github.muntashirakon.adb.AbsAdbConnectionManager;
import io.github.muntashirakon.adb.AdbStream;

public class UserMainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar loader;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private static MyAdbManager adbManager;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        loader = findViewById(R.id.loader);

        if (webView == null || loader == null) return;

        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
            Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(insets.left, 0, insets.right, insets.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webView.setBackgroundColor(0x00000000);

        initAdbManager();

        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidNative");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                loader.setVisibility(View.GONE);
                view.animate().alpha(1.0f).setDuration(300);
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void initAdbManager() {
        executor.execute(() -> {
            try {
                // Ensure Bouncy Castle provider is registered
                Security.removeProvider("BC");
                Security.addProvider(new BouncyCastleProvider());

                adbManager = new MyAdbManager();
            } catch (Exception e) {
                Log.e("NEXUS", "Failed to init ADB Manager", e);
            }
        });
    }

    // --- IMPLEMENTATION USING BOUNCY CASTLE ---
    public static class MyAdbManager extends AbsAdbConnectionManager {
        private PrivateKey mPrivateKey;
        private Certificate mCertificate;

        public MyAdbManager() throws Exception {
            setApi(Build.VERSION.SDK_INT);
            generateKeys();
        }

        private void generateKeys() throws Exception {
            // 1. Generate RSA Key Pair
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
            keyGen.initialize(2048, new SecureRandom());
            KeyPair pair = keyGen.generateKeyPair();

            mPrivateKey = pair.getPrivate();
            PublicKey publicKey = pair.getPublic();

            // 2. Generate Self-Signed Certificate using Bouncy Castle
            X500Name issuer = new X500Name("CN=NexusADB");
            BigInteger serial = BigInteger.valueOf(System.currentTimeMillis());
            Date notBefore = new Date();
            Date notAfter = new Date(System.currentTimeMillis() + 1000L * 3600 * 24 * 365); // 1 Year validity
            X500Name subject = new X500Name("CN=NexusADB");

            JcaX509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    issuer, serial, notBefore, notAfter, subject, publicKey
            );

            ContentSigner signer = new JcaContentSignerBuilder("SHA256WithRSA")
                    .setProvider("BC")
                    .build(mPrivateKey);

            X509CertificateHolder certHolder = certBuilder.build(signer);

            mCertificate = new JcaX509CertificateConverter()
                    .setProvider("BC")
                    .getCertificate(certHolder);
        }

        @NonNull
        @Override
        protected PrivateKey getPrivateKey() { return mPrivateKey; }

        @NonNull
        @Override
        protected Certificate getCertificate() { return mCertificate; }

        @NonNull
        @Override
        protected String getDeviceName() { return "NexusController"; }
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) { mContext = c; }

        @JavascriptInterface
        public String getNativeCoreVersion() { return "3.1.0-BOUNCY"; }

        @JavascriptInterface
        public void hapticFeedback(String type) {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null) v.vibrate(VibrationEffect.createOneShot(20, 100));
        }

        @JavascriptInterface
        public void showToast(String toast) {
            Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show();
        }

        @JavascriptInterface
        public void pairAdb(String ip, String portStr, String code) {
            executor.execute(() -> {
                if (adbManager == null) {
                    runOnUiThread(() -> showToast("Initializing Core..."));
                    return;
                }
                try {
                    int port = Integer.parseInt(portStr);
                    boolean success = adbManager.pair(ip, port, code);
                    runOnUiThread(() -> showToast(success ? "Pairing Success!" : "Pairing Failed"));
                } catch (Exception e) {
                    Log.e("NEXUS", "Pairing Error", e);
                    runOnUiThread(() -> showToast("Error: " + e.getMessage()));
                }
            });
        }

        @JavascriptInterface
        public boolean connectAdb(String ip, String portStr) {
            executor.execute(() -> {
                if (adbManager == null) return;
                try {
                    int port = Integer.parseInt(portStr);
                    boolean connected = adbManager.connect(ip, port);
                    if (connected) {
                        runOnUiThread(() -> {
                            showToast("Connected to ADB!");
                            getInstalledPackages();
                        });
                    } else {
                        runOnUiThread(() -> showToast("Connection Refused"));
                    }
                } catch (Exception e) {
                    Log.e("NEXUS", "Connect Error", e);
                    runOnUiThread(() -> showToast("Connect Error: " + e.getMessage()));
                }
            });
            return true;
        }

        @JavascriptInterface
        public void getInstalledPackages() {
            executor.execute(() -> {
                try {
                    PackageManager pm = getPackageManager();
                    java.util.List<PackageInfo> packages = pm.getInstalledPackages(PackageManager.GET_PERMISSIONS);
                    JSONArray jsonArray = new JSONArray();
                    for (PackageInfo info : packages) {
                        boolean isSystem = (info.applicationInfo.flags & android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0;
                        JSONObject obj = new JSONObject();
                        obj.put("name", info.applicationInfo.loadLabel(pm).toString());
                        obj.put("pkg", info.packageName);
                        obj.put("category", isSystem ? "System" : "User");
                        obj.put("risk", "safe");
                        obj.put("permissions", new JSONArray());
                        jsonArray.put(obj);
                    }
                    String js = "if(window.receiveAppList) { window.receiveAppList('" + jsonArray.toString().replace("'", "\\'") + "'); }";
                    runOnUiThread(() -> webView.evaluateJavascript(js, null));
                } catch (Exception e) {
                    Log.e("NEXUS", "List Error", e);
                }
            });
        }

        @JavascriptInterface
        public void revokeInternet(String pkg) {
            executor.execute(() -> {
                if (adbManager == null) return;
                try {
                    adbManager.openStream("shell:cmd appops set " + pkg + " INTERNET deny");
                    runOnUiThread(() -> showToast("Revoked Net: " + pkg));
                } catch (Exception e) {}
            });
        }
    }
}