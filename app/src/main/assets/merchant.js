const MerchantComponent = {
    // الهيكل الرئيسي للنافذة مع الشريط العلوي المعدل ليتمدد مرناً
    render: () => `
        <div class="merchant-wrapper" style="width: 100%; box-sizing: border-box;">
            <header class="merchant-nav-header" style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.08);">
                <div style="display: flex; width: 100%; background: #f1f1f1; padding: 4px; border-radius: 14px; box-sizing: border-box; gap: 4px;">
                    <button onclick="MerchantComponent.switchSection('inventory')" class="m-btn active" id="m-btn-inventory" style="flex: 1; padding: 10px; border: none; border-radius: 10px; cursor: pointer; font-weight: 900; font-size: 13px; transition: all 0.2s ease;">المخزون</button>
                    <button onclick="MerchantComponent.switchSection('analytics')" class="m-btn" id="m-btn-analytics" style="flex: 1; padding: 10px; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; transition: all 0.2s ease;">التحليل</button>
                    <button onclick="MerchantComponent.switchSection('controls')" class="m-btn" id="m-btn-controls" style="flex: 1; padding: 10px; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; transition: all 0.2s ease;">التحكم</button>
                </div>
            </header>
            
            <div id="merchant-dynamic-content" style="padding: 15px; width: 100%; box-sizing: border-box;">
                <p style="text-align:center; color:#888; font-size: 13px;">⏳ جاري تحميل القسم...</p>
            </div>
        </div>
    `,

    init: () => {
        // فتح قسم المخزون افتراضياً عند التشغيل الأول
        MerchantComponent.switchSection('inventory');
    },

    switchSection: (sectionName) => {
        // 1. تحديث الحالة البصرية للأزرار
        document.querySelectorAll('.m-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = "transparent";
            btn.style.color = "#666";
            btn.style.fontWeight = "700";
        });
        const activeBtn = document.getElementById(`m-btn-${sectionName}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = "var(--accent, #007aff)";
            activeBtn.style.color = "white";
            activeBtn.style.fontWeight = "900";
        }

        // 2. استدعاء سكريبت القسم المختار
        MerchantComponent.loadExternalScript(sectionName);
    },

    loadExternalScript: (name) => {
        const scriptId = `script-${name}`;
        
        // إذا كان الملف محمل مسبقاً، نقوم بعرضه فوراً دون إعادة تحميله
        if (document.getElementById(scriptId)) {
            MerchantComponent.executeInit(name);
            return;
        }

        // تحديد اسم الملف المناسب بناءً على اسم القسم المطلوب
        let sourceFile = `${name}.js`;
        if (name === 'controls') {
            sourceFile = 'seller_bord.js'; // تخصيص ملف لوحة التحكم حسب طلبك
        }

        // إنشاء وسم السكريبت ديناميكياً لتوفير موارد التطبيق
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = sourceFile; 
        script.onload = () => MerchantComponent.executeInit(name);
        script.onerror = () => {
            document.getElementById('merchant-dynamic-content').innerHTML = `
                <p style="text-align:center; color:#ff3b30; padding:20px;">🛑 فشل تحميل الملف الخارجي: ${sourceFile}</p>
            `;
        };
        document.body.appendChild(script);
    },

    executeInit: (name) => {
        // تشغيل نظام الـ Init الخاص بالملف الخارجي الذي تم استدعاؤه
        if (name === 'inventory' && window.InventoryModule) InventoryModule.init();
        if (name === 'analytics' && window.AnalyticsModule) AnalyticsModule.init();
        if (name === 'controls' && window.ControlsModule) ControlsModule.init();
    }
};