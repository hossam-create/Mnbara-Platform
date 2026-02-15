
package com.travbuy.consent

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException

data class Policy(val version: String, val updatedAt: String, val summary: String, val fullText: String)

sealed class ConsentUiState {
    object Loading : ConsentUiState()
    data class Ready(val policy: Policy) : ConsentUiState()
    object Error : ConsentUiState()
}

class ConsentViewModel(app: Application) : AndroidViewModel(app) {
    private val _uiState = MutableStateFlow<ConsentUiState>(ConsentUiState.Loading)
    val uiState: StateFlow<ConsentUiState> = _uiState

    private val client = OkHttpClient()

    fun loadPolicy() {
        viewModelScope.launch {
            _uiState.value = ConsentUiState.Loading
            try {
                // Try remote first
                val url = "http://10.0.2.2:8080/policy.json" // change in prod
                val req = Request.Builder().url(url).build()
                client.newCall(req).execute().use { resp ->
                    if (!resp.isSuccessful) throw IOException("HTTP ${'$'}{resp.code}")
                    val body = resp.body?.string() ?: throw IOException("Empty body")
                    val parsed = PolicyParser.parse(body)
                    _uiState.value = ConsentUiState.Ready(parsed)
                    return@use
                }
            } catch (e: Exception) {
                // fallback
                val fallback = PolicyParser.fallback()
                _uiState.value = ConsentUiState.Ready(fallback)
            }
        }
    }

    fun accept(cb: (Boolean) -> Unit) {
        viewModelScope.launch {
            ConsentStore.setAccepted(getApplication(), BuildConfig.PRIVACY_VERSION)
            cb(true)
        }
    }
}
