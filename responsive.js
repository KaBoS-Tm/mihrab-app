/* ==========================================================================
   محراب الإمام - محرك إدارة التجاوب والتبديل اليدوي بين التصميمات
   ========================================================================== */

(function () {
  const LAYOUT_MODES = [
    { key: 'auto', label: '⚙️ تلقائي' },
    { key: 'mobile', label: '📱 جوال' },
    { key: 'tablet', label: '📟 لوحي' },
    { key: 'desktop', label: '💻 حاسب' }
  ];

  function getStoredMode() {
    return localStorage.getItem('mihrab_view_mode') || 'auto';
  }

  function applyLayout(mode) {
    document.body.classList.remove('force-mobile', 'force-tablet', 'force-desktop');

    if (mode === 'mobile') {
      document.body.classList.add('force-mobile');
    } else if (mode === 'tablet') {
      document.body.classList.add('force-tablet');
    } else if (mode === 'desktop') {
      document.body.classList.add('force-desktop');
    }

    const btn = document.getElementById('layoutSwitcherBtn');
    if (btn) {
      const current = LAYOUT_MODES.find(m => m.key === mode) || LAYOUT_MODES[0];
      btn.innerText = current.label;
    }
  }

  function cycleLayout() {
    const currentMode = getStoredMode();
    const currentIndex = LAYOUT_MODES.findIndex(m => m.key === currentMode);
    const nextIndex = (currentIndex + 1) % LAYOUT_MODES.length;
    const nextMode = LAYOUT_MODES[nextIndex].key;

    localStorage.setItem('mihrab_view_mode', nextMode);
    applyLayout(nextMode);

    if (typeof showToast === 'function') {
      showToast(`تم التبديل إلى العرض: ${LAYOUT_MODES[nextIndex].label}`);
    }
  }

  function injectSwitcherButton() {
    const actions = document.querySelector('.header-actions');
    if (!actions || document.getElementById('layoutSwitcherBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'layoutSwitcherBtn';
    btn.className = 'icon-btn layout-switcher-btn';
    btn.title = 'تغيير وضع العرض (تلقائي / جوال / لوحي / حاسب)';
    btn.onclick = cycleLayout;

    // إدراج الزر قبل زر الوضع الليلي
    actions.insertBefore(btn, actions.children[1] || actions.firstChild);
    applyLayout(getStoredMode());
  }

  // تفعيل النظام فور تحميل المستند
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectSwitcherButton();
      applyLayout(getStoredMode());
    });
  } else {
    injectSwitcherButton();
    applyLayout(getStoredMode());
  }
})();
