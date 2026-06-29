package com.earnscroll

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import androidx.core.content.ContextCompat
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

    // When the screen turns off, bank the time actually used so far and stop the
    // timer — otherwise locked-screen time would keep draining the balance.
    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_SCREEN_OFF) {
                deductBlockedAppTime()
                stopExpiryCheck()
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        try {
            ContextCompat.registerReceiver(
                this,
                screenReceiver,
                IntentFilter(Intent.ACTION_SCREEN_OFF),
                ContextCompat.RECEIVER_NOT_EXPORTED
            )
        } catch (e: Exception) {
            Log.e("EarnScrollService", "Failed to register screen receiver", e)
        }
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

        Log.d("EarnScrollService", "Deducted ${elapsedMinutes}m of blocked app usage. Balance: ${currentBalance}m -> ${newBalance}m")
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
        try {
            unregisterReceiver(screenReceiver)
        } catch (e: Exception) {
            // Receiver may not be registered; ignore.
        }
        deductBlockedAppTime()
        stopExpiryCheck()
        super.onDestroy()
    }
}
