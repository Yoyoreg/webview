// cmd_l.js
window.OrderModalModule = {
    currentProduct: {},

    show: function(id, name, price, maxQty, sellerId) {
        this.currentProduct = { id, name, price, maxQty, sellerId };

        const oldModal = document.getElementById('global-order-modal');
        if (oldModal) oldModal.remove();

        const modal = document.createElement('div');
        modal.id = 'global-order-modal';
        modal.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.4); display: flex; align-items: center;
            justify-content: center; z-index: 9999;
        `;
        modal.setAttribute('dir', 'rtl');

        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 20px; width: 90%; max-width: 340px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); text-align: right; font-family: sans-serif;">
                <b style="font-size: 16px; color: #333; display: block; margin-bottom: 5px;">🛒 إضافة إلى السلة</b>
                <span style="font-size: 13px; color: #666; display: block; margin-bottom: 15px;">${name}</span>

                <div style="background: #fafafa; padding: 12px; border-radius: 12px; margin-bottom: 15px; font-size: 12px; border: 1px solid rgba(0,0,0,0.02);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="color:#777;">السعر الحالي:</span>
                        <strong style="color:var(--accent, #007aff);">${price} ɱ</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="color:#777;">المخزون المتاح:</span>
                        <strong style="color:#4cd964;">${maxQty} قطعة</strong>
                    </div>
                    <hr style="border:0; border-top:1px dashed #eee; margin:8px 0;">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:#333; font-weight:bold;">المجموع:</span>
                        <strong id="modal-total-price" style="color:#2ecc71; font-size:14px;">${price} ɱ</strong>
                    </div>
                </div>

                <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 20px;">
                    <button onclick="OrderModalModule.changeQty(-1)" style="width: 36px; height: 36px; border: none; background: #eee; color: #555; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer;">-</button>
                    <input type="number" id="modal-qty-input" value="1" min="1" max="${maxQty}" oninput="OrderModalModule.validateAndCalculate()" style="width: 60px; text-align: center; font-size: 16px; font-weight: 900; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 5px; outline:none;">
                    <button onclick="OrderModalModule.changeQty(1)" style="width: 36px; height: 36px; border: none; background: rgba(0,122,255,0.1); color: var(--accent); border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer;">+</button>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button onclick="OrderModalModule.addToCart()" style="flex: 2; background: var(--accent, #007aff); color: white; border: none; padding: 10px; border-radius: 12px; font-weight: 900; font-size: 13px; cursor: pointer;">أضف للسلة 📥</button>
                    <button onclick="OrderModalModule.close()" style="flex: 1; background: #f1f1f1; color: #666; border: none; padding: 10px; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer;">إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    changeQty: function(val) {
        const input = document.getElementById('modal-qty-input');
        if (!input) return;
        let currentVal = parseInt(input.value) || 1;
        currentVal += val;
        if (currentVal < 1) currentVal = 1;
        if (currentVal > this.currentProduct.maxQty) currentVal = this.currentProduct.maxQty;
        input.value = currentVal;
        this.validateAndCalculate();
    },

    validateAndCalculate: function() {
        const input = document.getElementById('modal-qty-input');
        const totalLabel = document.getElementById('modal-total-price');
        if (!input || !totalLabel) return;
        let val = parseInt(input.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > this.currentProduct.maxQty) { val = this.currentProduct.maxQty; input.value = val; }
        totalLabel.innerText = (val * this.currentProduct.price).toFixed(2) + " ɱ";
    },

    // 🔒 التخزين الذكي والمبسط جداً
    addToCart: function() {
        const input = document.getElementById('modal-qty-input');
        const qty = parseInt(input.value) || 1;
        
        let cart = JSON.parse(localStorage.getItem('user_market_cart')) || {};

        // حفظ المعرفات الأساسية فقط دون تخزين الاسم أو السعر أو الصورة
        cart[this.currentProduct.id] = {
            id: this.currentProduct.id,
            sellerId: this.currentProduct.sellerId,
            qty_ordered: qty
        };

        localStorage.setItem('user_market_cart', JSON.stringify(cart));
        alert("🛍️ تم إضافة المنتج إلى سلة المشتريات المحلية!");
        this.close();
    },

    close: function() {
        const modal = document.getElementById('global-order-modal');
        if (modal) modal.remove();
    }
};