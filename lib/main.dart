import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MihrabApp());
}

// ==========================================
// 1. نماذج البيانات (Data Models)
// ==========================================

enum PrayerType { fajr, dhuhr, asr, maghrib, isha }

enum VersesCategory {
  shortEasy,      // من كتاب الآيات القصيرة جداً
  mediumSelected, // من كتاب الشيخ محمد المطري
  completeQuran   // المصحف كاملاً
}

class VerseSelectionItem {
  final String id;
  final int surahNumber;
  final String surahNameAr;
  final String surahNameEn;
  final int startAyah;
  final int endAyah;
  final int juzNumber;
  final VersesCategory category;
  final String themeAr;
  final String themeEn;
  final int rakah1End;
  final int rakah2Start;
  List<String> loadedVerses; // تُملأ تلقائياً من مصحف الملك فهد

  VerseSelectionItem({
    required this.id,
    required this.surahNumber,
    required this.surahNameAr,
    required this.surahNameEn,
    required this.startAyah,
    required this.endAyah,
    required this.juzNumber,
    required this.category,
    required this.themeAr,
    required this.themeEn,
    required this.rakah1End,
    required this.rakah2Start,
    this.loadedVerses = const [],
  });

  factory VerseSelectionItem.fromJson(Map<String, dynamic> json) {
    VersesCategory cat;
    if (json['category'] == 'shortEasy') {
      cat = VersesCategory.shortEasy;
    } else if (json['category'] == 'mediumSelected') {
      cat = VersesCategory.mediumSelected;
    } else {
      cat = VersesCategory.completeQuran;
    }

    return VerseSelectionItem(
      id: json['id'] ?? '',
      surahNumber: json['surahNumber'] ?? 1,
      surahNameAr: json['surahNameAr'] ?? '',
      surahNameEn: json['surahNameEn'] ?? '',
      startAyah: json['startAyah'] ?? 1,
      endAyah: json['endAyah'] ?? 1,
      juzNumber: json['juzNumber'] ?? 30,
      category: cat,
      themeAr: json['themeAr'] ?? '',
      themeEn: json['themeEn'] ?? '',
      rakah1End: json['rakah1End'] ?? 1,
      rakah2Start: json['rakah2Start'] ?? 2,
    );
  }

  int get totalAyahs => (endAyah - startAyah) + 1;
}

// ==========================================
// 2. مستودع البيانات وحظر الـ 48 ساعة
// ==========================================

class QuranRepository {
  static const String _prefPrefix = 'cooldown_';
  static Map<int, Map<int, String>>? _cachedQuran;

  // فحص حظر الـ 48 ساعة
  static Future<bool> isCoolingDown(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final expire = prefs.getInt('$_prefPrefix$id');
    if (expire == null) return false;

    if (DateTime.now().millisecondsSinceEpoch > expire) {
      await prefs.remove('$_prefPrefix$id');
      return false;
    }
    return true;
  }

  // تسجيل القراءة لتفعيل حظر الـ 48 ساعة
  static Future<void> markAsRead(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final expireTime = DateTime.now().add(const Duration(hours: 48)).millisecondsSinceEpoch;
    await prefs.setInt('$_prefPrefix$id', expireTime);
  }

  // تحميل نصوص الآيات من ملف المصحف hafs_smart_v8.json بذكاء وخفة
  static Future<void> _ensureQuranLoaded() async {
    if (_cachedQuran != null) return;
    _cachedQuran = {};

    try {
      final jsonString = await rootBundle.loadString('assets/hafs_smart_v8.json');
      final dynamic raw = jsonDecode(jsonString);

      // التعامل مع هيكلية مجمع الملك فهد الشائعة
      if (raw is List) {
        for (var item in raw) {
          int sNum = item['sura_no'] ?? item['surah'] ?? item['sura'] ?? 0;
          int aNum = item['aya_no'] ?? item['ayah'] ?? item['aya'] ?? 0;
          String text = item['aya_text'] ?? item['text'] ?? item['content'] ?? '';

          if (sNum > 0 && aNum > 0) {
            _cachedQuran!.putIfAbsent(sNum, () => {})[aNum] = text;
          }
        }
      } else if (raw is Map) {
        if (raw.containsKey('verses') && raw['verses'] is List) {
          for (var item in raw['verses']) {
            int sNum = item['surah'] ?? item['sura_no'] ?? 0;
            int aNum = item['ayah'] ?? item['aya_no'] ?? 0;
            String text = item['text'] ?? item['aya_text'] ?? '';
            if (sNum > 0 && aNum > 0) {
              _cachedQuran!.putIfAbsent(sNum, () => {})[aNum] = text;
            }
          }
        }
      }
    } catch (_) {
      // احتياط في حال كان الملف قيد الرفع أو به هيكل مختلف
    }
  }

