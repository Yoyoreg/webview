// user_store.js
window.UserStoreComponent = {
    storeConfig: {
        apiKey: "AIzaSyC0Hf2Xy6YICYFgMGx6QUWsZWlroFX0OYc",
        databaseURL: "https://mmarket-cb517-default-rtdb.firebaseio.com",
        projectId: "mmarket-cb517"
    },

    render: () => `
        <div class="user-store-wrapper" style="width: 100%; box-sizing: border-box;" dir="rtl">
            <header class="store-nav-header" style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.08);">
                <div style="display: flex; width: 100%; background: #f1f1f1; padding: 4px; border-radius: 14px; box-sizing: border-box; gap: 4px;">
                    <button onclick="UserStoreComponent.switchSection('shop')" class="u-btn active" id="u-btn-shop" style="flex: 1; padding: 10px; border: none; border-radius: 10px; cursor: pointer; font-weight: 900; font-size: 12px; transition: all 0.2s ease; background: var(--accent, #007aff); color: white;">🛒 المتجر</button>
                    <button onclick="UserStoreComponent.switchSection('auction')" class="u-btn" id="u-btn-auction" style="flex: 1; padding: 10px; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; transition: all 0.2s ease; background: transparent; color: #666;">🔨 المزاد</button>
                    <button onclick="UserStoreComponent.switchSection('cart')" class="u-btn" id="u-btn-cart" style="flex: 1; padding: 10px; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; transition: all 0.2s ease; background: transparent; color: #666;">🛍️ السلة</button>
                </div>
            </header>
            
            <div id="user-store-dynamic-content" style="padding: 15px; width: 100%; box-sizing: border-box;">
                <p style="text-align:center; color:#888; font-size: 13px;">⏳ جاري التجهيز...</p>
            </div>
        </div>
    `,

    init: function() {
        if (!window.storeDb && typeof firebase !== 'undefined') {
            try {
                const storeApp = firebase.apps.find(app => app.name === "storeInstance") 
                                 || firebase.initializeApp(this.storeConfig, "storeInstance");
                window.storeDb = storeApp.database();
            } catch(e) {
                window.storeDb = firebase.database();
            }
        }
        setTimeout(() => {
            UserStoreComponent.switchSection('shop');
        }, 50);
    },

    switchSection: function(sectionName) {
        document.querySelectorAll('.u-btn').forEach(btn => {
            btn.style.background = "transparent";
            btn.style.color = "#666";
            btn.style.fontWeight = "700";
        });
        
        const activeBtn = document.getElementById(`u-btn-${sectionName}`);
        if (activeBtn) {
            activeBtn.style.background = "var(--accent, #007aff)";
            activeBtn.style.color = "white";
            activeBtn.style.fontWeight = "900";
        }

        const oldScript = document.getElementById('script-user-runtime');
        if (oldScript) oldScript.remove();

        // تحديد اسم الملف المستهدف بناءً على التبويب المختار
        let fileName = "";
        if (sectionName === 'shop') fileName = 'user_shop.js';
        else if (sectionName === 'auction') fileName = 'user_auction.js';
        else if (sectionName === 'cart') fileName = 'bt_mc.js'; // السلة أصبحت موديول خارجي مستقل تماماً 🎯

        const script = document.createElement('script');
        script.id = 'script-user-runtime'; 
        script.src = fileName;
        script.onload = () => {
            if (sectionName === 'shop' && window.UserShopModule) window.UserShopModule.init();
            if (sectionName === 'auction' && window.UserAuctionModule) window.UserAuctionModule.init();
            if (sectionName === 'cart' && window.LocalCartModule) window.LocalCartModule.init();
        };
        document.body.appendChild(script);
    }
};