// ============================================
// TEXT TOOLS - MAIN
// ============================================

// Đảm bảo PAGES tồn tại
if (typeof PAGES === 'undefined') {
  window.PAGES = {};
}

const TEXT_TOOLS_SKILLS = {
  cleaner: {
    id: 'cleaner', title: 'Làm sạch văn bản', desc: 'Xóa HTML, Markdown, định dạng ẩn',
    icon: '🧹', color: 'linear-gradient(135deg, #3498db, #2980b9)', pageName: 'cleaner',
  },
  comparator: {
    id: 'comparator', title: 'So sánh văn bản', desc: 'So sánh 2 văn bản, tìm từ thêm/bớt',
    icon: '🆚', color: 'linear-gradient(135deg, #7C3AED, #A78BFA)', pageName: 'comparator',
  },
};

// ===== CLEANER HTML =====
const SKILL_HTML = {
  cleaner: `
<div class="cleaner-container" style="border:none !important; padding:0; margin:0;">
  <button id="cleaner-paste-btn" class="action-btn primary" style="width:100%; padding:14px 12px; background:linear-gradient(135deg,#2ECC71,#27AE60); margin-bottom:10px; border:none !important; justify-content:center;">
    <span style="font-size:20px; margin-right:10px;">📋</span>
    <span style="font-size:14px; font-weight:700;">Dán từ clipboard &amp; làm sạch</span>
    <span style="margin-left:auto; font-size:11px; opacity:0.7; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:10px;">Ctrl+V</span>
  </button>
  <div style="display:flex; gap:8px; margin-bottom:10px;">
    <select id="cleaner-level" style="flex:1; padding:8px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-family:inherit; font-size:13px; background:var(--surface); color:var(--text); cursor:pointer;">
      <option value="BASIC">🔰 Cơ bản</option>
      <option value="STANDARD" selected>⭐ Tiêu chuẩn</option>
      <option value="ADVANCED">🚀 Nâng cao</option>
    </select>
    <button id="cleaner-clean-btn" class="action-btn primary" style="flex:1; padding:8px 12px; background:linear-gradient(135deg,#3498db,#2980b9); margin-bottom:0; border:none !important; justify-content:center;">
      <span style="font-size:14px; margin-right:6px;">🧹</span>
      <span style="font-size:13px; font-weight:600;">Làm sạch lại</span>
    </button>
  </div>
  <div class="form-group" id="cleaner-result-area" style="margin-bottom:8px; display:none;">
    <label style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
      <span>✨</span> Kết quả: <span id="cleaner-stats" style="font-weight:600; color:var(--dtu-red); margin-left:4px;"></span>
      <span style="margin-left:auto; font-size:10px; color:#999;">(Double-click để copy)</span>
    </label>
    <textarea id="cleaner-output" rows="6" readonly placeholder="Kết quả sẽ hiển thị ở đây..." style="background:#f8f9fa; cursor:default; width:100%; padding:10px; border:1px solid var(--border); border-radius:var(--radius-sm); font-family:inherit; font-size:13px; resize:vertical; line-height:1.6;"></textarea>
  </div>
  <div id="cleaner-hint" style="text-align:center; padding:16px; color:var(--text-muted); font-size:12px;">
    <div style="font-size:28px; margin-bottom:8px; opacity:0.5;">📋</div>
    <div>Nhấn nút bên trên hoặc <strong>Ctrl+V</strong> để dán văn bản</div>
    <div style="margin-top:4px; font-size:11px;">Hoặc kéo thả file văn bản vào đây</div>
  </div>
</div>
  `,

  comparator: `
<div class="comparator-container" style="border:none !important; padding:0; margin:0;">
  <div style="display:flex; gap:8px; margin-bottom:10px;">
    <button id="comp-paste-1" class="action-btn" style="flex:1; padding:12px 8px; background:linear-gradient(135deg,#fff3e0,#ffe0b2); color:#e65100; border:1px solid #ffcc80; margin-bottom:0; justify-content:center;">
      <span style="font-size:16px; margin-right:6px;">📄</span>
      <span style="font-size:12px; font-weight:700;">Dán Văn bản 1</span>
    </button>
    <button id="comp-swap-btn" title="Đảo văn bản" style="background:var(--surface); border:1px solid var(--border); border-radius:50%; width:36px; height:36px; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; color:var(--text); flex-shrink:0; align-self:center;">⇅</button>
    <button id="comp-paste-2" class="action-btn" style="flex:1; padding:12px 8px; background:linear-gradient(135deg,#e8f5e9,#c8e6c9); color:#2e7d32; border:1px solid #a5d6a7; margin-bottom:0; justify-content:center;">
      <span style="font-size:16px; margin-right:6px;">📄</span>
      <span style="font-size:12px; font-weight:700;">Dán Văn bản 2</span>
    </button>
  </div>
  <div id="comp-status" style="text-align:center; padding:8px; background:#f5f5f5; border-radius:var(--radius-sm); margin-bottom:10px; font-size:12px; color:var(--text-muted); font-weight:500;">
    👆 Dán 2 văn bản để so sánh
  </div>
  <button id="comp-compare-btn" class="action-btn primary" style="width:100%; margin-bottom:10px; background:linear-gradient(135deg,#7C3AED,#A78BFA); border:none !important; justify-content:center;">
    <span style="font-size:16px; margin-right:8px;">🆚</span>
    <span style="font-size:14px; font-weight:700;">So sánh ngay</span>
  </button>
  <div id="comp-result" style="display:none;"></div>
  <div id="comp-hint" style="text-align:center; padding:16px; color:var(--text-muted); font-size:12px;">
    <div style="font-size:28px; margin-bottom:8px; opacity:0.5;">🆚</div>
    <div>Dán 2 văn bản từ clipboard để so sánh</div>
    <div style="margin-top:4px; font-size:11px;">Hoặc kéo thả file vào đây</div>
  </div>
</div>
  `
};

