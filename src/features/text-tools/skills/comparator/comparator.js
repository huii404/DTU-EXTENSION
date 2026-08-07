// ============================================
// COMPARATOR - SO SÁNH VĂN BẢN (UI ẨN INPUT)
// ============================================

const ComparatorEngine = {
  tokenize: function(text) {
    if (!text || typeof text !== 'string') return [];
    return text.toLowerCase().replace(/\s+/g, ' ').trim().match(/[\wÀ-ỹ]+/g) || [];
  },
  getFreq: function(words) {
    const freq = new Map();
    for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
    return freq;
  },
  compare: function(text1, text2) {
    const start = performance.now();
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);
    const freq1 = this.getFreq(words1);
    const freq2 = this.getFreq(words2);
    const all = new Set([...freq1.keys(), ...freq2.keys()]);
    const result = {
      totalWords1: words1.length, totalWords2: words2.length,
      uniqueWords1: freq1.size, uniqueWords2: freq2.size,
      added: [], removed: [], common: [], freqDiff: [],
      similarity: 0, processingTime: 0
    };
    for (const w of all) {
      const c1 = freq1.get(w) || 0, c2 = freq2.get(w) || 0;
      if (c1 === 0 && c2 > 0) result.added.push({ word: w, count: c2 });
      else if (c1 > 0 && c2 === 0) result.removed.push({ word: w, count: c1 });
      else {
        result.common.push({ word: w, count1: c1, count2: c2 });
        if (c1 !== c2) result.freqDiff.push({ word: w, count1: c1, count2: c2, diff: c2 - c1, absDiff: Math.abs(c2 - c1) });
      }
    }
    result.added.sort((a, b) => b.count - a.count);
    result.removed.sort((a, b) => b.count - a.count);
    result.freqDiff.sort((a, b) => b.absDiff - a.absDiff);
    const inter = result.common.length;
    const union = result.added.length + result.removed.length + inter;
    result.similarity = union > 0 ? Math.round((inter / union) * 100) : 0;
    result.processingTime = Math.round(performance.now() - start);
    return result;
  },

  lcs: function(text1, text2) {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);
    const m = words1.length, n = words2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = words1[i - 1] === words2[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    const lcsWords = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (words1[i - 1] === words2[j - 1]) { lcsWords.unshift(words1[i - 1]); i--; j--; }
      else if (dp[i - 1][j] > dp[i][j - 1]) i--; else j--;
    }
    return lcsWords;
  },

  diffLines: function(text1, text2) {
    const lines1 = text1.split('\n').map(l => l.trim()).filter(l => l);
    const lines2 = text2.split('\n').map(l => l.trim()).filter(l => l);
    const result = [];
    let i = 0, j = 0;
    while (i < lines1.length || j < lines2.length) {
      if (i >= lines1.length) { result.push({ type: 'added', line: lines2[j] }); j++; }
      else if (j >= lines2.length) { result.push({ type: 'removed', line: lines1[i] }); i++; }
      else if (lines1[i] === lines2[j]) { result.push({ type: 'same', line: lines1[i] }); i++; j++; }
      else {
        const foundIn2 = lines2.slice(j + 1).indexOf(lines1[i]);
        const foundIn1 = lines1.slice(i + 1).indexOf(lines2[j]);
        if (foundIn2 !== -1 && (foundIn1 === -1 || foundIn2 <= foundIn1)) { result.push({ type: 'added', line: lines2[j] }); j++; }
        else if (foundIn1 !== -1) { result.push({ type: 'removed', line: lines1[i] }); i++; }
        else { result.push({ type: 'modified', line1: lines1[i], line2: lines2[j] }); i++; j++; }
      }
    }
    return result;
  },

  renderResult: function(result, text1, text2) {
    let html = `<div style="background:#f0f4ff; padding:12px; border-radius:8px; margin-top:10px;">`;

    // Stats
    html += `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">`;
    html += `<span style="background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:700;">📊 ${result.similarity}% giống nhau</span>`;
    html += `<span style="background:#e3f2fd; color:#1565c0; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600;">⏱️ ${result.processingTime}ms</span>`;
    html += `</div>`;

    // Word counts
    html += `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; font-size:11px;">`;
    html += `<div style="flex:1; min-width:120px; background:#fff3e0; padding:6px; border-radius:6px;"><div style="font-weight:700; color:#e65100;">📄 VB 1</div><div>${result.totalWords1} từ · ${result.uniqueWords1} độc nhất</div></div>`;
    html += `<div style="flex:1; min-width:120px; background:#e8f5e9; padding:6px; border-radius:6px;"><div style="font-weight:700; color:#2e7d32;">📄 VB 2</div><div>${result.totalWords2} từ · ${result.uniqueWords2} độc nhất</div></div>`;
    html += `</div>`;

    // Tabs
    html += `<div class="comp-tabs" style="display:flex; gap:4px; margin-bottom:8px; border-bottom:2px solid #e0e0e0; padding-bottom:4px;">`;
    html += `<button class="comp-tab active" data-tab="summary" style="padding:5px 10px; border:none; background:transparent; cursor:pointer; font-size:12px; font-weight:600; color:var(--dtu-red); border-bottom:2px solid var(--dtu-red); margin-bottom:-6px;">Tóm tắt</button>`;
    html += `<button class="comp-tab" data-tab="diff" style="padding:5px 10px; border:none; background:transparent; cursor:pointer; font-size:12px; font-weight:600; color:var(--text-muted); margin-bottom:-6px;">So dòng</button>`;
    html += `<button class="comp-tab" data-tab="lcs" style="padding:5px 10px; border:none; background:transparent; cursor:pointer; font-size:12px; font-weight:600; color:var(--text-muted); margin-bottom:-6px;">Chung</button>`;
    html += `</div>`;

    // Tab: Summary
    html += `<div class="comp-tab-content" data-content="summary">`;
    if (result.added.length) {
      html += `<div style="background:#e8f5e9; padding:8px; border-radius:6px; margin-bottom:6px;">`;
      html += `<div style="font-weight:700; color:#2e7d32; margin-bottom:4px; font-size:12px;">➕ Thêm (${result.added.length})</div>`;
      html += `<div style="font-size:11px; line-height:1.6;">`;
      result.added.forEach(w => html += `<span style="display:inline-block; background:#c8e6c9; color:#1b5e20; padding:1px 6px; border-radius:10px; margin:1px; font-size:11px;">${w.word} (${w.count})</span>`);
      html += `</div></div>`;
    }
    if (result.removed.length) {
      html += `<div style="background:#ffebee; padding:8px; border-radius:6px; margin-bottom:6px;">`;
      html += `<div style="font-weight:700; color:#c62828; margin-bottom:4px; font-size:12px;">➖ Bớt (${result.removed.length})</div>`;
      html += `<div style="font-size:11px; line-height:1.6;">`;
      result.removed.forEach(w => html += `<span style="display:inline-block; background:#ffcdd2; color:#b71c1c; padding:1px 6px; border-radius:10px; margin:1px; font-size:11px;">${w.word} (${w.count})</span>`);
      html += `</div></div>`;
    }
    if (result.freqDiff.length) {
      html += `<div style="background:#fff3e0; padding:8px; border-radius:6px; margin-bottom:6px;">`;
      html += `<div style="font-weight:700; color:#e65100; margin-bottom:4px; font-size:12px;">🔄 Khác tần suất (${result.freqDiff.length})</div>`;
      html += `<div style="font-size:11px; line-height:1.6;">`;
      result.freqDiff.slice(0, 20).forEach(w => {
        const arrow = w.diff > 0 ? '↑' : '↓';
        html += `<span style="display:inline-block; background:#ffe0b2; color:#e65100; padding:1px 6px; border-radius:10px; margin:1px; font-size:11px;">${w.word}: ${w.count1}${arrow}${w.count2}</span>`;
      });
      if (result.freqDiff.length > 20) html += `<span style="font-size:11px; color:#999;">+${result.freqDiff.length - 20} khác...</span>`;
      html += `</div></div>`;
    }
    if (!result.added.length && !result.removed.length && !result.freqDiff.length)
      html += `<div style="text-align:center; padding:16px; color:var(--text-muted);">✅ Hai văn bản giống nhau hoàn toàn!</div>`;
    html += `</div>`;

    // Tab: Diff
    html += `<div class="comp-tab-content" data-content="diff" style="display:none;">`;
    const diffResult = this.diffLines(text1 || '', text2 || '');
    if (!diffResult.length) html += `<div style="text-align:center; padding:16px; color:var(--text-muted);">Không có dữ liệu</div>`;
    else {
      html += `<div style="font-family:monospace; font-size:10px; line-height:1.6; max-height:250px; overflow-y:auto;">`;
      diffResult.forEach(item => {
        if (item.type === 'same') html += `<div style="padding:1px 4px; color:#666;"><span style="color:#999; margin-right:6px;"> </span>${this.escapeHtml(item.line)}</div>`;
        else if (item.type === 'added') html += `<div style="padding:1px 4px; background:#e8f5e9; color:#2e7d32;"><span style="margin-right:6px; font-weight:700;">+</span>${this.escapeHtml(item.line)}</div>`;
        else if (item.type === 'removed') html += `<div style="padding:1px 4px; background:#ffebee; color:#c62828;"><span style="margin-right:6px; font-weight:700;">−</span>${this.escapeHtml(item.line)}</div>`;
        else if (item.type === 'modified') html += `<div style="padding:1px 4px; background:#fff3e0;"><span style="margin-right:6px; font-weight:700;">~</span>${this.escapeHtml(item.line1)}</div><div style="padding:1px 4px; background:#fff3e0; margin-left:16px;"><span style="margin-right:6px; font-weight:700;">→</span>${this.escapeHtml(item.line2)}</div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;

    // Tab: LCS
    html += `<div class="comp-tab-content" data-content="lcs" style="display:none;">`;
    const lcsWords = this.lcs(text1 || '', text2 || '');
    if (!lcsWords.length) html += `<div style="text-align:center; padding:16px; color:var(--text-muted);">Không tìm thấy đoạn chung</div>`;
    else {
      html += `<div style="font-size:11px; margin-bottom:6px; color:var(--text-muted);">📏 ${lcsWords.length} từ chung</div>`;
      html += `<div style="background:#e3f2fd; padding:8px; border-radius:6px; font-size:11px; line-height:1.6;">`;
      html += lcsWords.map(w => `<span style="display:inline-block; background:#bbdefb; color:#1565c0; padding:1px 6px; border-radius:10px; margin:1px; font-size:11px;">${w}</span>`).join(' ');
      html += `</div>`;
    }
    html += `</div>`;

    // Buttons
    html += `<div style="display:flex; gap:6px; margin-top:10px;">`;
    html += `<button class="comp-copy-all" style="flex:1; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">📋 Báo cáo</button>`;
    html += `<button class="comp-copy-added" style="flex:1; background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">➕ Từ thêm</button>`;
    html += `<button class="comp-copy-removed" style="flex:1; background:#ffebee; color:#c62828; border:1px solid #ef9a9a; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">➖ Từ bớt</button>`;
    html += `</div>`;

    html += `</div>`;
    return html;
  },

  escapeHtml: function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

function generateReport(result) {
  let r = `BÁO CÁO SO SÁNH VĂN BẢN\n═══════════════════════\n`;
  r += `Độ tương đồng: ${result.similarity}%\nThờigian: ${result.processingTime}ms\n\n`;
  r += `VB 1: ${result.totalWords1} từ (${result.uniqueWords1} độc nhất)\n`;
  r += `VB 2: ${result.totalWords2} từ (${result.uniqueWords2} độc nhất)\n\n`;
  if (result.added.length) r += `➕ Thêm (${result.added.length}):\n${result.added.map(w => `  • ${w.word}: ${w.count}`).join('\n')}\n\n`;
  if (result.removed.length) r += `➖ Bớt (${result.removed.length}):\n${result.removed.map(w => `  • ${w.word}: ${w.count}`).join('\n')}\n\n`;
  if (result.freqDiff.length) r += `🔄 Khác tần suất (${result.freqDiff.length}):\n${result.freqDiff.map(w => `  • ${w.word}: ${w.count1} → ${w.count2}`).join('\n')}\n\n`;
  if (!result.added.length && !result.removed.length && !result.freqDiff.length) r += `✅ Giống nhau hoàn toàn!\n`;
  return r;
}

// ============================================
// ATTACH EVENTS - UI ẨN INPUT
// ============================================
function comparatorAttachEvents() {
  console.log('[Comparator] attachEvents called');

  const paste1Btn = document.getElementById('comp-paste-1');
  const paste2Btn = document.getElementById('comp-paste-2');
  const compareBtn = document.getElementById('comp-compare-btn');
  const swapBtn = document.getElementById('comp-swap-btn');
  const resultDiv = document.getElementById('comp-result');
  const statusEl = document.getElementById('comp-status');

  if (!paste1Btn || !paste2Btn || !resultDiv) {
    console.error('[Comparator] Missing DOM elements');
    return;
  }

  let text1 = '';
  let text2 = '';
  let lastResult = null;
  let isProcessing = false;

  function updateStatus() {
    if (!statusEl) return;
    const w1 = text1 ? ComparatorEngine.tokenize(text1).length : 0;
    const w2 = text2 ? ComparatorEngine.tokenize(text2).length : 0;
    if (!text1 && !text2) statusEl.textContent = '👆 Dán 2 văn bản để so sánh';
    else if (!text1 || !text2) statusEl.textContent = `📋 Đã dán ${w1 + w2 > 0 ? w1 + ' từ' : ''} · cần thêm 1 văn bản nữa`;
    else statusEl.textContent = `✅ Sẵn sàng · VB1: ${w1} từ · VB2: ${w2} từ`;
  }

  async function doCompare() {
    if (!text1.trim() && !text2.trim()) {
      showToast('⚠️ Vui lòng dán văn bản', 'warning');
      return;
    }
    if (isProcessing) return;
    isProcessing = true;

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-muted);">⏳ Đang so sánh...</div>`;

    setTimeout(() => {
      const result = ComparatorEngine.compare(text1, text2);
      lastResult = result;
      resultDiv.innerHTML = ComparatorEngine.renderResult(result, text1, text2);

      // Tab switching
      document.querySelectorAll('.comp-tab').forEach(tab => {
        tab.addEventListener('click', function() {
          const target = this.dataset.tab;
          document.querySelectorAll('.comp-tab').forEach(t => {
            t.style.color = 'var(--text-muted)';
            t.style.borderBottom = 'none';
            t.classList.remove('active');
          });
          this.style.color = 'var(--dtu-red)';
          this.style.borderBottom = '2px solid var(--dtu-red)';
          this.classList.add('active');
          document.querySelectorAll('.comp-tab-content').forEach(c => {
            c.style.display = c.dataset.content === target ? 'block' : 'none';
          });
        });
      });

      // Copy buttons
      document.querySelector('.comp-copy-all')?.addEventListener('click', function() {
        navigator.clipboard.writeText(generateReport(lastResult)).then(() => showToast('✅ Đã copy báo cáo!', 'success'))
          .catch(() => showToast('❌ Lỗi copy', 'error'));
      });
      document.querySelector('.comp-copy-added')?.addEventListener('click', function() {
        navigator.clipboard.writeText(lastResult.added.map(w => w.word).join(', ')).then(() => showToast('✅ Đã copy từ thêm!', 'success'))
          .catch(() => showToast('❌ Lỗi copy', 'error'));
      });
      document.querySelector('.comp-copy-removed')?.addEventListener('click', function() {
        navigator.clipboard.writeText(lastResult.removed.map(w => w.word).join(', ')).then(() => showToast('✅ Đã copy từ bớt!', 'success'))
          .catch(() => showToast('❌ Lỗi copy', 'error'));
      });

      isProcessing = false;
    }, 50);
  }

  async function pasteFromClipboard(setter, btn) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span>';
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';

    try {
      let t = '';
      try { t = await navigator.clipboard.readText(); }
      catch (_) {
        const tmp = document.createElement('textarea');
        tmp.style.cssText = 'position:fixed;opacity:0;pointer-events:none;z-index:-1;';
        document.body.appendChild(tmp); tmp.focus();
        document.execCommand('paste');
        t = tmp.value; document.body.removeChild(tmp);
      }
      if (t && t.trim()) {
        setter(t);
        updateStatus();
        showToast('✅ Đã dán!', 'success');
        if (text1 && text2) doCompare();
      } else { showToast('📝 Clipboard trống', 'info'); }
    } catch (err) {
      showToast('❌ Lỗi đọc clipboard', 'error');
    } finally {
      btn.innerHTML = originalHTML;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
  }

  paste1Btn.addEventListener('click', () => pasteFromClipboard((t) => { text1 = t; }, paste1Btn));
  paste2Btn.addEventListener('click', () => pasteFromClipboard((t) => { text2 = t; }, paste2Btn));

  if (compareBtn) compareBtn.addEventListener('click', doCompare);

  if (swapBtn) {
    swapBtn.addEventListener('click', function() {
      const tmp = text1; text1 = text2; text2 = tmp;
      updateStatus();
      if (text1 && text2) doCompare();
    });
  }

  // Drag & drop
  const container = document.querySelector('.comparator-container') || document.body;
  container.addEventListener('dragover', function(e) { e.preventDefault(); });
  container.addEventListener('drop', async function(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (/\.(txt|md|html|htm|json|csv)$/i.test(file.name)) {
        try {
          const t = await file.text();
          if (!text1) { text1 = t; showToast(`✅ VB1: ${file.name}`, 'success'); }
          else { text2 = t; showToast(`✅ VB2: ${file.name}`, 'success'); }
          updateStatus();
          if (text1 && text2) doCompare();
        } catch { showToast('❌ Không đọc được file', 'error'); }
      } else { showToast('⚠️ Chỉ hỗ trợ file văn bản', 'warning'); }
    }
  });

  updateStatus();
  console.log('[Comparator] Events attached (hidden input mode)');
}

// Đăng ký PAGES
PAGES.comparator = {
  render: () => '',
  attachEvents: comparatorAttachEvents,
  title: '🆚 So sánh văn bản'
};

console.log('[Comparator] Module loaded');