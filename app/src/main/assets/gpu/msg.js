/**
 * نظام المراسلات التاريخي الاحترافي - msg.js
 * الميزات: تحديث سلس (Animation)، أزرار حساسة، أداء عالي
 */

const flg = {
    1: "flags/1.svg",
    2: "flags/2.svg",
    3: "flags/3.svg",
    4: "flags/4.svg",
    5: "flags/5.svg",
    6: "flags/6.svg",
};

const style = document.createElement('style');
style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');

    #main-msg-window {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 550px; 
        max-height: 700px; 
        z-index: 10000; display: none;
        background-color: #e6d5ac; 
        background-image: radial-gradient(circle, #eee1ba 0%, #d9c593 100%);
        border: 2px solid #8f7f55; border-radius: 20px;
        box-shadow: 0 0 80px rgba(0,0,0,0.8), inset 0 0 100px rgba(139, 69, 19, 0.1);
        direction: rtl; padding: 25px;
        font-family: "DecoType Naskh", "Amiri", serif;
        user-select: none;
    }

    .msg-scroll-area {
        max-height: 620px; overflow-y: auto; padding: 15px;
        display: flex; flex-direction: column; gap: 25px;
        overflow-x: hidden;
    }

    .msg-scroll-area::-webkit-scrollbar { width: 8px; }
    .msg-scroll-area::-webkit-scrollbar-thumb { background: #8f7f55; border-radius: 10px; }

    .msg-paper-mini {
        position: relative; 
        background: rgba(255, 255, 255, 0.15);
        padding: 25px; border-radius: 15px;
        border: 1px solid #c4b07b;
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        /* مؤثرات الظهور والاختفاء */
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 1;
        transform: scale(1);
    }

    /* حالة الرسالة عند التحديث (إضافة أو حذف) */
    .msg-anim-hidden {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
        margin-bottom: -100px;
    }

    .close-win-btn {
        position: absolute; top: -15px; right: -15px;
        cursor: pointer; border: 3px solid #8f7f55; background: #8b0000;
        color: white; border-radius: 50%; width: 35px; height: 35px;
        font-weight: bold; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.5); z-index: 10001;
    }

    .delete-msg-btn {
        position: absolute; top: 10px; left: 10px; 
        cursor: pointer; border: 1px solid rgba(139, 69, 19, 0.3); 
        background: rgba(139, 69, 19, 0.05); border-radius: 5px;
        width: 45px; height: 45px; color: #4e342e; font-size: 22px;
        display: flex; align-items: center; justify-content: center;
        z-index: 100;
    }

    .msg-header-mini { 
        display: flex; align-items: center; gap: 15px; 
        border-bottom: 2px solid rgba(139, 69, 19, 0.2); 
        padding-bottom: 12px; margin-bottom: 15px; 
    }

    .flag-box-mini {
        width: 55px; height: 55px; background: rgba(0,0,0,0.03);
        border: 1px solid rgba(139, 69, 19, 0.15); border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
    }

    .flag-box-mini img { width: 90%; height: 90%; object-fit: contain; filter: sepia(0.2); }

    .msg-title-mini { font-size: 1.5rem; color: #4e342e; margin: 0; font-weight: bold; }
    
    .msg-body-mini { 
        font-size: 1.35rem; color: #2b1d1a; line-height: 1.6; 
        text-align: justify; font-family: "Amiri", serif; 
    }

    .empty-msg-vessel {
        text-align: center; padding: 60px 20px; color: #4e342e; 
        font-size: 1.6rem; font-weight: bold; opacity: 0.7;
    }
`;
document.head.appendChild(style);

const msgDiv = document.createElement('div');
msgDiv.id = 'main-msg-window';
msgDiv.innerHTML = `
    <div class="close-win-btn" onclick="msg_mng('hide')">✕</div>
    <div class="msg-scroll-area" id="msg-render-target"></div>
`;
document.body.appendChild(msgDiv);

function msg_mng(action) {
    const win = document.getElementById('main-msg-window');
    const target = document.getElementById('msg-render-target');
    const data = window.globalplayersmsg || [];

    if (action === 'show') {
        win.style.display = 'block';
        renderMsgs(data, target);
    } 
    else if (action === 'upd') {
        renderMsgs(data, target);
    } 
    else if (action === 'hide') {
        win.style.display = 'none';
    }
}

/**
 * دالة رندر ذكية: تضيف وتحذف الرسائل الجديدة فقط مع مؤثرات بصرية
 */
function renderMsgs(data, target) {
    if (!data || data.length === 0) {
        target.innerHTML = `<div class="empty-msg-vessel">📜<br>لا توجد مراسلات في ديوان الرسائل حالياً</div>`;
        return;
    }

    // إزالة رسالة "لا توجد مراسلات" إذا كانت موجودة عند وصول بيانات جديدة
    if (target.querySelector('.empty-msg-vessel')) target.innerHTML = '';

    const currentElements = Array.from(target.querySelectorAll('.msg-paper-mini'));
    const currentIds = currentElements.map(el => parseInt(el.id.replace('msg-card-', '')));
    const newIds = data.map(m => m[0]);

    // 1. حذف الرسائل التي لم تعد موجودة بسلاسة
    currentElements.forEach(el => {
        const id = parseInt(el.id.replace('msg-card-', ''));
        if (!newIds.includes(id)) {
            el.classList.add('msg-anim-hidden');
            setTimeout(() => el.remove(), 500);
        }
    });

    // 2. إضافة الرسائل الجديدة بسلاسة
    data.forEach(m => {
        const [id, title, flagKey, text] = m;
        if (!currentIds.includes(id)) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `
                <div class="msg-paper-mini msg-anim-hidden" id="msg-card-${id}">
                    <button class="delete-msg-btn" onclick="event.stopPropagation(); sendDeleteRequest(${id})">✕</button>
                    <div class="msg-header-mini">
                        <div class="flag-box-mini">
                            <img src="${flg[flagKey] || flg['default']}">
                        </div>
                        <h3 class="msg-title-mini">${title}</h3>
                    </div>
                    <div class="msg-body-mini">${text}</div>
                </div>`;
            
            const newEl = tempDiv.firstElementChild;
            target.appendChild(newEl);
            
            // تفعيل أنميشن الظهور بعد الإضافة
            setTimeout(() => newEl.classList.remove('msg-anim-hidden'), 20);
        }
    });
}

function sendDeleteRequest(msgId) {
    const ip = window.ip || "1";
    const url = `http://192.168.8.${ip}:8080/?msg=[${id_devs},"rol",'dlet',${msgId}]`;
    
    // إرسال الطلب فقط للسيرفر
    fetch(url).catch(err => console.error("فشل إرسال طلب الحذف:", err));
}