const TEXT_TOOLS_HTML = `
<div class="text-tools-container">
  <button class="tt-skill-btn" data-skill="cleaner" style="border-left:4px solid #3498db;">
    <div class="tt-skill-icon" style="background:linear-gradient(135deg,#3498db,#2980b9);">🧹</div>
    <div class="tt-skill-info">
      <span class="tt-skill-title">Làm sạch văn bản</span>
      <span class="tt-skill-desc">Xóa HTML, Markdown, định dạng ẩn</span>
    </div>
    <span class="tt-skill-arrow">›</span>
  </button>
  <button class="tt-skill-btn" data-skill="comparator" style="border-left:4px solid #7C3AED;">
    <div class="tt-skill-icon" style="background:linear-gradient(135deg,#7C3AED,#A78BFA);">🆚</div>
    <div class="tt-skill-info">
      <span class="tt-skill-title">So sánh văn bản</span>
      <span class="tt-skill-desc">So sánh 2 văn bản, tìm từ thêm/bớt</span>
    </div>
    <span class="tt-skill-arrow">›</span>
  </button>
  <div id="tt-skill-content" style="display:none;">
    <div id="tt-skill-body"></div>
  </div>
</div>
`;

// ============================================
// INLINE FALLBACK ATTACH EVENTS (nếu module chưa load)
// ============================================
function fallbackCleanerAttachEvents() {
  console.log('[Cleaner] Fallback attachEvents');
  const output = document.getElementById('cleaner-output');
  const stats = document.getElementById('cleaner-stats');
  const levelSelect = document.getElementById('cleaner-level');
  const pasteBtn = document.getElementById('cleaner-paste-btn');
  const cleanBtn = document.getElementById('cleaner-clean-btn');
  const resultArea = document.getElementById('cleaner-result-area');
  const hint = document.getElementById('cleaner-hint');

  if (!pasteBtn) { console.error('[Cleaner] pasteBtn not found'); return; }

  let rawText = '';

  async function processText(text) {
  if (!text || !text.trim()) {
    if (typeof showToast === 'function') showToast('📝 Không có dữ liệu', 'info');
    return;
  }

  // Gọi hàm lọc thông minh
  const result = smartCleanText(text);

  // Hiển thị ra giao diện
  const output = document.getElementById('cleaner-output');
  const resultArea = document.getElementById('cleaner-result-area');
  const hint = document.getElementById('cleaner-hint');
  const stats = document.getElementById('cleaner-stats');

  if (output) output.value = result;
  if (resultArea) resultArea.style.display = 'block';
  if (hint) hint.style.display = 'none';

  if (stats) {
    const reduction = text.length > 0 ? ((1 - result.length / text.length) * 100).toFixed(1) : 0;
    stats.textContent = `${text.length} → ${result.length} ký tự (giảm ${reduction}%)`;
  }

  // Tự động sao chép kết quả sạch vào Clipboard
  try {
    await navigator.clipboard.writeText(result);
    if (typeof showToast === 'function') showToast('✅ Đã làm sạch & copy!', 'success');
  } catch (_) {
    if (typeof showToast === 'function') showToast('✅ Đã làm sạch!', 'success');
  }
}

  pasteBtn.addEventListener('click', async function() {
    const orig = this.innerHTML;
    this.innerHTML = '<span style="font-size:16px;margin-right:8px;">⏳</span><span>Đang đọc...</span>';
    this.style.opacity = '0.6'; this.style.pointerEvents = 'none';
    try {
      let t = '';
      try { t = await navigator.clipboard.readText(); }
      catch (_) {
        const tmp = document.createElement('textarea');
        tmp.style.cssText = 'position:fixed;opacity:0;pointer-events:none;z-index:-1;';
        document.body.appendChild(tmp); tmp.focus();
        document.execCommand('paste'); t = tmp.value; document.body.removeChild(tmp);
      }
      await processText(t);
    } catch (e) { showToast('❌ Lỗi đọc clipboard', 'error'); }
    finally { this.innerHTML = orig; this.style.opacity = '1'; this.style.pointerEvents = 'auto'; }
  });

  if (cleanBtn) {
    cleanBtn.addEventListener('click', function() {
      if (!rawText) { showToast('⚠️ Chưa có dữ liệu', 'warning'); return; }
      processText(rawText);
    });
  }

  if (levelSelect) {
    levelSelect.addEventListener('change', function() {
      if (rawText) processText(rawText);
    });
  }

  if (output) {
    output.addEventListener('dblclick', function() {
      if (!this.value) return;
      this.select();
      navigator.clipboard.writeText(this.value).then(() => showToast('📋 Đã copy!', 'success'))
        .catch(() => { document.execCommand('copy'); showToast('📋 Đã copy!', 'success'); });
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'v' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault(); pasteBtn.click();
    }
  });

  const container = document.querySelector('.cleaner-container') || document.body;
  container.addEventListener('dragover', function(e) { e.preventDefault(); });
  container.addEventListener('drop', async function(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (/\.(txt|md|html|htm|json|csv)$/i.test(file.name)) {
        try { await processText(await file.text()); showToast('✅ ' + file.name, 'success'); }
        catch { showToast('❌ Không đọc được file', 'error'); }
      } else { showToast('⚠️ Chỉ hỗ trợ file văn bản', 'warning'); }
    }
  });
}

