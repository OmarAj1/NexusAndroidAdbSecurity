package com.example.nexus.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import com.example.nexus.R;
import com.example.nexus.UserMainActivity;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

public class ShieldVpnService extends VpnService {

    private static final String TAG = "ShieldVpnService";
    private static final String CHANNEL_ID = "NexusShieldChannel";

    // --- ACTIONS ---
    public static final String ACTION_VPN_STATUS = "com.example.nexus.VPN_STATUS";
    public static final String ACTION_VPN_BLOCK = "com.example.nexus.VPN_BLOCK";
    public static final String ACTION_UPDATE_DNS = "com.example.nexus.UPDATE_DNS"; // [NEW]

    // --- EXTRAS ---
    public static final String EXTRA_IS_RUNNING = "isRunning";
    public static final String EXTRA_BLOCKED_COUNT = "blockedCount";
    public static final String EXTRA_BLOCKED_DOMAIN = "blockedDomain";
    public static final String EXTRA_DNS_PROVIDER = "dnsProvider"; // [NEW]

    // Global flag for UI Sync
    public static boolean IS_RUNNING = false;

    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private final AtomicLong blockedCount = new AtomicLong(0);

    private ParcelFileDescriptor vpnInterface;
    private FileOutputStream vpnOutput;

    // [OPTIMIZATION] CachedThreadPool is better for IO-bound bursty tasks than Fixed(50)
    private ExecutorService dnsThreadPool;

    private static final String VPN_ADDRESS = "10.0.0.2";

    public enum DnsProfile {
        CONTROLD_ADS("Control D (Ads)", "76.76.2.2"),
        CLOUDFLARE("Cloudflare", "1.1.1.1"),
        GOOGLE("Google", "8.8.8.8");

        final String label;
        final String ipv4;

        DnsProfile(String label, String ipv4) {
            this.label = label;
            this.ipv4 = ipv4;
        }

        public static DnsProfile fromString(String name) {
            if (name == null) return CONTROLD_ADS;
            for (DnsProfile p : values()) {
                if (p.name().equalsIgnoreCase(name) || p.label.equalsIgnoreCase(name)) return p;
            }
            return CONTROLD_ADS;
        }
    }

    private volatile DnsProfile activeProfile = DnsProfile.CONTROLD_ADS;

    // [FIX] Use synchronized set for thread safety if modified (though currently static)
    private static final Set<String> BLOCKED_KEYWORDS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "log.tiktokv.com", "mon.tiktokv.com", "log-va.tiktokv.com",
            "ib.tiktokv.com", "toblog.ctobsnssdk.com", "log16-normal-c-useast1a.tiktokv.com",
            "mssdk.dns.tiktok.com", "ws-log.tiktokv.com", "p16-tiktokcdn-com.akamaized.net",

            "app-measurement.com", "firebase-logging", "crashlytics",
            "segment.io", "adjust.com", "appsflyer", "kochava", "branch.io",
            "amplitude", "mixpanel", "newrelic", "bugsnag", "sentry.io",

            "doubleclick", "googleadservices", "analytics", "tracker", "metrics",
            "scorecardresearch", "quantserve", "moatads", "adcolony", "unity3d.ads",
            "applovin", "vungle", "inmobi", "tapjoy",

            "onetrust", "didomi", "quantcast", "cookiebot", "usercentrics",
            "trustarc", "osano", "cookie-script", "termly", "iubenda",
            "civiccomputing", "cookiepro", "cookielaw", "consensu",

