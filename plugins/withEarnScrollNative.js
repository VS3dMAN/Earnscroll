const {
    withAndroidManifest,
    withMainApplication,
    withDangerousMod,
    AndroidConfig
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withEarnScrollNative = (config) => {

    // 1. Add Permissions Safely
    config = AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.QUERY_ALL_PACKAGES'
    ]);

    // 2. Generate Native Files
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const androidRoot = config.modRequest.platformProjectRoot;
            // UNIFIED PACKAGE PATH: com.earnscroll
            const packagePath = path.join(androidRoot, 'app/src/main/java/com/earnscroll');
            const resXmlPath = path.join(androidRoot, 'app/src/main/res/xml');

            // Ensure directories exist
            fs.mkdirSync(packagePath, { recursive: true });
            fs.mkdirSync(resXmlPath, { recursive: true });

            // A. EarnScrollModule.kt - WritableArray Logic + Unified Package
            const moduleContent = `package com.earnscroll

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import android.content.Context
import android.content.SharedPreferences
import android.content.Intent
import android.content.pm.PackageManager
import org.json.JSONArray
import org.json.JSONObject
import android.util.Log

class EarnScrollModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "EarnScrollModule"
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            // Use queryIntentActivities to get launchable apps (App Drawer list)
            val intent = Intent(Intent.ACTION_MAIN, null)
            intent.addCategory(Intent.CATEGORY_LAUNCHER)
            
            val resolveInfos = pm.queryIntentActivities(intent, 0)
            
            // Use WritableArray for Bridge Safety
            val appsList: WritableArray = Arguments.createArray()
            val seenPackages = HashSet<String>()

            for (resolveInfo in resolveInfos) {
                val activityInfo = resolveInfo.activityInfo
                val packageName = activityInfo.packageName
                
                // Avoid duplicates if app has multiple launcher activities
                if (!seenPackages.contains(packageName)) {
                    val label = resolveInfo.loadLabel(pm).toString()
                    android.util.Log.d("EarnScrollModule", "Found app: " + label + " (" + packageName + ")")
                    
                    val appMap: WritableMap = Arguments.createMap()
                    appMap.putString("label", label)
                    appMap.putString("package", packageName)
                    appsList.pushMap(appMap)
                    
                    seenPackages.add(packageName)
                }
            }
            promise.resolve(appsList)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }

    @ReactMethod
    fun setBlockedPackages(jsonString: String) {
        // Logging for visibility
        Log.d("EarnScrollModule", "Saving blocklist: $jsonString")
        
        val prefs: SharedPreferences = reactApplicationContext.getSharedPreferences("EarnScrollPrefs", Context.MODE_PRIVATE)
        val editor = prefs.edit()
        editor.putString("blocked_packages", jsonString)
        editor.apply()
    }

    @ReactMethod
    fun setMinutes(minutes: Int) {
        val prefs: SharedPreferences = reactApplicationContext.getSharedPreferences("EarnScrollPrefs", Context.MODE_PRIVATE)
        val editor = prefs.edit()
        editor.putInt("minutes", minutes)
        editor.apply()
        Log.d("EarnScrollModule", "Minutes updated: $minutes")
    }
}
`;
            fs.writeFileSync(path.join(packagePath, 'EarnScrollModule.kt'), moduleContent);

            // B. EarnScrollPackage.kt - Unified Package
            const packageContent = `package com.earnscroll

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import java.util.Collections

class EarnScrollPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(EarnScrollModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return Collections.emptyList()
    }
}
`;
            fs.writeFileSync(path.join(packagePath, 'EarnScrollPackage.kt'), packageContent);

            // C. BlockerService.kt - Unified Package & Robust Parsing
            const serviceContent = `package com.earnscroll

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONArray

class BlockerService : AccessibilityService() {
    
    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d("EarnScrollService", "Blocker Service Connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            
            val prefs: SharedPreferences = getSharedPreferences("EarnScrollPrefs", Context.MODE_PRIVATE)
            val minutes = prefs.getInt("minutes", 0)
            val blockedPackagesJson = prefs.getString("blocked_packages", "[]")

            // Log checking attempting (diagnostic)
            // Log.d("EarnScrollService", "Checking $packageName against $blockedPackagesJson")

            if (isPackageBlocked(packageName, blockedPackagesJson)) {
                // If minutes are depleted, block the app
                if (minutes <= 0) {
                    Log.d("EarnScrollService", "BLOCKING: $packageName. Minutes: $minutes")
                    performGlobalAction(GLOBAL_ACTION_HOME)
                } else {
                     Log.d("EarnScrollService", "ALLOWED: $packageName. Minutes left: $minutes")
                }
            }
        }
    }

    private fun isPackageBlocked(pkg: String, jsonString: String?): Boolean {
        if (jsonString.isNullOrEmpty()) return false
        try {
            val jsonArray = JSONArray(jsonString)
            for (i in 0 until jsonArray.length()) {
                // SIMPLIFIED: Expecting Array of Strings ["com.foo", "com.bar"]
                val blockedPkg = jsonArray.getString(i)
                
                if (pkg == blockedPkg) {
                     Log.d("EarnScrollService", "MATCH FOUND: $pkg is blocked.")
                    return true
                }
            }
        } catch (e: Exception) {
            Log.e("EarnScrollService", "Error parsing JSON: $jsonString", e)
        }
        return false
    }

    override fun onInterrupt() {}
}
`;
            fs.writeFileSync(path.join(packagePath, 'BlockerService.kt'), serviceContent);

            // D. accessibility_service_config.xml
            const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/app_name"
    android:accessibilityEventTypes="typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="true"