function fallbackComparatorAttachEvents() {
  console.log('[Comparator] Fallback attachEvents');
  const paste1Btn = document.getElementById('comp-paste-1');
  const paste2Btn = document.getElementById('comp-paste-2');
  const compareBtn = document.getElementById('comp-compare-btn');
  const swapBtn = document.getElementById('comp-swap-btn');
  const resultDiv = document.getElementById('comp-result');
  const statusEl = document.getElementById('comp-status');
  const hint = document.getElementById('comp-hint');

  if (!paste1Btn || !paste2Btn) { console.error('[Comparator] Buttons not found'); return; }

  let text1 = '', text2 = '';

  function tokenize(text) {
    if (!text) return [];
    return text.toLowerCase().replace(/\s+/g, ' ').trim().match(/[\wÀ-ỹ]+/g) || [];
  }

  function updateStatus() {
    if (!statusEl) return;
    const w1 = text1 ? tokenize(text1).length : 0;
    const w2 = text2 ? tokenize(text2).length : 0;
    if (!text1 && !text2) statusEl.textContent = '👆 Dán 2 văn bản để so sánh';
    else if (!text1 || !text2) statusEl.textContent = '⏳ Đã dán ' + (w1 || w2) + ' từ · cần thêm 1 văn bản';
    else statusEl.textContent = '✅ Sẵn sàng · VB1: ' + w1 + ' từ · VB2: ' + w2 + ' từ';
  }

  function doCompare() {
    if (!text1.trim() && !text2.trim()) { showToast('⚠️ Vui lòng dán văn bản', 'warning'); return; }
    const words1 = tokenize(text1);
    const words2 = tokenize(text2);
    const freq1 = new Map(), freq2 = new Map();
    words1.forEach(w => freq1.set(w, (freq1.get(w) || 0) + 1));
    words2.forEach(w => freq2.set(w, (freq2.get(w) || 0) + 1));
    const all = new Set([...freq1.keys(), ...freq2.keys()]);
    const added = [], removed = [], common = [];
    all.forEach(w => {
      const c1 = freq1.get(w) || 0, c2 = freq2.get(w) || 0;
      if (c1 === 0 && c2 > 0) added.push({ word: w, count: c2 });
      else if (c1 > 0 && c2 === 0) removed.push({ word: w, count: c1 });
      else common.push(w);
    });
    const similarity = all.size > 0 ? Math.round((common.length / all.size) * 100) : 0;

    let html = '<div style="background:#f0f4ff;padding:12px;border-radius:8px;margin-top:10px;">';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">';
    html += '<span style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;">📊 ' + similarity + '% giống nhau</span>';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;font-size:11px;">';
    html += '<div style="flex:1;min-width:120px;background:#fff3e0;padding:6px;border-radius:6px;"><div style="font-weight:700;color:#e65100;">📄 VB1</div><div>' + words1.length + ' từ · ' + freq1.size + ' độc nhất</div></div>';
    html += '<div style="flex:1;min-width:120px;background:#e8f5e9;padding:6px;border-radius:6px;"><div style="font-weight:700;color:#2e7d32;">📄 VB2</div><div>' + words2.length + ' từ · ' + freq2.size + ' độc nhất</div></div>';
    html += '</div>';
    if (added.length) {
      html += '<div style="background:#e8f5e9;padding:8px;border-radius:6px;margin-bottom:6px;"><div style="font-weight:700;color:#2e7d32;margin-bottom:4px;font-size:12px;">➕ Thêm (' + added.length + ')</div><div style="font-size:11px;line-height:1.6;">';
      added.forEach(w => html += '<span style="display:inline-block;background:#c8e6c9;color:#1b5e20;padding:1px 6px;border-radius:10px;margin:1px;font-size:11px;">' + w.word + ' (' + w.count + ')</span>');
      html += '</div></div>';
    }
    if (removed.length) {
      html += '<div style="background:#ffebee;padding:8px;border-radius:6px;margin-bottom:6px;"><div style="font-weight:700;color:#c62828;margin-bottom:4px;font-size:12px;">➖ Bớt (' + removed.length + ')</div><div style="font-size:11px;line-height:1.6;">';
      removed.forEach(w => html += '<span style="display:inline-block;background:#ffcdd2;color:#b71c1c;padding:1px 6px;border-radius:10px;margin:1px;font-size:11px;">' + w.word + ' (' + w.count + ')</span>');
      html += '</div></div>';
    }
    if (!added.length && !removed.length) html += '<div style="text-align:center;padding:16px;color:var(--text-muted);">✅ Hai văn bản giống nhau hoàn toàn!</div>';
    html += '</div>';

    if (resultDiv) { resultDiv.innerHTML = html; resultDiv.style.display = 'block'; }
    if (hint) hint.style.display = 'none';
  }

  async function pasteTo(setter, btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span>'; btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none';
    try {
      let t = '';
      try { t = await navigator.clipboard.readText(); }
      catch (_) {
        const tmp = document.createElement('textarea');
        tmp.style.cssText = 'position:fixed;opacity:0;pointer-events:none;z-index:-1;';
        document.body.appendChild(tmp); tmp.focus();
        document.execCommand('paste'); t = tmp.value; document.body.removeChild(tmp);
      }
      if (t && t.trim()) { setter(t); updateStatus(); showToast('✅ Đã dán!', 'success'); if (text1 && text2) doCompare(); }
      else { showToast('📝 Clipboard trống', 'info'); }
    } catch (e) { showToast('❌ Lỗi đọc clipboard', 'error'); }
    finally { btn.innerHTML = orig; btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }
  }

  paste1Btn.addEventListener('click', () => pasteTo((t) => { text1 = t; }, paste1Btn));
  paste2Btn.addEventListener('click', () => pasteTo((t) => { text2 = t; }, paste2Btn));

  if (compareBtn) compareBtn.addEventListener('click', doCompare);

  if (swapBtn) {
    swapBtn.addEventListener('click', function() {
      const tmp = text1; text1 = text2; text2 = tmp;
      updateStatus(); if (text1 && text2) doCompare();
    });
  }

  updateStatus();
}

