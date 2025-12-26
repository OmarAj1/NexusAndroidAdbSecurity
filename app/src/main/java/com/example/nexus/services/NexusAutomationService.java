package com.example.nexus.services;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.content.Intent;
import android.graphics.Path;
import android.graphics.Rect;
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

    // --- STATES ---
    private static final int STATE_SEARCHING = 1;
    private static final int STATE_ENTERING = 2; // Found "Wireless debug", trying to click in
    private static final int STATE_INSIDE_MENU = 3;
    private static final int STATE_DONE = 5;

    private int currentState = STATE_SEARCHING;
    private boolean isAppConnected = false;
    private long lastActionTime = 0;

    // Counters & Limits
    private int scrollAttempts = 0;
    private static final int MAX_SCROLLS = 10;
    private int entryClickAttempts = 0;
    private static final int MAX_ENTRY_ATTEMPTS = 5;

    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            if (intent != null && intent.hasExtra("SHIELD_STATUS")) {
                boolean wasConnected = isAppConnected;
                isAppConnected = intent.getBooleanExtra("SHIELD_STATUS", false);
                if (isAppConnected && !wasConnected) {
                    resetState();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Command Error", e);
        }
        return START_NOT_STICKY;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        try {
            handleAccessibilityEventSafe(event);
        } catch (Throwable t) {
            Log.e(TAG, "CRITICAL ERROR", t);
            resetState();
        }
    }

    private void handleAccessibilityEventSafe(AccessibilityEvent event) {
        if (isAppConnected || currentState == STATE_DONE) return;
        if (event == null) return;

        // Anti-Spam / Animation Wait
        if (System.currentTimeMillis() - lastActionTime < 600) return;

        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return;

        // --- DETERMINE LOCATION ---
        boolean isInsideMenu = !findNodesByText(root, "Pair device with pairing code").isEmpty() ||
                !findNodesByText(root, "Pair with pairing code").isEmpty() ||
                !findNodesByText(root, "IP address & Port").isEmpty();

        boolean isPairingDialog = isInsideMenu &&
                (!findNodesByText(root, "Cancel").isEmpty() ||
                        !findNodesByText(root, "Pair").isEmpty());

        // --- STATE MACHINE ---

        if (!isInsideMenu && currentState >= STATE_INSIDE_MENU) {
            currentState = STATE_SEARCHING; // Reset if lost
        }

        if (isPairingDialog) {
            handleExtraction(root);
        } else if (isInsideMenu) {
            currentState = STATE_INSIDE_MENU;
            handleInsideMenu(root);
        } else {
            // Main Settings List
            if (currentState == STATE_ENTERING) {
                // We tried clicking but are still outside. Retry.
                if (System.currentTimeMillis() - lastActionTime > 1500) {
                    Log.d(TAG, "Click didn't work, retrying entry...");
                    handleNavigation(root);
                }
            } else {
                currentState = STATE_SEARCHING;
                handleNavigation(root);
            }
        }
    }

    // --- PHASE 1: FIND & ENTER ---
    private void handleNavigation(AccessibilityNodeInfo root) {
        List<AccessibilityNodeInfo> targets = findNodesByText(root, "Wireless debugging");

        if (!targets.isEmpty()) {
            AccessibilityNodeInfo target = targets.get(0);

            // [MAX OUT] Try standard click first, then force gesture
            if (entryClickAttempts < MAX_ENTRY_ATTEMPTS) {
                boolean clicked = smartClick(target);

                // If standard click 'worked' (returned true) but we are still here,
                // it means the UI didn't respond. Try Physical Gesture.
                if (!clicked || entryClickAttempts > 2) {
                    dispatchGestureClick(target);
                }

                currentState = STATE_ENTERING;
                lastActionTime = System.currentTimeMillis();
                entryClickAttempts++;
            } else {
                resetState();
            }
        } else {
            // NOT FOUND -> SCROLL
            if (scrollAttempts < MAX_SCROLLS) {
                AccessibilityNodeInfo list = findScrollableNode(root);
                if (list != null) {
                    list.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD);
                    scrollAttempts++;
                    lastActionTime = System.currentTimeMillis();
                }
            }
        }
    }

    // --- PHASE 2: CLICK PAIR BUTTON ---
    private void handleInsideMenu(AccessibilityNodeInfo root) {
        scrollAttempts = 0;
        AccessibilityNodeInfo pairButton = findClickableButton(root);

        if (pairButton != null) {
            // Try standard click, then nuclear gesture
            if (!smartClick(pairButton)) {
                dispatchGestureClick(pairButton);
            }
            lastActionTime = System.currentTimeMillis();
        } else {
            // Scroll to find button
            AccessibilityNodeInfo list = findScrollableNode(root);
            if (list != null) {
                list.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD);
                lastActionTime = System.currentTimeMillis();
            }
        }
    }

    // --- PHASE 3: EXTRACT INFO ---
    private void handleExtraction(AccessibilityNodeInfo root) {
        String code = extractRegex(root, "\\d{6}");
        String ipPort = extractRegex(root, "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}:\\d{5}");

        if (code != null && ipPort != null) {
            currentState = STATE_DONE;

            Intent intent = new Intent(UserMainActivity.ACTION_PAIR_REPLY);
            intent.putExtra("auto_code", code);
            intent.putExtra("auto_addr", ipPort);
            intent.setPackage(getPackageName());
            sendBroadcast(intent);

            try {
                Toast.makeText(this, "Pairing...", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Log.e(TAG, "Toast failed", e);
            }

            handler.postDelayed(() -> {
                performGlobalAction(GLOBAL_ACTION_BACK);
                handler.postDelayed(() -> {
                    performGlobalAction(GLOBAL_ACTION_BACK);
                    handler.postDelayed(this::resetState, 4000);
                }, 800);
            }, 2000);
        }
    }

    // --- SMART CLICK (Standard) ---
    private boolean smartClick(AccessibilityNodeInfo node) {
        if (node == null) return false;
        if (node.isClickable()) {
            return node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        }
        AccessibilityNodeInfo parent = node.getParent();
        while (parent != null) {
            if (parent.isClickable()) {
                return parent.performAction(AccessibilityNodeInfo.ACTION_CLICK);
            }
            parent = parent.getParent();
        }
        return false;
    }

    // --- NUCLEAR OPTION: Physical Gesture Tap ---
    // Simulates a finger tap at the center of the node.
    // Works even if the View is non-clickable but swallows touches.
    private void dispatchGestureClick(AccessibilityNodeInfo node) {
        if (node == null) return;
        Rect bounds = new Rect();
        node.getBoundsInScreen(bounds);

        // Tap center of the item
        float x = bounds.centerX();
        float y = bounds.centerY();

        // Safety check: Don't click off-screen (e.g. 0,0)
        if (x < 0 || y < 0) return;

        Path path = new Path();
        path.moveTo(x, y);
        GestureDescription.Builder builder = new GestureDescription.Builder();
        GestureDescription gesture = builder
                .addStroke(new GestureDescription.StrokeDescription(path, 0, 50))
                .build();

        dispatchGesture(gesture, null, null);
        Log.d(TAG, "Dispatching Nuclear Gesture Tap at: " + x + "," + y);
    }

    // --- HELPERS ---

    private List<AccessibilityNodeInfo> findNodesByText(AccessibilityNodeInfo root, String text) {
        if (root == null) return java.util.Collections.emptyList();
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

    private void resetState() {
        currentState = STATE_SEARCHING;
        scrollAttempts = 0;
        entryClickAttempts = 0;
        lastActionTime = 0;
    }

    @Override
    public void onInterrupt() {
        resetState();
    }
}
