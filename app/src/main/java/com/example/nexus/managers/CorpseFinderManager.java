package com.example.nexus.managers;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.os.Environment;
import android.util.Log;

import com.example.nexus.interfaces.CommonInterface;

import java.io.File;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class CorpseFinderManager {
    private final Context context;
    private final CommonInterface common;

    public CorpseFinderManager(Context context, CommonInterface common) {
        this.context = context;
        this.common = common;
    }

    public void scanForCorpses() {
        new Thread(() -> {
            try {
                // 1. Get Installed Packages
                List<PackageInfo> installedApps = context.getPackageManager().getInstalledPackages(0);
                Set<String> installedPackageNames = new HashSet<>();
                for (PackageInfo pkg : installedApps) {
                    installedPackageNames.add(pkg.packageName);
                }

                // 2. Scan External Storage Root
                File root = Environment.getExternalStorageDirectory(); // /sdcard/
                File[] files = root.listFiles();

                List<String> corpsePaths = new ArrayList<>();
                long corpseSize = 0;

                if (files != null) {
                    for (File file : files) {
                        if (file.isDirectory()) {
                            String name = file.getName();
                            // Check if folder name looks like a package (contains dot, lowercase)
                            if (name.contains(".") && name.length() > 5 && !name.startsWith(".")) {
                                if (!installedPackageNames.contains(name)) {
                                    // Potential Corpse
                                    corpsePaths.add(name);
                                    corpseSize += getFolderSize(file);
                                }
                            }
                        }
                    }
                }

                // 3. Scan Android/data (Limited on Android 11+)
                File androidData = new File(root, "Android/data");
                File[] dataFiles = androidData.listFiles();
                if (dataFiles != null) {
                    for (File file : dataFiles) {
                        if (file.isDirectory() && !installedPackageNames.contains(file.getName())) {
                            corpsePaths.add("Android/data/" + file.getName());
                            corpseSize += getFolderSize(file);
                        }
                    }
                }

                // 4. Report Results
                String resultMsg;
                if (corpsePaths.isEmpty()) {
                    resultMsg = "No Uninstalled App Data Found.";
                } else {
                    resultMsg = "Found " + corpsePaths.size() + " Corpses (" + (corpseSize / 1024 / 1024) + " MB):\n" + String.join(", ", corpsePaths);
                }

                String finalResultMsg = resultMsg;
                common.runOnUi(() -> common.showToast(finalResultMsg));

            } catch (Exception e) {
                Log.e("NexusCorpse", "Scan failed", e);
                common.runOnUi(() -> common.showToast("Scan Failed: " + e.getMessage()));
            }
        }).start();
    }

    private long getFolderSize(File directory) {
        long length = 0;
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isFile()) length += file.length();
                else length += getFolderSize(file);
            }
        }
        return length;
    }
}