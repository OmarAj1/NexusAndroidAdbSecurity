package com.example.myapplication.interfaces;

import android.webkit.WebView;
import androidx.appcompat.app.AppCompatActivity;
import java.util.concurrent.ExecutorService;

public class PurgeInterface {
    // This file is obsolete. Logic has moved to UserMainActivity.
    // Kept empty to satisfy compiler if file is not deleted.
    public PurgeInterface(AppCompatActivity activity, ExecutorService executor, WebView webView, CommonInterface common) {}
    public void pairAdb(String ip, String portStr, String code) {}
    public boolean connectAdb(String ip, String portStr) { return false; }
    public void executeCommand(String action, String pkg) {}
    public void getInstalledPackages() {}
    public void startMdnsDiscovery() {}
    public void stopMdnsDiscovery() {}
    public void retrieveConnectionInfo() {}
}