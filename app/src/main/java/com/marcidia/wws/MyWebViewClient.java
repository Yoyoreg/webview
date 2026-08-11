package com.marcidia.wws;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

class MyWebViewClient extends WebViewClient {

    // 🌟 دعم إصدارات أندرويد الحديثة (Android 24 فما فوق)
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();
        return handleUrlRouting(view, url);
    }

    // 🌟 دعم إصدارات أندرويد القديمة (خيار احتياطي لمنع أي خطأ أثناء التجميع)
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        return handleUrlRouting(view, url);
    }

    // 🛠️ دالة الفرز الموحدة والنظيفة
    private boolean handleUrlRouting(WebView view, String url) {
        if (url == null) return false;

        // 1. إذا كان الرابط محلياً (داخل مجلد الـ assets)، افتحه داخل الـ WebView مباشرة دون الخروج
        if (url.startsWith("file:///android_asset/")) {
            return false; 
        }
        
        // 2. أي رابط خارجي آخر (مثل http أو https أو روابط الخرائط والمكالمات)، افتحه خارجياً في المتصفح الافتراضي
        try {
            Context context = view.getContext();
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            return true; // إخبار الـ WebView أننا تولّينا فتح الرابط خارجيًا
        } catch (Exception e) {
            // في حال حدوث حالة نادرة جداً (عدم وجود متصفح)، اترك الـ WebView يحاول فتحه داخلياً كخيار احتياطي
            return false;
        }
    }
}