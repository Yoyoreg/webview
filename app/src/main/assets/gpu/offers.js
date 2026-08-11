(function() {
    const flagsDict = {
    1: "flags/1.svg",
    2: "flags/2.svg",
    3: "flags/3.svg",
    4: "flags/4.svg",
    5: "flags/5.svg",
    6: "flags/6.svg",
};

    const offerIcons = {
        'mn': 'mony.svg',
        'ps': 'pzs.svg'
    };

    const style = document.createElement('style');
    style.innerHTML = `
        .offers-window {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 620px; max-height: 80vh; z-index: 11000; display: none;
            background: #2c2c2c; border: 2px solid #ffcc00; border-radius: 20px;
            box-shadow: 0 0 60px rgba(0,0,0,0.9); direction: rtl; padding: 25px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #eeeeee;
            user-select: none; -webkit-user-select: none;
        }

        img { pointer-events: none; user-select: none; }

        /* --- شريط تمرير عريض للهواتف --- */
        #offers-render-target::-webkit-scrollbar { 
            width: 14px; /* زيادة العرض للمس السهل */
        }
        #offers-render-target::-webkit-scrollbar-track { 
            background: #1a1a1a; border-radius: 10px; 
        }
        #offers-render-target::-webkit-scrollbar-thumb { 
            background: #ffcc00; border-radius: 10px; 
            border: 3px solid #1a1a1a; /* ليعطي شكل عارضة بارزة */
        }

        .offer-card {
            background: #3a3a3a; border-right: 5px solid #ffcc00;
            border-radius: 15px; margin-bottom: 25px; padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }

        .diplomacy-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .flag-img { width: 70px; height: 45px; border-radius: 6px; }
        .status-dot { width: 60px; height: 6px; border-radius: 3px; margin: 8px auto 0 auto; }
        
        .items-area { flex-grow: 1; padding: 0 20px; display: flex; flex-direction: row; gap: 8px; justify-content: space-between; align-items: center; }
        .items-column { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .deal-item { display: flex; align-items: center; gap: 12px; color: #ffcc00; font-size: 1rem; font-weight: bold; }
        .deal-item img { width: 28px; height: 28px; }
        
        .offer-input-ro { background: transparent; border: none; color: #ffffff; font-weight: bold; pointer-events: none; font-size: 1.1rem; }
        
        .action-footer { display: flex; justify-content: center; gap: 20px; margin-top: 20px; }

        .btn-diplomacy { 
            padding: 12px 35px; border-radius: 30px; cursor: pointer; border: none; 
            font-weight: 800; font-size: 1.05rem; transition: all 0.3s ease; 
        }

        .btn-accept { background: #ffcc00; color: #2c2c2c; box-shadow: 0 4px 0 #b38f00; }
        .btn-accept:hover { background: #ffe066; }
        .btn-accept:active { transform: translateY(-2px); }

        .btn-reject { background: #ff4444; color: white; box-shadow: 0 4px 0 #b30000; }
        .btn-reject:hover { background: #ff6666; }
        .btn-reject:active { transform: translateY(-2px); }

        /* --- زر الإغلاق المحدث --- */
        .close-btn-main {
            background: transparent;
            color: #ffffff;
            border: 2px solid #ffffff; /* إطار أبيض واضح */
            padding: 8px 30px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
            font-size: 1rem;
            transition: 0.3s;
            margin-top: 10px;
        }
        .close-btn-main:hover {
            background: #ffffff;
            color: #2c2c2c;
        }

        h2 { text-shadow: 0 2px 10px rgba(255, 204, 0, 0.3); }
    `;
    document.head.appendChild(style);

    const win = document.createElement('div');
    win.id = 'offers-main-window';
    win.className = 'offers-window';
    win.innerHTML = `
        <h2 style="text-align:center; color:#ffcc00; margin:0 0 25px 0; font-size: 1.6rem;">ديوان التبادلات الدبلوماسية</h2>
        <div id="offers-render-target" style="max-height:480px; overflow-y:auto; padding-right: 10px;"></div>
        <div style="text-align:center; margin-top:15px;">
            <button class="close-btn-main" onclick="offers_mng('hide')">إغلاق الديوان</button>
        </div>
    `;
    document.body.appendChild(win);

    // الهيكل المحدث: { id_sfq: [id_sfq, p1, p2, it1, it2, s_ok, r_ok] }
    window.globalOffers = {
    };

    window.offers_mng = function(action, data = null) {
        if (action === 'show') win.style.display = 'block';
        if (action === 'hide') win.style.display = 'none';
        if (action === 'upd' || action === 'show') {
            renderOffers(data || window.globalOffers, document.getElementById('offers-render-target'));
        }
    };

    function renderOffers(data, target) {
        // تحويل القاموس إلى مصفوفة قيم لتكرارها وعرضها بسلاسة
        const offersArray = Object.values(data);

        target.innerHTML = offersArray.map((off) => {
            const offerId = off[0];
            const senderCol = off[5] === 'ok' ? '#4CAF50' : '#f44336';
            const receiverCol = off[6] === 'ok' ? '#4CAF50' : '#f44336';
            
            const giveHTML = off[3].map(item => {
                if (item[0] === "mn") return `<div class="deal-item"><img src="${offerIcons.mn}"><span class="offer-input-ro">${item[1]}</span> ذهب</div>`;
                if (item[0] === "ps") return `<div class="deal-item"><img src="${offerIcons.ps}"><span>X: ${item[2]} | Y: ${item[1]}</span></div>`;
            }).join('');

            const takeHTML = off[4].map(item => {
                if (item[0] === "mn") return `<div class="deal-item"><img src="${offerIcons.mn}"><span class="offer-input-ro">${item[1]}</span> ذهب</div>`;
                if (item[0] === "ps") return `<div class="deal-item"><img src="${offerIcons.ps}"><span>X: ${item[2]} | Y: ${item[1]}</span></div>`;
            }).join('');

            return `
            <div class="offer-card">
                <div class="diplomacy-header">
                    <div class="player-side">
                        <img src="${flagsDict[off[1]]}" class="flag-img">
                        <div class="status-dot" style="background: ${senderCol};"></div>
                    </div>
                    <div class="items-area">
                        <div class="items-column">${giveHTML}</div>
                        <hr style="border: none; border-left: 1px dashed #ffcc00; height: 50px; margin: 0 10px;">
                        <div class="items-column">${takeHTML}</div>
                    </div>
                    <div class="player-side">
                        <img src="${flagsDict[off[2]]}" class="flag-img">
                        <div class="status-dot" style="background: ${receiverCol};"></div>
                    </div>
                </div>
                <div class="action-footer">
                    <button class="btn-diplomacy btn-accept" onclick="handleOffer(${offerId}, 'kbl')">قبول</button>
                    <button class="btn-diplomacy btn-reject" onclick="handleOffer(${offerId}, 'rfz')">رفض</button>
                </div>
            </div>`;
        }).join('');
    }

    window.handleOffer = function(id_sfq, type) {
        const ip = window.ip;
        const url = `http://192.168.8.${ip}:8080/?msg=[${id_devs},"rol",'sfq',[${id_sfq},"${type}"]]`;
        fetch(url).catch(() => {});
    };

    
})();