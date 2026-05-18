package com.marcidia.myloc;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView mWebView;
    // 🌟 تعريف المتغير الثابت المفقود الخاص بصلاحية الـ GPS
    private static final int REQUEST_CODE_GPS = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        mWebView = findViewById(R.id.activity_main_webview);
        
        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setGeolocationEnabled(true); // 🌟 تفعيل الجغرافي داخل إعدادات الـ WebView
        
        // 1. تفعيل تشغيل الميديا وتلقائية الفيديو دون الحاجة لضغط المستخدم
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // 2. تفعيل الـ WebChromeClient مباشرة على mWebView ليدعم الكاميرا، الـ Alert، والـ GPS
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final android.webkit.PermissionRequest request) {
                // الموافقة التلقائية على طلبات الصلاحية القادمة من الـ HTML (مثل الكاميرا)
                request.grant(request.getResources());
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message, final android.webkit.JsResult result) {
                // تخصيص نافذة الـ alert لتعرض اسم التطبيق بدلاً من الـ file://
                new android.app.AlertDialog.Builder(view.getContext())
                        .setTitle("MyLOC") // اسم تطبيقك الممرر ديناميكياً
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
                // تمنح هذه الدالة الإذن لصفحة الـ HTML برمجياً للوصول إلى الـ GPS داخل الـ WebView
                callback.invoke(origin, true, false);
            }
        });

        mWebView.setWebViewClient(new MyWebViewClient());
        
        // طلب صلاحيات الـ GPS من النظام بطريقة الـ Native النظيفة
        checkAndRequestAndroidPermissions();

        // LOCAL RESOURCE
        mWebView.loadUrl("file:///android_asset/index.html");
    }

    private void checkAndRequestAndroidPermissions() {
        // التحقق وطلب الصلاحية باستخدام الـ SDK الأساسي للأندرويد لحذف اعتمادية androidx تماماً من الـ actions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED ||
                checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                
                requestPermissions(new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION, 
                        Manifest.permission.ACCESS_COARSE_LOCATION
                }, REQUEST_CODE_GPS);
            }
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