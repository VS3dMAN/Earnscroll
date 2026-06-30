package com.earnscroll

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
    fun getBlockedPackages(promise: Promise) {
        try {
            val prefs = getEncryptedPrefs()
            val blockedJson = prefs.getString("blocked_packages", "[]") ?: "[]"
            val arr = JSONArray(blockedJson)
            val result: WritableArray = Arguments.createArray()
            val limit = minOf(arr.length(), MAX_BLOCKED_PACKAGES)
            for (i in 0 until limit) {
                result.pushString(arr.getString(i))
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
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
    fun clearSecurePrefs(promise: Promise) {
        try {
            val prefs = getEncryptedPrefs()
            prefs.edit().clear().apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
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
