package com.example.nexus.managers;

import android.content.Context;
import android.util.Log;
import java.util.concurrent.atomic.AtomicBoolean;
import java.security.Security;
import org.bouncycastle.jce.provider.BouncyCastleProvider;


public class AdbSingleton {

    private static AdbSingleton instance;
    private MyAdbManager adbManager;
    private final AtomicBoolean isInitializing = new AtomicBoolean(false);

    public interface AdbInitListener {
        void onInitComplete();
    }

    private AdbSingleton() {
    }

    public static synchronized AdbSingleton getInstance() {
        if (instance == null) {
            instance = new AdbSingleton();
        }
        return instance;
    }

    public MyAdbManager getAdbManager() {
        return adbManager;
    }

    public void init(Context context, AdbInitListener listener) {
        if (adbManager != null) {
            if (listener != null) {
                listener.onInitComplete();
            }
            return;
        }

        if (isInitializing.get()) {
            return;
        }

        isInitializing.set(true);
        new Thread(() -> {
            try {
                if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                    Security.addProvider(new BouncyCastleProvider());
                }

                adbManager = new MyAdbManager(context);

                if (listener != null) {
                    listener.onInitComplete();
                }
            } catch (Exception e) {
                Log.e("NEXUS", "Failed to init ADB", e);
            } finally {
                isInitializing.set(false);
            }
        }).start();
    }
}