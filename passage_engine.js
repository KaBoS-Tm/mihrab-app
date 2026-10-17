/* ==========================================================================
   محراب الإمام - محرك المقاطع الشرعية المنتقاة من السور الكبيرة (3 - 5 آيات)
   ========================================================================== */

(function () {
  // حزمة المقاطع القرآنية تامة المعنى والوقف من كبرى سور القرآن الكريم
  const QURAN_THEMATIC_PASSAGES = [
    {
      id: "gen_baqarah_01",
      book: "quranFull",
      sourceName: "محرك السور الكبيرة | كمال المعنى",
      surahNo: 2,
      surahName: "البقرة",
      juz: 2,
      startAyah: 155,
      endAyah: 157,
      ayahCount: 3,
      theme: "بشارة الصابرين عند الابتلاء وجزاؤهم",
      topicLabel: "الأخلاق والمواعظ",
      topicKey: "morals",
      lengthTier: "very_short",
      rakah1End: 156,
      rakah2Start: 157,
      verses: [
        { num: 155, text: "وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ وَنَقْصٍ مِّنَ الْأَمْوَالِ وَالْأَنفُسِ وَالثَّمَرَاتِ وَبَشِّرِ الصَّابِرِينَ" },
        { num: 156, text: "الَّذِينَ إِذَا أَصَابَتْهُم مُّصِيبَةٌ قَالُوا إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ" },
        { num: 157, text: "أُولَٰئِكَ عَلَيْهِمْ صَلَوَاتٌ مِّن رَّبِّهِمْ وَرَحْمَةٌ وَأُولَٰئِكَ هُمُ الْمُهْتَدُونَ" }
      ]
    },
    {
      id: "gen_baqarah_02",
      book: "quranFull",
      sourceName: "محرك السور الكبيرة | كمال المعنى",
      surahNo: 2,
      surahName: "البقرة",
      juz: 3,
      startAyah: 284,
      endAyah: 286,
      ayahCount: 3,
      theme: "خواتيم سورة البقرة ودعاء المؤمنين",
      topicLabel: "التوحيد والإيمان",
      topicKey: "tawheed",
      lengthTier: "very_short",
      rakah1End: 285,
      rakah2Start: 286,
      verses: [
        { num: 284, text: "لِّلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ وَإِن تُبْدُوا مَا فِي أَنفُسِكُمْ أَوْ تُخْفُوهُ يُحَاسِبْكُم بِهِ اللَّهُ فَيَغْفِرُ لِمَن يَشَاءُ وَيُعَذِّبُ مَن يَشَاءُ وَاللَّهُ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ" },
        { num: 285, text: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ وَقَالُوا سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ" },
        { num: 286, text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ" }
      ]
    },
    {
      id: "gen_imran_01",
      book: "quranFull",
      sourceName: "محرك السور الكبيرة | كمال المعنى",
      surahNo: 3,
      surahName: "آل عمران",
      juz: 4,
      startAyah: 190,
      endAyah: 194,
      ayahCount: 5,
      theme: "تفكر أولي الألباب في خلق السماوات والأرض ودعاؤهم",
      topicLabel: "التوحيد وعظمة الخالق",
      topicKey: "tawheed",
      lengthTier: "short",
      rakah1End: 192,
      rakah2Start: 193,
      verses: [
        { num: 190, text: "إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِّأُولِي الْأَلْبَابِ" },
        { num: 191, text: "الَّذِينَ يَذْكُرُونَ اللَّهَ قِيَامًا وَقُعُودًا وَعَلَىٰ جُنُوبِهِمْ وَيَتَفَكَّرُونَ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ رَبَّنَا مَا خَلَقْتَ هَٰذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ" },
        { num: 192, text: "رَبَّنَا إِنَّكَ مَن تُدْخِلِ النَّارَ فَقَدْ أَخْزَيْتَهُ وَمَا لِلظَّالِمِينَ مِنْ أَنصَارٍ" },
        { num: 193, text: "رَّبَّنَا إِنَّنَا سَمِعْنَا مُنَادِيًا يُنَادِي لِلْإِيمَانِ أَنْ آمِنُوا بِرَبِّكُمْ فَآمَنَّا رَبَّنَا فَاغْفِرْ لَنَا ذُنُوبَنَا وَكَفِّرْ عَنَّا سَيِّئَاتِنَا وَتَوَفَّنَا مَعَ الْأَبْرَارِ" },
        { num: 194, text: "رَبَّنَا وَآتِنَا مَا وَعَدتَّنَا عَلَىٰ رُسُلِكَ وَلَا تُخْزِنَا يَوْمَ الْقِيَامَةِ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ" }
      ]
    },
    {
      id: "gen_yusuf_01",
      book: "quranFull",
      sourceName: "محرك السور الكبيرة | كمال المعنى",
      surahNo: 12,
      surahName: "يوسف",
      juz: 13,
      startAyah: 88,
      endAyah: 90,
      ayahCount: 3,
      theme: "لقاء يوسف بإخوته وعاقبة الصبر والتقوى",
      topicLabel: "قصص الأنبياء والعِبر",
      topicKey: "prophets",
      lengthTier: "very_short",
      rakah1End: 89,
      rakah2Start: 90,
      verses: [
        { num: 88, text: "فَلَمَّا دَخَلُوا عَلَيْهِ قَالُوا يَا أَيُّهَا الْعَزِيزُ مَسَّنَا وَأَهْلَنَا الضُّرُّ وَجِئْنَا بِبِضَاعَةٍ مُّزْجَاةٍ فَأَوْفِ لَنَا الْكَيْلَ وَتَصَدَّقْ عَلَيْنَا إِنَّ اللَّهَ يَجْزِي الْمُتَصَدِّقِينَ" },
        { num: 89, text: "قَالَ هَلْ عَلِمْتُم مَّا فَعَلْتُم بِيُوسُفَ وَأَخِيهِ إِذْ أَنتُمْ جَاهِلُونَ" },
        { num: 90, text: "قَالُوا أَإِنَّكَ لَأَنتَ يُوسُفُ قَالَ أَنَا يُوسُفُ وَهَٰذَا أَخِي قَدْ مَنَّ اللَّهُ عَلَيْنَا إِنَّهُ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ" }
      ]
    },
    {
      id: "gen_furqan_01",
      book: "quranFull",
      sourceName: "محرك السور الكبيرة | كمال المعنى",
      surahNo: 25,
      surahName: "الفرقان",
      juz: 19,
      startAyah: 63,
      endAyah: 66,
      ayahCount: 4,
      theme: "صفات عباد الرحمن في مشيتهم وقيامهم ودعائهم",
      topicLabel: "الأخلاق والمعاملات",
      topicKey: "morals",
      lengthTier: "short",
      rakah1End: 64,
      rakah2Start: 65,
      verses: [
        { num: 63, text: "وَعِبَادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا وَإِذَا خَاطَبَهُمُ الْجَاهِلُونَ قَالُوا سَلَامًا" },
        { num: 64, text: "وَالَّذِينَ يَبِيتُونَ لِرَبِّهِمْ سُجَّدًا وَقِيَامًا" },
        { num: 65, text: "وَالَّذِينَ يَقُولُونَ رَبَّنَا اصْرِفْ عَنَّا عَذَابَ جَهَنَّمَ إِنَّ عَذَابَهَا كَانَ غَرَامًا" },
        { num: 66, text: "إِنَّهَا سَاءَتْ مُسْتَقَرًّا وَمُقَامًا" }
      ]
    },
    {
      id: "gen_hashr_01",
      book: "quranFull",
      sourceName: "محرك السور الكبيرة | كمال المعنى",
      surahNo: 59,
      surahName: "الحشر",
      juz: 28,
      startAyah: 21,
      endAyah: 24,
      ayahCount: 4,
      theme: "لو أنزلنا هذا القرآن على جبل وأسماء الله الحسنى",
      topicLabel: "التوحيد وعظمة الخالق",
      topicKey: "tawheed",
      lengthTier: "short",
      rakah1End: 22,
      rakah2Start: 23,
      verses: [
        { num: 21, text: "لَوْ أَنزَلْنَا هَٰذَا الْقُرْآنَ عَلَىٰ جَبَلٍ لَّرَأَيْتَهُ خَاشِعًا مُّتَصَدِّعًا مِّنْ خَشْيَةِ اللَّهِ وَتِلْكَ الْأَمْثَالُ نَضْرِبُهَا لِلنَّاسِ لَعَلَّهُمْ يَتَفَكَّرُونَ" },
        { num: 22, text: "هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ عَالِمُ الْغَيْبِ وَالشَّهَادَةِ هُوَ الرَّحْمَٰنُ الرَّحِيمُ" },
        { num: 23, text: "هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ" },
        { num: 24, text: "هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ لَهُ الْأَسْمَاءُ الْحُسْنَىٰ يُسَبِّحُ لَهُ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ وَهُوَ الْعَزِيزُ الْحَكِيمُ" }
      ]
    }
  ];

  // دمج المقاطع تلقائياً داخل قاعدة بيانات الموقع عند التحميل
  function integrateThematicPassages() {
    if (typeof database === 'undefined' && !window.database) {
      setTimeout(integrateThematicPassages, 150);
      return;
    }

    const targetDb = (typeof database !== 'undefined') ? database : window.database;

    // منع التكرار
    QURAN_THEMATIC_PASSAGES.forEach(pass => {
      const exists = targetDb.some(item => item.id === pass.id);
      if (!exists) {
        targetDb.push(pass);
      }
    });

    // إضافة زر تصفح المقاطع الكبيرة في شريط التبويبات تلقائياً
    const bookTabs = document.querySelector('.book-tabs');
    if (bookTabs && !document.getElementById('quranFullTabBtn')) {
      const btn = document.createElement('button');
      btn.id = 'quranFullTabBtn';
      btn.className = 'book-tab-btn';
      btn.innerText = '🕋 روائع السور الكبيرة';
      btn.onclick = function () {
        if (typeof setBookFilter === 'function') {
          setBookFilter('quranFull', this);
        }
      };
      // إضافة التبويب إلى الشريط
      bookTabs.style.gridTemplateColumns = 'repeat(4, 1fr)';
      bookTabs.appendChild(btn);
    }

    // إضافة زر "اقترح مقطعاً محرابياً عشوائياً" في أعلى بطاقة التحكم
    const controlCard = document.querySelector('.control-card');
    if (controlCard && !document.getElementById('randomShuffleBtn')) {
      const shuffleWrap = document.createElement('div');
      shuffleWrap.style.cssText = 'display:flex; justify-content:center; margin-bottom:2px;';
      
      const shuffleBtn = document.createElement('button');
      shuffleBtn.id = 'randomShuffleBtn';
      shuffleBtn.className = 'confirm-btn';
      shuffleBtn.style.cssText = 'background:linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); border:1px solid var(--gold); padding:9px 16px; font-size:0.86rem; box-shadow:none; width:auto;';
      shuffleBtn.innerHTML = '<span>🎲</span><span>اقترح مقطعاً شرعياً عشوائياً (تام المعنى)</span>';
      
      shuffleBtn.onclick = suggestRandomThematicPassage;
      shuffleWrap.appendChild(shuffleBtn);
      
      // إدراج الزر فوق تصنيف الصلوات
      const prayersGrid = document.querySelector('.prayers-grid');
      if (prayersGrid) {
        controlCard.insertBefore(shuffleWrap, prayersGrid);
      }
    }

    if (typeof render === 'function') render();
  }

  // دالة الاقتراح العشوائي الذكي وفق معايير الحفظ والصلوات
  function suggestRandomThematicPassage() {
    const targetDb = (typeof database !== 'undefined') ? database : window.database;
    if (!targetDb || targetDb.length === 0) return;

    // استخراج المقاطع المطابقة لنطاق حفظ الإمام وغير المحظورة
    const eligible = targetDb.filter(item => {
      if (typeof isLocked === 'function' && isLocked(item.id)) return false;
      if (typeof selectedJuzs !== 'undefined' && !selectedJuzs.has(item.juz)) return false;
      return true;
    });

    if (eligible.length === 0) {
      if (typeof showToast === 'function') showToast('كافة المقاطع المقترحة حالياً تحت الحظر المؤقت (48 ساعة)');
      return;
    }

    // اختيار مقطع عشوائي
    const chosen = eligible[Math.floor(Math.random() * eligible.length)];
    
    // تركيز الشاشة وعرض المقطع المختار
    const feed = document.getElementById('cardsFeed');
    if (feed) {
      feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (typeof handleSearch === 'function') {
      handleSearch(chosen.surahName);
      if (typeof showToast === 'function') {
        showToast(`تم اختيار مقطع مبارك من سورة ${chosen.surahName} (${chosen.ayahCount} آيات) ✨`);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', integrateThematicPassages);
  } else {
    integrateThematicPassages();
  }
})();
