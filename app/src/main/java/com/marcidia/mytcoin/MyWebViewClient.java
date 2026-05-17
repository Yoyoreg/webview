package com.marcidia.mytcoin;

import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;

class MyWebViewClient extends WebViewClient {

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        // إذا كان الرابط محلياً أو رابط إنترنت طبيعي، افتحه داخل الـ WebView مباشرة ولا تخرج
        if (url.startsWith("file:") || url.startsWith("http://") || url.startsWith("https://")) {
            return false; 
        }
        
        // روابط الـ Intents الأخرى (مثل فتح تطبيق المتجر أو الاتصال أو إيميل) تفتح خارجياً بأمان
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            view.getContext().startActivity(intent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}