  // جلب الاقتراحات المفلترة حسب الصلاة ونطاق الحفظ
  static Future<List<VerseSelectionItem>> getSuggestions({
    required int startJuz,
    required int endJuz,
    required PrayerType prayer,
    required VersesCategory category,
  }) async {
    await _ensureQuranLoaded();

    List<VerseSelectionItem> selections = [];
    try {
      final catalogString = await rootBundle.loadString('assets/quran_selections.json');
      final List<dynamic> list = jsonDecode(catalogString);
      selections = list.map((e) => VerseSelectionItem.fromJson(e)).toList();
    } catch (_) {}

    List<VerseSelectionItem> result = [];

    for (var item in selections) {
      // 1. فلتر نطاق أجزاء الحفظ
      if (item.juzNumber < startJuz || item.juzNumber > endJuz) continue;

      // 2. فلتر التصنيف
      if (category != VersesCategory.completeQuran && item.category != category) {
        continue;
      }

      // 3. ملائمة الصلاة (المغرب مثلاً تخفيف الآيات)
      if (prayer == PrayerType.maghrib && item.totalAyahs > 6) {
        continue;
      }

      // 4. استبعاد المقاطع تحت حظر الـ 48 ساعة
      final isBlocked = await isCoolingDown(item.id);
      if (isBlocked) continue;

      // تعبئة نصوص الآيات من المصحف
      List<String> verses = [];
      if (_cachedQuran != null && _cachedQuran!.containsKey(item.surahNumber)) {
        final surahMap = _cachedQuran![item.surahNumber]!;
        for (int i = item.startAyah; i <= item.endAyah; i++) {
          if (surahMap.containsKey(i)) {
            verses.add(surahMap[i]!);
          }
        }
      }

      if (verses.isEmpty) {
        // نص بديل في حال لم يكتمل الفهرس
        verses = ['(نص الآيات الشريفة من سورة ${item.surahNameAr})'];
      }

      item.loadedVerses = verses;
      result.add(item);
    }

    return result;
  }
}

// ==========================================
// 3. جذر التطبيق وإدارة اللغات
// ==========================================

class MihrabApp extends StatefulWidget {
  const MihrabApp({super.key});

  @override
  State<MihrabApp> createState() => _MihrabAppState();
}

class _MihrabAppState extends State<MihrabApp> {
  Locale _locale = const Locale('ar');

  void _toggleLocale() {
    setState(() {
      _locale = _locale.languageCode == 'ar' ? const Locale('en') : const Locale('ar');
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mihrab',
      debugShowCheckedModeBanner: false,
      locale: _locale,
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFF134E4A), // أخضر محراب هادئ
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF134E4A),
          primary: const Color(0xFF134E4A),
          secondary: const Color(0xFFB45309), // ذهبي كهرماني
          surface: const Color(0xFFFAF9F6),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF134E4A),
          foregroundColor: Colors.white,
          centerTitle: true,
          elevation: 2,
        ),
      ),
      home: HomeScreen(
        currentLocale: _locale,
        onToggleLocale: _toggleLocale,
      ),
    );
  }
}

// ==========================================
// 4. الواجهة الرئيسية والفلاتر
// ==========================================

class HomeScreen extends StatefulWidget {
  final Locale currentLocale;
  final VoidCallback onToggleLocale;

