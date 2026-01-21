package com.example.wsu_finance;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class LoginActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    // If running in emulator, use 10.0.2.2. If physical device, use local IP.
    private static final String LOGIN_URL = "http://10.0.2.2:3000/sign-in"; 

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Check if we already have a token
        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        String token = prefs.getString("auth_token", null);
        if (token != null) {
            startMainActivity();
            return;
        }

        setContentView(R.layout.activity_login);

        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progressBar);

        setupWebView();
        webView.loadUrl(LOGIN_URL);
    }

    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        
        // Spoof User-Agent to bypass Google's "disallowed_useragent" block for WebViews
        webSettings.setUserAgentString("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36");
        
        // Adjust for debugging
        WebView.setWebContentsDebuggingEnabled(true);

        // Accept third party cookies for Clerk
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new WebAppInterface(), "AndroidInterface");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                
                // Try to extract token if we are on a logged-in page
                // We inject JS to check if Clerk is ready and has a session
                checkForToken();
            }
        });
    }

    private void checkForToken() {
        String js = "(function() { " +
                "  if (window.Clerk && window.Clerk.session) { " +
                "    window.Clerk.session.getToken().then(token => { " +
                "      window.AndroidInterface.onTokenReceived(token); " +
                "    }); " +
                "  } " +
                "})()";
        
        webView.evaluateJavascript(js, null);
    }

    // Bridge class to receive data from JS
    public class WebAppInterface {
        @JavascriptInterface
        public void onTokenReceived(String token) {
            if (token != null && !token.isEmpty()) {
                Log.d("LoginActivity", "Token received: " + token);
                
                // Save token
                SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
                prefs.edit().putString("auth_token", token).apply();

                runOnUiThread(() -> {
                    Toast.makeText(LoginActivity.this, "Login Successful!", Toast.LENGTH_SHORT).show();
                    startMainActivity();
                });
            }
        }
    }

    private void startMainActivity() {
        Intent intent = new Intent(LoginActivity.this, MainActivity.class);
        startActivity(intent);
        finish();
    }
}
