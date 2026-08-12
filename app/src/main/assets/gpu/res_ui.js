// 1. قاموس تعريف الصور (Icons Registry)
// هنا تربط الاسم التقني للمورد بمسار الصورة الخاصة به


// 2. التنسيق (CSS) المحقون برمجياً
const resStyle = document.createElement('style');
resStyle.innerHTML = `
    /* الحاوية الرئيسية للنافذة */
    .res-overlay-window {
        position: fixed; 
        top: 50%; left: 50%; 
        transform: translate(-50%, -50%); /* لضمان التمركز في وسط الشاشة تماماً */
        width: 420px;            /* عرض النافذة */
        max-height: 80vh;        /* أقصى ارتفاع (80% من طول الشاشة) لمنع الخروج عن الحدود */
        background: #1e2819;     /* لون الخلفية (أخضر عسكري صلب غير شفاف) */
        border: 3px solid #4a5d23; /* إطار النافذة الخارجي */
        box-shadow: 0 0 50px #000; /* الظل خلف النافذة */
        display: none;           /* مخفية افتراضياً (يتم تحويلها لـ flex عبر JS) */
        z-index: 2000;           /* لضمان ظهورها فوق كل عناصر اللعبة */
        font-family: 'Courier New', monospace;
        border-radius: 4px;      /* انحناء بسيط للزوايا */
        flex-direction: column;  /* ترتيب العناصر داخلياً بشكل عمودي */
    }

    /* الشريط العلوي (يحتوي على زر الإغلاق) */
    .res-header-bar { 
        background: #2d3629;     /* لون خلفية الشريط العلوي */
        padding: 10px; 
        display: flex; 
        justify-content: flex-end; /* وضع زر الإغلاق في جهة اليمين */
        border-bottom: 2px solid #f1c40f; /* الخط الذهبي الفاصل */
        flex-shrink: 0;          /* يمنع تقلص الهيدر عند امتلاء القائمة */
    }

    /* زر الإغلاق (X) */
    .res-close-x { 
        background: #ff0000;     /* لون الزر الأحمر */
        color: white; 
        border: none; 
        padding: 5px 15px; 
        cursor: pointer; 
        font-weight: bold; 
    }

    /* منطقة القائمة (التي تحتوي على التمرير) */
    .res-grid-list { 
        padding: 20px; 
        overflow-y: auto;        /* إظهار التمرير العمودي فقط عند الحاجة */
        overflow-x: hidden;      /* إخفاء التمرير الأفقي تماماً */
        flex-grow: 1;            /* تجعل هذا القسم يملأ المساحة المتبقية */
    }

    /* --- تخصيص شريط التمرير (Scrollbar) --- */
    .res-grid-list::-webkit-scrollbar {
        width: 30px;             /* سمك شريط التمرير (عدل هذا لتكبيره) */
    }
    .res-grid-list::-webkit-scrollbar-track {
        background: #12160f;     /* لون مسار الشريط (خلفية السكرول) غير شفافة */
    }
    .res-grid-list::-webkit-scrollbar-thumb {
        background: #556b2f;     /* لون الجزء المتحرك (المقبض) */
        border: 2px solid #f1c40f; /* إطار المقبض (ذهبي) */
        border-radius: 0px;      /* جعل المقبض حاد الزوايا لشكل عسكري */
    }
    .res-grid-list::-webkit-scrollbar-thumb:hover {
        background: #f1c40f;     /* لون المقبض عند وضع الماوس عليه */
    }

    /* خانة المورد الواحد */
    .res-entry { 
        display: flex; 
        align-items: center; 
        padding: 15px 0; 
        border-bottom: 1px solid rgba(255,255,255,0.05); /* خط خفيف يفصل بين الموارد */
        gap: 30px;               /* المسافة بين الصورة والأرقام */
    }

    /* صورة المورد */
    .res-entry img { 
        width: 60px;             /* عرض الأيقونة */
        height: 60px;            /* طول الأيقونة */
        object-fit: contain;     /* يمنع تشوه الصورة */
    }

    /* قسم الأرقام (Owned / Required) */
    .res-numbers { 
        display: flex; 
        align-items: center; 
        font-size: 30px;         /* حجم أرقام الموارد */
        font-weight: bold; 
    }

    /* الألوان الديناميكية للحالة */
    .res-met { color: #2ecc71; } /* لون أخضر (عند توفر المورد) */
    .res-need { color: #e74c3c; } /* لون أحمر (عند نقص المورد) */
`;
document.head.appendChild(resStyle);

