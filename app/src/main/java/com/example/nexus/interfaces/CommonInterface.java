package com.example.nexus.interfaces;

import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class CommonInterface {
    public final Context mContext;
    private final AppCompatActivity mActivity;

    public CommonInterface(AppCompatActivity activity) {
        this.mActivity = activity;
        this.mContext = activity.getApplicationContext();
    }

    // --- NEW: Helper to run code on the main UI thread (Fixes CorpseFinder error) ---
    public void runOnUi(Runnable action) {
        if (mActivity != null) {
            mActivity.runOnUiThread(action);
        } else {
            new Handler(Looper.getMainLooper()).post(action);
        }
    }

    @JavascriptInterface
    public String getNativeCoreVersion() {
        return "5.2.1-STABLE";
    }

    @JavascriptInterface
    public void hapticFeedback(String type) {
        try {
            Vibrator v = (Vibrator) mContext.getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null) {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(20);
                }
            }
        } catch (Exception e) {
            Log.e("NEXUS_HAPTIC", "Error", e);
        }
    }

    @JavascriptInterface
    public void showToast(String toast) {
        runOnUi(() ->
                Toast.makeText(mContext, toast, Toast.LENGTH_LONG).show()
        );
    }

    @JavascriptInterface
    public void shareText(String title, String content) {
        runOnUi(() -> {
            try {
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("text/plain");
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
                shareIntent.putExtra(Intent.EXTRA_TEXT, content);

                Intent chooser = Intent.createChooser(shareIntent, title);
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(chooser);
            } catch (Exception e) {
                Toast.makeText(mContext, "Share failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}