window.InventoryModule = {
    storeConfig: {
        apiKey: "AIzaSyC0Hf2Xy6YICYFgMGx6QUWsZWlroFX0OYc",
        databaseURL: "https://mmarket-cb517-default-rtdb.firebaseio.com",
        projectId: "mmarket-cb517"
    },
    
    init: function() {
        const container = document.getElementById('merchant-dynamic-content');
        if (!container) return;

        // 🟢 استدعاء ملف إضافة المنتج في الخلفية لتجهيز إعدادات الـ GitHub Token للحذف
        if (!window.AddProductModule) {
            const script = document.createElement('script');
            script.src = 'add_prd.js';
            script.style.display = 'none'; // تحميل صامت بدون التأثير على الواجهة
            document.body.appendChild(script);
        }

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;" dir="rtl">
                <b style="color:var(--text-main)">📦 إدارة المخزون</b>
                <button onclick="InventoryModule.openAddModal()" style="padding:6px 12px; background:var(--accent); color:white; border:none; border-radius:8px; font-weight:900; font-size:12px; cursor:pointer;">+ إضافة منتج</button>
            </div>
            <div id="items-render-area" style="display:flex; flex-direction:column; gap:10px;"></div>
        `;

        if (!window.storeDb) {
            const storeApp = firebase.initializeApp(this.storeConfig, "storeInstance");
            window.storeDb = storeApp.database();
        }
        this.loadProducts();
    },

    loadProducts: function() {
        const currentUid = localStorage.getItem('market_user_id') || 'user0'; 
        
        // جلب عقدة البائع بالكامل لقراءة المنتجات والتخفيض العالمي معاً
        window.storeDb.ref('sellers_lists/' + currentUid).on('value', (snapshot) => {
            const renderArea = document.getElementById('items-render-area');
            if (!renderArea) return;
            renderArea.innerHTML = "";

            if (!snapshot.exists()) return;

            const fullData = snapshot.val();
            const products = fullData['list-prd'] || {};
            const sellerInfo = fullData['seller_info'] || {};
            const globalPta = sellerInfo.pta || 0; // التخفيض العالمي (العام)

            for (let id in products) {
                if (products.hasOwnProperty(id)) {
                    const data = products[id];
                    const productImg = (data.img && data.img !== "") ? data.img : "d.svg";
                    
                    // قراءة التخفيض الخاص بالمنتج (0% افتراضياً)
                    const localDiscount = data.p_discount || 0;

                    // حساب السعر النهائي بعد الخصم الثنائي (العام والخاص)
                    const originalPrice = parseFloat(data.price || 0);
                    const priceAfterGlobal = originalPrice * (1 - (globalPta / 100));
                    const finalPrice = priceAfterGlobal * (1 - (localDiscount / 100));

                    // الفحص الذكي: هل يوجد أي تخفيض (عام أو خاص)؟
                    const hasAnyDiscount = (globalPta > 0 || localDiscount > 0);
                    // تحديد نمط الخط: شطب إذا وجد تخفيض، أو خط عادي بلون بارز إذا لم يوجد
                    const priceStyle = hasAnyDiscount 
                        ? "text-decoration: line-through; color: #999;" 
                        : "text-decoration: none; color: var(--accent); font-weight: 900;";

                    renderArea.innerHTML += `
                        <div style="background:var(--card); padding:12px; border-radius:15px; display:flex; align-items:center; gap:12px; border:1px solid rgba(0,0,0,0.05);" dir="rtl">
                            <img src="${productImg}" onerror="this.src='d.svg'" style="width:55px; height:55px; border-radius:10px; object-fit:cover;">
                            <div style="flex:1; text-align: right;">
                                <div style="font-weight:900; color:var(--text-main); font-size:14px;">${data.name}</div>
                                <div style="font-size:12px; color:var(--accent); font-weight:700;">
                                    السعر الأصلي: <span onclick="InventoryModule.editPrice('${id}', ${data.price})" style="cursor:pointer; ${priceStyle}">${data.price} ɱ ✏️</span> 
                                    <span style="color:#777; font-weight:400; margin-right:10px;">الكمية: ${data.qty}</span>
                                </div>
                                
                                <div style="margin-top: 4px; display: flex; align-items: center; gap: 8px; font-size: 11px;">
                                    <span onclick="InventoryModule.editLocalDiscount('${id}', ${localDiscount})" style="color: #ff3b30; font-weight: 900; background: rgba(255, 59, 48, 0.06); padding: 2px 6px; border-radius: 6px; cursor: pointer;">
                                        🔻 خصم خاص: ${localDiscount}% ✏️
                                    </span>
                                    <span style="color: #1a570bff; font-weight: 900;">
                                        🏷️ النهائي: ${finalPrice.toFixed(2)} ɱ
                                    </span>
                                </div>
                            </div>
                            <div style="display:flex; gap:5px; align-items:center;">
                                <button onclick="InventoryModule.updateQty('${id}', 1)" style="border:none; background:rgba(0,122,255,0.1); color:var(--accent); border-radius:8px; width:30px; height:30px; font-weight:bold; cursor:pointer;">+</button>
                                <button onclick="InventoryModule.updateQty('${id}', -1)" style="border:none; background:#eee; color:#666; border-radius:8px; width:30px; height:30px; font-weight:bold; cursor:pointer;">-</button>
                                <button onclick="InventoryModule.deleteProduct('${id}')" style="background:none; border:none; color:#ff3b30; font-size:18px; margin-left:5px; cursor:pointer;">🗑️</button>
                            </div>
                        </div>`;
                }
            }
        });
    },

    editPrice: function(id, currentPrice) {
        const newPriceStr = prompt("💵 أدخل السعر الجديد للمنتج:", currentPrice);
        
        // إذا ضغط التاجر إلغاء (Cancel)
        if (newPriceStr === null) return;

        const newPrice = parseFloat(newPriceStr);

        // 🛡️ الفحص الأمني والمنطقي لمنع الأسعار السالبة أو الخاطئة
        if (isNaN(newPrice) || newPrice <= 0) {
            alert("🛑 خطأ: يجب إدخال سعر صحيح وأكبر من الصفر!");
            return; // إيقاف العملية فوراً ومنع التحديث
        }

        const uid = localStorage.getItem('market_user_id') || 'user0';
        
        // تحديث السعر في قاعدة البيانات بعد التأكد من سلامته
        window.storeDb.ref(`sellers_lists/${uid}/list-prd/${id}`).update({
            price: newPrice
        }).then(() => {
            console.log(`تم تحديث سعر المنتج ${id} بنجاح إلى: ${newPrice}`);
        }).catch(err => {
            alert("حدث خطأ أثناء تحديث السعر في السيرفر.");
            console.error(err);
        });
    },

    // دالة تعديل نسبة التخفيض الخاصة بالمنتج عند النقر عليها
    editLocalDiscount: function(id, currentDiscount) {
        const res = prompt("أدخل نسبة التخفيض الخاصة بهذا المنتج (0 إلى 100):", currentDiscount);
        if (res === null) return;

        const discountVal = parseInt(res);
        if (isNaN(discountVal) || discountVal < 0 || discountVal > 100) {
            alert("يرجى إدخال نسبة صحيحة بين 0 و 100");
            return;
        }

        const uid = localStorage.getItem('market_user_id') || 'user0';
        window.storeDb.ref(`sellers_lists/${uid}/list-prd/${id}`).update({ p_discount: discountVal });
    },

    updateQty: function(id, val) {
        const uid = localStorage.getItem('market_user_id') || 'user0';
        window.storeDb.ref(`sellers_lists/${uid}/list-prd/${id}/qty`).transaction(c => (c || 0) + val < 0 ? 0 : (c || 0) + val);
    },

    deleteProduct: async function(id) {
        if (!confirm("هل أنت متأكد من حذف المنتج وصورته نهائياً؟")) return;

        const uid = localStorage.getItem('market_user_id') || 'user0';
        const prdRef = window.storeDb.ref(`sellers_lists/${uid}/list-prd/${id}`);

        prdRef.once('value', async (snapshot) => {
            const data = snapshot.val();
            
            if (data && data.img && data.img.includes("raw.githubusercontent.com")) {
                const parts = data.img.split('/');
                const fileName = parts[parts.length - 1];
                await this.deleteImageFromGithub(fileName);
            }

            prdRef.remove().then(() => {
                console.log("تم حذف المنتج والبيانات بنجاح");
            });
        });
    },

    deleteImageFromGithub: async function(fileName) {
        const config = window.AddProductModule.gitConfig;
        const url = `https://api.github.com/repos/${config.user}/${config.repo}/contents/products/${fileName}`;

        try {
            const getRes = await fetch(url, {
                headers: { "Authorization": `token ${config.token}` }
            });
            
            if (getRes.ok) {
                const fileData = await getRes.json();
                const fileSha = fileData.sha;

                await fetch(url, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `token ${config.token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `Delete image: ${fileName}`,
                        sha: fileSha,
                        branch: config.branch
                    })
                });
                console.log("تم حذف الصورة من GitHub");
            }
        } catch (e) {
            console.error("خطأ أثناء محاولة حذف الصورة:", e);
        }
    },

    openAddModal: function() {
        if (!window.AddProductModule) {
            const script = document.createElement('script');
            script.src = 'add_prd.js';
            script.onload = () => AddProductModule.show();
            document.body.appendChild(script);
        } else {
            AddProductModule.show();
        }
    }
};