/* ==========================================================================
   محراب الإمام - المحرك المتقدم (التجاوب، أزرار الرجوع، تكبير الخط، والبحث الذكي)
   ========================================================================== */

(function () {
  // دالة تجريد النص العربي من التشكيل وعلامات المصحف لمطابقة البحث بدقة
  function normalizeArabic(txt) {
    if (!txt) return '';
    return txt
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // إزالة كافة الحركات والتنوين
      .replace(/[أإآٱ]/g, 'ا') // توحيد الألف
      .replace(/ة/g, 'ه')     // توحيد التاء المربوطة
      .replace(/ى/g, 'ي')     // توحيد الياء
      .replace(/[\s\-_]+/g, ' ')
      .trim().toLowerCase();
  }

  // --------------------------------------------------------------------------
  // 1. ترقية محرك البحث ليشمل كل كلمات الآيات والسور دون التأثر بالتشكيل
  // --------------------------------------------------------------------------
  window.handleSearch = function (val) {
    window.searchQuery = val.trim();
    const qClean = normalizeArabic(val);

    const feed = document.getElementById('cardsFeed');
    if (!feed || !window.database) return;

    if (!qClean) {
      if (typeof window.render === 'function') window.render();
      return;
    }

    // فلترة فورية تبحث في اسم السورة، الموضوع، وكل كلمات الآيات نصياً
    feed.innerHTML = '';
    const results = window.database.filter(item => {
      const inSurah = normalizeArabic(item.surahName).includes(qClean);
      const inTheme = normalizeArabic(item.theme || '').includes(qClean);
      const inTopic = normalizeArabic(item.topicLabel || '').includes(qClean);
      const inVerses = (item.verses || []).some(v => normalizeArabic(v.text).includes(qClean));

      return inSurah || inTheme || inTopic || inVerses;
    });

    if (results.length === 0) {
      feed.innerHTML = `
        <div class="empty-state">
          <span style="font-size: 2.4rem;">🔍</span>
          <h3 style="color:var(--primary); font-weight:800;">لم يتم العثور على نتائج للكلمة: "${val}"</h3>
          <p style="color:var(--text-muted); font-size:0.88rem;">جرب كتابة جذر الكلمة أو جزء منها للبحث في كافة السور والآيات.</p>
        </div>`;
      return;
    }

    results.forEach(sec => {
      const isFav = !!localStorage.getItem('mihrab_fav_' + sec.id);
      const versesHtml = (sec.verses || []).map(v => 
        `${(typeof window.cleanAyaText === 'function' ? window.cleanAyaText(v.text) : v.text)} <span class="verse-badge">﴿${window.toArabicDigits(v.num)}﴾</span>`
      ).join(' ');

      const card = document.createElement('article');
      card.className = 'card-item';
      card.innerHTML = `
        <div class="card-header-bar">
          <div class="surah-info">
            <span class="surah-title">سورة ${sec.surahName}</span>
            <span class="ayat-tag">الآيات (${window.toArabicDigits(sec.startAyah)} - ${window.toArabicDigits(sec.endAyah)})</span>
            <span class="ayat-tag" style="color:var(--gold); font-weight:800;">جزء ${window.toArabicDigits(sec.juz)}</span>
          </div>
          <div class="header-badges">
            <span class="topic-badge">${sec.topicLabel || 'التوحيد'}</span>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${sec.id}', this)" title="إضافة للمفضلة">
              ${isFav ? '★' : '☆'}
            </button>
          </div>
        </div>
        <div class="card-content">
          <div style="font-size:0.86rem; color:var(--text-muted); font-weight:700;">
            المصدر: ${sec.sourceName} | المستوى: ${sec.lengthLabel || 'معتدل'}
          </div>
          <div class="quran-text-wrapper">${versesHtml}</div>
          <div class="rakah-box">
            <span>📖</span>
            <span>دليل الركعتين: الأولى تقف عند آية (${window.toArabicDigits(sec.rakah1End)})، والثانية تبدأ من آية (${window.toArabicDigits(sec.rakah2Start)}).</span>
          </div>
          <button class="confirm-btn" onclick="commitRead('${sec.id}', this)">
            <span>✓</span>
            <span>تمت القراءة في الصلاة (حظر 48 ساعة)</span>
          </button>
        </div>`;
      feed.appendChild(card);
    });
  };

  // --------------------------------------------------------------------------
  // 2. إصلاح أزرار تكبير وتصغير الخط وتطبيقها فوراً على القارئ والبطاقات
  // --------------------------------------------------------------------------
  window.changeReaderFontSize = function (delta) {
    let current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reader-font-size')) || 1.8;
    current = Math.max(1.2, Math.min(3.2, current + delta));
    document.documentElement.style.setProperty('--reader-font-size', current + 'rem');

    // فرض التطبيق المباشر على الحاويات النشطة
    document.querySelectorAll('.mushaf-page-frame, .mushaf-page-frame .quran-text-wrapper').forEach(el => {
      el.style.fontSize = current + 'rem';
    });
  };

  window.changeFontSize = function (delta) {
    let current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--quran-font-size')) || 1.65;
    current = Math.max(1.2, Math.min(3.0, current + delta));
    document.documentElement.style.setProperty('--quran-font-size', current + 'rem');

    document.querySelectorAll('.card-item .quran-text-wrapper').forEach(el => {
      el.style.fontSize = current + 'rem';
    });
  };

  // --------------------------------------------------------------------------
  // 3. إعادة هيكلة ترويسة القارئ وإضافة أزرار "رجوع" صريحة للجوال
  // --------------------------------------------------------------------------
  function adjustReaderHeader() {
    const readerHeader = document.querySelector('.reader-header');
    if (!readerHeader || readerHeader.getAttribute('data-adjusted')) return;

    const titleEl = document.getElementById('readerTitle');
    const tabsEl = readerHeader.querySelector('.reader-source-tabs');
    const oldCloseBtn = readerHeader.querySelector('button[onclick*="closeReaderModal"]');

    // إنشاء شريط علوي أنيق
    const topBar = document.createElement('div');
    topBar.className = 'reader-top-bar';

    // زر رجوع رئيسي
    const backBtn = document.createElement('button');
    backBtn.className = 'reader-back-btn';
    backBtn.innerHTML = '⬅ رجوع للمحراب';
    backBtn.onclick = () => window.closeReaderModal();

    // زر الفهرس
    const indexBtn = readerHeader.querySelector('button[onclick*="toggleMobileIndex"]');

    topBar.appendChild(backBtn);
    if (titleEl) topBar.appendChild(titleEl);
    if (indexBtn) topBar.appendChild(indexBtn);

    if (oldCloseBtn) oldCloseBtn.remove();

    readerHeader.innerHTML = '';
    readerHeader.appendChild(topBar);
    if (tabsEl) readerHeader.appendChild(tabsEl);

    readerHeader.setAttribute('data-adjusted', 'true');
  }

  // --------------------------------------------------------------------------
  // 4. إضافة زر رجوع صريح لنافذة نطاق الحفظ (Scope Modal)
  // --------------------------------------------------------------------------
  function adjustScopeModal() {
    const scopeCard = document.querySelector('.scope-modal-card');
    if (!scopeCard || scopeCard.getAttribute('data-back-added')) return;

    const modalHeader = scopeCard.querySelector('.modal-header');
    if (modalHeader && !modalHeader.querySelector('.modal-close-btn')) {
      const backBtn = document.createElement('button');
      backBtn.className = 'modal-close-btn';
      backBtn.innerHTML = '✕ رجوع';
      backBtn.onclick = () => window.closeScopeModal();
      modalHeader.appendChild(backBtn);
    }
    scopeCard.setAttribute('data-back-added', 'true');
  }

  // --------------------------------------------------------------------------
  // 5. زر تبديل أوضاع الشاشة (تلقائي / جوال / لوحي / حاسب)
  // --------------------------------------------------------------------------
  const LAYOUT_MODES = [
    { key: 'auto', label: '⚙️ تلقائي' },
    { key: 'mobile', label: '📱 جوال' },
    { key: 'tablet', label: '📟 لوحي' },
    { key: 'desktop', label: '💻 حاسب' }
  ];

  function applyLayout(mode) {
    document.body.classList.remove('force-mobile', 'force-tablet', 'force-desktop');
    if (mode === 'mobile') document.body.classList.add('force-mobile');
    else if (mode === 'tablet') document.body.classList.add('force-tablet');
    else if (mode === 'desktop') document.body.classList.add('force-desktop');

    const btn = document.getElementById('layoutSwitcherBtn');
    if (btn) {
      const cur = LAYOUT_MODES.find(m => m.key === mode) || LAYOUT_MODES[0];
      btn.innerText = cur.label;
    }
  }

  function cycleLayout() {
    const cur = localStorage.getItem('mihrab_view_mode') || 'auto';
    const idx = LAYOUT_MODES.findIndex(m => m.key === cur);
    const next = LAYOUT_MODES[(idx + 1) % LAYOUT_MODES.length].key;
    localStorage.setItem('mihrab_view_mode', next);
    applyLayout(next);
    if (typeof window.showToast === 'function') {
      const item = LAYOUT_MODES.find(m => m.key === next);
      window.showToast(`تم تغيير العرض إلى: ${item.label}`);
    }
  }

  function initUI() {
    adjustReaderHeader();
    adjustScopeModal();

    const actions = document.querySelector('.header-actions');
    if (actions && !document.getElementById('layoutSwitcherBtn')) {
      const btn = document.createElement('button');
      btn.id = 'layoutSwitcherBtn';
      btn.className = 'icon-btn layout-switcher-btn';
      btn.onclick = cycleLayout;
      actions.insertBefore(btn, actions.children[1] || actions.firstChild);
    }

    applyLayout(localStorage.getItem('mihrab_view_mode') || 'auto');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }
})();
