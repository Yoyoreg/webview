package com.marcidia.myloc;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

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
		webSettings.setGeolocationEnabled(true); // 🌟 تفعيل الجغرافي داخل إعدادات الـ WebView
        // 1. تفعيل تشغيل الميديا وتلقائية الفيديو دون الحاجة لضغط المستخدم (تم تصحيح السطر)
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // 2. تفعيل الـ WebChromeClient مباشرة على mWebView (تم تصحيح السطر)
        mWebView.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override
            public void onPermissionRequest(final android.webkit.PermissionRequest request) {
                // الموافقة التلقائية على طلبات الصلاحية القادمة من الـ HTML (مثل الكاميرا)
                request.grant(request.getResources());
            }
			@Override
            public boolean onJsAlert(android.webkit.WebView view, String url, String message, final android.webkit.JsResult result) {
                // تخصيص نافذة الـ alert لتعرض اسم التطبيق بدلاً من الـ file://
                new android.app.AlertDialog.Builder(view.getContext())
                        .setTitle("MyLOC") // 🌟 اكتب هنا اسم تطبيقك الذي تريده أن يظهر كعنوان
                        .setMessage(message)
                        .setPositiveButton(android.R.string.ok, new android.content.DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(android.content.DialogInterface dialog, int which) {
                                result.confirm();
                            }
                        })
                        .setCancelable(false)
                        .create()
                        .show();
                return true;
            }
			@Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                // تمنح هذه الدالة الإذن لصفحة الـ HTML برمجياً للوصول إلى الـ GPS
                callback.invoke(origin, true, false);
            }
        });

        mWebView.setWebViewClient(new MyWebViewClient());
		checkAndRequestAndroidPermissions();
        // REMOTE RESOURCE
        // mWebView.loadUrl("https://example.com");

        // LOCAL RESOURCE
        mWebView.loadUrl("file:///android_asset/index.html");
    }
	private void checkAndRequestAndroidPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) 
                != PackageManager.PERMISSION_GRANTED) {
            
            // طلب الصلاحية من المستخدم عبر نظام الأندرويد
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                    REQUEST_CODE_GPS);
        }
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
