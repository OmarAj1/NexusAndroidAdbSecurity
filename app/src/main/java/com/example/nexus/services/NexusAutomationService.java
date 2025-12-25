package com.example.nexus.services;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Toast;

import com.example.nexus.UserMainActivity;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class NexusAutomationService extends AccessibilityService {

    private static final String TAG = "NexusAuto";

    private boolean isPairingDialogOpened = false;
    private boolean isSequenceCompleted = false;
    private boolean isAppConnected = false;
    private long lastActionTime = 0;

    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // CRASH GUARD: Catch errors here to prevent "Malfunctioning" status
        try {
            if (intent != null && intent.hasExtra("SHIELD_STATUS")) {
                boolean wasConnected = isAppConnected;
                isAppConnected = intent.getBooleanExtra("SHIELD_STATUS", false);

                if (isAppConnected && !wasConnected) {
                    resetState();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error processing command", e);
        }
        // START_STICKY tells OS to recreate service if killed, but don't redeliver intent (avoids loops)
        return START_NOT_STICKY;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // CRASH GUARD: The Ultimate Protection
        // If ANY line of code below fails, we catch it so the Service stays alive.
        try {
            handleAccessibilityEventSafe(event);
        } catch (Throwable t) {
            Log.e(TAG, "CRITICAL SERVICE ERROR", t);
            // Optional: reset state to recover
            resetState();
        }
    }

    // Move logic to a helper method for safety
    private void handleAccessibilityEventSafe(AccessibilityEvent event) {
        if (isAppConnected) return; // Standby Mode
        if (isSequenceCompleted) return;
        if (event == null || event.getSource() == null) return;

        // Anti-Spam
        if (System.currentTimeMillis() - lastActionTime < 300) return;

        if (!"com.android.settings".equals(event.getPackageName())) return;

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return;

        // --- PHASE 1: NAVIGATION ---
        if (!isPairingDialogOpened) {
            List<AccessibilityNodeInfo> wirelessOptions = findNodesByText(rootNode, "Wireless debugging");

            if (!wirelessOptions.isEmpty()) {
                AccessibilityNodeInfo target = wirelessOptions.get(0);
                boolean alreadyInside = !findNodesByText(rootNode, "Pair device with pairing code").isEmpty() ||
                        !findNodesByText(rootNode, "Pair with pairing code").isEmpty();

                if (!alreadyInside) {
                    if (clickNode(target)) {
                        lastActionTime = System.currentTimeMillis();
                        return;
                    }
                }
            }
        }

        // --- PHASE 2: TRIGGER ---
        if (!isPairingDialogOpened) {
            AccessibilityNodeInfo pairButton = findClickableButton(rootNode);

            if (pairButton != null) {
                if (clickNode(pairButton)) {
                    isPairingDialogOpened = true;
                    lastActionTime = System.currentTimeMillis();
                }
            } else {
                AccessibilityNodeInfo list = findScrollableNode(rootNode);
                if (list != null) {
                    list.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD);
                    lastActionTime = System.currentTimeMillis();
                }
            }
        }

        // --- PHASE 3: EXTRACTION ---
        else {
            String code = extractRegex(rootNode, "\\d{6}");
            String ipPort = extractRegex(rootNode, "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}:\\d{5}");

            if (code != null && ipPort != null) {
                isSequenceCompleted = true;

                Intent intent = new Intent(UserMainActivity.ACTION_PAIR_REPLY);
                intent.putExtra("auto_code", code);
                intent.putExtra("auto_addr", ipPort);
                intent.setPackage(getPackageName());
                sendBroadcast(intent);

                showToastSafe("Pairing...");

                handler.postDelayed(() -> {
                    performGlobalAction(GLOBAL_ACTION_BACK);
                    handler.postDelayed(() -> {
                        performGlobalAction(GLOBAL_ACTION_BACK);
                        handler.postDelayed(this::resetState, 5000);
                    }, 800);
                }, 3000);
            }
        }
    }

    private void showToastSafe(String msg) {
        try {
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            // UI operations in background services can sometimes fail
        }
    }

    // --- HELPER METHODS (Kept same but ensure they don't crash) ---

    private List<AccessibilityNodeInfo> findNodesByText(AccessibilityNodeInfo root, String text) {
        if (root == null) return java.util.Collections.emptyList(); // Safety check
        List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(text);
        if (nodes.isEmpty()) nodes = root.findAccessibilityNodeInfosByText(text.toLowerCase());
        return nodes;
    }

    private AccessibilityNodeInfo findClickableButton(AccessibilityNodeInfo root) {
        List<AccessibilityNodeInfo> nodes = findNodesByText(root, "Pair device with pairing code");
        if (nodes.isEmpty()) nodes = findNodesByText(root, "Pair with pairing code");
        if (!nodes.isEmpty()) return nodes.get(0);
        return null;
    }

    private AccessibilityNodeInfo findScrollableNode(AccessibilityNodeInfo node) {
        if (node == null) return null;
        if (node.isScrollable()) return node;
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo result = findScrollableNode(node.getChild(i));
            if (result != null) return result;
        }
        return null;
    }

    private String extractRegex(AccessibilityNodeInfo node, String regex) {
        if (node == null) return null;
        if (node.getText() != null) {
            Matcher m = Pattern.compile(regex).matcher(node.getText());
            if (m.find()) return m.group(0);
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            String res = extractRegex(node.getChild(i), regex);
            if (res != null) return res;
        }
        return null;
    }

    private boolean clickNode(AccessibilityNodeInfo node) {
        if (node == null) return false;
        if (node.isClickable()) return node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        if (node.getParent() != null) return clickNode(node.getParent());
        return false;
    }

    private void resetState() {
        isPairingDialogOpened = false;
        isSequenceCompleted = false;
        lastActionTime = 0;
    }

    @Override
    public void onInterrupt() {
        resetState();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // This is where most services die. We intentionally do nothing here
        // to let the separate process keep running.
        Log.d(TAG, "Main App swiped away. Service switching to background mode.");    }
}