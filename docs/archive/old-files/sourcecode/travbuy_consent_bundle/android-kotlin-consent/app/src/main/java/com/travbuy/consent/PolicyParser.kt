
package com.travbuy.consent

import org.json.JSONObject

object PolicyParser {
    fun parse(json: String): Policy {
        val o = JSONObject(json)
        val version = o.getString("version")
        val updated = o.getString("updatedAt")
        val lang = o.getJSONObject("ar") // choose ar by default
        val summary = lang.getString("summary")
        val full = lang.getString("fullText")
        return Policy(version, updated, summary, full)
    }

    fun fallback(): Policy = Policy(
        version = "1.0.0",
        updatedAt = "2025-08-01",
        summary = "باستخدامك للتطبيق فأنت توافق على سياسة الخصوصية والأمان.",
        fullText = "سياسة خصوصية مختصرة للاستخدام دون إنترنت. نُحدّث هذه السياسة من حين لآخر."
    )
}
