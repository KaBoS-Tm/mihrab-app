import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MihrabApp());
}

enum PrayerType { fajr, dhuhr, asr, maghrib, isha }

enum VersesCategory {
  shortEasy,
  mediumSelected,
  completeQuran,
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
  List<String> loadedVerses;

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
    final catStr = json['category']?.toString() ?? '';
    if (catStr == 'shortEasy') {
      cat = VersesCategory.shortEasy;
    } else if (catStr == 'mediumSelected') {
      cat = VersesCategory.mediumSelected;
    } else {
      cat = VersesCategory.completeQuran;
    }

    return VerseSelectionItem(
      id: json['id']?.toString() ?? '',
      surahNumber: json['surahNumber'] ?? 1,
      surahNameAr: json['surahNameAr']?.toString() ?? '',
      surahNameEn: json['surahNameEn']?.toString() ?? '',
      startAyah: json['startAyah'] ?? 1,
      endAyah: json['endAyah'] ?? 1,
      juzNumber: json['juzNumber'] ?? 30,
      category: cat,
      themeAr: json['themeAr']?.toString() ?? '',
      themeEn: json['themeEn']?.toString() ?? '',
      rakah1End: json['rakah1End'] ?? 1,
      rakah2Start: json['rakah2Start'] ?? 2,
    );
  }

  int get totalAyahs => (endAyah - startAyah) + 1;
}

class QuranRepository {
  static const String _prefPrefix = 'cooldown_';
  static Map<int, Map<int, String>>? _cachedQuran;

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

  static Future<void> markAsRead(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final expireTime = DateTime.now().add(const Duration(hours: 48)).millisecondsSinceEpoch;
    await prefs.setInt('$_prefPrefix$id', expireTime);
  }

  static Future<void> _ensureQuranLoaded() async {
    if (_cachedQuran != null) return;
    _cachedQuran = {};

    try {
      final jsonString = await rootBundle.loadString('assets/hafs_smart_v8.json');
      final dynamic raw = jsonDecode(jsonString);

      if (raw is List) {
        for (var item in raw) {
          int sNum = item['sura_no'] ?? item['surah'] ?? item['sura'] ?? 0;
          int aNum = item['aya_no'] ?? item['ayah'] ?? item['aya'] ?? 0;
          String text = item['aya_text'] ?? item['text'] ?? item['content'] ?? '';

          if (sNum > 0 && aNum > 0) {
            _cachedQuran!.putIfAbsent(sNum, () => {})[aNum] = text;
          }
        }
      } else if (raw is Map && raw.containsKey('verses') && raw['verses'] is List) {
        for (var item in raw['verses']) {
          int sNum = item['surah'] ?? item['sura_no'] ?? 0;
          int aNum = item['ayah'] ?? item['aya_no'] ?? 0;
          String text = item['text'] ?? item['aya_text'] ?? '';
          if (sNum > 0 && aNum > 0) {
            _cachedQuran!.putIfAbsent(sNum, () => {})[aNum] = text;
          }
        }
      }
    } catch (_) {}
  }

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
      if (item.juzNumber < startJuz || item.juzNumber > endJuz) continue;

      if (category != VersesCategory.completeQuran && item.category != category) {
        continue;
      }

      if (prayer == PrayerType.maghrib && item.totalAyahs > 6) {
        continue;
      }

      final isBlocked = await isCoolingDown(item.id);
      if (isBlocked) continue;

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
        verses = ['(نص الآيات الشريفة من سورة ${item.surahNameAr})'];
      }

      item.loadedVerses = verses;
      result.add(item);
    }

    return result;
  }
}

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
        primaryColor: const Color(0xFF134E4A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF134E4A),
          primary: const Color(0xFF134E4A),
          secondary: const Color(0xFFB45309),
        ),
      ),
      home: HomeScreen(
        currentLocale: _locale,
        onToggleLocale: _toggleLocale,
      ),
    );
  }
}

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
        title: Text(isAr ? 'محراب | اقتراح الآيات' : 'Mihrab | Verses Suggester'),
        actions: [
          TextButton(
            onPressed: widget.onToggleLocale,
            child: Text(
              isAr ? 'EN' : 'عربي',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                DropdownButtonFormField<VersesCategory>(
                  value: _selectedCategory,
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  items: VersesCategory.values.map((cat) {
                    return DropdownMenuItem<VersesCategory>(
                      value: cat,
                      child: Text(_categoryTitle(cat, isAr), style: const TextStyle(fontSize: 13)),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _selectedCategory = val);
                      _loadData();
                    }
                  },
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isAr
                          ? 'نطاق الحفظ: الجزء ${_juzRange.start.round()} إلى ${_juzRange.end.round()}'
                          : 'Juz Range: ${_juzRange.start.round()} to ${_juzRange.end.round()}',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh),
                      onPressed: _loadData,
                    ),
                  ],
                ),
                RangeSlider(
                  values: _juzRange,
                  min: 1,
                  max: 30,
                  divisions: 29,
                  labels: RangeLabels(
                    _juzRange.start.round().toString(),
                    _juzRange.end.round().toString(),
                  ),
                  onChanged: (val) => setState(() => _juzRange = val),
                  onChangeEnd: (_) => _loadData(),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _suggestions.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Text(
                            isAr
                                ? 'لا توجد مقاطع متوفرة حالياً، أو أنها تحت حظر الـ 48 ساعة لمنع التكرار.'
                                : 'No suggestions available or all matching passages are in 48-hour cooldown.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.grey, fontSize: 14),
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _suggestions.length,
                        itemBuilder: (context, i) {
                          final item = _suggestions[i];
                          return Card(
                            elevation: 2,
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        isAr ? 'سورة ${item.surahNameAr}' : 'Surah ${item.surahNameEn}',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                      Text(
                                        isAr
                                            ? 'الآيات (${item.startAyah} - ${item.endAyah}) | جزء ${item.juzNumber}'
                                            : 'Ayahs (${item.startAyah}-${item.endAyah}) | Juz ${item.juzNumber}',
                                        style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    isAr ? item.themeAr : item.themeEn,
                                    style: TextStyle(color: Colors.grey.shade800, fontSize: 13, fontStyle: FontStyle.italic),
                                  ),
                                  const Divider(height: 16),
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF9F9F6),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      item.loadedVerses.join(' ۝ '),
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(fontSize: 15, height: 1.8),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE8F5E9),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      isAr
                                          ? 'دليل الركعتين: الأولى تقف عند آية (${item.rakah1End})، والثانية تبدأ من (${item.rakah2Start}).'
                                          : 'Rakah 1 ends at (${item.rakah1End}), Rakah 2 begins at (${item.rakah2Start}).',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1B5E20)),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  ElevatedButton.icon(
                                    onPressed: () async {
                                      await QuranRepository.markAsRead(item.id);
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              isAr
                                                  ? 'تم التسجيل! استُبعد هذا المقطع لمدة 48 ساعة لمنع التكرار.'
                                                  : 'Recorded! Excluded for 48 hours to ensure variety.',
                                            ),
                                          ),
                                        );
                                      }
                                      _loadData();
                                    },
                                    icon: const Icon(Icons.check_circle_outline, size: 18),
                                    label: Text(isAr ? 'تمت القراءة في الصلاة (حظر 48 ساعة)' : 'Recited (48h Lock)'),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
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
        return isAr ? 'مقاطع متوسطة ومكتملة (المطري)' : 'Medium Selected (Al-Matari)';
      case VersesCategory.completeQuran:
        return isAr ? 'المصحف الشريف كاملاً' : 'All Quran';
    }
  }
}
