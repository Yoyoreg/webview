/**
 * نظام بوابة الدخول وشاشة التحميل الذكية مع ميزة الحفظ والدخول التلقائي - login.js
 */

(function() {
    // 1. التنسيقات والضمان الكامل لتمدد الصورة والمظهر الزجاجي
    const style = document.createElement('style');
    style.innerHTML = `
        html, body {
            margin: 0; padding: 0; width: 100%; height: 100%;
        }

        .login-overlay {
            position: fixed; top: 0; left: 0; 
            width: 100vw; height: 100vh; /* ملأ الشاشة بالكامل */
            z-index: 99999; display: flex; justify-content: center; align-items: center;
            overflow: hidden; background: #000;
            transition: opacity 0.8s ease, filter 0.8s ease;
        }

        /* تتمدد تلقائياً لتغطية كامل أبعاد الشاشة مهما تغير حجمها */
        .login-bg-img {
            position: absolute; top: 0; left: 0; 
            width: 100%; height: 100%;
            object-fit: cover; /* التمدد الذكي لملا الشاشة تماماً دون تشويه */
            z-index: 1;
            user-select: none; -webkit-user-select: none; pointer-events: none;
        }

        /* النافذة الشبه شفافة */
        .login-box {
            position: relative; z-index: 2;
            width: 340px; padding: 30px;
            background: rgba(44, 44, 44, 0.65);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 2px solid #ffcc00; border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            text-align: center; direction: rtl;
            font-family: 'Segoe UI', Tahoma, sans-serif; color: #eee;
            user-select: none; -webkit-user-select: none;
        }

        .login-box h3 { color: #ffcc00; margin: 0 0 20px 0; font-size: 1.4rem; letter-spacing: 1px; }
        .login-group { margin-bottom: 15px; text-align: right; }
        .login-group label { display: block; font-size: 0.85rem; color: #ddd; margin-bottom: 5px; font-weight: bold; }
        
        .login-input {
            width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;
            background: rgba(30, 30, 30, 0.7); color: #fff; font-size: 1rem; box-sizing: border-box;
            outline: none; transition: 0.3s;
        }
        .login-input:focus { border-color: #ffcc00; box-shadow: 0 0 8px rgba(255, 204, 0, 0.4); }

        .btn-login {
            width: 100%; padding: 12px; border: none; border-radius: 25px;
            background: #ffcc00; color: #2c2c2c; font-weight: 800; font-size: 1.1rem;
            cursor: pointer; margin-top: 10px; transition: all 0.3s ease;
            box-shadow: 0 4px 0 #b38f00;
        }
        .btn-login:hover { background: #ffe066; transform: translateY(-2px); }
        .btn-login:active { transform: translateY(2px); box-shadow: 0 2px 0 #b38f00; }

        .fade-out-screen { opacity: 0; filter: blur(15px); pointer-events: none; }
    `;
    document.head.appendChild(style);

    // 2. بناء هيكل الشاشة وحقنها
    const loginOverlay = document.createElement('div');
    loginOverlay.id = 'player-login-overlay';
    loginOverlay.className = 'login-overlay';

    loginOverlay.innerHTML = `
        <img src="login_bg.png" class="login-bg-img" alt="Loading...">

        <div class="login-box">
            <h3>بوابة المقاتلين</h3>
            
            <div class="login-group">
                <label>عنوان IP (الجزء الأخير)</label>
                <input type="number" id="user-ip-field" class="login-input" placeholder="مثال: 103" min="1" max="254" autocomplete="off">
            </div>

            <div class="login-group">
                <label>اسم المستخدم</label>
                <input type="text" id="user-name-field" class="login-input" placeholder="أدخل اسمك الملكي..." autocomplete="off">
            </div>

            <div class="login-group">
                <label>كلمة المرور</label>
                <input type="password" id="user-pass-field" class="login-input" placeholder="••••••••" autocomplete="off">
            </div>

            <button class="btn-login" id="login-submit-btn" onclick="attemptLogin()">دخول المعركة</button>
        </div>
    `;
    
    document.body.insertBefore(loginOverlay, document.body.firstChild);

    // 3. دالة التحقق المعدلة لتدعم حفظ البيانات والدخول التلقائي
    window.attemptLogin = function() {
        const username = document.getElementById('user-name-field').value.trim();
        const password = document.getElementById('user-pass-field').value.trim();
        const ip = document.getElementById('user-ip-field').value.trim();
        const btn = document.getElementById('login-submit-btn');

        if (username === "" || password === "" || ip === "") {
            alert("عذراً، يرجى ملء كافة الخانات (بما فيها IP) أولاً للدخول!");
            return;
        }

        btn.innerText = "جاري الفحص...";
        btn.style.pointerEvents = "none";

        const id_devs = window.id_devs;
        
        const url = `http://192.168.8.${ip}:8080/?msg=[${id_devs},"log","${username}","${password}"]`;

        console.log("جاري إرسال بيانات الدخول للسيرفر:", url);

        fetch(url)
            .then(response => response.text())
            .then(data => {
                console.log("رد السيرفر المستلم:", data);
                
                if (data.includes("ok")) {
                    // [ميزة الحفظ]: تخزين البيانات وحقل IP بنجاح لعدم تكرار كتابتها
                    localStorage.setItem('saved_username', username);
                    localStorage.setItem('saved_password', password);
                    localStorage.setItem('saved_ip', ip);

                    loginOverlay.classList.add('fade-out-screen');
                    setTimeout(() => {
                        loginOverlay.remove();
                    }, 800);
                } else {
                    alert("فشل تسجيل الدخول: اسم المستخدم أو كلمة المرور غير صحيحة!");
                    resetButton(btn);
                    
                    // إذا فشل الدخول التلقائي، نحذف المفاتيح المخزنة
                    localStorage.removeItem('saved_username');
                    localStorage.removeItem('saved_password');
                    localStorage.removeItem('saved_ip');
                }
            })
            .catch(error => {
                console.error("خطأ في الاتصال:", error);
                alert("تعذر الاتصال بالسيرفر! تأكد من تشغيل الخادم وصحة عنوان IP.");
                resetButton(btn);
            });
    };

    function resetButton(btn) {
        btn.innerText = "دخول المعركة";
        btn.style.pointerEvents = "auto";
    }

    // --- [ميزة الفحص والدخول التلقائي الفورى عند تشغيل الملف] ---
    function checkSavedPlayer() {
        const savedUser = localStorage.getItem('saved_username');
        const savedPass = localStorage.getItem('saved_password');
        const savedIp = localStorage.getItem('saved_ip') || window.ip || '';

        // ملء حقل الـ IP مسبقاً إذا كان متوفراً
        if (savedIp) {
            document.getElementById('user-ip-field').value = savedIp;
        }

        // إذا وُجدت مفاتيح مخزنة كاملة، يتم حقنها وإطلاق طلب الدخول فوراً
        if (savedUser && savedPass && savedIp) {
            document.getElementById('user-name-field').value = savedUser;
            document.getElementById('user-pass-field').value = savedPass;
            
            console.log("تم العثور على لاعب وبينات IP محفوظة.. جاري تسجيل الدخول التلقائي..");
            window.attemptLogin();
        }
    }

    // تشغيل الفحص التلقائي بعد حقن نافذة الـ HTML مباشرة
    setTimeout(checkSavedPlayer, 100);

})();