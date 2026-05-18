package com.marcidia.mmarket;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView mWebView;
    
    // 🌟 المتغيرات الثابتة الخاصة بأكواد طلب الصلاحيات والاستدعاء
    private static final int REQUEST_CODE_PERMISSIONS = 1002;
    private static final int FILE_CHOOSER_RESULT_CODE = 2002;
    
    // 📥 متغيرات تتبع واسترجاع الملفات المرفوعة من الهاتف
    private ValueCallback<Uri[]> mUploadMessage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        mWebView = findViewById(R.id.activity_main_webview);
        
        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true); // حاسم جداً لحفظ بيانات الـ localStorage
        webSettings.setGeolocationEnabled(true); // تفعيل تحديد الموقع الجغرافي
        
        // تفعيل الصلاحيات المتقدمة للوصول للملفات والميديا داخلياً
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        // تفعيل تشغيل الميديا وتلقائية الفيديو دون الحاجة لضغط المستخدم
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // 🌟 إعداد الـ WebChromeClient الشامل (يدعم الكاميرا، الـ Alert، الـ GPS، واستيراد الملفات)
        mWebView.setWebChromeClient(new WebChromeClient() {
            
            // 1. الموافقة التلقائية على طلبات الصلاحية القادمة من الـ HTML (مثل الكاميرا)
            @Override
            public void onPermissionRequest(final android.webkit.PermissionRequest request) {
                request.grant(request.getResources());
            }

            // 2. تخصيص نافذة الـ alert لتعرض اسم التطبيق بدلاً من الـ file://
            @Override
            public boolean onJsAlert(WebView view, String url, String message, final android.webkit.JsResult result) {
                new android.app.AlertDialog.Builder(view.getContext())
                        .setTitle("MMarket") // اسم تطبيقك الممرر ديناميكياً من السكريبت
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

            // 3. منح إذن لصفحة الـ HTML برمجياً للوصول إلى الـ GPS داخل الـ WebView
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            // 4. 🌟 الجسر السحري لاستيراد الملفات والصور من الهاتف
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
                if (mUploadMessage != null) {
                    mUploadMessage.onReceiveValue(null);
                }
                mUploadMessage = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE);
                } catch (Exception e) {
                    mUploadMessage = null;
                    return false;
                }
                return true;
            }
        });

        mWebView.setWebViewClient(new MyWebViewClient());
        
        // طلب الصلاحيات الشاملة من نظام أندرويد (الـ GPS وقراءة الملفات والميديا)
        checkAndRequestAndroidPermissions();

        // LOCAL RESOURCE
        mWebView.loadUrl("file:///android_asset/index.html");
    }

    // 📬 طلب الصلاحيات بصيغة الـ Native لتفادي أي تضارب مع الـ Build Actions
    private void checkAndRequestAndroidPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            
            // مصفوفة الصلاحيات الأساسية المطلوبة للتطبيق
            String[] permissions;
            
            // في أندرويد 13 (API 33) فما فوق، تم تقسيم صلاحيات الملفات لصلاحيات ميديا متخصصة
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permissions = new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                        Manifest.permission.READ_MEDIA_IMAGES
                };
            } else {
                permissions = new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                        Manifest.permission.READ_EXTERNAL_STORAGE
                };
            }

            // فحص إذا كانت إحدى الصلاحيات غير ممنوحة ليتم طلبها دفعة واحدة
            boolean needsRequest = false;
            for (String perm : permissions) {
                if (checkSelfPermission(perm) != PackageManager.PERMISSION_GRANTED) {
                    needsRequest = true;
                    break;
                }
            }

            if (needsRequest) {
                requestPermissions(permissions, REQUEST_CODE_PERMISSIONS);
            }
        }
    }

    // 📩 دالة استقبال الملفات المستوردة المرتجعة من نظام التشغيل وتمريرها للجافاسكريبت
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (mUploadMessage == null) return;
            
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getClipData() != null) { // لدعم اختيار عدة ملفات معاً إن وجد
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            mUploadMessage.onReceiveValue(results);
            mUploadMessage = null;
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