package com.example.nexus.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.SystemClock;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class MockLocationService extends Service {
    public static final String ACTION_START = "START_MOCK";
    public static final String ACTION_STOP = "STOP_MOCK";
    public static final String EXTRA_LAT = "LAT";
    public static final String EXTRA_LON = "LON";

    private LocationManager locationManager;
    private Handler handler = new Handler();
    private boolean isMocking = false;
    private double lat, lon;

    private final Runnable mockRunnable = new Runnable() {
        @Override
        public void run() {
            if (isMocking) {
                pushLocation(lat, lon);
                handler.postDelayed(this, 1000); // Update every second
            }
        }
    };

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_START.equals(action)) {
                lat = intent.getDoubleExtra(EXTRA_LAT, 0);
                lon = intent.getDoubleExtra(EXTRA_LON, 0);
                startMocking();
            } else if (ACTION_STOP.equals(action)) {
                stopMocking();
            }
        }
        return START_STICKY;
    }

    private void startMocking() {
        if (isMocking) return;

        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        try {
            locationManager.addTestProvider(LocationManager.GPS_PROVIDER, false, false, false, false, true, true, true, 0, 5);
            locationManager.setTestProviderEnabled(LocationManager.GPS_PROVIDER, true);
        } catch (SecurityException e) {
            Log.e("NexusMock", "Permission denied. App not selected as Mock App.", e);
            stopSelf();
            return;
        } catch (IllegalArgumentException e) {
            // Provider likely already exists
        }

        isMocking = true;
        startForeground(999, createNotification());
        handler.post(mockRunnable);
    }

    private void stopMocking() {
        isMocking = false;
        handler.removeCallbacks(mockRunnable);
        try {
            locationManager.removeTestProvider(LocationManager.GPS_PROVIDER);
        } catch (Exception e) {
            // Ignore
        }
        stopForeground(true);
        stopSelf();
    }

    private void pushLocation(double lat, double lon) {
        Location mockLocation = new Location(LocationManager.GPS_PROVIDER);
        mockLocation.setLatitude(lat);
        mockLocation.setLongitude(lon);
        mockLocation.setAltitude(0);
        mockLocation.setTime(System.currentTimeMillis());
        mockLocation.setAccuracy(5.0f);
        mockLocation.setElapsedRealtimeNanos(SystemClock.elapsedRealtimeNanos());

        try {
            locationManager.setTestProviderLocation(LocationManager.GPS_PROVIDER, mockLocation);
        } catch (Exception e) {
            Log.e("NexusMock", "Failed to push location", e);
        }
    }

    private Notification createNotification() {
        String channelId = "nexus_mock_channel";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId, "Mock Location", NotificationManager.IMPORTANCE_LOW);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
        return new NotificationCompat.Builder(this, channelId)
                .setContentTitle("Nexus Fake GPS")
                .setContentText("Location Mocking Active")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .build();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}