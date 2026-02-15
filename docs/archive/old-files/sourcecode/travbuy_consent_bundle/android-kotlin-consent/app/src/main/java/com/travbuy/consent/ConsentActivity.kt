
package com.travbuy.consent

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class ConsentActivity : ComponentActivity() {
    private val vm: ConsentViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                ConsentScreen(
                    state = vm.uiState.collectAsState().value,
                    onReload = { vm.loadPolicy() },
                    onAccept = {
                        vm.accept { accepted ->
                            if (accepted) {
                                startActivity(Intent(this, HomeActivity::class.java))
                                finish()
                            }
                        }
                    },
                    onDecline = { finish() }
                )
            }
        }
        vm.loadPolicy()
    }
}

@Composable
fun ConsentScreen(
    state: ConsentUiState,
    onReload: () -> Unit,
    onAccept: () -> Unit,
    onDecline: () -> Unit
) {
    Scaffold(
        topBar = { TopAppBar(title = { Text("Privacy & Security") }) }
    ) { padding ->
        Column(
            modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp),
        ) {
            when (state) {
                is ConsentUiState.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is ConsentUiState.Error -> {
                    Text("Failed to load policy. Using fallback.", color = MaterialTheme.colorScheme.error)
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = onReload) { Text("Reload") }
                }
                is ConsentUiState.Ready -> {
                    val s = state.policy
                    Text("Version: ${s.version} • Updated: ${s.updatedAt}")
                    Spacer(Modifier.height(8.dp))
                    Text(s.summary)
                    Spacer(Modifier.height(8.dp))
                    Text("Details:", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    Box(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                        Text(s.fullText)
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(onClick = onDecline, modifier = Modifier.weight(1f)) { Text("Decline") }
                        Button(onClick = onAccept, modifier = Modifier.weight(1f)) { Text("Accept") }
                    }
                }
            }
        }
    }
}