/>`;
            fs.writeFileSync(path.join(resXmlPath, 'accessibility_service_config.xml'), xmlContent);

            return config;
        }
    ]);

    // 3. Register Service in AndroidManifest.xml (Safe JSON Manipulation)
    config = withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);

        const service = {
            $: {
                'android:name': 'com.earnscroll.BlockerService', // UPDATED PACKAGE
                'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
                'android:exported': 'false',
            },
            'intent-filter': [{
                action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }],
            }],
            'meta-data': [{
                $: { 'android:name': 'android.accessibilityservice', 'android:resource': '@xml/accessibility_service_config' },
            }],
        };

        // Remove existing if present to avoid dupes
        mainApplication.service = mainApplication.service || [];
        mainApplication.service = mainApplication.service.filter(
            s => s.$['android:name'] !== '.BlockerService' && s.$['android:name'] !== 'com.earnscroll.BlockerService'
        );
        mainApplication.service.push(service);

        return config;
    });

    // 4. Inject Package into MainApplication (ROBUST KOTLIN SUPPORT)
    config = withMainApplication(config, async (config) => {
        let rawContent = config.modResults.contents;

        // Check if it's Kotlin
        // Note: Expo 52+ templates are typically Kotlin for MainApplication

        // 4a. Import Logic (Unified Package)
        if (!rawContent.includes('import com.earnscroll.EarnScrollPackage')) {
            // Try simple replacement in standard import block
            rawContent = rawContent.replace(
                /(package\s+[\w.]+)/,
                '$1\n\nimport com.earnscroll.EarnScrollPackage'
            );
        }

        // 4b. Package Injection Logic - STRICT CHECK
        const isKotlin = config.modResults.language === 'kt';

        if (isKotlin) {
            // Look for: PackageList(this).packages.apply { ... } OR PackageList(this).packages
            // We want to transform it to ensure our package is added.

            const packageListApplyRegex = /(PackageList\(this\)\.packages\.apply\s*\{)([\s\S]*?)(\})/;
            const packageListSimpleRegex = /(PackageList\(this\)\.packages)(?!\.apply)/;

            if (rawContent.includes('EarnScrollPackage()')) {
                // Already injected
            } else if (packageListApplyRegex.test(rawContent)) {
                // Case 1: .apply { ... } exists
                rawContent = rawContent.replace(packageListApplyRegex, '$1$2    add(EarnScrollPackage())\n$3');
            } else if (packageListSimpleRegex.test(rawContent)) {
                // Case 2: .packages exists but no .apply
                rawContent = rawContent.replace(packageListSimpleRegex, '$1.apply {\n      add(EarnScrollPackage())\n    }');
            } else {
                // FALLBACK: Try to find getPackages() method
                const getPackagesRegex = /override\s+fun\s+getPackages\(\)\s*:\s*List<ReactPackage>\s*\{([\s\S]*?)return\s+packages/;
                if (getPackagesRegex.test(rawContent)) {
                    rawContent = rawContent.replace(/return\s+packages/, 'packages.add(EarnScrollPackage())\n    return packages');
                } else {
                    console.warn("WARNING: Could not automagically inject EarnScrollPackage into MainApplication.kt. You may need to add 'packages.add(EarnScrollPackage())' manually.");
                    // Throwing error as per Critical Requirement 1
                    throw new Error("Failed to inject EarnScrollPackage into MainApplication.kt. Pattern 'PackageList(this).packages' not found.");
                }
            }
        } else {
            // Java Fallback
            if (!rawContent.includes('new EarnScrollPackage()')) {
                const listStart = 'List<ReactPackage> packages = new PackageList(this).getPackages();';
                if (rawContent.includes(listStart)) {
                    rawContent = rawContent.replace(listStart, `${listStart}\n      packages.add(new EarnScrollPackage());`);
                }
            }
        }

        config.modResults.contents = rawContent;
        return config;
    });

    return config;
};

module.exports = withEarnScrollNative;
