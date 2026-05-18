// bt_mc.js - النسخة النهائية المستقرة والمتوافقة مع كائنات index.html الحقيقية
window.LocalCartModule = {
    notifications: [],

    init: function() {
        this.render();
    },

    render: async function() {
        const container = document.getElementById('user-store-dynamic-content');
        if (!container) return;

        let cart = JSON.parse(localStorage.getItem('user_market_cart')) || {};
        let keys = Object.keys(cart);

        if (keys.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:#999; font-family:sans-serif;">
                    🛒 سلة المشتريات فارغة حالياً.
                </div> ${this.renderNotificationsHTML()}`;
            return;
        }

        container.innerHTML = `<p style="text-align:center; color:#888; font-size:13px;">🔄 جاري فحص التخفيضات المزدوجة والمخازن حياً من السيرفر...</p>`;

        let html = `<div style="font-family:sans-serif; display:flex; flex-direction:column; gap:12px;">`;
        let totalCartPrice = 0;
        let hasChanges = false;

        for (let id of keys) {
            const localItem = cart[id];
            
            if (!localItem || !localItem.sellerId) {
                delete cart[id];
                hasChanges = true;
                continue;
            }

            try {
                // جلب بيانات السلعة والتاجر عبر الـ storeDb الخاص بالمتجر
                const prdSnap = await window.storeDb.ref(`sellers_lists/${localItem.sellerId}/list-prd/${id}`).once('value');
                const ptaSnap = await window.storeDb.ref(`sellers_lists/${localItem.sellerId}/seller_info/pta`).once('value');

                if (prdSnap.exists()) {
                    const prd = prdSnap.val();
                    
                    const originalPrice = parseFloat(prd.price || 0);
                    const localDiscount = parseFloat(prd.p_discount || 0); 
                    const maxQtyAvailable = parseInt(prd.qty || 0);
                    const globalPta = ptaSnap.exists() ? parseFloat(ptaSnap.val() || 0) : 0;

                    // حساب السعر النهائي التراكمي مثل متجرك تماماً
                    const priceAfterGlobal = originalPrice * (1 - (globalPta / 100));
                    const finalPrice = parseFloat((priceAfterGlobal * (1 - (localDiscount / 100))).toFixed(2));

                    // فحص الأمان للمخازن الفجائية للتاجر
                    if (localItem.qty_ordered > maxQtyAvailable) {
                        if (maxQtyAvailable <= 0) {
                            this.notifications.push({
                                id: 'note_' + Date.now() + Math.random(),
                                msg: `⚠️ تم إزالة <b>(${prd.name || 'منتج'})</b> تلقائياً؛ لنفاد الكمية من مخزن التاجر.`
                            });
                            delete cart[id];
                            hasChanges = true;
                            continue;
                        } else {
                            localItem.qty_ordered = maxQtyAvailable;
                            hasChanges = true;
                        }
                    }

                    const itemTotal = finalPrice * localItem.qty_ordered;
                    totalCartPrice += itemTotal;

                    const imgHtml = prd.img ? 
                        `<img src="${prd.img}" style="width:45px; height:45px; border-radius:12px; object-fit:cover; border:1px solid rgba(0,0,0,0.05);"/>` :
                        `<div style="width:45px; height:45px; border-radius:12px; background:#f0f0f0; display:flex; align-items:center; justify-content:center; font-size:18px;">📦</div>`;

                    html += `
                        <div style="background:var(--card, white); padding:12px; border-radius:18px; display:flex; align-items:center; gap:12px; border:1px solid rgba(0,0,0,0.04); box-shadow:0 2px 8px rgba(0,0,0,0.01);">
                            ${imgHtml}
                            <div style="flex:1;">
                                <b style="font-size:13px; color:var(--text-main, #333); display:block; margin-bottom:3px;">${prd.name || 'منتج بدون اسم'}</b>
                                <span style="font-size:11px; color:#888; display:block;">التاجر: <span style="font-family:monospace;">${localItem.sellerId}</span></span>
                                <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
                                    <span style="font-size:12px; color:#4cd964; font-weight:700;">${finalPrice.toFixed(2)} ɱ</span>
                                    ${(globalPta > 0 || localDiscount > 0) ? `<span style="font-size:10px; background:rgba(255,149,0,0.1); color:#ff9500; padding:1px 5px; border-radius:6px; font-weight:bold;">🏷️ تخفيض نشط</span>` : ''}
                                </div>
                            </div>
                            
                            <div style="display:flex; align-items:center; gap:8px;">
                                <button onclick="LocalCartModule.updateQty('${id}', -1)" style="width:26px; height:26px; border:none; background:#eee; border-radius:6px; font-weight:bold; cursor:pointer;">-</button>
                                <b style="font-size:14px; min-width:20px; text-align:center;">${localItem.qty_ordered}</b>
                                <button onclick="LocalCartModule.updateQty('${id}', 1, ${maxQtyAvailable})" style="width:26px; height:26px; border:none; background:rgba(0,122,255,0.1); color:var(--accent); border-radius:6px; font-weight:bold; cursor:pointer;">+</button>
                                <button onclick="LocalCartModule.deleteItem('${id}')" style="background:none; border:none; color:#ff3b30; font-size:16px; cursor:pointer; margin-right:5px;">🗑️</button>
                            </div>
                        </div>
                    `;
                } else {
                    this.notifications.push({
                        id: 'note_' + Date.now(),
                        msg: `⚠️ تم إزالة منتج من السلة لأن التاجر حذفه من متجره الأصلي.`
                    });
                    delete cart[id];
                    hasChanges = true;
                }
            } catch(e) { 
                console.error("🛑 فشل استخراج وحساب التخفيضات للـ id:", id, e); 
            }
        }

        if (hasChanges) {
            localStorage.setItem('user_market_cart', JSON.stringify(cart));
        }

        if (Object.keys(cart).length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:#999; font-family:sans-serif;">
                    🛒 سلة المشتريات فارغة حالياً.
                </div> ${this.renderNotificationsHTML()}`;
            return;
        }

        this.currentTotalCartPrice = totalCartPrice;

        html += `
            <div style="margin-top:15px; padding:15px; background:var(--card, white); border-radius:18px; border:1px solid rgba(0,0,0,0.04);">
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-weight:bold;">
                    <span style="color:#555; font-size:13px;">المجموع الكلي للسلة:</span>
                    <span style="color:#2ecc71; font-size:15px;">${totalCartPrice.toFixed(2)} ɱ</span>
                </div>
                <button onclick="LocalCartModule.openSecurePayModal()" style="width:100%; padding:12px; background:#2ecc71; color:white; border:none; border-radius:12px; font-weight:900; font-size:13px; cursor:pointer; box-shadow:0 4px 12px rgba(46,204,113,0.2);">تأكيد وإرسال الطلبات بالكامل 🚀</button>
            </div>
            ${this.renderNotificationsHTML()}
        </div>`;

        container.innerHTML = html;
    },

    updateQty: function(id, val, maxLimit) {
        let cart = JSON.parse(localStorage.getItem('user_market_cart')) || {};
        if (!cart[id]) return;

        cart[id].qty_ordered += val;
        if (cart[id].qty_ordered < 1) cart[id].qty_ordered = 1;
        if (maxLimit && cart[id].qty_ordered > maxLimit) cart[id].qty_ordered = maxLimit;

        localStorage.setItem('user_market_cart', JSON.stringify(cart));
        this.render();
    },

    deleteItem: function(id) {
        let cart = JSON.parse(localStorage.getItem('user_market_cart')) || {};
        if (cart[id]) {
            delete cart[id];
            localStorage.setItem('user_market_cart', JSON.stringify(cart));
            this.render();
        }
    },

    openSecurePayModal: function() {
        const userId = localStorage.getItem('market_user_id');
        if (!userId) {
            alert("🛑 خطأ: يجب تسجيل الدخول للمتجر أولاً!");
            return;
        }

        let modal = document.getElementById('mycoin-secure-pay-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'mycoin-secure-pay-modal';
            modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:99999; display:flex; align-items:center; justify-content:center; font-family:sans-serif; padding:15px; box-sizing:border-box;";
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="background:var(--card, white); width:100%; max-width:400px; padding:22px; border-radius:24px; box-shadow:0 12px 36px rgba(0,0,0,0.15); text-align:center; box-sizing:border-box;" dir="rtl">
                <h3 style="margin:0 0 10px 0; color:#1e293b; font-size:18px;">🏦 بوابة الدفع الآمن (MyCoin)</h3>
                <p style="font-size:13px; color:#ff3b30; background:rgba(255,59,48,0.08); padding:8px 12px; border-radius:10px; font-weight:bold; margin-bottom:15px; border:1px dashed rgba(255,59,48,0.2)">⚠️ تنبيه: لا يمكن التراجع عن هذا الخيار بعد التأكيد.</p>
                
                <div style="background:#f8fafc; padding:12px; border-radius:14px; margin-bottom:15px; border:1px solid #e2e8f0;">
                    <span style="font-size:12px; color:#64748b; display:block;">المبلغ الإجمالي المطلوب خصمه:</span>
                    <b style="font-size:22px; color:#1e293b;">${this.currentTotalCartPrice.toFixed(2)} ɱ</b>
                </div>

                <div style="text-align:right; margin-bottom:15px;">
                    <label style="font-size:12px; font-weight:bold; color:#475569; display:block; margin-bottom:5px;">تأكيد كلمة المرور لـ MyCoin:</label>
                    <input type="password" id="mycoin-secure-pass" placeholder="اتركه فارغاً أو اكتب كلمة المرور" style="width:100%; padding:12px; border-radius:10px; border:1px solid #cbd5e1; font-size:15px; outline:none; box-sizing:border-box; text-align:center;">
                </div>

                <div style="display:flex; gap:10px;">
                    <button onclick="LocalCartModule.processBankPayment()" style="flex:1; padding:12px; background:#2ecc71; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; font-size:13px;">✅ تأكيد ودفع الآن</button>
                    <button onclick="LocalCartModule.closeSecurePayModal()" style="padding:12px 18px; background:#94a3b8; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; font-size:13px;">إلغاء</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
        document.getElementById('mycoin-secure-pass').focus();
    },

    closeSecurePayModal: function() {
        const modal = document.getElementById('mycoin-secure-pay-modal');
        if (modal) modal.style.display = 'none';
    },

    // ⚡ معالجة الدفع والخصم والإرسال المتزامن إلى قاعدة البيانات الأساسية لـ MyCoin
    // ⚡ معالجة الدفع والخصم والإرسال المتزامن إلى قاعدة البيانات الأساسية لـ MyCoin
    // ⚡ معالجة الدفع والخصم والإرسال المتزامن إلى قاعدة البيانات الأساسية لـ MyCoin
    processBankPayment: async function() {
        const passInput = document.getElementById('mycoin-secure-pass');
        
        if (!passInput) {
            alert("❌ خطأ داخلي: لم يتم العثور على حقل الإدخال في الواجهة!");
            return;
        }

        const buyerId = localStorage.getItem('market_user_id');
        if (!buyerId || buyerId === "null" || buyerId === "undefined") {
            alert("🛑 خطأ أمني: لم يتم العثور على حساب المشتري محلياً! يرجى إعادة تسجيل الدخول أولاً.");
            return;
        }

        const bankDatabase = window.db || (window.firebase && window.firebase.database());
        
        if (!bankDatabase || typeof bankDatabase.ref !== 'function') {
            alert("⏳ نظام قاعدة بيانات البنك غير متصل حالياً.. يرجى التحقق من الاتصال!");
            return;
        }
        
        const plainPassword = passInput.value ? passInput.value : "";
        const encodedPass = plainPassword === "" ? "" : btoa(plainPassword); 
        
        const requiredAmount = this.currentTotalCartPrice;

        try {
            // 1. جلب حساب المشتري من البنك والتحقق من كلمة المرور والرصيد
            const userSnap = await bankDatabase.ref(`users/${buyerId}`).once('value');
            
            if (!userSnap.exists()) {
                alert(`❌ خطأ: الحساب (${buyerId}) غير مسجل في قاعدة بيانات بنك MyCoin!`);
                return;
            }

            const userData = userSnap.val();
            const currentPass = userData.pass || "";

            if (encodedPass !== currentPass) {
                alert("❌ كلمة المرور غير صحيحة! فشلت عملية الدفع.");
                return;
            }

            const currentBalance = parseFloat(userData.balance || 0);
            if (buyerId !== 'user0' && currentBalance < requiredAmount) {
                alert(`❌ رصيدك الحالي (${currentBalance} ɱ) لا يكفي لإتمام العملية! مطلوب: ${requiredAmount.toFixed(2)} ɱ`);
                return;
            }

            // 2. التحقق المسبق من كميات المخازن لجميع المنتجات قبل الخصم المالي للـأمان
            let cart = JSON.parse(localStorage.getItem('user_market_cart')) || {};
            let keys = Object.keys(cart);
            
            // هيكل لتجميع المنتجات حسب كل تاجر لتنفيذ طلب مجمع لاحقاً
            let bundledOrdersBySeller = {}; 

            for (let id of keys) {
                const item = cart[id];
                const prdSnap = await window.storeDb.ref(`sellers_lists/${item.sellerId}/list-prd/${id}`).once('value');
                
                if (!prdSnap.exists()) {
                    alert(`❌ فشل الطلب: المنتج (${item.name}) لم يعد متوفراً في المتجر الحقيقي للتاجر!`);
                    return;
                }

                const prdData = prdSnap.val();
                const currentStock = parseInt(prdData.qty || 0);

                // التأكد من أن الكمية المطلوبة ليست أكبر من المتاح في المخزن
                if (item.qty_ordered > currentStock) {
                    alert(`⚠️ كمية غير كافية! المنتج (${prdData.name}) متاح منه ${currentStock} قطع فقط في المخزن، وأنت طلبت ${item.qty_ordered}. يرجى تعديل السلة.`);
                    return;
                }

                // حساب الأسعار والتخفيضات المزدوجة بدقة
                const ptaSnap = await window.storeDb.ref(`sellers_lists/${item.sellerId}/seller_info/pta`).once('value');
                const originalPrice = parseFloat(prdData.price || 0);
                const localDiscount = parseFloat(prdData.p_discount || 0);
                const globalPta = ptaSnap.exists() ? parseFloat(ptaSnap.val() || 0) : 0;

                const priceAfterGlobal = originalPrice * (1 - (globalPta / 100));
                const finalPrice = parseFloat((priceAfterGlobal * (1 - (localDiscount / 100))).toFixed(2));
                const totalItemCost = finalPrice * item.qty_ordered;

                // بناء كائن التجميع الذكي للمتاجر
                if (!bundledOrdersBySeller[item.sellerId]) {
                    bundledOrdersBySeller[item.sellerId] = {
                        itemsList: {},
                        totalSellerEarnings: 0,
                        itemIndex: 0,
                        telegramTextSummary: ""
                    };
                }

                // إضافة تفاصيل المنتج داخل حزمة المتجر المعني
                bundledOrdersBySeller[item.sellerId].itemsList[`item_${bundledOrdersBySeller[item.sellerId].itemIndex}`] = {
                    prdId: item.id,
                    prdName: prdData.name,
                    qty_ordered: item.qty_ordered,
                    finalPaidPrice: finalPrice,
                    totalCost: totalItemCost
                };
                
                bundledOrdersBySeller[item.sellerId].totalSellerEarnings += totalItemCost;
                bundledOrdersBySeller[item.sellerId].telegramTextSummary += `• *${prdData.name}* (${item.qty_ordered} قطع) بـ ${totalItemCost.toFixed(2)} ɱ\n`;
                bundledOrdersBySeller[item.sellerId].itemIndex++;
            }

            // إغلاق نافذة التأكيد وبدء المعالجة الحية على السيرفرات
            this.closeSecurePayModal();
            const container = document.getElementById('user-store-dynamic-content');
            if (container) {
                container.innerHTML = `<p style="text-align:center; color:#888; font-size:14px; padding:30px;">⚡ جاري الخصم المالي وتحديث المخازن وتوزيع طلبات المتاجر المجمعة...</p>`;
            }

            const invoiceId = 'invoice_' + Date.now();
            let bankUpdates = {}; // تحديثات بنك MyCoin الحية لقواعد البيانات
            let promises = [];

            // خصم الرصيد الكلي من المشتري
            if (buyerId !== 'user0') {
                bankUpdates[`users/${buyerId}/balance`] = currentBalance - requiredAmount;
            }

            // 3. معالجة الحزم المجمعة لكل متجر على حدة
            for (let sellerId in bundledOrdersBySeller) {
                const bundle = bundledOrdersBySeller[sellerId];

                // أ) جلب رصيد التاجر الحالي لإضافة أرباح الحزمة بالكامل إليه دفعة واحدة
                const sellerBankSnap = await bankDatabase.ref(`users/${sellerId}`).once('value');
                let sellerCurrentBalance = 0;
                if (sellerBankSnap.exists()) {
                    sellerCurrentBalance = parseFloat(sellerBankSnap.val().balance || 0);
                }

                if (sellerId !== 'user0') {
                    bankUpdates[`users/${sellerId}/balance`] = (bankUpdates[`users/${sellerId}/balance`] || sellerCurrentBalance) + bundle.totalSellerEarnings;
                }

                // ب) إنقاص الكمية الكلية لكل منتج داخل الحزمة من مخزن المتجر الأصلي
                for (let key in bundle.itemsList) {
                    const orderedItem = bundle.itemsList[key];
                    
                    // استخدام دالة المعاملات التبادلية السيالة (Transaction) لإنقاص المخزن بشكل آمن تماماً ضد التزامن
                    let stockRef = window.storeDb.ref(`sellers_lists/${sellerId}/list-prd/${orderedItem.prdId}/qty`);
                    let stockPromise = stockRef.transaction((currentQty) => {
                        let q = parseInt(currentQty || 0);
                        return q >= orderedItem.qty_ordered ? q - orderedItem.qty_ordered : 0;
                    });
                    promises.push(stockPromise);
                }

                // جـ) بناء الطلب الحزمي المجمع وإرساله إلى comd_box الخاص بالتاجر في المتجر
                const bundledInvoiceData = {
                    buyerId: buyerId,
                    timestamp: Date.now(),
                    totalOrderCost: bundle.totalSellerEarnings,
                    status: "pending", // حالة مجمعة للحزمة
                    items: bundle.itemsList // تضم جميع المنتجات التي تم طلبها من هذا المتجر المعين
                };

                let orderPromise = window.storeDb.ref(`sellers_lists/${sellerId}/seller_info/comd_box/${invoiceId}`).set(bundledInvoiceData);
                promises.push(orderPromise);

                // د) إرسال إشعار تلغرام ذكي ومجمع للتاجر يحتوي على الفاتورة الحزمية كاملة
                if (sellerBankSnap.exists() && sellerBankSnap.val().chatId) {
                    const sellerData = sellerBankSnap.val();
                    const botToken = "8752761556:AAEVdlQafOqMoZwFAcAk_Cv8VMhg6-75aGc";
                    
                    const msg = `🛒 *إشعار مبيعات مجمع جديد*\n\n` +
                                `قام العميل \`${buyerId}\` بشراء حزمة منتجات من متجرك:\n` +
                                `${bundle.telegramTextSummary}\n` +
                                `💰 *إجمالي الأرباح المضافة للمحفظة:* ${bundle.totalSellerEarnings.toFixed(2)} ɱ\n` +
                                `🆔 *رقم الطلب الموحد:* \`${invoiceId}\``;

                    fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${sellerData.chatId}&text=${encodeURIComponent(msg)}&parse_mode=Markdown`).catch(e=>console.log(e));
                }
            }

            // تطبيق التحديثات المالية الجماعية على سيرفر البنك بدقة تزامنية مطلقة
            await bankDatabase.ref().update(bankUpdates);

            // انتظار اكتمال عمليات تحديث المخازن وإدراج الطلبات المجمعة بالكامل
            await Promise.all(promises);

            alert("🎉 نجاح العملية! خُصم الرصيد، حُدثت مخازن المنتجات، وتم تجميع وإرسال الفواتير حزمياً للمتاجر بنجاح!");
            localStorage.removeItem('user_market_cart');
            this.render();

        } catch (error) {
            console.error("🛑 خطأ أثناء معالجة عملية الدفع المجمعة التزامنية:", error);
            alert("حدث خطأ مالي أو أمني غير متوقع أثناء الاتصال بالسيرفر، يرجى المحاولة لاحقاً.");
            this.render();
        }
    },


    renderNotificationsHTML: function() {
        if (this.notifications.length === 0) return "";
        let html = `<div style="margin-top:20px; display:flex; flex-direction:column; gap:8px;">`;
        this.notifications.forEach(n => {
            html += `
                <div id="${n.id}" style="background:rgba(255,59,48,0.08); border:1px solid rgba(255,59,48,0.15); padding:10px 14px; border-radius:12px; display:flex; align-items:center; justify-content:between; gap:10px; text-align:right;">
                    <span style="color:#ff3b30; font-size:11.5px; flex:1; line-height:1.4;">${n.msg}</span>
                    <button onclick="LocalCartModule.removeNote('${n.id}')" style="background:none; border:none; color:#ff3b30; cursor:pointer; font-size:14px; font-weight:bold; padding:0 4px;">✕</button>
                </div>
            `;
        });
        html += `</div>`;
        return html;
    },

    removeNote: function(noteId) {
        this.notifications = this.notifications.filter(n => n.id !== noteId);
        const element = document.getElementById(noteId);
        if (element) element.remove();
    }
};