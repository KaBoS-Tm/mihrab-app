import os
import re
import json
import urllib.request
import pypdf

# 1. قائمة السور الـ 114 للتعرف عليها
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
    """جلب نسخة القرآن الكريم المعتمدة عبر Alquran Cloud API الرسمية"""
    url = "https://api.alquran.cloud/v1/quran/quran-uthmani"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        return data["data"]["surahs"]

def parse_book(pdf_file, category_id, source_label, all_surahs):
    pages = extract_raw_text(pdf_file)
    sections = []
    sec_id = 1

    for p in pages:
        txt = p["text"]
        matched_surah = None
        surah_index = None

        for idx, s in enumerate(SURAHS, start=1):
            s_rev = s[::-1]
            if s in txt or s_rev in txt:
                matched_surah = s
                surah_index = idx
                break

        if matched_surah and surah_index:
            surah_data = all_surahs[surah_index - 1]
            ayahs = surah_data.get("ayahs", [])
            total_ayahs = len(ayahs)

            start_a = 1
            end_a = min(total_ayahs, 6 if category_id == "shortEasy" else 10)
            mid_a = max(1, end_a // 2)

            selected_verses = []
            for a in ayahs[start_a - 1 : end_a]:
                # إزالة البسملة الزائدة من أول الآية إذا كانت مدمجة في غير الفاتحة
                raw_text = a.get("text", "")
                if surah_index != 1 and a.get("numberInSurah") == 1:
                    raw_text = raw_text.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ", "").replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ", "")

                selected_verses.append({
                    "num": a.get("numberInSurah"),
                    "text": raw_text
                })

            juz_no = ayahs[start_a - 1].get("juz", 30)

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
    all_surahs = download_quran_clean()

    all_sections = []

    if os.path.exists("book1.pdf"):
        print("جاري معالجة كتاب 1 (قصار السور)...")
        b1_sections = parse_book("book1.pdf", "shortEasy", "كتاب الآيات القصيرة", all_surahs)
        all_sections.extend(b1_sections)

    if os.path.exists("book2.pdf"):
        print("جاري معالجة كتاب 2 (الشيخ المطري)...")
        b2_sections = parse_book("book2.pdf", "mediumSelected", "الشيخ محمد المطري", all_surahs)
        all_sections.extend(b2_sections)

    if not all_sections:
        print("تنبيه: لم يتم العثور على ملفات الـ PDF بالأسماء book1.pdf و book2.pdf")
        return

    output_path = "quran_books.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_sections, f, ensure_ascii=False, indent=2)

    print(f"تم بنجاح استخراج {len(all_sections)} مقطع وحفظها في {output_path}")

if __name__ == "__main__":
    main()
