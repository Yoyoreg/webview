/**
 * نظام إنشاء وإرسال الصفقات الدبلوماسية المطور (مصفوفة عناصر موحدة لكل جهة) - create_offer.js
 */

(function() {
    const kingdoms = {
        1: { name: 'الفهرر منصف', img: "flags/1.svg" },
        2: { name: 'الملكة اكرام', img: "flags/2.svg" },
        3: { name: 'الرئيس محمد', img: "flags/3.svg" },
        4: { name: 'الامبراطورة ملاك', img: "flags/4.svg" },
        5: { name: 'المديرة غنية', img: "flags/5.svg" },
        6: { name: 'السلطان ياسين', img: "flags/6.svg" }
    };

    // مصفوفات ديناميكية لتخزين الأراضي المضافة مؤقتاً قبل الكبس والدمج
    let myLands = [];
    let theirLands = [];
    let selectedOfferKingdom = null;

    // 1. التنسيقات العصرية للنافذة والجهتين
    const style = document.createElement('style');
    style.innerHTML = `
        .create-offer-window {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 700px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
            background: #2c2c2c; border: 2px solid #ffcc00; border-radius: 20px;
            box-shadow: 0 0 50px rgba(0,0,0,0.8); direction: rtl; padding: 25px;
            font-family: 'Segoe UI', Tahoma, sans-serif; color: #eeeeee; z-index: 12000; display: none;
        }

        .create-offer-window h2 { text-align: center; color: #ffcc00; margin: 0 0 15px 0; font-size: 1.4rem; }
        
        .offer-form-group { margin-bottom: 12px; text-align: right; }
        .offer-form-group label { display: block; font-size: 0.85rem; color: #ffcc00; margin-bottom: 4px; font-weight: bold; }
        
        .kingdom-selector { display: flex; gap: 10px; overflow-x: auto; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 12px; margin-bottom: 15px; }
        .kingdom-option { cursor: pointer; text-align: center; transition: 0.2s; border: 2px solid transparent; border-radius: 10px; padding: 5px; flex-shrink: 0; background: #1e1e1e; min-width: 70px; }
        .kingdom-option img { width: 50px; height: 35px; border-radius: 4px; border: 1px solid #444; object-fit: cover; }
        .kingdom-option p { margin: 3px 0 0; font-size: 0.75rem; color: #bbb; }
        .kingdom-option.selected { border-color: #ffcc00; background: rgba(255, 204, 0, 0.1); }
        .kingdom-option.selected p { color: #ffcc00; }

        .deal-sides-container { display: flex; gap: 20px; margin-top: 15px; }
        .deal-side { flex: 1; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; border: 1px solid #444; }
        .side-title { font-size: 1rem; font-weight: bold; text-align: center; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px dashed #ffcc00; }
        .side-give { color: #ffcc00; }
        .side-take { color: #ff4444; }

        .offer-field { width: 100%; padding: 8px 12px; border: 1px solid #555; border-radius: 6px; background: #1e1e1e; color: #fff; font-size: 0.95rem; box-sizing: border-box; outline: none; }
        .offer-field:focus { border-color: #ffcc00; }

        .coordinates-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .btn-add-land { background: #444; color: #fff; border: 1px solid #666; border-radius: 6px; padding: 0 10px; cursor: pointer; font-size: 0.85rem; font-weight: bold; }
        .btn-add-land:hover { background: #555; border-color: #ffcc00; }

        .lands-pool { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; min-height: 25px; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 6px; }
        .land-chip { background: #1a1a1a; border: 1px solid #555; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; }
        .land-chip span { color: #ff4444; cursor: pointer; font-weight: bold; }

        .offer-submit-btn { width: 100%; padding: 12px; border: none; border-radius: 25px; background: #ffcc00; color: #2c2c2c; font-weight: 800; font-size: 1.1rem; cursor: pointer; margin-top: 15px; box-shadow: 0 4px 0 #b38f00; transition: 0.2s; }
        .offer-submit-btn:hover { background: #ffe066; transform: translateY(-2px); }
        .offer-submit-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 #b38f00; }
        .offer-close-link { display: block; text-align: center; margin-top: 12px; color: #888; cursor: pointer; font-size: 0.85rem; text-decoration: underline; }
    `;
    document.head.appendChild(style);

    // 2. بناء هيكل النافذة وحقنها
    const makeWin = document.createElement('div');
    makeWin.id = 'create-offer-main-window';
    makeWin.className = 'create-offer-window';
    makeWin.innerHTML = `
        <h2>إبرام ميثاق مقايضة دبلوماسي</h2>
        
        <div class="offer-form-group">
            <label>المملكة المستهدفة بالمقايضة</label>
            <div class="kingdom-selector" id="kingdoms-offer-list"></div>
        </div>

        <div class="deal-sides-container">
            <div class="deal-side">
                <div class="side-title side-give">ماتقدمه إمبراطوريتك (عطاء)</div>
                
                <div class="offer-form-group">
                    <label>تقديم سبائك ذهبية</label>
                    <input type="number" id="my-gold" class="offer-field" placeholder="كمية الذهب المرسل..." min="0">
                </div>

                <div class="offer-form-group">
                    <label>التنازل عن أراضٍ (أدخل الإحداثيات واضغط إضافة)</label>
                    <div class="coordinates-row">
                        <input type="number" id="my-x" class="offer-field" placeholder="X">
                        <input type="number" id="my-y" class="offer-field" placeholder="Y">
                        <button class="btn-add-land" onclick="addLandToPool('my')">+</button>
                    </div>
                    <div class="lands-pool" id="my-lands-pool"></div>
                </div>
            </div>

            <div class="deal-side">
                <div class="side-title side-take">ما تشترطه في المقابل (طلب)</div>
                
                <div class="offer-form-group">
                    <label>طلب سبائك ذهبية</label>
                    <input type="number" id="their-gold" class="offer-field" placeholder="كمية الذهب المطلوب..." min="0">
                </div>

                <div class="offer-form-group">
                    <label>المطالبة بأراضٍ (أدخل الإحداثيات واضغط إضافة)</label>
                    <div class="coordinates-row">
                        <input type="number" id="their-x" class="offer-field" placeholder="X">
                        <input type="number" id="their-y" class="offer-field" placeholder="Y">
                        <button class="btn-add-land" onclick="addLandToPool('their')">+</button>
                    </div>
                    <div class="lands-pool" id="their-lands-pool"></div>
                </div>
            </div>
        </div>

        <button class="offer-submit-btn" onclick="sendNewOfferToServer()">إرسال المقايضة الرسمية</button>
        <span class="offer-close-link" onclick="toggleCreateOfferWindow('hide')">إلغاء المعاهدة</span>
    `;
    document.body.appendChild(makeWin);

    window.toggleCreateOfferWindow = function(action) {
        if (action === 'show') {
            document.getElementById('my-gold').value = "";
            document.getElementById('their-gold').value = "";
            myLands = [];
            theirLands = [];
            selectedOfferKingdom = null;
            renderLandsPools();
            makeWin.style.display = 'block';
            initOfferKingdoms();
        }
        if (action === 'hide') {
            makeWin.style.display = 'none';
        }
    };

    function initOfferKingdoms() {
        const list = document.getElementById('kingdoms-offer-list');
        list.innerHTML = Object.keys(kingdoms).map(key => `
            <div class="kingdom-option" id="okng-${key}" onclick="selectOfferKingdom('${key}')">
                <img src="${kingdoms[key].img}" alt="${kingdoms[key].name}">
                <p>${kingdoms[key].name}</p>
            </div>
        `).join('');
    }

    window.selectOfferKingdom = function(key) {
        document.querySelectorAll('.kingdom-option').forEach(el => el.classList.remove('selected'));
        const targetEl = document.getElementById(`okng-${key}`);
        if (targetEl) targetEl.classList.add('selected');
        selectedOfferKingdom = key;
    };

    window.addLandToPool = function(side) {
        const xField = document.getElementById(`${side}-x`);
        const yField = document.getElementById(`${side}-y`);
        const x = xField.value.trim();
        const y = yField.value.trim();

        if (x === "" || y === "") {
            alert("يرجى إدخال إحداثيات X و Y معاً لإضافة موقع الأرض!");
            return;
        }

        const landObj = [parseInt(y), parseInt(x)];

        if (side === 'my') {
            myLands.push(landObj);
        } else {
            theirLands.push(landObj);
        }

        xField.value = "";
        yField.value = "";
        renderLandsPools();
    };

    window.removeLandFromPool = function(side, index) {
        if (side === 'my') {
            myLands.splice(index, 1);
        } else {
            theirLands.splice(index, 1);
        }
        renderLandsPools();
    };

    function renderLandsPools() {
        document.getElementById('my-lands-pool').innerHTML = myLands.map((land, idx) => `
            <div class="land-chip">[${land[1]}, ${land[0]}] <span onclick="removeLandFromPool('my', ${idx})">✕</span></div>
        `).join('');

        document.getElementById('their-lands-pool').innerHTML = theirLands.map((land, idx) => `
            <div class="land-chip">[${land[1]}, ${land[0]}] <span onclick="removeLandFromPool('their', ${idx})">✕</span></div>
        `).join('');
    }

    /**
     * ميزة دمج كافة العناصر (الذهب والأراضي) في مصفوفة موحدة بالتوالي وإرسالها للسيرفر
     */
    window.sendNewOfferToServer = function() {
        if (!selectedOfferKingdom) {
            alert("عذراً، يجب اختيار المملكة المستهدفة من القائمة أولاً!");
            return;
        }

        const targetPlayerId = parseInt(selectedOfferKingdom);
        const myGold = document.getElementById('my-gold').value.trim();
        const theirGold = document.getElementById('their-gold').value.trim();

        // 1. تجميع كل عناصر جهتك (عطاء) في مصفوفة موحدة بالتوالي
        let giveItems = [];
        
        // إذا وجد ذهب، نقوم بدفعه كعنصر مستقل في القائمة أولاً
        if (myGold !== "" && parseInt(myGold) > 0) {
            giveItems.push(["mn", parseInt(myGold)]);
        }
        
        // ثم نقوم برص كل الأراضي كعناصر مستقلة داخل نفس المصفوفة الموحدة
        myLands.forEach(land => {
            giveItems.push(["ps", land[0], land[1]]); // تندرج كـ ["ps", Y, X]
        });


        // 2. تجميع كل عناصر جهتهم (طلب) في مصفوفة موحدة بالتوالي
        let takeItems = [];
        
        // إذا طُلب ذهب، يوضع في مصفوفة الطلبات الموحدة أولاً
        if (theirGold !== "" && parseInt(theirGold) > 0) {
            takeItems.push(["mn", parseInt(theirGold)]);
        }
        
        // ثم رص الأراضي المطلوبة داخل نفس مصفوفة الطلبات الموحدة
        theirLands.forEach(land => {
            takeItems.push(["ps", land[0], land[1]]);
        });


        // 3. منع المعاهدات الفارغة
        if (giveItems.length === 0 && takeItems.length === 0) {
            alert("لا يمكن إرسال معاهدة فارغة! يرجى تقديم أو طلب مواد (ذهب أو أراضٍ).");
            return;
        }

        const ip = window.ip;
        const id_devs = window.id_devs;

        // 4. صياغة مخرجات المصفوفات الموحدة النظيفة تماماً وإرسال الطلب
        const url = `http://192.168.8.${ip}:8080/?msg=[${id_devs},"rol","make_sfq",${targetPlayerId},${JSON.stringify(giveItems)},${JSON.stringify(takeItems)}]`;

        console.log("جاري إرسال المقايضة الموحدة بالصيغة المحدثة للشبكة:", url);

        fetch(url)
            .then(() => {
                alert("تم إرسال ميثاق المقايضة الموحد بنجاح إلى الديوان الدبلوماسي!");
                toggleCreateOfferWindow('hide');
            })
            .catch(err => {
                console.error("خطأ في الاتصال بالسيرفر:", err);
                alert("فشل اتصال الشبكة مع الخادم المحلي.");
            });
    };

})();