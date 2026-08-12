/**
 * نظام إرسال المراسلات التاريخي - send_msg.js
 */

// 1. قاموس المتلقين (الصور)
const recipients = {
    1: { name:'الفهرر منصف', img: "flags/1.svg" },
    6: { name: 'السلطان ياسين', img:"flags/6.svg"},
    4: { name: 'الامبراطورة ملاك', img: "flags/4.svg"},
    5: { name: 'المديرة غنية', img: "flags/5.svg" },
    3: { name: 'الرئيس محمد', img: "flags/3.svg" },
    2: { name:'الملكة اكرام', img: "flags/2.svg" },
};

const sendStyle = document.createElement('style');
sendStyle.innerHTML = `
    #send-msg-window {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 550px; z-index: 10005; display: none;
        background-color: #e6d5ac; 
        background-image: radial-gradient(circle, #eee1ba 0%, #d9c593 100%);
        border: 2px solid #8f7f55; border-radius: 20px;
        box-shadow: 0 0 80px rgba(0,0,0,0.8);
        direction: rtl; padding: 25px;
        font-family: "DecoType Naskh", "Amiri", serif;
    }

    .send-header {
        text-align: center; color: #4e342e; font-size: 1.8rem;
        margin-bottom: 20px; border-bottom: 2px solid #8f7f55;
    }

    /* منطقة اختيار المتلقي */
    .recipient-selector {
        display: flex; gap: 10px; overflow-x: auto; padding: 10px;
        background: rgba(0,0,0,0.05); border-radius: 10px; margin-bottom: 15px;
    }

    .recipient-option {
        cursor: pointer; text-align: center; transition: 0.3s;
        border: 2px solid transparent; border-radius: 10px; padding: 5px;
        flex-shrink: 0;
    }

    .recipient-option img { width: 60px; height: 60px; border-radius: 5px; border: 1px solid #8f7f55; }
    .recipient-option p { margin: 5px 0 0; font-size: 0.9rem; color: #4e342e; }

    .recipient-option.selected {
        border-color: #8b0000; background: rgba(139, 69, 19, 0.1);
        transform: scale(1.05);
    }

    /* المدخلات */
    .input-field {
        width: 100%; background: rgba(255,255,255,0.2);
        border: 1px solid #8f7f55; border-radius: 8px;
        padding: 10px; margin-bottom: 15px; font-family: "Amiri", serif;
        font-size: 1.2rem; color: #2b1d1a; box-sizing: border-box;
    }

    textarea.input-field { height: 150px; resize: none; }

    .char-count {
        text-align: left; font-size: 0.8rem; color: #8b4513;
        margin-top: -12px; margin-bottom: 10px;
    }

    /* زر الإرسال */
    .btn-container { text-align: center; }
    .send-btn {
        background: #4e342e; color: #e6d5ac; border: 1px solid #8f7f55;
        padding: 10px 40px; font-size: 1.4rem; cursor: pointer;
        border-radius: 10px; transition: 0.3s;
    }
    .send-btn:hover { background: #8b0000; color: white; }

    .close-send-btn {
        position: absolute; top: 10px; left: 10px;
        cursor: pointer; font-size: 1.5rem; color: #8b0000;
    }
`;
document.head.appendChild(sendStyle);

// إنشاء هيكل النافذة
const sendDiv = document.createElement('div');
sendDiv.id = 'send-msg-window';
sendDiv.innerHTML = `
    <div class="close-send-btn" onclick="send_msg_mng('hide')">✕</div>
    <div class="send-header">ديوان المراسلات - كتابة رسالة</div>
    
    <div class="recipient-selector" id="recipients-list"></div>
    
    <input type="text" id="msg-title-input" class="input-field" placeholder="عنوان الرسالة..." maxlength="50">
    <div class="char-count" id="title-count">0 / 50</div>
    
    <textarea id="msg-text-input" class="input-field" placeholder="اكتب نص الرسالة هنا..." maxlength="500"></textarea>
    <div class="char-count" id="text-count">0 / 500</div>
    
    <div class="btn-container">
        <button class="send-btn" onclick="submitMessage()">إرسال الرسالة 📜</button>
    </div>
`;
document.body.appendChild(sendDiv);

let selectedRecipient = null;

// دالة إدارة النافذة
function send_msg_mng(action) {
    const win = document.getElementById('send-msg-window');
    if (action === 'show') {
        win.style.display = 'block';
        initRecipients();
    } else {
        win.style.display = 'none';
    }
}

// بناء قائمة المتلقين
function initRecipients() {
    const list = document.getElementById('recipients-list');
    list.innerHTML = Object.keys(recipients).map(key => `
        <div class="recipient-option" id="rec-${key}" onclick="selectRecipient('${key}')">
            <img src="${recipients[key].img}" alt="${recipients[key].name}">
            <p>${recipients[key].name}</p>
        </div>
    `).join('');
}

function selectRecipient(key) {
    document.querySelectorAll('.recipient-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(`rec-${key}`).classList.add('selected');
    selectedRecipient = key;
}

// مراقبة عدد الحروف
document.getElementById('msg-title-input').oninput = function() {
    document.getElementById('title-count').innerText = `${this.value.length} / 50`;
};
document.getElementById('msg-text-input').oninput = function() {
    document.getElementById('text-count').innerText = `${this.value.length} / 500`;
};

// إرسال الطلب للسيرفر
function submitMessage() {
    const title = document.getElementById('msg-title-input').value;
    const text = document.getElementById('msg-text-input').value;
    const ip = window.ip || "1";

    if (!selectedRecipient || !title || !text) {
        alert("يرجى اختيار المتلقي وكتابة العنوان والنص!");
        return;
    }

    // التعديل هنا: استخدام parseInt لتحويل المعرف إلى رقم صحيح قبل الإرسال
    const recipientId = parseInt(selectedRecipient);

    // بناء الرابط مع التأكد من إزالة الاقتباسات حول الرقم
    const url = `http://192.168.8.${ip}:8080/?msg=[${id_devs},"rol",'send',[${recipientId},"${title}","${text}"]]`;

    console.log("Sending to Server:", url); // للتأكد في الكونسول

    fetch(url)
    .then(() => {
        send_msg_mng('hide');
        // تفريغ الحقول
        document.getElementById('msg-title-input').value = '';
        document.getElementById('msg-text-input').value = '';
        selectedRecipient = null;
    })
    .catch(err => {
        console.error("خطأ في الإرسال:", err);
        alert("فشل الإرسال، تأكد من اتصال السيرفر.");
    });
}