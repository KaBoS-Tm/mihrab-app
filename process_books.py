import os
import re
import json
import urllib.request
import pypdf

# 1. قائمة السور الـ 114
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

# قاموس التصنيف الموضوعي الشرعي
TOPIC_KEYWORDS = {
    "paradise": ["جَنَّات", "جَنَّة", "نَعِيم", "أَنْهَار", "سُنْدُس", "رِضْوَان", "الْفِرْدَوْس", "حُور", "أَبْرَار"],
    "afterlife": ["الْقِيَامَة", "جَهَنَّم", "النَّار", "عَذَاب", "الْحِسَاب", "الصَّاخَّة", "الطَّامَّة", "زَلْزَلَة", "الْقَارِعَة"],
    "prophets": ["مُوسَىٰ", "إِبْرَاهِيم", "نُوح", "يُوسُف", "عِيسَى", "دَاوُود", "سُلَيْمَان", "آدَم", "فِرْعَوْن", "لُوط"],
    "tawheed": ["اللَّهُ لَا إِلَٰهَ", "الْخَالِق", "السَّمَاوَاتِ وَالْأَرْضِ", "الْعَزِيز", "الرَّحْمَٰن", "سَبَّحَ", "يُسَبِّحُ"],
    "morals": ["الصَّلَاة", "الزَّكَاة", "الْإِحْسَان", "الصَّبْر", "الْمُتَّقِين", "تَقْوَى", "أَوْفُوا", "الْعَدْل"]
}

TOPIC_LABELS = {
    "paradise": "نعيم الجنة والرضوان",
    "afterlife": "أهوال القيامة والمواعظ",
    "prophets": "قصص الأنبياء والرسل والعِبر",
    "tawheed": "التوحيد وعظمة الخالق",
    "morals": "الأخلاق والتقوى والمعاملات"
}

def detect_topic(verses_text):
    for key, words in TOPIC_KEYWORDS.items():
        for w in words:
            if w in verses_text:
                return key, TOPIC_LABELS[key]
    return "tawheed", TOPIC_LABELS["tawheed"]

def get_length_tier(count):
    if count <= 3:
        return "very_short", "قصير جداً"
    elif count <= 7:
        return "short", "قصير"
    elif count <= 15:
        return "medium", "متوسط"
    else:
        return "long", "طويل"

def extract_raw_text(pdf_path):
    text_content = []
    if not os.path.exists(pdf_path):
        return text_content
    try:
        reader = pypdf.PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            t = page.extract_text() or ""
            text_content.append({"page": i + 1, "text": t})
    except Exception as e:
        print(f"خطأ أثناء قراءة {pdf_path}: {e}")
    return text_content

def download_quran_clean():
    url = "https://api.alquran.cloud/v1/quran/quran-uthmani"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        return data["data"]["surahs"]

def parse_book(pdf_file, book_key, source_label, all_surahs):
    pages = extract_raw_text(pdf_file)
    sections = []
    seen_surahs = set()

    for p in pages:
        txt = p["text"]
        for idx, s in enumerate(SURAHS, start=1):
            s_rev = s[::-1]
            if (s in txt or s_rev in txt) and (idx not in seen_surahs):
                seen_surahs.add(idx)

                surah_data = all_surahs[idx - 1]
                ayahs = surah_data.get("ayahs", [])
                total_ayahs = len(ayahs)

                if book_key == "shortEasy":
                    # قصار السور: إذا كانت السورة أقل من 10 آيات نقرأها كاملة، وإلا 4 إلى 6 آيات
                    start_a = 1
                    end_a = total_ayahs if total_ayahs <= 9 else 6
                else:
                    # آيات مختارة للمطري
                    start_a = 1
                    end_a = min(total_ayahs, 10)

                mid_a = max(1, end_a // 2)

                selected_verses = []
                full_text_merged = ""
                for a in ayahs[start_a - 1 : end_a]:
                    raw_text = a.get("text", "")
                    if idx != 1 and a.get("numberInSurah") == 1:
                        raw_text = raw_text.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ", "").replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ", "")
                    selected_verses.append({
                        "num": a.get("numberInSurah"),
                        "text": raw_text
                    })
                    full_text_merged += " " + raw_text

                ayah_count = len(selected_verses)
                length_tier, length_label = get_length_tier(ayah_count)
                topic_key, topic_label = detect_topic(full_text_merged)

                juz_no = ayahs[start_a - 1].get("juz", 30)
                page_no = ayahs[start_a - 1].get("page", 1)

                sections.append({
                    "id": f"{book_key}_{idx}",
                    "book": book_key,
                    "sourceName": source_label,
                    "surahName": s,
                    "surahNo": idx,
                    "startAyah": start_a,
                    "endAyah": end_a,
                    "ayahCount": ayah_count,
                    "lengthTier": length_tier,
                    "lengthLabel": length_label,
                    "topicKey": topic_key,
                    "topicLabel": topic_label,
                    "juz": juz_no,
                    "page": page_no,
                    "theme": f"مقاطع مختارة تامة المعنى من سورة {s} في {topic_label}",
                    "rakah1End": mid_a,
                    "rakah2Start": mid_a + 1 if mid_a < end_a else mid_a,
                    "verses": selected_verses
                })
                break

    return sections

def main():
    print("جاري تحميل قاعدة بيانات المصحف الشريف...")
    all_surahs = download_quran_clean()
    all_sections = []

    # 1. كتاب قصار السور للصلاة
    if os.path.exists("book1.pdf"):
        b1_sections = parse_book("book1.pdf", "shortEasy", "قـصـار السور للصلاة", all_surahs)
        all_sections.extend(b1_sections)

    # 2. كتاب الشيخ المطري
    if os.path.exists("book2.pdf"):
        b2_sections = parse_book("book2.pdf", "mediumSelected", "آيات وسور مختارة للصلاة", all_surahs)
        all_sections.extend(b2_sections)

    output_path = "quran_books.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_sections, f, ensure_ascii=False, indent=2)

    print(f"تم بنجاح استخراج {len(all_sections)} مقطعاً وتصنيفها موضوعياً وفقهياً في {output_path}")

if __name__ == "__main__":
    main()
