// seller_bord.js
window.ControlsModule = {
    init: function() {
        const container = document.getElementById('merchant-dynamic-content');
        if (!container) return;

        // بناء الهيكل الرئيسي للوحة التحكم
        container.innerHTML = `
            <div style="font-family: sans-serif; text-align: right;" dir="rtl">
                
                <div style="background: var(--card, white); padding: 20px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 20px; border: 1px solid rgba(0,0,0,0.05);">
                    <b style="color: var(--text-main, #333); font-size: 15px; display: block; margin-bottom: 10px;">📉 نسبة التخفيض العالمية </b>
                    <p style="font-size: 12px; color: #777; margin: 0 0 15px 0;">تطبيق نسبة تخفيض مئوية على جميع المنتجات المعروضة في متجرك.</p>
                    
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <input type="range" id="pta-slider" min="0" max="100" value="0" oninput="ControlsModule.updatePtaLabel(this.value)" onchange="ControlsModule.savePta(this.value)" style="flex: 1; accent-color: var(--accent, #007aff); cursor: pointer;">
                        <span id="pta-label" style="font-weight: 900; font-size: 18px; color: var(--accent, #007aff); min-width: 50px; text-align: center;">0%</span>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <b style="color: var(--text-main, #333); font-size: 15px;">📥 فواتير الشراء الواردة (سلال طلبات الزبائن) </b>
                </div>
                
                <div id="orders-render-area" style="display: flex; flex-direction: column; gap: 20px;">
                    <p style="text-align: center; color: #999; padding: 20px;">⏳ جاري جلب الفواتير والطلبات...</p>
                </div>

            </div>
        `;

        this.loadSellerData();
    },

    // تحديث النسبة على الشاشة أثناء سحب الشريط
    updatePtaLabel: function(val) {
        document.getElementById('pta-label').innerText = val + "%";
    },

    // حفظ نسبة التخفيض في قاعدة البيانات عند الإفلات
    savePta: function(val) {
        const uid = localStorage.getItem('market_user_id') || 'user0';
        window.storeDb.ref(`sellers_lists/${uid}/seller_info`).update({
            pta: parseInt(val)
        }).then(() => {
            console.log("تم تحديث نسبة التخفيض العالمية إلى: " + val + "%");
        });
    },

    // جلب البيانات الكلية للبائع مع حقن البيانات الابتدائية إن لم توجد
    loadSellerData: function() {
        const uid = localStorage.getItem('market_user_id') || 'user0';
        
        window.storeDb.ref(`sellers_lists/${uid}`).on('value', (snapshot) => {
            const ordersArea = document.getElementById('orders-render-area');
            if (!ordersArea) return;

            // في حال كان الحساب جديداً كلياً
            if (!snapshot.exists()) {
                ordersArea.innerHTML = `<p style="text-align:center; color:#999;">جاري إنشاء وتهيئة مساحة البيع الخاصة بك...</p>`;
                window.storeDb.ref(`sellers_lists/${uid}`).set({
                    "list-prd": {},
                    "seller_info": {
                        "pta": 0,
                        "comd_box": {}
                    }
                });
                return;
            }

            const fullData = snapshot.val();
            const products = fullData['list-prd'] || {};
            
            // الفحص وحقن البيانات الافتراضية إذا كانت غائبة
            if (!fullData.seller_info) {
                console.log("⚠️ لم يتم العثور على seller_info، جاري حقن البيانات الافتراضية...");
                window.storeDb.ref(`sellers_lists/${uid}/seller_info`).set({
                    "pta": 0,
                    "comd_box": {}
                });
                return;
            }

            const sellerInfo = fullData.seller_info || {};
            const globalPta = sellerInfo.pta || 0; // التخفيض العام للمتجر
            const invoices = sellerInfo.comd_box || {};

            // 1. تحديث قيمة شريط التخفيض على الشاشة بشكل آمن
            const slider = document.getElementById('pta-slider');
            const label = document.getElementById('pta-label');
            if (slider && label && document.activeElement !== slider) {
                slider.value = globalPta;
                label.innerText = globalPta + "%";
            }

            // 2. معالجة وعرض فواتير الزبائن الواردة
            ordersArea.innerHTML = "";
            let hasInvoices = false;
            
            for (let invoiceId in invoices) {
                if (invoices.hasOwnProperty(invoiceId)) {
                    hasInvoices = true;
                    const invoiceData = invoices[invoiceId];
                    
                    ordersArea.innerHTML += this.createInvoiceCard(invoiceId, invoiceData, products, globalPta);
                }
            }

            if (!hasInvoices) {
                ordersArea.innerHTML = `
                    <div style="text-align:center; padding:30px; color:#999; border:1px dashed rgba(0,0,0,0.08); border-radius:20px; background: white;">
                        📭 صندوق الفواتير فارغ حالياً.
                    </div>`;
            }
        });
    },

    // بناء كرت الفاتورة الكاملة (متعددة السلع)
    createInvoiceCard: function(invoiceId, invoice, allProducts, globalPta) {
        const buyerId = invoice.buyerId || "زبون مجهول";
        const items = invoice.items || {};
        
        let itemsHtml = "";
        let originalCartTotal = 0; // إجمالي السعر الأصلي قبل التخفيض العام
        let finalCartTotal = 0;    // إجمالي السعر النهائي الكلي للسلع بعد دمج التخفيضات العامة والخاصة

        // الدوران حول السلع الموجودة داخل الفاتورة الواحدة
        for (let itemId in items) {
            if (items.hasOwnProperty(itemId)) {
                const item = items[itemId];
                const product = allProducts[item.prdId];
                const qtyOrdered = parseInt(item.qty_ordered || 1);

                if (!product) {
                    // ستايل لعرض سلعة تم حذفها من المخزن بينما هي داخل الفاتورة
                    itemsHtml += `
                        <div style="padding: 8px; border-bottom: 1px dashed #ff3b30; color: #ff3b30; font-size: 12px;">
                            ⚠️ سلعة بمعرف (${item.prdId}) لم تعد متوفرة في مخزنك الحالي.
                        </div>`;
                    continue;
                }

                const img = product.img || "d.svg";
                const pPrice = parseFloat(product.price || 0);
                const localDiscount = parseInt(product.p_discount || 0); // التخفيض الخاص

                // الحسبة للسلعة الفردية
                const hasLocalDiscount = localDiscount > 0;
                const priceAfterLocal = hasLocalDiscount ? pPrice * (1 - (localDiscount / 100)) : pPrice;
                
                // حسابات التراكمي الكلي للفاتورة
                originalCartTotal += (pPrice * qtyOrdered);
                // السعر النهائي الفعلي للقطعة يمر بالتخفيضين (الخاص أولاً ثم العام)
                const itemFinalPrice = priceAfterLocal * (1 - (globalPta / 100));
                finalCartTotal += (itemFinalPrice * qtyOrdered);

                // بناء صف السلعة البصري
                itemsHtml += `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.03);">
                        <img src="${img}" onerror="this.src='d.svg'" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; background: #fafafa;">
                        
                        <div style="flex: 1; text-align: right;">
                            <div style="font-weight: 700; color: #333; font-size: 13px;">${product.name}</div>
                            <div style="font-size: 11px;">
                                ${hasLocalDiscount ? `
                                    <span style="text-decoration: line-through; color: #999; margin-left: 5px;">${pPrice} ɱ</span>
                                    <span style="color: #ff3b30; font-weight: bold;">(${localDiscount}% خصم خاص) ➔ </span>
                                    <span style="color: #333; font-weight: bold;">${priceAfterLocal.toFixed(2)} ɱ</span>
                                ` : `
                                    <span style="color: #666;">السعر الفردي: ${pPrice} ɱ</span>
                                `}
                            </div>
                        </div>

                        <div style="background: rgba(0, 122, 255, 0.06); color: var(--accent, #007aff); padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 13px; border: 1px solid rgba(0, 122, 255, 0.08);">
                            ${qtyOrdered}x
                        </div>
                    </div>
                `;
            }
        }

        // تحديد ما إذا كان السعر الكلي الإجمالي اختلف بسبب وجود تخفيض (عام أو خاص)
        const totalHasChanged = Math.abs(originalCartTotal - finalCartTotal) > 0.01;
        const totalSectionHtml = totalHasChanged ? `
            <div style="font-size: 12px; color: #777; margin-bottom: 2px;">
                الإجمالي الأصلي قبل التخفيضات: <span style="text-decoration: line-through; color: #ff3b30; font-weight: 700;">${originalCartTotal.toFixed(2)} ɱ</span>
            </div>
            <div style="font-size: 15px; color: #2ecc71; font-weight: 900;">
                💰 صافي الفاتورة الكلي: ${finalCartTotal.toFixed(2)} ɱ
            </div>
        ` : `
            <div style="font-size: 15px; color: var(--accent, #007aff); font-weight: 900;">
                💰 إجمالي الفاتورة: ${finalCartTotal.toFixed(2)} ɱ
            </div>
        `;

        // إرجاع كرت الفاتورة الكاملة مدمج بها قائمة السلع والتحكم بها
        return `
            <div style="background: white; border-radius: 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 15px rgba(0,0,0,0.03); overflow: hidden;">
                <div style="background: #f8fafc; padding: 12px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 11px; color: #888; display: block;">صاحب الفاتورة (المشتري)</span>
                        <strong style="color: #1e293b; font-size: 13px; font-family: monospace;">${buyerId}</strong>
                    </div>
                    <span style="font-size: 10px; color: #aaa; background: #e2e8f0; padding: 2px 6px; border-radius: 6px;">${invoiceId}</span>
                </div>

                <div style="padding: 5px 15px;">
                    ${itemsHtml}
                </div>

                <div style="padding: 15px; background: #fafafa; border-top: 1px solid rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 12px;">
                    <div style="text-align: right;">
                        ${totalSectionHtml}
                    </div>
                    
                    <button onclick="ControlsModule.removeOrder('${invoiceId}')" style="width: 100%; background: #2ecc71; color: white; border: none; padding: 10px; border-radius: 12px; font-weight: 900; font-size: 13px; cursor: pointer; box-shadow: 0 2px 6px rgba(46,204,113,0.2); transition: background 0.2s;">
                        ✓ تم تلبية الطلب وشحن الفاتورة
                    </button>
                </div>
            </div>
        `;
    },

    // دالة حذف الفاتورة الكاملة عند الضغط على زر تلبية الطلب
    removeOrder: function(invoiceId) {
        if (confirm("هل تؤكد تلبية وشحن هذه الفاتورة بالكامل وحذفها من لوحة التحكم؟")) {
            const uid = localStorage.getItem('market_user_id') || 'user0';
            window.storeDb.ref(`sellers_lists/${uid}/seller_info/comd_box/${invoiceId}`).remove()
                .then(() => {
                    console.log(`تم إنهاء وتلبية الفاتورة ${invoiceId} بنجاح.`);
                });
        }
    }
};