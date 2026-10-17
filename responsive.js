/* ==========================================================================
   محراب الإمام - المحرك الذكي (إصلاح البحث في كلمات الآيات بدقة + التجاوب)
   ========================================================================== */

(function () {
  // دالة متقدمة لتجريد النص وتوحيده للبحث الصافي
  function cleanForSearch(txt) {
    if (!txt) return '';
    return txt
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // إزالة التشكيل وعلامات الضبط
      .replace(/[أإآٱ]/g, 'ا') // توحيد الألف
      .replace(/ة/g, 'ه')     // توحيد التاء المربوطة
      .replace(/ى/g, 'ي')     // توحيد الياء
      .replace(/[\u0640]/g, '') // إزالة الكشيدة (التطويل)
      .replace(/[\s\-_]+/g, ' ')
      .trim().toLowerCase();
  }

  // تجاوز دالة البحث الأصلية بربط مباشر وذكي
  window.handleSearch = function (val) {
    const qRaw = (val || '').trim();
    const qClean = cleanForSearch(qRaw);
    const feed = document.getElementById('cardsFeed');
    if (!feed) return;

    // الوصول الآمن لمصفوفة البيانات العامة
    const dataList = (typeof database !== 'undefined') ? database : (window.database || []);

    if (!qClean) {
      if (typeof render === 'function') render();
      return;
    }

    feed.innerHTML = '';

    // البحث في اسم السورة، الموضوع، وكل كلمات الآيات حرفاً بحرف
    const matched = dataList.filter(item => {
      const inSurah = cleanForSearch(item.surahName).includes(qClean);
      const inTheme = cleanForSearch(item.theme || '').includes(qClean);
      const inTopic = cleanForSearch(item.topicLabel || '').includes(qClean);
      const inVerses = (item.verses || []).some(v => cleanForSearch(v.text).includes(qClean));

      return inSurah || inTheme || inTopic || inVerses;
    });

    if (matched.length === 0) {
      feed.innerHTML = `
        <div class="empty-state">
          <span style="font-size: 2.4rem;">🔍</span>
          <h3 style="color:var(--primary); font-weight:800;">لم يتم العثور على نتائج للكلمة: "${qRaw}"</h3>
          <p style="color:var(--text-muted); font-size:0.88rem;">تأكد من كتابة أحرف الكلمة؛ والبحث يبحث تلقائياً في نصوص السور والآيات والموضوعات.</p>
        </div>`;
      return;
    }

    matched.forEach(sec => {
      const isFav = !!localStorage.getItem('mihrab_fav_' + sec.id);
      const versesHtml = (sec.verses || []).map(v => {
        const txt = typeof cleanAyaText === 'function' ? cleanAyaText(v.text) : v.text;
        const num = typeof toArabicDigits === 'function' ? toArabicDigits(v.num) : v.num;
        return `${txt} <span class="verse-badge">﴿${num}﴾</span>`;
      }).join(' ');

      const start = typeof toArabicDigits === 'function' ? toArabicDigits(sec.startAyah) : sec.startAyah;
      const end = typeof toArabicDigits === 'function' ? toArabicDigits(sec.endAyah) : sec.endAyah;
      const juz = typeof toArabicDigits === 'function' ? toArabicDigits(sec.juz) : sec.juz;
      const r1 = typeof toArabicDigits === 'function' ? toArabicDigits(sec.rakah1End) : sec.rakah1End;
      const r2 = typeof toArabicDigits === 'function' ? toArabicDigits(sec.rakah2Start) : sec.rakah2Start;

      const card = document.createElement('article');
      card.className = 'card-item';
      card.innerHTML = `
        <div class="card-header-bar">
          <div class="surah-info">
            <span class="surah-title">سورة ${sec.surahName}</span>
            <span class="ayat-tag">الآيات (${start} - ${end})</span>
            <span class="ayat-tag" style="color:var(--gold); font-weight:800;">جزء ${juz}</span>
          </div>
          <div class="header-badges">
            <span class="topic-badge">${sec.topicLabel || 'عام'}</span>
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
            <span>دليل الركعتين: الأولى تقف عند آية (${r1})، والثانية تبدأ من آية (${r2}).</span>
          </div>
          <button class="confirm-btn" onclick="commitRead('${sec.id}', this)">
            <span>✓</span>
            <span>تمت القراءة في الصلاة (حظر 48 ساعة)</span>
          </button>
        </div>`;
      feed.appendChild(card);
    });
  };

  // التحكم الديناميكي بأحجام الخط
  window.changeReaderFontSize = function (delta) {
    let current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reader-font-size')) || 1.8;
    current = Math.max(1.2, Math.min(3.2, current + delta));
    document.documentElement.style.setProperty('--reader-font-size', current + 'rem');

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

  // ضبط أزرار الرجوع وترويسة القارئ
  function adjustReaderHeader() {
    const readerHeader = document.querySelector('.reader-header');
    if (!readerHeader || readerHeader.getAttribute('data-adjusted')) return;

    const titleEl = document.getElementById('readerTitle');
    const tabsEl = readerHeader.querySelector('.reader-source-tabs');
    const oldCloseBtn = readerHeader.querySelector('button[onclick*="closeReaderModal"]');

    const topBar = document.createElement('div');
    topBar.className = 'reader-top-bar';

    const backBtn = document.createElement('button');
    backBtn.className = 'reader-back-btn';
    backBtn.innerHTML = '⬅ رجوع للمحراب';
    backBtn.onclick = () => { if (typeof closeReaderModal === 'function') closeReaderModal(); };

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

  function adjustScopeModal() {
    const scopeCard = document.querySelector('.scope-modal-card');
    if (!scopeCard || scopeCard.getAttribute('data-back-added')) return;

    const modalHeader = scopeCard.querySelector('.modal-header');
    if (modalHeader && !modalHeader.querySelector('.modal-close-btn')) {
      const backBtn = document.createElement('button');
      backBtn.className = 'modal-close-btn';
      backBtn.innerHTML = '✕ رجوع';
      backBtn.onclick = () => { if (typeof closeScopeModal === 'function') closeScopeModal(); };
      modalHeader.appendChild(backBtn);
    }
    scopeCard.setAttribute('data-back-added', 'true');
  }

  // زر التبديل بين التصميمات (تلقائي / جوال / لوحي / حاسب)
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
    if (typeof showToast === 'function') {
      const item = LAYOUT_MODES.find(m => m.key === next);
      showToast(`تم تغيير العرض إلى: ${item.label}`);
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
