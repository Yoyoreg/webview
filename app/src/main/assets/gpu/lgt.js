// 1. قاموس تعريف الصور (Icons Registry)
const RESOURCE_ASSETSs = {
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

// 2. التنسيق (CSS) المحقون برمجياً
const sendResStyle = document.createElement('style');
sendResStyle.innerHTML = `
    /* الحاوية الرئيسية للنافذة */
    .send-res-overlay {
        position: fixed; 
        top: 50%; left: 50%; 
        transform: translate(-50%, -50%);
        width: 450px;
        max-height: 85vh;
        background: #1e2819;
        border: 3px solid #4a5d23;
        box-shadow: 0 0 50px #000;
        display: none;
        z-index: 2000;
        font-family: 'Courier New', monospace;
        border-radius: 4px;
        flex-direction: column;
        color: white;
    }

    /* الشريط العلوي */
    .send-res-header { 
        background: #2d3629;
        padding: 10px 15px; 
        display: flex; 
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #f1c40f;
        flex-shrink: 0;
    }

    .send-res-title {
        font-size: 16px;
        font-weight: bold;
        color: #f1c40f;
    }

    /* زر الإغلاق */
    .send-res-close-x { 
        background: #ff0000;
        color: white; 
        border: none; 
        padding: 5px 12px; 
        cursor: pointer; 
        font-weight: bold; 
    }

    /* قسم عرض المساحة المتبقية */
    .send-res-space-info {
        background: #12160f;
        padding: 10px;
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        color: #2ecc71;
        border-bottom: 1px solid #4a5d23;
    }

    /* منطقة القائمة */
    .send-res-list { 
        padding: 15px; 
        overflow-y: auto;
        overflow-x: hidden;
        flex-grow: 1;
    }

    /* تخصيص شريط التمرير */
    .send-res-list::-webkit-scrollbar { width: 20px; }
    .send-res-list::-webkit-scrollbar-track { background: #12160f; }
    .send-res-list::-webkit-scrollbar-thumb {
        background: #556b2f;
        border: 1px solid #f1c40f;
    }
    .send-res-list::-webkit-scrollbar-thumb:hover { background: #f1c40f; }

    /* خانة المورد الواحد */
    .send-res-entry { 
        display: flex; 
        align-items: center; 
        justify-content: space-between;
        padding: 10px 0; 
        border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .send-res-left {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .send-res-entry img { 
        width: 45px; 
        height: 45px; 
        object-fit: contain; 
    }

    .send-res-available { 
        font-size: 18px; 
        font-weight: bold; 
        color: #2ecc71;
    }

    /* حقل إدخال الكمية */
    .send-res-input {
        width: 100px;
        background: #12160f;
        border: 2px solid #556b2f;
        color: #f1c40f;
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        padding: 5px;
        border-radius: 4px;
        outline: none;
    }

    .send-res-input:focus {
        border-color: #f1c40f;
    }

    /* الشريط السفلي وزر الإرسال الأخضر */
    .send-res-footer {
        padding: 15px;
        background: #2d3629;
        border-top: 1px solid #4a5d23;
        display: flex;
        justify-content: center;
    }

    .send-res-btn {
        background: #27ae60;
        color: white;
        border: 2px solid #2ecc71;
        padding: 10px 40px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.2s;
    }

    .send-res-btn:hover {
        background: #219150;
    }
`;
document.head.appendChild(sendResStyle);

// 3. بناء الهيكل (HTML)
const sendResDiv = document.createElement('div');
sendResDiv.id = "main-send-res-window";
sendResDiv.className = "send-res-overlay";
sendResDiv.innerHTML = `
    <div class="send-res-header">
        <span class="send-res-title">نافذة إرسال الموارد</span>
        <button class="send-res-close-x" onclick="manageSendResWindow(false)">X</button>
    </div>
    <div class="send-res-space-info">
        المساحة المتبقية: <span id="send-res-space-val">0</span>
    </div>
    <div id="send-res-items-container" class="send-res-list"></div>
    <div class="send-res-footer">
        <button class="send-res-btn" onclick="executeResourceSend()">إرسال</button>
    </div>
`;
document.body.appendChild(sendResDiv);

// 4. دالة فتح وإغلاق وعرض النافذة
function manageSendResWindow(show) {
    const win = document.getElementById('main-send-res-window');
    if (!win) return;

    win.style.display = show ? 'flex' : 'none'; 

    if (show) {
        const container = document.getElementById('send-res-items-container');
        const spaceDisplay = document.getElementById('send-res-space-val');

        // التحقق من وجود القائمة العالمية logt_box
        if (!window.logt_box || !Array.isArray(window.logt_box) || window.logt_box.length < 2) {
            container.innerHTML = "<div style='text-align:center; color:#e74c3c; padding:20px;'>لا توجد بيانات متاحة (logt_box)</div>";
            spaceDisplay.innerText = "0";
            return;
        }

        const itemsList = window.logt_box[0]; // [[[a,b,c]...]]
        const remainingSpace = window.logt_box[1]; // s

        // عرض المساحة s
        spaceDisplay.innerText = remainingSpace;

        // عرض عناصر الموارد
        container.innerHTML = itemsList.map(item => {
            const b = item[1]; // نوع المورد
            const c = item[2]; // الكمية المتاحة
            const iconPath = RESOURCE_ASSETSs[b] || 'mrd/default.svg';

            return `
                <div class="send-res-entry">
                    <div class="send-res-left">
                        <img src="${iconPath}" alt="${b}" onerror="this.src='mrd/default.svg'">
                        <span class="send-res-available">${c}</span>
                    </div>
                    <input 
                        type="number" 
                        class="send-res-input" 
                        data-type="${b}" 
                        max="${c}" 
                        min="0" 
                        value="0" 
                        oninput="if(parseInt(this.value) > ${c}) this.value = ${c}; if(this.value < 0 || !this.value) this.value = 0;"
                    />
                </div>`;
        }).join('');
    }
}

// 5. دالة تنفيذ الإرسال عند ضغط الزر الأخضر
function executeResourceSend() {
    const inputs = document.querySelectorAll('.send-res-input');
    let ss = [];

    // تجميع القيم المدخلة i مع أنواع الموارد b
    inputs.forEach(input => {
        const b = input.getAttribute('data-type');
        const i = parseInt(input.value) || 0;
        
        // إرسال حتى وإن كانت 0 أو اختيار تصفية القيم حسب الرغبة
        ss.push([b, i]);
    });

    // تحويل المصفوفة إلى صيغة JSON نصية للرابط
    const ssJson = JSON.stringify(ss);

    // التحقق من المتغيرات العالمية للرابط وإمكانية التعويض بقيم افتراضية
    const ip = window.ip || "1";
    const id_devs = window.id_devs || 0;
    const objsl_y = window.objsl_y || 0;
    const objsl_x = window.objsl_x || 0;
    const objsl_l = window.objsl_l || 0;
    // تشكيل الرابط النهائي
    const url = `http://192.168.8.${ip}:8080/?msg=[${id_devs},"rol","logt_l${objsl_l}",[${objsl_y},${objsl_x},${ssJson}]]`;

    // إرسال الطلب للسيرفر عبر fetch
    fetch(url)
        .then(response => response.text())
        .then(data => {
            console.log("تم الإرسال بنجاح:", data);
            manageSendResWindow(false); // إغلاق النافذة بعد الإرسال
        })
        .catch(error => {
            console.error("خطأ أثناء الإرسال:", error);
        });
}