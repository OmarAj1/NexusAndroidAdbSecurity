package com.example.myapplication.interfaces;

import android.content.Context;
import android.content.Intent;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class CommonInterface {
    private final AppCompatActivity mActivity;
    private final Context mContext;

    public CommonInterface(AppCompatActivity activity) {
        this.mActivity = activity;
        this.mContext = activity.getApplicationContext();
    }

    @JavascriptInterface
    public String getNativeCoreVersion() {
        return "3.2.0-LIFECYCLE-FIX";
    }

    @JavascriptInterface
    public void hapticFeedback(String type) {
        Vibrator v = (Vibrator) mContext.getSystemService(Context.VIBRATOR_SERVICE);
        if (v != null) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                v.vibrate(20);
            }
        }
    }

    @JavascriptInterface
    public void showToast(String toast) {
        if (mActivity != null && !mActivity.isFinishing()) {
            mActivity.runOnUiThread(() ->
                    Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show()
            );
        }
    }

    @JavascriptInterface
    public void shareText(String title, String content) {
        if (mActivity != null && !mActivity.isFinishing()) {
            mActivity.runOnUiThread(() -> {
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("text/plain");
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
                shareIntent.putExtra(Intent.EXTRA_TEXT, content);
                Intent chooser = Intent.createChooser(shareIntent, title);
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(chooser);
            });
        }
    }
}