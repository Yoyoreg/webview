window.AddProductModule = {
    gitConfig: {
        // تم نقل الـ Token بأمان داخل إعدادات خادم Render لحمايته
        SERVER_PROXY: "https://api-marcidia-mmarket.onrender.com", 
        user: "Yoyoreg",
        repo: "market-assets",
        branch: "main"
    },
    
    selectedImgBase64: "",
    cropper: null,

    show: function() {
        if (!document.getElementById('cropper-css')) {
            const link = document.createElement('link');
            link.id = 'cropper-css';
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
            document.head.appendChild(link);
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
            document.body.appendChild(script);
        }

        let overlay = document.getElementById('add-prd-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'add-prd-overlay';
            overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0, 0, 0, 0.8); display:flex; align-items:center; justify-content:center; z-index:2000; backdrop-filter:blur(5px);";
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div id="add-modal-card" style="background:white; width:90%; max-width:400px; padding:25px; border-radius:25px; text-align:right; max-height:90vh; overflow-y:auto; box-shadow:0 15px 35px rgba(0,0,0,0.3);" dir="rtl">
                <h3 style="margin-top:0; margin-bottom:20px; color:#333; font-weight:900;">إضافة منتج جديد</h3>
                
                <div style="margin-bottom:15px; background:#f9f9f9; border-radius:15px; overflow:hidden; border:1px solid #eee;">
                    <div id="crop-container" style="display:none; max-height:260px; background:#000;">
                        <img id="image-to-crop" style="max-width:100%; display:block;">
                    </div>
                    <div id="upload-placeholder" style="padding:30px; text-align:center;">
                        <label for="p-file" style="cursor:pointer; color:var(--accent, #007aff); font-weight:bold; font-size:14px; display:block;">📸 إضغط هنا لاختيار صورة المنتج</label>
                    </div>
                    <input type="file" id="p-file" accept="image/*" onchange="AddProductModule.handleFile(this)" style="display:none;">
                </div>

                <label style="font-size:12px; color:#666; display:block; margin-bottom:5px;">اسم المنتج التجارية:</label>
                <input type="text" id="p-name" oninput="AddProductModule.validateForm()" placeholder="مثال: حذاء رياضي، قميص..." style="width:100%; padding:12px; margin-bottom:12px; border:1.5px solid #eee; border-radius:12px; outline:none; box-sizing:border-box;">
                
                <div style="display:flex; gap:12px; margin-bottom:25px;">
                    <div style="flex:2;">
                        <label style="font-size:12px; color:#666; display:block; margin-bottom:5px;">السعر المعروض (ɱ):</label>
                        <input type="number" id="p-price" oninput="AddProductModule.validateForm()" placeholder="0.00" style="width:100%; padding:12px; border:1.5px solid #eee; border-radius:12px; outline:none; box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:12px; color:#666; display:block; margin-bottom:5px;">الكمية الحالية:</label>
                        <input type="number" id="p-qty" oninput="AddProductModule.validateForm()" value="1" min="1" style="width:100%; padding:12px; border:1.5px solid #eee; border-radius:12px; outline:none; box-sizing:border-box;">
                    </div>
                </div>

                <div style="display:flex; gap:10px;">
                    <button id="save-btn" onclick="AddProductModule.prepareAndSave()" disabled style="flex:2; background:#b2bec3; color:white; border:none; padding:15px; border-radius:15px; font-weight:900; cursor:not-allowed; transition: all 0.3s ease;">يرجى ملء البيانات</button>
                    <button onclick="AddProductModule.hide()" style="flex:1; background:#f5f5f5; color:#666; border:none; padding:15px; border-radius:15px; font-weight:700; cursor:pointer;">إلغاء</button>
                </div>
            </div>
        `;
        overlay.style.display = 'flex';
        
        // 📡 إيقاظ صامت للسيرفر فور فتح الواجهة لتجاوز الـ Cold Start تلقائياً
        fetch(`${this.gitConfig.SERVER_PROXY}/upload`, { method: "OPTIONS" }).catch(() => {});
    },

    handleFile: function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById('image-to-crop');
                img.src = e.target.result;
                
                document.getElementById('upload-placeholder').style.display = 'none';
                document.getElementById('crop-container').style.display = 'block';

                if (this.cropper) this.cropper.destroy();
                
                this.cropper = new Cropper(img, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 1
                });
                
                this.validateForm();
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    validateForm: function() {
        const name = document.getElementById('p-name').value.trim();
        const price = document.getElementById('p-price').value.trim();
        const qty = document.getElementById('p-qty').value.trim();
        const saveBtn = document.getElementById('save-btn');
        
        if (name !== "" && price !== "" && !isNaN(price) && parseFloat(price) >= 0 && qty !== "" && parseInt(qty) > 0) {
            saveBtn.disabled = false;
            saveBtn.style.background = "#2ecc71"; 
            saveBtn.style.cursor = "pointer";
            saveBtn.innerText = "حفظ ونشر المنتج 🚀";
        } else {
            saveBtn.disabled = true;
            saveBtn.style.background = "#b2bec3"; 
            saveBtn.style.cursor = "not-allowed";
            saveBtn.innerText = "يرجى ملء البيانات كاملة";
        }
    },

    prepareAndSave: async function() {
        const saveBtn = document.getElementById('save-btn');
        
        saveBtn.disabled = true;
        saveBtn.style.background = "#e67e22"; 
        saveBtn.innerText = "⏳ جاري تهيئة قياسات الصورة...";

        if (this.cropper) {
            try {
                const canvas = this.cropper.getCroppedCanvas({ width: 400, height: 400 });
                this.selectedImgBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
            } catch (err) {
                console.error("خطأ أثناء قص الصورة:", err);
                alert("🔴 فشل في معالجة أبعاد الصورة محلياً.");
                this.validateForm();
                return;
            }
        }

        const name = document.getElementById('p-name').value.trim();
        const price = document.getElementById('p-price').value;
        const qty = document.getElementById('p-qty').value;

        let finalImgUrl = "d.svg";

        if (this.selectedImgBase64) {
            saveBtn.innerText = "☁️ جاري رفع الصورة إلى خزنة المتجر...";
            
            finalImgUrl = await this.uploadToGithub(name);
            
            if (finalImgUrl === null) {
                this.validateForm(); 
                return; 
            }
        }

        saveBtn.innerText = "🏪 جاري عرض المنتج على رفوف السوق...";
        this.saveToFirebase(name, price, qty, finalImgUrl);
    },

    // 🟢 تم تعديل هذه الدالة فقط لتمرير البيانات للسيرفر الوسيط بدلاً من جيتهاب مباشرة
    uploadToGithub: async function(productName) {
        const url = `${this.gitConfig.SERVER_PROXY}/upload`;
        
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    product_name: productName,
                    content: this.selectedImgBase64
                })
            });

            const resData = await response.json();

            if (response.ok && resData.status === "success") {
                return resData.url;
            }
            
            let errorMsg = `فشل الرفع (كود الخطأ: ${response.status})`;
            if (resData.message) {
                errorMsg = `🛑 ${resData.message}`;
            }

            alert(`⚠️ تنبيه من نظام الحماية:\n${errorMsg}`);
            return null;

        } catch (e) {
            alert(`🔌 خطأ في الاتصال السحابي:\nتأكد من اتصالك بالإنترنت ومن عمل خادم Render. تفاصيل: ${e.message}`);
            return null;
        }
    },

    saveToFirebase: function(name, price, qty, imgUrl) {
        const uid = localStorage.getItem('market_user_id') || 'user0';
        const newPrdId = "prd" + Date.now();

        window.storeDb.ref(`sellers_lists/${uid}/list-prd/${newPrdId}`).set({
            name: name,
            price: parseFloat(price),
            qty: parseInt(qty),
            img: imgUrl
        }).then(() => {
            this.hide();
        }).catch(err => {
            alert("❌ تعذر نشر بيانات المنتج في السيرفر الرئيسي:\n" + err.message);
            this.validateForm();
        });
    },

    hide: function() {
        if (this.cropper) this.cropper.destroy();
        this.selectedImgBase64 = "";
        const overlay = document.getElementById('add-prd-overlay');
        if (overlay) overlay.style.display = 'none';
    }
};