
package com.travbuy.consent

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { }
        lifecycleScope.launch {
            val accepted = ConsentStore.isAccepted(this@MainActivity, BuildConfig.PRIVACY_VERSION)
            if (accepted) {
                startActivity(Intent(this@MainActivity, HomeActivity::class.java))
            } else {
                startActivity(Intent(this@MainActivity, ConsentActivity::class.java))
            }
            finish()
        }
    }
}
