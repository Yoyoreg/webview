package com.marcidia.mytcoin;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends Activity {

    private WebView mWebView;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mWebView = findViewById(R.id.activity_main_webview);
        
        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);

        // 1. تفعيل تشغيل الميديا وتلقائية الفيديو دون الحاجة لضغط المستخدم (تم تصحيح السطر)
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // 2. تفعيل الـ WebChromeClient مباشرة على mWebView (تم تصحيح السطر)
        mWebView.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override
            public void onPermissionRequest(final android.webkit.PermissionRequest request) {
                // الموافقة التلقائية على طلبات الصلاحية القادمة من الـ HTML (مثل الكاميرا)
                request.grant(request.getResources());
            }
        });

        mWebView.setWebViewClient(new MyWebViewClient());

        // REMOTE RESOURCE
        // mWebView.loadUrl("https://example.com");

        // LOCAL RESOURCE
        mWebView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if(mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