// ============================================
// MAIN PAGES REGISTRATION
// ============================================
PAGES['text-tools'] = {
  render: function() {
    return TEXT_TOOLS_HTML;
  },
  attachEvents: function() {
    console.log('[Text Tools] attachEvents called');
    const container = document.getElementById('tt-skill-content');
    const body = document.getElementById('tt-skill-body');

    if (!container || !body) {
      console.error('[Text Tools] DOM elements not found');
      return;
    }

    document.querySelectorAll('.tt-skill-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const skillId = this.dataset.skill;
        const skill = TEXT_TOOLS_SKILLS[skillId];
        if (!skill) return;

        console.log('[Text Tools] Opening skill:', skillId);

        document.querySelectorAll('.tt-skill-btn').forEach(el => el.style.display = 'none');
        container.style.display = 'block';
        body.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">⏳ Đang tải...</div>';

        const html = SKILL_HTML[skillId];
        if (!html) {
          body.innerHTML = '<div class="form-group"><p style="color:var(--text-muted);">⚠️ Không tìm thấy giao diện.</p></div>';
          return;
        }

        body.innerHTML = html;

        // Thử gọi attachEvents từ PAGES trước
        const page = PAGES[skill.pageName];
        if (page && typeof page.attachEvents === 'function') {
          setTimeout(() => {
            console.log('[Text Tools] Calling attachEvents for', skillId);
            page.attachEvents();
          }, 50);
        } else {
          console.warn('[Text Tools] No attachEvents in PAGES for', skillId, '- using fallback');
          // Fallback inline
          setTimeout(() => {
            if (skillId === 'cleaner') fallbackCleanerAttachEvents();
            else if (skillId === 'comparator') fallbackComparatorAttachEvents();
          }, 50);
        }
      });
    });
  },
  title: '🧹 Text Tools'
};

console.log('[Text Tools] Module loaded');