// user_shop.js
window.UserShopModule = {
    // مصفوفة مؤقتة في الذاكرة لتخزين المنتجات الأصلية القادمة من السيرفر لتسهيل الفلترة السريعة
    allProductsCache: [],

    init: function() {
        const container = document.getElementById('user-store-dynamic-content');
        if (!container) return;

        // بناء واجهة الفلترة والبحث المتقدم في الأعلى وأسفلها مساحة العرض
        container.innerHTML = `
            <div style="font-family: sans-serif; text-align: right;" dir="rtl">
                
                <div style="background: var(--card, white); padding: 15px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); margin-bottom: 20px; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 10px;">
                    
                    <div style="position: relative; flex: 1;">
                        <input type="text" id="shop-search-input" oninput="UserShopModule.applyFilters()" placeholder="🔍 ابحث عن اسم المنتج بدقة..." style="width: 100%; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; font-size: 13px; outline: none; box-sizing: border-box; background: #fafafa;">
                    </div>

                    <div style="display: flex; gap: 10px; align-items: center; width: 100%;">
                        <div style="flex: 1;">
                            <input type="number" id="shop-price-max" oninput="UserShopModule.applyFilters()" placeholder="💰 السعر الأقصى (ɱ)..." style="width: 100%; padding: 10px; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; font-size: 13px; outline: none; box-sizing: border-box; background: #fafafa;">
                        </div>

                        <div style="flex: 1;">
                            <select id="shop-seller-filter" onchange="UserShopModule.applyFilters()" style="width: 100%; padding: 10px; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; font-size: 13px; outline: none; box-sizing: border-box; background: #fafafa; cursor: pointer; color: #555;">
                                <option value="all">👥 كل البائعين</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <b style="color: var(--text-main, #333); font-size: 15px;">🛒 المعروضات المتاحة في السوق</b>
                    <span id="results-count" style="font-size: 12px; color: #888; font-weight: 700;">منج: 0</span>
                </div>
                
                <div id="shop-products-area" style="display: flex; flex-direction: column; gap: 12px;">
                    <p style="text-align: center; color: #999; padding: 20px; font-size: 13px;">⏳ جاري جلب السلع المعروضة من السيرفر...</p>
                </div>

            </div>
            
        `;
        
        this.loadShopProducts();
    },

    loadShopProducts: function() {
        // الاتصال المباشر بجذر قائمة البائعين بالكامل لسحب المعروضات
        window.storeDb.ref('sellers_lists').on('value', (snapshot) => {
            const productsArea = document.getElementById('shop-products-area');
            const sellerFilter = document.getElementById('shop-seller-filter');
            if (!productsArea) return;

            if (!snapshot.exists()) {
                productsArea.innerHTML = `<p style="text-align:center; color:#999; padding:20px;">السوق فارغ حالياً، لا توجد منتجات معروضة.</p>`;
                return;
            }

            const sellersData = snapshot.val();
            this.allProductsCache = []; // تصفير الكاش المحلي قبل الحقن الجديد
            
            // حفظ التاجر المختار حالياً لمنع تصفير القائمة المنسدلة عند التحديث الحي لقاعدة البيانات
            const selectedSellerBefore = sellerFilter ? sellerFilter.value : "all";
            
            // تهيئة محتوى القائمة المنسدلة للبائعين
            let sellersOptionsHtml = `<option value="all">👥 كل البائعين</option>`;
            const uniqueSellers = new Set();

            // 1. الدوران لتجميع البيانات من كل البائعين وحساب الأسعار
            for (let sellerId in sellersData) {
                if (sellersData.hasOwnProperty(sellerId)) {
                    const sellerNode = sellersData[sellerId];
                    const products = sellerNode['list-prd'] || {};
                    const sellerInfo = sellerNode['seller_info'] || {};
                    const globalPta = sellerInfo.pta || 0; // نسبة التخفيض العالمية للتاجر

                    for (let prdId in products) {
                        if (products.hasOwnProperty(prdId)) {
                            const prd = products[prdId];
                            const localDiscount = prd.p_discount || 0; // الخصم الخاص بالسلعة
                            
                            // معادلة حساب السعر النهائي التراكمي
                            const originalPrice = parseFloat(prd.price || 0);
                            const priceAfterGlobal = originalPrice * (1 - (globalPta / 100));
                            const finalPrice = priceAfterGlobal * (1 - (localDiscount / 100));

                            // حفظ المنتج المهيأ ببياناته الكلية والنهائية في الكاش
                            this.allProductsCache.push({
                                id: prdId,
                                sellerId: sellerId,
                                name: prd.name || "منتج بدون اسم",
                                img: prd.img || "d.svg",
                                qty: parseInt(prd.qty || 0),
                                originalPrice: originalPrice,
                                finalPrice: parseFloat(finalPrice.toFixed(2)),
                                localDiscount: localDiscount,
                                globalPta: globalPta
                            });

                            uniqueSellers.add(sellerId);
                        }
                    }
                }
            }

            // 2. تحديث قائمة البائعين المتاحة في الفلتر المنسدل
            if (sellerFilter) {
                uniqueSellers.forEach(sId => {
                    sellersOptionsHtml += `<option value="${sId}">👤 تاجر: ${sId}</option>`;
                });
                sellerFilter.innerHTML = sellersOptionsHtml;
                sellerFilter.value = selectedSellerBefore; // إرجاع القيمة المختارة سابقاً
            }

            // تشغيل الفلترة والعرض المعتمد على مدخلات البحث الحالية
            this.applyFilters();
        });
    },

    // دالة الفلترة الفورية والمتقدمة (تدمج الاسم، السعر الأقصى، وهوية البائع)
    applyFilters: function() {
        const searchInput = document.getElementById('shop-search-input');
        const priceMaxInput = document.getElementById('shop-price-max');
        const sellerFilter = document.getElementById('shop-seller-filter');
        const productsArea = document.getElementById('shop-products-area');
        const countLabel = document.getElementById('results-count');

        if (!productsArea) return;

        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const maxPrice = priceMaxInput && priceMaxInput.value ? parseFloat(priceMaxInput.value) : Infinity;
        const targetSeller = sellerFilter ? sellerFilter.value : "all";

        // عملية تصفية الكاش بناءً على المدخلات الحالية
        const filtered = this.allProductsCache.filter(item => {
            const matchName = item.name.toLowerCase().includes(query);
            const matchPrice = item.finalPrice <= maxPrice;
            const matchSeller = (targetSeller === "all" || item.sellerId === targetSeller);
            return matchName && matchPrice && matchSeller;
        });

        // تحديث عدد النتائج الظاهرة
        if (countLabel) countLabel.innerText = `المنتجات المتاحة: ${filtered.length}`;

        if (filtered.length === 0) {
            productsArea.innerHTML = `
                <div style="text-align:center; padding:30px; color:#aaa; border:1px dashed rgba(0,0,0,0.06); border-radius:20px; background:white; font-size:13px;">
                    ❌ لا توجد منتجات تطابق معايير البحث والفلترة المحددة.
                </div>`;
            return;
        }

        // 3. رندر المنتجات المفلترة وبناء كروت الزبون
        let html = "";
        filtered.forEach(item => {
            const isOutOfStock = item.qty <= 0;
            
            // تطبيق تغميق وإعتام الكرت كاملاً (Opacity + Grayscale) إذا كانت الكمية صفر
            const cardOpacity = isOutOfStock ? "opacity: 0.55; filter: grayscale(70%); pointer-events: none;" : "";
            const hasAnyDiscount = (item.globalPta > 0 || item.localDiscount > 0);
            
            // ستايل السعر المعتمد على وجود خط الشطب التخفيضي
            const originalPriceStyle = hasAnyDiscount 
                ? "text-decoration: line-through; color: #aaa; font-size: 11px;" 
                : "text-decoration: none; color: var(--accent, #007aff); font-weight: 900; font-size: 13px;";

            html += `
                <div style="background: var(--card, white); padding: 12px; border-radius: 18px; display: flex; align-items: center; gap: 12px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: all 0.3s; ${cardOpacity}">
                    
                    <img src="${item.img}" onerror="this.src='d.svg'" style="width: 58px; height: 58px; border-radius: 12px; object-fit: cover; background: #fafafa;">
                    
                    <div style="flex: 1; text-align: right;">
                        <div style="font-weight: 900; color: var(--text-main, #333); font-size: 14px; margin-bottom: 2px;">${item.name}</div>
                        
                        <div style="font-size: 12px; margin-bottom: 2px;">
                            <span style="${originalPriceStyle}">${item.originalPrice} ɱ</span>
                            ${hasAnyDiscount ? `<span style="color: #2ecc71; font-weight: 900; margin-right: 5px;">🏷️ النهائي: ${item.finalPrice} ɱ</span>` : ''}
                        </div>

                        <div style="font-size: 11px; color: #777;">
                            التاجر: <span style="font-family: monospace; color: #555; font-weight: 700;">${item.sellerId}</span> | 
                            المنطاد: ${isOutOfStock ? `<b style="color:#ff3b30;">❌ نفذت الكمية</b>` : `<b style="color:#4cd964;">المتوفر: ${item.qty}</b>`}
                        </div>
                    </div>

    
                <div id="action-area-${item.id}" style="display: flex; align-items: center;">
                    ${isOutOfStock ? `
                    <button disabled style="background: #e5e5ea; color: #aeaeae; border: none; padding: 8px 12px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: not-allowed;">غير متاح</button>
                    ` : `
                    <button onclick="UserShopModule.openOrderModal('${item.id}', '${item.name}', ${item.finalPrice}, ${item.qty}, '${item.sellerId}')" style="background: var(--accent, #007aff); color: white; border: none; padding: 8px 14px; border-radius: 10px; font-weight: 900; font-size: 12px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,122,255,0.15);">طلب</button>
                    `}
                </div>

                </div>
            `;
        });

        productsArea.innerHTML = html;
    },
    // دالة استدعاء ملف لوحة الطلب الخارجي cmd_l.js دون تشويش
    openOrderModal: function(id, name, price, maxQty, sellerId) {
        const scriptId = 'script-order-modal';
        const runOrder = () => {
            if (window.OrderModalModule) {
                window.OrderModalModule.show(id, name, price, maxQty, sellerId);
            }
        };

        // إذا كان الملف محملاً مسبقاً نشغله فوراً، وإلا نحقنه في الصفحة
        if (document.getElementById(scriptId)) {
            runOrder();
        } else {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'cmd_l.js';
            script.onload = runOrder;
            document.body.appendChild(script);
        }
    }
};