// 3. بناء الهيكل (HTML)
const resDiv = document.createElement('div');
resDiv.id = "main-res-window";
resDiv.className = "res-overlay-window";
resDiv.innerHTML = `
    <div class="res-header-bar"><button class="res-close-x" onclick="manageResWindow(false)">X</button></div>
    <div id="res-items-container" class="res-grid-list"></div>
`;
document.body.appendChild(resDiv);

// 4. الدالة الرئيسية للعرض (تستخدم القاموس والقائمة المشتركة)




const RESOURCE_ASSETS = {
    'pk': 'mrd/pk.svg', 'pl': 'mrd/pl.svg', 'pd': 'mrd/pd.svg',
    'ps': 'mrd/ps.svg', 'pt': 'mrd/pt.svg', 'pp': 'mrd/pp.svg',
    'ppt': 'mrd/ppt.svg', 'mzs': 'mrd/mzs.svg', 'mzd': 'mrd/mzd.svg',
    'mzb': 'mrd/mzb.svg', 'l': 'mrd/l.svg', 'sw': 'mrd/sw.svg',
    'sg': 'mrd/sg.svg', 'sws': 'mrd/sws.svg', 'ptr': 'mrd/pt2.svg',
    'gaz': 'mrd/gaz.svg', 'al': 'mrd/al.svg', 'cu': 'mrd/cu.svg',
    'f': 'mrd/f.svg', 'ag': 'mrd/ag.svg', 'g': 'mrd/g.svg', 'sl': 'mrd/sl.svg', 'urn': 'mrd/urn.svg',
    'cad': 'mrd/cad.svg', 'cen': 'mrd/cen.svg', 'ced': 'mrd/ced.svg',
    'cf': 'mrd/cf.svg'
};

function manageResWindow(show) {
    const win = document.getElementById('main-res-window');
    if (!win) return;

    win.style.display = show ? 'flex' : 'none'; 
    
    if (show) {
        const container = document.getElementById('res-items-container');
        
        // التحقق من وجود البيانات
        if (!window.globalResources || Object.keys(window.globalResources).length === 0) {
            container.innerHTML = "<div style='text-align:center; color:#f1c40f; padding:20px;'>NO DATA AVAILABLE</div>";
            return;
        }

        // استخدام مفاتيح RESOURCE_ASSETS كمصدر للترتيب لضمان الظهور بنفس ترتيب القاموس
        const orderedKeys = Object.keys(RESOURCE_ASSETS);

        container.innerHTML = orderedKeys.map(type => {
            // جلب القيم من البيانات العالمية بناءً على النوع الحالي في الترتيب
            const values = window.globalResources[type];
            
            // إذا كان المفتاح غير موجود في البيانات، نتخطى رسمه
            if (!values) return '';

            const owned = values[0] !== undefined ? values[0] : 0;
            const required = values[1] !== undefined ? values[1] : 0;
            
            // جلب المسار من القاموس الذي أرسلته
            const iconPath = RESOURCE_ASSETS[type];
            const colorClass = owned >= required ? 'res-met' : 'res-need';

            return `
                <div class="res-entry">
                    <img src="${iconPath}" alt="${type}" onerror="this.src='mrd/default.svg'">
                    <div class="res-numbers">
                        <span style="color: white;">${owned}</span>
                        <span style="color:#556b2f; margin:0 10px;">/</span>
                        <span class="${colorClass}">${required}</span>
                    </div>
                </div>`;
        }).join('');
    }
}