  const HomeScreen({
    super.key,
    required this.currentLocale,
    required this.onToggleLocale,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  PrayerType _selectedPrayer = PrayerType.maghrib;
  VersesCategory _selectedCategory = VersesCategory.shortEasy;
  RangeValues _juzRange = const RangeValues(28, 30);

  List<VerseSelectionItem> _suggestions = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final list = await QuranRepository.getSuggestions(
      startJuz: _juzRange.start.round(),
      endJuz: _juzRange.end.round(),
      prayer: _selectedPrayer,
      category: _selectedCategory,
    );
    setState(() {
      _suggestions = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isAr = widget.currentLocale.languageCode == 'ar';

    return Scaffold(
      appBar: AppBar(
        title: Text(isAr ? 'محراب | اقتراح الآيات للأئمة' : 'Mihrab | Verses Suggester'),
        actions: [
          TextButton.icon(
            onPressed: widget.onToggleLocale,
            icon: const Icon(Icons.language, color: Colors.white, size: 20),
            label: Text(
              isAr ? 'EN' : 'عربي',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterCard(isAr),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _suggestions.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Text(
                            isAr
                                ? 'لا توجد مقاطع متوفرة حالياً، إما لعدم مطابقة النطاق أو لأنها تحت حظر الـ 48 ساعة لمنع التكرار.'
                                : 'No suggestions available or all matching passages are in 48-hour cooldown.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.grey, fontSize: 14),
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        itemCount: _suggestions.length,
                        itemBuilder: (context, i) {
                          return VerseItemCard(
                            item: _suggestions[i],
                            isAr: isAr,
                            onReadCompleted: _loadData,
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterCard(bool isAr) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // اختيار الصلاة
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: PrayerType.values.map((p) {
                final sel = _selectedPrayer == p;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    label: Text(_prayerTitle(p, isAr)),
                    selected: sel,
                    selectedColor: const Color(0xFF134E4A),
                    labelStyle: TextStyle(
                      color: sel ? Colors.white : Colors.black87,
                      fontWeight: sel ? FontWeight.bold : FontWeight.normal,
                    ),
                    onSelected: (val) {
                      if (val) {
                        setState(() => _selectedPrayer = p);
                        _loadData();
                      }
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 10),

          // اختيار المصدر والتصنيف
          DropdownButtonFormField<VersesCategory>(
            value: _selectedCategory,
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
            items: VersesCategory.values.map((cat) {
              return DropdownMenuItem(
                value: cat,
                child: Text(_categoryTitle(cat, isAr), style: const TextStyle(fontSize: 13)),
              );
            }).toList>,
            onChanged: (val) {
              if (val != null) {
                setState(() => _selectedCategory = val);
                _loadData();
              }
            },
          ),
          const SizedBox(height: 8),

          // نطاق أجزاء الحفظ
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isAr
                    ? 'نطاق الحفظ: الجزء ${_juzRange.start.round()} إلى ${_juzRange.end.round()}'
                    : 'Memorization: Juz ${_juzRange.start.round()} to ${_juzRange.end.round()}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.refresh, color: Color(0xFF134E4A)),
                onPressed: _loadData,
              ),
            ],
          ),
          RangeSlider(
            values: _juzRange,
            min: 1,
            max: 30,
            divisions: 29,
            activeColor: const Color(0xFF134E4A),
            labels: RangeLabels(
              _juzRange.start.round().toString(),
              _juzRange.end.round().toString(),
            ),
            onChanged: (val) => setState(() => _juzRange = val),
            onChangeEnd: (_) => _loadData(),
          ),
        ],
      ),
    );
  }

  String _prayerTitle(PrayerType p, bool isAr) {
    switch (p) {
      case PrayerType.fajr: return isAr ? 'الفجر' : 'Fajr';
      case PrayerType.dhuhr: return isAr ? 'الظهر' : 'Dhuhr';
      case PrayerType.asr: return isAr ? 'العصر' : 'Asr';
      case PrayerType.maghrib: return isAr ? 'المغرب' : 'Maghrib';
      case PrayerType.isha: return isAr ? 'العشاء' : 'Isha';
    }
  }

  String _categoryTitle(VersesCategory c, bool isAr) {
    switch (c) {
      case VersesCategory.shortEasy:
        return isAr ? 'آيات قصيرة وسهلة جداً (كتاب 1)' : 'Short & Easy (Book 1)';
      case VersesCategory.mediumSelected:
        return isAr ? 'مقاطع متوسطة ومكتملة (الشيخ المطري)' : 'Medium Selected (Al-Matari)';
      case VersesCategory.completeQuran:
        return isAr ? 'المصحف الشريف كاملاً' : 'All Quran';
    }
  }
}

// ==========================================
// 5. بطاقة العرض وتقسيم الركعتين وحظر 48 ساعة
// ==========================================

class VerseItemCard extends StatelessWidget {
  final VerseSelectionItem item;
  final bool isAr;
  final VoidCallback onReadCompleted;

  const VerseItemCard({
    super.key,
    required this.item,
    required this.isAr,
    required this.onReadCompleted,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFE2D9C8)),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ترويسة البطاقة
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF134E4A),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    isAr ? 'سورة ${item.surahNameAr}' : 'Surah ${item.surahNameEn}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
                Text(
                  isAr
                      ? 'الآيات (${item.startAyah} - ${item.endAyah}) | جزء ${item.juzNumber}'
                      : 'Ayahs (${item.startAyah}-${item.endAyah}) | Juz ${item.juzNumber}',
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // السياق والموضوع الفقهي
            Text(
              isAr ? item.themeAr : item.themeEn,
              style: TextStyle(color: Colors.blueGrey.shade800, fontSize: 13, fontStyle: FontStyle.italic),
            ),
            const Divider(height: 20),

            // صندوق نص القرآن الكريم
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFAF9F5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                item.loadedVerses.join(' ۝ '),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  height: 1.9,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // دليل تقسيم الركعتين
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.splitscreen, color: Color(0xFF047857), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      isAr
                          ? 'دليل الركعتين: الأولى تقف عند آية (${item.rakah1End})، والثانية تبدأ من (${item.rakah2Start}).'
                          : 'Rakah Split: Rakah 1 ends at (${item.rakah1End}), Rakah 2 begins at (${item.rakah2Start}).',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // زر تأكيد القراءة وتفعيل حظر الـ 48 ساعة
            ElevatedButton.icon(
              onPressed: () async {
                await QuranRepository.markAsRead(item.id);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        isAr
                            ? 'تمت القراءة بنجاح! تم استبعاد هذا المقطع لمدة 48 ساعة لمنع التكرار.'
                            : 'Marked as read! Excluded for 48 hours to ensure variety.',
                      ),
                      backgroundColor: const Color(0xFF134E4A),
                    ),
                  );
                }
                onReadCompleted();
              },
              icon: const Icon(Icons.check_circle_outline, size: 18),
              label: Text(isAr ? 'تمت القراءة في الصلاة (حظر 48 ساعة)' : 'Recited in Prayer (48h Lock)'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB45309),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
