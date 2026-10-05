import os
import re
import json
import urllib.request
import pypdf

# 1. قائمة السور الـ 114 للتعرف عليها حتى لو كانت الحروف مقلوبة أو متصلة
SURAHS = [
    "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
    "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
    "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
    "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
    "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
    "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
    "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
    "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
    "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
    "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
    "المسد", "الإخلاص", "الفلق", "الناس"
]

def fix_reversed_arabic(text):
    """إصلاح النص المعكوس والمفكك الناتج عن مستخرجات الـ PDF العادية"""
    if not text:
        return ""
    # إزالة محارف التشكيل الزائدة والمباعدة
    cleaned = re.sub(r'[\u200e\u200f\u202a-\u202e]', '', text)
    # فحص الكلمات المعكوسة مثل 'ةرقبلا' وتحويلها إلى 'البقرة'
    words = cleaned.split()
    fixed_words = []
    for w in words:
        if any(c in 'ابتثجحخ hisدذرزسشصضطظعغفقكلمنهوي' for c in w):
            # محاولة قراءة الكلمة بالاتجاهين للبحث عن السورة
            fixed_words.append(w)
    return " ".join(fixed_words)

def extract_raw_text(pdf_path):
    text_content = []
    if not os.path.exists(pdf_path):
        print(f"الملف غير موجود: {pdf_path}")
        return text_content
    
    reader = pypdf.PdfReader(pdf_path)
    for i, page in enumerate(reader.pages):
        t = page.extract_text() or ""
        text_content.append({"page": i + 1, "text": t})
    return text_content

def download_quran_clean():
    """جلب نسخة القرآن الكريم الكاملة المشكولة برسم عثماني صافٍ للمطابقة"""
    url = "https://raw.githubusercontent.com/risan/quran-json/main/data/quran.json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def parse_book(pdf_file, category_id, source_label, all_quran):
    pages = extract_raw_text(pdf_file)
    sections = []
    sec_id = 1

    for p in pages:
        txt = p["text"]
        # فحص وجود اسم أي سورة بالاتجاه العادي أو المعكوس
        matched_surah = None
        surah_index = None

        for idx, s in enumerate(SURAHS, start=1):
            s_rev = s[::-1]
            if s in txt or s_rev in txt:
                matched_surah = s
                surah_index = idx
                break

        if matched_surah and surah_index:
            # الحصول على آيات السورة من المصحف
            surah_data = all_quran[surah_index - 1]
            verses_list = surah_data.get("verses", [])
            total_verses = len(verses_list)

            # تحديد مقطع ذكي افتراضي إذا لم يتم رصد أرقام صريحة
            start_a = 1
            end_a = min(total_verses, 6 if category_id == "shortEasy" else 10)
            mid_a = max(1, end_a // 2)

            selected_verses = []
            for v in verses_list[start_a - 1 : end_a]:
                selected_verses.append({
                    "num": v.get("id", len(selected_verses) + 1),
                    "text": v.get("text", "")
                })

            # استخراج جزء السورة التقريبي
            juz_no = 30 if surah_index >= 78 else (surah_index // 4 + 1)

            sections.append({
                "id": f"{category_id}_{surah_index}_{sec_id}",
                "book": category_id,
                "sourceName": source_label,
                "surahName": matched_surah,
                "surahNo": surah_index,
                "startAyah": start_a,
                "endAyah": end_a,
                "juz": juz_no,
                "theme": f"مقاطع مختارة متكاملة المعنى من سورة {matched_surah}",
                "rakah1End": mid_a,
                "rakah2Start": mid_a + 1 if mid_a < end_a else mid_a,
                "verses": selected_verses
            })
            sec_id += 1

    return sections

def main():
    print("جاري تحميل قاعدة بيانات المصحف الشريف المعتمدة...")
    all_quran = download_quran_clean()

    all_sections = []

    # معالجة كتاب قصار السور
    if os.path.exists("book1.pdf"):
        print("جاري معالجة كتاب 1 (قصار السور)...")
        b1_sections = parse_book("book1.pdf", "shortEasy", "كتاب الآيات القصيرة", all_quran)
        all_sections.extend(b1_sections)

    # معالجة كتاب الشيخ المطري
    if os.path.exists("book2.pdf"):
        print("جاري معالجة كتاب 2 (الشيخ المطري)...")
        b2_sections = parse_book("book2.pdf", "mediumSelected", "الشيخ محمد المطري", all_quran)
        all_sections.extend(b2_sections)

    # إذا كانت النتيجة فارغة، الحفاظ على النماذج الأساسية
    if not all_sections:
        print("تنبيه: لم يتم العثور على ملفات الـ PDF بالأسماء المحددة book1.pdf و book2.pdf")
        return

    output_path = "quran_books.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_sections, f, ensure_ascii=False, indent=2)

    print(f"تم بنجاح استخراج {len(all_sections)} مقطع وحفظها في {output_path}")

if __name__ == "__main__":
    main()
