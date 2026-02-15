
package com.travbuy.consent

import android.content.Context
import android.content.SharedPreferences

object ConsentStore {
    private const val KEY = "accepted_privacy_version"

    fun isAccepted(ctx: Context, version: String): Boolean {
        val p = prefs(ctx)
        return p.getString(KEY, null) == version
    }

    fun setAccepted(ctx: Context, version: String) {
        prefs(ctx).edit().putString(KEY, version).apply()
    }

    private fun prefs(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences("consent_prefs", Context.MODE_PRIVATE)
}
