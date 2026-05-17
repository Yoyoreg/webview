import os
import shutil
import zipfile
import customtkinter as ctk
from tkinter import filedialog, messagebox

ctk.set_appearance_mode("System")
ctk.set_default_color_theme("blue")

class IconOnlyZipBuilder(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("VoltBuilder Icon Only Package")
        self.geometry("550x420")
        
        self.html_dir = ""
        self.icon_path = ""

        ctk.CTkLabel(self, text="مجهز ملفات VoltBuilder (الأيقونة فقط)", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=15)

        self.app_name = ctk.CTkEntry(self, placeholder_text="اسم التطبيق (مثال: My App)", width=400)
        self.app_name.pack(pady=8)

        self.package_id = ctk.CTkEntry(self, placeholder_text="معرّف الحزمة (مثال: com.company.app1)", width=400)
        self.package_id.pack(pady=8)

        self.btn_html = ctk.CTkButton(self, text="اختر مجلد ملفات الويب المحلية (index.html)", command=self.choose_html, width=400)
        self.btn_html.pack(pady=8)

        self.btn_icon = ctk.CTkButton(self, text="اختر أيقونة التطبيق (PNG مربعة 1024x1024)", command=self.choose_icon, fg_color="gray25", hover_color="gray30", width=400)
        self.btn_icon.pack(pady=8)

        self.btn_generate = ctk.CTkButton(self, text="إنشاء وحفظ ملف الـ ZIP النظيف", command=self.generate_zip, fg_color="green", hover_color="darkgreen", width=400, font=ctk.CTkFont(weight="bold"))
        self.btn_generate.pack(pady=25)

    def choose_html(self):
        self.html_dir = filedialog.askdirectory()
        if self.html_dir: self.btn_html.configure(text="تم اختيار مجلد الملفات ✓", fg_color="indigo")

    def choose_icon(self):
        self.icon_path = filedialog.askopenfilename(filetypes=[("PNG Images", "*.png")])
        if self.icon_path: self.btn_icon.configure(text="تم اختيار الأيقونة بنجاح ✓", fg_color="indigo")

    def generate_zip(self):
        name = self.app_name.get().strip()
        pkg_id = self.package_id.get().strip()

        if not name or not pkg_id or not self.html_dir or not self.icon_path:
            messagebox.showerror("خطأ", "برجاء تعبئة جميع البيانات واختيار الأيقونة ومجلد الملفات!")
            return

        save_path = filedialog.asksaveasfilename(defaultextension=".zip", filetypes=[("Zip files", "*.zip")])
        if not save_path: return

        temp_dir = os.path.join(os.path.dirname(save_path), "volt_temp_icon_only")
        if os.path.exists(temp_dir): shutil.rmtree(temp_dir)
        os.makedirs(temp_dir)

        try:
            # 1. نقل ملفات الويب المحلية
            www_dir = os.path.join(temp_dir, "www")
            shutil.copytree(self.html_dir, www_dir)

            # 2. نسخ صورة الأيقونة إلى الجذر مباشرة باسم قياسي
            shutil.copy(self.icon_path, os.path.join(temp_dir, "icon.png"))

            # 3. صياغة ملف config بدون أي أسطر خاصة بشاشة البدء وبإصدار الرابط القياسي الصحيح
            config_content = f"""<?xml version='1.0' encoding='utf-8'?>
<widget id="{pkg_id}" version="1.0.0" xmlns="w3.org">
    <name>{name}</name>
    <content src="index.html" />
    <icon src="icon.png" />
</widget>"""
            
            with open(os.path.join(temp_dir, "config.xml"), "w", encoding="utf-8") as f:
                f.write(config_content)

            # 4. تجميع وضغط الملفات إلى ZIP
            with zipfile.ZipFile(save_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, temp_dir)
                        zipf.write(file_path, arcname)

            shutil.rmtree(temp_dir)
            messagebox.showinfo("نجاح", "تم إنشاء حزمة ملف الـ ZIP البسيطة بنجاح!")

        except Exception as e:
            if os.path.exists(temp_dir): shutil.rmtree(temp_dir)
            messagebox.showerror("خطأ", f"فشلت العملية: {str(e)}")

if __name__ == "__main__":
    app = IconOnlyZipBuilder()
    app.mainloop()
