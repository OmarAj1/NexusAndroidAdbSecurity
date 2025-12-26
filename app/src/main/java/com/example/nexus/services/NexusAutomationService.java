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

    // Simple state flags (proven to be more stable than complex enums for this use case)
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
        // START_NOT_STICKY prevents boot loops if the service crashes
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

    // Main Logic
    private void handleAccessibilityEventSafe(AccessibilityEvent event) {
        if (isAppConnected) return; // Standby Mode
        if (isSequenceCompleted) return;
        if (event == null || event.getSource() == null) return;

        // Anti-Spam: Prevents the service from clicking too fast
        if (System.currentTimeMillis() - lastActionTime < 300) return;

        // Security: Ensure we are only interacting with Android Settings
        if (event.getPackageName() != null && !event.getPackageName().toString().contains("settings")) return;

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return;

        // --- PHASE 1: FIND & ENTER MENU ---
        if (!isPairingDialogOpened) {
            // Search for "Wireless debugging" text
            List<AccessibilityNodeInfo> wirelessOptions = findNodesByText(rootNode, "Wireless debugging");

            if (!wirelessOptions.isEmpty()) {
                AccessibilityNodeInfo target = wirelessOptions.get(0);

                // Check if we are already inside the menu to avoid clicking it again
                boolean alreadyInside = !findNodesByText(rootNode, "Pair device with pairing code").isEmpty() ||
                        !findNodesByText(rootNode, "Pair with pairing code").isEmpty();

                if (!alreadyInside) {
                    // This uses the aggressive recursive clicker
                    if (clickNode(target)) {
                        lastActionTime = System.currentTimeMillis();
                        return;
                    }
                }
            }
        }

        // --- PHASE 2: FIND & CLICK PAIR BUTTON ---
        if (!isPairingDialogOpened) {
            AccessibilityNodeInfo pairButton = findClickableButton(rootNode);

            if (pairButton != null) {
                if (clickNode(pairButton)) {
                    isPairingDialogOpened = true;
                    lastActionTime = System.currentTimeMillis();
                }
            } else {
                // If button not visible, try scrolling the largest list found
                AccessibilityNodeInfo list = findScrollableNode(rootNode);
                if (list != null) {
                    list.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD);
                    lastActionTime = System.currentTimeMillis();
                }
            }
        }

        // --- PHASE 3: EXTRACT CODE & PORT ---
        else {
            // Regex to find 6-digit code and IP:Port pattern
            String code = extractRegex(rootNode, "\\d{6}");
            String ipPort = extractRegex(rootNode, "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}:\\d{5}");

            if (code != null && ipPort != null) {
                isSequenceCompleted = true;

                // Send data back to Main Activity
                Intent intent = new Intent(UserMainActivity.ACTION_PAIR_REPLY);
                intent.putExtra("auto_code", code);
                intent.putExtra("auto_addr", ipPort);
                intent.setPackage(getPackageName());
                sendBroadcast(intent);

                showToastSafe("Pairing...");

                // Clean exit strategy
                handler.postDelayed(() -> {
                    performGlobalAction(GLOBAL_ACTION_BACK); // Close dialog
                    handler.postDelayed(() -> {
                        performGlobalAction(GLOBAL_ACTION_BACK); // Close menu
                        handler.postDelayed(this::resetState, 5000); // Reset for next time
                    }, 800);
                }, 3000);
            }
        }
    }

    // --- HELPER METHODS ---

    private void showToastSafe(String msg) {
        try {
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            // UI operations in background services can sometimes fail silently
        }
    }

    private List<AccessibilityNodeInfo> findNodesByText(AccessibilityNodeInfo root, String text) {
        if (root == null) return java.util.Collections.emptyList();
        List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(text);
        // Fallback to lowercase if exact match fails
        if (nodes.isEmpty()) nodes = root.findAccessibilityNodeInfosByText(text.toLowerCase());
        return nodes;
    }

    private AccessibilityNodeInfo findClickableButton(AccessibilityNodeInfo root) {
        // Supports both Pixel/Stock ("Pair device...") and Samsung ("Pair with...")
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

    // THE MAGIC SAUCE: Recursive clicking
    // If the target isn't clickable, it climbs the tree until it finds a parent that is.
    private boolean clickNode(AccessibilityNodeInfo node) {
        if (node == null) return false;
        if (node.isClickable()) {
            return node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        }
        if (node.getParent() != null) {
            return clickNode(node.getParent());
        }
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
        // Keeps the service alive even if the app is swiped away
        Log.d(TAG, "Main App swiped away. Service switching to background mode.");
    }
}