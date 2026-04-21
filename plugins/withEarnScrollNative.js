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

            // A. EarnScrollModule.kt - WritableArray Logic + Unified Package + EncryptedSharedPreferences
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
import android.provider.Settings
import android.text.TextUtils
import android.app.usage.UsageStatsManager
import android.app.usage.UsageStats
import org.json.JSONArray
import org.json.JSONObject
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.util.Calendar

class EarnScrollModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val MAX_MINUTES = 1440.0 // 24 hours cap
        private const val MAX_BLOCKED_PACKAGES = 200
    }

    private fun getEncryptedPrefs(): SharedPreferences {
        val masterKey = MasterKey.Builder(reactApplicationContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        return EncryptedSharedPreferences.create(
            reactApplicationContext,
            "EarnScrollSecurePrefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    override fun getName(): String {
        return "EarnScrollModule"
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val intent = Intent(Intent.ACTION_MAIN, null)
            intent.addCategory(Intent.CATEGORY_LAUNCHER)

            val resolveInfos = pm.queryIntentActivities(intent, 0)

            val appsList: WritableArray = Arguments.createArray()
            val seenPackages = HashSet<String>()

            for (resolveInfo in resolveInfos) {
                val activityInfo = resolveInfo.activityInfo
                val packageName = activityInfo.packageName

                if (!seenPackages.contains(packageName)) {
                    val label = resolveInfo.loadLabel(pm).toString()

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
        try {
            // Validate JSON and enforce size limit
            val jsonArray = JSONArray(jsonString)
            if (jsonArray.length() > MAX_BLOCKED_PACKAGES) {
                Log.w("EarnScrollModule", "Blocked packages list exceeds maximum size")
                return
            }
            val prefs = getEncryptedPrefs()
            prefs.edit().putString("blocked_packages", jsonString).apply()
        } catch (e: Exception) {
            Log.e("EarnScrollModule", "Invalid blocked packages JSON", e)
        }
    }

    @ReactMethod
    fun setMinutes(minutes: Int) {
        val clamped = minutes.coerceIn(0, MAX_MINUTES.toInt())
        val prefs = getEncryptedPrefs()
        prefs.edit()
            .putInt("minutes", clamped)
            .putFloat("minutes_float", clamped.toFloat())
            .apply()
    }

    @ReactMethod
    fun setMinutesFloat(minutes: Double) {
        val clamped = minutes.coerceIn(0.0, MAX_MINUTES)
        val prefs = getEncryptedPrefs()
        prefs.edit()
            .putFloat("minutes_float", clamped.toFloat())
            .putInt("minutes", clamped.toInt())
            .apply()
    }

    @ReactMethod
    fun getMinutes(promise: Promise) {
        try {
            val prefs = getEncryptedPrefs()
            val minutesFloat = prefs.getFloat("minutes_float", prefs.getInt("minutes", 0).toFloat())
            if (minutesFloat <= 0f) {
                promise.resolve(0.0)
                return
            }
            // Only subtract time if a blocked app is currently being used
            val blockedStart = prefs.getLong("blocked_app_start_at", 0L)
            if (blockedStart > 0L) {
                val activeUsage = (android.os.SystemClock.elapsedRealtime() - blockedStart) / 60_000.0
                val remaining = Math.max(0.0, minutesFloat.toDouble() - activeUsage)
                promise.resolve(remaining)
            } else {
                promise.resolve(minutesFloat.toDouble())
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            val serviceName = reactApplicationContext.packageName + "/com.earnscroll.BlockerService"
            val enabledServices = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""
            val colonSplitter = TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServices)
            while (colonSplitter.hasNext()) {
                val componentName = colonSplitter.next()
                if (componentName.equals(serviceName, ignoreCase = true)) {
                    promise.resolve(true)
                    return
                }
            }
            promise.resolve(false)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getAppUsageToday(promise: Promise) {
        try {
            val usm = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            if (usm == null) {
                promise.resolve(Arguments.createArray())
                return
            }

            // Get today's start
            val cal = Calendar.getInstance()
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val startTime = cal.timeInMillis
            val endTime = System.currentTimeMillis()

            val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)

            // Get blocked packages from prefs
            val prefs = getEncryptedPrefs()
            val blockedJson = prefs.getString("blocked_packages", "[]") ?: "[]"
            val blockedSet = HashSet<String>()
            try {
                val arr = JSONArray(blockedJson)
                for (i in 0 until arr.length()) {
                    blockedSet.add(arr.getString(i))
                }
            } catch (_: Exception) {}

            val pm = reactApplicationContext.packageManager
            val result: WritableArray = Arguments.createArray()

            if (stats != null) {
                for (us in stats) {
                    if (us.totalTimeInForeground <= 0) continue
                    if (!blockedSet.contains(us.packageName)) continue

                    val appMap: WritableMap = Arguments.createMap()
                    appMap.putString("package", us.packageName)
                    val label = try {
                        pm.getApplicationLabel(pm.getApplicationInfo(us.packageName, 0)).toString()
                    } catch (_: Exception) {
                        us.packageName
                    }
                    appMap.putString("label", label)
                    appMap.putDouble("minutesUsed", us.totalTimeInForeground / 60_000.0)
                    result.pushMap(appMap)
                }
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
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

            // C. BlockerService.kt - Only counts time when a blocked app is actually in the foreground
            const serviceContent = `package com.earnscroll

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import org.json.JSONArray
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class BlockerService : AccessibilityService() {

    private val handler = Handler(Looper.getMainLooper())
    private var currentBlockedApp: String? = null
    private var encryptedPrefs: SharedPreferences? = null

    private fun getEncryptedPrefs(): SharedPreferences {
        encryptedPrefs?.let { return it }
        val masterKey = MasterKey.Builder(applicationContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        val prefs = EncryptedSharedPreferences.create(
            applicationContext,
            "EarnScrollSecurePrefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        encryptedPrefs = prefs
        return prefs
    }

    private val expiryCheckRunnable = object : Runnable {
        override fun run() {
            val app = currentBlockedApp ?: return
            val remaining = getRemainingMinutes()
            if (remaining <= 0f) {
                deductBlockedAppTime()
                blockApp(app)
                currentBlockedApp = null
            } else {
                val delayMs = (remaining * 60_000f).toLong() + 500L
                handler.postDelayed(this, delayMs)
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return

            // User switched away from a blocked app — deduct the time they actually spent
            if (currentBlockedApp != null && packageName != currentBlockedApp) {
                deductBlockedAppTime()
                stopExpiryCheck()
            }

            // Don't block our own app or system UI
            if (packageName == applicationContext.packageName) return
            if (packageName == "com.android.systemui") return

            try {
                val prefs = getEncryptedPrefs()
                val blockedPackagesJson = prefs.getString("blocked_packages", "[]")

                if (isPackageBlocked(packageName, blockedPackagesJson)) {
                    val remaining = getRemainingMinutes()
                    if (remaining <= 0f) {
                        blockApp(packageName)
                    } else {
                        // Mark that a blocked app session has started
                        startBlockedAppSession()
                        startExpiryCheck(packageName, remaining)
                    }
                }
            } catch (e: Exception) {
                Log.e("EarnScrollService", "Error in accessibility event handler", e)
            }
        }
    }

    /** Record that the user just opened a blocked app */
    private fun startBlockedAppSession() {
        val prefs = getEncryptedPrefs()
        // Only set if not already in a session
        if (prefs.getLong("blocked_app_start_at", 0L) == 0L) {
            prefs.edit()
                .putLong("blocked_app_start_at", SystemClock.elapsedRealtime())
                .apply()
            Log.d("EarnScrollService", "Blocked app session started")
        }
    }

    /** Deduct actual usage time from the balance and clear the session */
    private fun deductBlockedAppTime() {
        val prefs = getEncryptedPrefs()
        val startAt = prefs.getLong("blocked_app_start_at", 0L)
        if (startAt <= 0L) return

        val elapsedMinutes = (SystemClock.elapsedRealtime() - startAt) / 60_000f
        val currentBalance = prefs.getFloat("minutes_float", 0f)
        val newBalance = Math.max(0f, currentBalance - elapsedMinutes)

        prefs.edit()
            .putFloat("minutes_float", newBalance)
            .putInt("minutes", newBalance.toInt())
            .putLong("blocked_app_start_at", 0L)
            .apply()

        Log.d("EarnScrollService", "Deducted \${elapsedMinutes}m of blocked app usage. Balance: \${currentBalance}m -> \${newBalance}m")
    }

    private fun getRemainingMinutes(): Float {
        val prefs = getEncryptedPrefs()
        val minutesFloat = prefs.getFloat("minutes_float", prefs.getInt("minutes", 0).toFloat())
        if (minutesFloat <= 0f) return 0f

        // If currently using a blocked app, subtract active session time
        val blockedStart = prefs.getLong("blocked_app_start_at", 0L)
        if (blockedStart > 0L) {
            val elapsedMinutes = (SystemClock.elapsedRealtime() - blockedStart) / 60_000f
            val remaining = minutesFloat - elapsedMinutes
            return if (remaining > 0f) remaining else 0f
        }

        return minutesFloat
    }

    private fun blockApp(packageName: String) {
        val prefs = getEncryptedPrefs()
        prefs.edit()
            .putFloat("minutes_float", 0f)
            .putInt("minutes", 0)
            .putLong("blocked_app_start_at", 0L)
            .apply()

        val intent = Intent(applicationContext, BlockedActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        intent.putExtra("blocked_app", packageName)
        applicationContext.startActivity(intent)
    }

    private fun startExpiryCheck(packageName: String, remainingMinutes: Float) {
        if (currentBlockedApp == packageName) return
        stopExpiryCheck()
        currentBlockedApp = packageName
        val delayMs = (remainingMinutes * 60_000f).toLong() + 500L
        handler.postDelayed(expiryCheckRunnable, delayMs)
    }

    private fun stopExpiryCheck() {
        handler.removeCallbacks(expiryCheckRunnable)
        currentBlockedApp = null
    }

    private fun isPackageBlocked(pkg: String, jsonString: String?): Boolean {
        if (jsonString.isNullOrEmpty()) return false
        try {
            val jsonArray = JSONArray(jsonString)
            // Cap iteration to prevent DoS from excessively large lists
            val limit = minOf(jsonArray.length(), 200)
            for (i in 0 until limit) {
                if (pkg == jsonArray.getString(i)) return true
            }
        } catch (e: Exception) {
            Log.e("EarnScrollService", "Error parsing blocked packages", e)
        }
        return false
    }

    override fun onInterrupt() {
        deductBlockedAppTime()
        stopExpiryCheck()
    }

    override fun onDestroy() {
        deductBlockedAppTime()
        stopExpiryCheck()
        super.onDestroy()
    }
}
`;
            fs.writeFileSync(path.join(packagePath, 'BlockerService.kt'), serviceContent);

            // D. BlockedActivity.kt - Full-screen "App Blocked" UI
            const blockedActivityContent = `package com.earnscroll

import android.app.Activity
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class BlockedActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val blockedApp = intent.getStringExtra("blocked_app") ?: "This app"

        // Root layout
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(80, 120, 80, 120)
            background = GradientDrawable(
                GradientDrawable.Orientation.TOP_BOTTOM,
                intArrayOf(Color.parseColor("#0F172A"), Color.parseColor("#1E293B"))
            )
        }

        // Block icon (emoji as text)
        val icon = TextView(this).apply {
            text = "\\u26D4"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 72f)
            gravity = Gravity.CENTER
        }
        root.addView(icon)

        // Title
        val title = TextView(this).apply {
            text = "App Blocked"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 32f)
            typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
            gravity = Gravity.CENTER
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            params.topMargin = 40
            layoutParams = params
        }
        root.addView(title)

        // Subtitle
        val subtitle = TextView(this).apply {
            text = "You have no screen time left.\\nWork out to earn more minutes!"
            setTextColor(Color.parseColor("#94A3B8"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            gravity = Gravity.CENTER
            setLineSpacing(8f, 1f)
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            params.topMargin = 24
            layoutParams = params
        }
        root.addView(subtitle)

        // "Open EarnScroll" button
        val openBtn = Button(this).apply {
            text = "Open EarnScroll"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
            isAllCaps = false
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#22C55E"))
                cornerRadius = 60f
            }
            background = bg
            setPadding(60, 36, 60, 36)
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            params.topMargin = 64
            layoutParams = params
            setOnClickListener {
                val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    startActivity(launchIntent)
                }
                finish()
            }
        }
        root.addView(openBtn)

        // "Go Home" button
        val homeBtn = Button(this).apply {
            text = "Go Home"
            setTextColor(Color.parseColor("#94A3B8"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            isAllCaps = false
            setBackgroundColor(Color.TRANSPARENT)
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            params.topMargin = 16
            layoutParams = params
            setOnClickListener {
                finish()
                val homeIntent = Intent(Intent.ACTION_MAIN)
                homeIntent.addCategory(Intent.CATEGORY_HOME)
                homeIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                startActivity(homeIntent)
            }
        }
        root.addView(homeBtn)

        setContentView(root)
    }

    override fun onBackPressed() {
        // Prevent going back to the blocked app
        finish()
        val homeIntent = Intent(Intent.ACTION_MAIN)
        homeIntent.addCategory(Intent.CATEGORY_HOME)
        homeIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        startActivity(homeIntent)
    }
}
`;
            fs.writeFileSync(path.join(packagePath, 'BlockedActivity.kt'), blockedActivityContent);

            // E. accessibility_service_config.xml
            const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/app_name"
    android:accessibilityEventTypes="typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="false"
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

        // Register BlockedActivity
        mainApplication.activity = mainApplication.activity || [];
        mainApplication.activity = mainApplication.activity.filter(
            a => a.$['android:name'] !== 'com.earnscroll.BlockedActivity'
        );
        mainApplication.activity.push({
            $: {
                'android:name': 'com.earnscroll.BlockedActivity',
                'android:theme': '@android:style/Theme.NoTitleBar.Fullscreen',
                'android:exported': 'false',
                'android:excludeFromRecents': 'true',
                'android:taskAffinity': '',
            },
        });

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