            // CAUTION: "ads" removed from generic list as it blocks "uploads.com", "threads.net" etc.
            // Added specific common ad domains instead
            "ads.google.com", "adservice.google.com"
    )));

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();

            if ("STOP".equals(action)) {
                stopVpn();
                return START_NOT_STICKY;
            }

            // [NEW] Allow switching DNS without full restart
            if (ACTION_UPDATE_DNS.equals(action)) {
                String provider = intent.getStringExtra(EXTRA_DNS_PROVIDER);
                if (provider != null) {
                    activeProfile = DnsProfile.fromString(provider);
                    Log.i(TAG, "Switched DNS to: " + activeProfile.label);
                    // Restart VPN interface to apply new route
                    if (isRunning.get()) {
                        stopVpn();
                        startVpn();
                    }
                }
            }
        }

        if (dnsThreadPool == null || dnsThreadPool.isShutdown()) {
            dnsThreadPool = Executors.newCachedThreadPool(); // [OPTIMIZATION]
        }

        startForegroundServiceNotification();
        startVpn();
        return START_STICKY;
    }

    private void startForegroundServiceNotification() {
        createNotificationChannel();
        Intent intent = new Intent(this, UserMainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        Intent stopIntent = new Intent(this, ShieldVpnService.class);
        stopIntent.setAction("STOP");
        PendingIntent pendingStopIntent = PendingIntent.getService(this, 0, stopIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification.Builder builder = new Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("Nexus Shield Active")
                .setContentText("Reqs Blocked: " + blockedCount.get())
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentIntent(pi)
                .addAction(new Notification.Action.Builder(null, "Disconnect", pendingStopIntent).build())
                .setOngoing(true)
                .setCategory(Notification.CATEGORY_SERVICE);

        try {
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(1, builder.build(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else if (Build.VERSION.SDK_INT >= 29) {
                startForeground(1, builder.build(), ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
            } else {
                startForeground(1, builder.build());
            }
        } catch (Exception e) {
            Log.e(TAG, "Start foreground failed", e);
            stopSelf();
        }
    }

    private void updateNotification() {
        if (!isRunning.get()) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) {
            Notification.Builder builder = new Notification.Builder(this, CHANNEL_ID)
                    .setContentTitle("Nexus Shield Active")
                    .setContentText("Protected | Blocked: " + blockedCount.get()) // Updated Text
                    .setSmallIcon(R.drawable.ic_launcher_foreground)
                    .setOngoing(true)
                    .setOnlyAlertOnce(true);
            nm.notify(1, builder.build());
        }
    }

    private void startVpn() {
        if (isRunning.get()) return;

        Log.i(TAG, "Starting VPN Proxy with DNS: " + activeProfile.label);
        Builder builder = new Builder();
        builder.setSession("NexusShield");
        builder.setMtu(1500);
        builder.addAddress(VPN_ADDRESS, 32);
        builder.addDnsServer(activeProfile.ipv4);

        try {
            builder.addRoute("0.0.0.0", 0); // Route all traffic
        } catch (Exception e) {
            Log.e(TAG, "Route error", e);
        }

        try {
            if (vpnInterface != null) vpnInterface.close();
            vpnInterface = builder.establish();

            if (vpnInterface == null) {
                stopSelf();
                return;
            }

            vpnOutput = new FileOutputStream(vpnInterface.getFileDescriptor());

            isRunning.set(true);
            IS_RUNNING = true;
            blockedCount.set(0);
            broadcastStatus(true);

            new Thread(this::listenForPackets).start();

        } catch (Exception e) {
            Log.e(TAG, "Establish error", e);
            stopVpn();
        }
    }

    private void listenForPackets() {
        // [FIX] Try-with-resources for automatic cleanup
        try (FileInputStream in = new FileInputStream(vpnInterface.getFileDescriptor())) {
            byte[] buffer = new byte[32767];

            while (isRunning.get() && vpnInterface != null) {
                int length = in.read(buffer);
                if (length > 0) {
                    // Copy only valid data to process
                    byte[] packetData = Arrays.copyOf(buffer, length);

                    if (dnsThreadPool != null && !dnsThreadPool.isShutdown()) {
                        dnsThreadPool.execute(() -> processPacket(packetData));
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Packet listener error", e);
        } finally {
            stopVpn();
        }
    }

    private void processPacket(byte[] packetData) {
        try {
            // [FIX] Simple IPv4 check. Drop IPv6 to prevent leaks (version != 4)
            int version = (packetData[0] >> 4) & 0x0F;
            if (version != 4) return;

            // Check for UDP (Protocol 17)
            if (packetData[9] != 17) return;

            int ipHeaderLen = (packetData[0] & 0x0F) * 4;
            int dstPort = ((packetData[ipHeaderLen + 2] & 0xFF) << 8) | (packetData[ipHeaderLen + 3] & 0xFF);

            // Intercept DNS Queries (Port 53)
            if (dstPort == 53) {
                int udpHeaderLen = 8;
                int dnsStart = ipHeaderLen + udpHeaderLen;

                String queryDomain = extractDomain(packetData, dnsStart, packetData.length);

                if (isBlocked(queryDomain)) {
                    Log.d(TAG, "BLOCKING: " + queryDomain);
                    blockedCount.incrementAndGet();
                    updateNotification();
                    broadcastStatus(true);
                    broadcastBlock(queryDomain);
                    return; // Drop packet
                }

                forwardDnsQuery(packetData, dnsStart, packetData.length);
            }
        } catch (Exception e) {
            Log.e(TAG, "Process packet error", e);
        }
    }

    // [FIX] Removed unused ipHeaderLen param, added try-with-resources
    private void forwardDnsQuery(byte[] originalPacket, int dnsStart, int totalLength) {
        // [FIX] Try-with-resources for socket
        try (DatagramSocket tunnelSocket = new DatagramSocket()) {
            if (!protect(tunnelSocket)) {
                throw new IOException("Socket protection failed");
            }
            tunnelSocket.setSoTimeout(2500);

            byte[] dnsPayload = Arrays.copyOfRange(originalPacket, dnsStart, totalLength);
            InetAddress server = InetAddress.getByName(activeProfile.ipv4);
            DatagramPacket dnsPacket = new DatagramPacket(dnsPayload, dnsPayload.length, server, 53);
            tunnelSocket.send(dnsPacket);

            byte[] respBuf = new byte[4096];
            DatagramPacket respPacket = new DatagramPacket(respBuf, respBuf.length);
            tunnelSocket.receive(respPacket);

            byte[] rawResponse = buildResponsePacket(originalPacket, respPacket.getData(), respPacket.getLength());

            writeToVpn(rawResponse);

        } catch (Exception e) {
            Log.w(TAG, "DNS Forward Warning: " + e.getMessage());
        }
    }

    private synchronized void writeToVpn(byte[] packet) {
        try {
            if (vpnOutput != null && isRunning.get()) {
                vpnOutput.write(packet);
            }
        } catch (IOException e) {
            Log.e(TAG, "Error writing to VPN interface", e);
        }
    }

    private boolean isBlocked(String domain) {
        if (domain == null) return false;
        String clean = domain.toLowerCase();

        for (String keyword : BLOCKED_KEYWORDS) {
            // [OPTIMIZATION] 'contains' is safer than regex, but still aggressive.
            // Consider changing to 'endsWith' for safer domain blocking in future.
            if (clean.contains(keyword)) return true;
        }
        return false;
    }

    private void broadcastBlock(String domain) {
        Intent intent = new Intent(ACTION_VPN_BLOCK);
        intent.putExtra(EXTRA_BLOCKED_DOMAIN, domain);
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }

    // [FIX] Removed unused ipLen param
    private byte[] buildResponsePacket(byte[] original, byte[] dnsData, int dnsLen) {
        int ipHeaderLen = (original[0] & 0x0F) * 4;
        int totalLen = ipHeaderLen + 8 + dnsLen;

        byte[] response = new byte[totalLen];

        // 1. Copy IP Header
        System.arraycopy(original, 0, response, 0, ipHeaderLen);

        // 2. Update IP Length
        response[2] = (byte) (totalLen >> 8);
        response[3] = (byte) (totalLen & 0xFF);

        // 3. Swap Source/Dest IP
        System.arraycopy(original, 16, response, 12, 4); // Src -> Dst
        System.arraycopy(original, 12, response, 16, 4); // Dst -> Src

        // 4. Recalculate IP Checksum
        response[10] = 0;
        response[11] = 0;
        int ipChecksum = calculateChecksum(response, 0, ipHeaderLen);
        response[10] = (byte) (ipChecksum >> 8);
        response[11] = (byte) (ipChecksum & 0xFF);

        // 5. Swap UDP Ports
        response[ipHeaderLen] = original[ipHeaderLen + 2];
        response[ipHeaderLen + 1] = original[ipHeaderLen + 3];
        response[ipHeaderLen + 2] = original[ipHeaderLen];
        response[ipHeaderLen + 3] = original[ipHeaderLen + 1];

        // 6. Update UDP Length
        int udpLen = 8 + dnsLen;
        response[ipHeaderLen + 4] = (byte) (udpLen >> 8);
        response[ipHeaderLen + 5] = (byte) (udpLen & 0xFF);
        response[ipHeaderLen + 6] = 0; // Checksum optional for IPv4
        response[ipHeaderLen + 7] = 0;

        // 7. Copy DNS Data
        System.arraycopy(dnsData, 0, response, ipHeaderLen + 8, dnsLen);

        return response;
    }

    // [FIX] Simplified checksum calc
    private int calculateChecksum(byte[] buf, int offset, int length) {
        int sum = 0;
        for (int i = 0; i < length; i += 2) {
            int word = ((buf[offset + i] & 0xFF) << 8) | ((i + 1 < length) ? (buf[offset + i + 1] & 0xFF) : 0);
            sum += word;
        }
        while ((sum >> 16) > 0) {
            sum = (sum & 0xFFFF) + (sum >> 16);
        }
        return ~sum & 0xFFFF;
    }

    private String extractDomain(byte[] data, int offset, int max) {
        try {
            int pos = offset + 12; // Skip Transaction ID, Flags, Counts
            StringBuilder sb = new StringBuilder();

            while (pos < max) {
                int len = data[pos] & 0xFF;
                if (len == 0) break; // End of domain
                if ((len & 0xC0) == 0xC0) {
                    // Pointer compression (not fully handled here for simplicity, usually not in Queries)
                    break;
                }

                if (sb.length() > 0) sb.append(".");
                pos++;
                for (int i = 0; i < len; i++) {
                    sb.append((char) data[pos + i]);
                }
                pos += len;
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private void stopVpn() {
        Log.i(TAG, "Stopping VPN Service...");
        isRunning.set(false);
        IS_RUNNING = false;
        broadcastStatus(false);

        if (dnsThreadPool != null) {
            dnsThreadPool.shutdownNow();
            dnsThreadPool = null;
        }

        if (vpnOutput != null) {
            try { vpnOutput.close(); } catch (IOException ignored) {}
            vpnOutput = null;
        }

        if (vpnInterface != null) {
            try { vpnInterface.close(); } catch (IOException ignored) {}
            vpnInterface = null;
        }
        stopForeground(true);
        stopSelf();
    }

    private void broadcastStatus(boolean running) {
        Intent intent = new Intent(ACTION_VPN_STATUS);
        intent.putExtra(EXTRA_IS_RUNNING, running);
        intent.putExtra(EXTRA_BLOCKED_COUNT, blockedCount.get());
        sendBroadcast(intent);
    }

    @Override
    public void onDestroy() {
        stopVpn();
        super.onDestroy();
    }

    @Override
    public void onRevoke() {
        stopVpn();
        super.onRevoke();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                NotificationChannel serviceChannel = new NotificationChannel(
                        CHANNEL_ID,
                        "Nexus Shield Service",
                        NotificationManager.IMPORTANCE_LOW
                );
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}