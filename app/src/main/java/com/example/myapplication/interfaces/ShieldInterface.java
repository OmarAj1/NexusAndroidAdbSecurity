package com.example.myapplication.interfaces;

import android.util.Log;
import android.webkit.JavascriptInterface;
import androidx.appcompat.app.AppCompatActivity;

public class ShieldInterface {
    private final CommonInterface mCommon;

    public ShieldInterface(AppCompatActivity activity, CommonInterface common) {
        this.mCommon = common;
    }

    @JavascriptInterface
    public void startVpn() {
        Log.i("NEXUS_SHIELD", "Attempting to start VPN service...");
        mCommon.showToast("Shield Activated (Simulated)");
    }

    @JavascriptInterface
    public void stopVpn() {
        Log.i("NEXUS_SHIELD", "Attempting to stop VPN service...");
        mCommon.showToast("Shield Deactivated (Simulated)");
    }
}