
// ============================================
// CẤP ĐỘ LỌC
// ============================================
const CLEAN_LEVELS = {
  BASIC: {
    label: '🔰 Cơ bản',
    desc: 'Xóa HTML, Markdown cơ bản',
    removeHtml: true,
    removeMarkdown: true,
    removeUnicodeControl: false,
    removeTableFormatting: false,
    normalizeWhitespace: true,
    removeLeadingSymbols: true,
    removeTrailingSymbols: false,
    cleanInlineCode: false,
  },
  STANDARD: {
    label: '⭐ Tiêu chuẩn',
    desc: 'Xóa định dạng phổ biến, giữ nội dung chính',
    removeHtml: true,
    removeMarkdown: true,
    removeUnicodeControl: true,
    removeTableFormatting: true,
    normalizeWhitespace: true,
    removeLeadingSymbols: true,
    removeTrailingSymbols: true,
    cleanBullets: true,
    cleanNumbers: true,
    cleanQuotes: true,
    cleanSeparators: true,
    cleanInlineCode: true,
  },
  ADVANCED: {
    label: '🚀 Nâng cao',
    desc: 'Xóa tất cả, chỉ giữ text thuần túy',
    removeHtml: true,
    removeMarkdown: true,
    removeUnicodeControl: true,
    removeTableFormatting: true,
    normalizeWhitespace: true,
    removeLeadingSymbols: true,
    removeTrailingSymbols: true,
    cleanBullets: true,
    cleanNumbers: true,
    cleanQuotes: true,
    cleanSeparators: true,
    cleanEmoji: true,
    cleanBoxDrawing: true,
    cleanUnicodeArrows: true,
    cleanSpecialSymbols: true,
    cleanInlineCode: true,
  }
};

// ============================================
// TEXT CLEANER ENGINE
// ============================================
const TextCleanerEngine = {
  clean: function(text, level = 'STANDARD') {
    if (!text || typeof text !== 'string') return text;
    if (text.length > 200000) {
      return '⚠️ Văn bản quá lớn (>200K ký tự). Vui lòng rút gọn.';
    }
    
    const config = CLEAN_LEVELS[level] || CLEAN_LEVELS.STANDARD;
    let result = text;
    
    // 0. TIỀN XỬ LÝ: Xóa backtick và nội dung code block
    if (config.cleanInlineCode) {
      result = this.cleanCodeBlocks(result);
    }
    
    // 1. Xóa HTML
    if (config.removeHtml) {
      result = this.removeHtml(result);
    }
    
    // 2. Xóa Markdown
    if (config.removeMarkdown) {
      result = this.removeMarkdown(result);
    }
    
    // 3. Xóa Unicode control
    if (config.removeUnicodeControl) {
      result = this.removeUnicodeControl(result);
    }
    
    // 4. Xóa định dạng bảng
    if (config.removeTableFormatting) {
      result = this.cleanTables(result);
    }
    
    // 5. Xóa ký tự đầu dòng (thông minh)
    if (config.removeLeadingSymbols) {
      result = this.cleanLeadingSymbols(result);
    }
    
    // 6. Xóa ký tự cuối dòng (thông minh)
    if (config.removeTrailingSymbols) {
      result = this.cleanTrailingSymbols(result);
    }
    
    // 7. Xóa bullet các loại
    if (config.cleanBullets) {
      result = this.cleanBullets(result);
    }
    
    // 8. Xóa số thứ tự
    if (config.cleanNumbers) {
      result = this.cleanNumbering(result);
    }
    
    // 9. Xóa quote/trích dẫn
    if (config.cleanQuotes) {
      result = this.cleanQuotes(result);
    }
    
    // 10. Xóa dấu phân cách
    if (config.cleanSeparators) {
      result = this.cleanSeparators(result);
    }
    
    // 11. Nâng cao
    if (level === 'ADVANCED') {
      result = this.advancedClean(result);
    }
    
    // 12. Normalize cuối cùng
    if (config.normalizeWhitespace) {
      result = this.normalizeWhitespace(result);
    }
    
    return result.trim();
  },

  // ==========================================
  // 0. XÓA CODE BLOCKS VÀ BACKTICK
  // ==========================================
  cleanCodeBlocks: function(text) {
    let result = text;
    result = result.replace(/```([\s\S]*?)```/g, function(match, code) {
      return code.trim();
    });
    result = result.replace(/`([^`]+)`/g, '$1');
    return result;
  },

  // ==========================================
  // 1. XÓA HTML
  // ==========================================
  removeHtml: function(text) {
    return text
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&[a-zA-Z]+;/g, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<hr[^>]*>/gi, '\n');
  },

  // ==========================================
  // 2. XÓA MARKDOWN
  // ==========================================
  removeMarkdown: function(text) {
    return text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^={1,3}\s*/gm, '')
      .replace(/^-{1,3}\s*/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/!\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/^>\s+/gm, '')
      .replace(/^[\s]*[-+*]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      .replace(/^[-*_]{3,}$/gm, '');
  },

  // ==========================================
  // 3. XÓA UNICODE CONTROL
  // ==========================================
  removeUnicodeControl: function(text) {
    const chars = ['\u200B', '\u200C', '\u200D', '\uFEFF', '\u2060', '\u00AD', '\u200E', '\u200F'];
    let result = text;
    for (const char of chars) {
      result = result.replace(new RegExp(char, 'g'), '');
    }
    return result;
  },

  // ==========================================
  // 4. LÀM SẠCH BẢNG
  // ==========================================
  cleanTables: function(text) {
    return text
      .replace(/<table[^>]*>/gi, '')
      .replace(/<\/table>/gi, '\n')
      .replace(/<tr[^>]*>/gi, '')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<td[^>]*>/gi, '')
      .replace(/<\/td>/gi, ' | ')
      .replace(/<th[^>]*>/gi, '')
      .replace(/<\/th>/gi, ' | ')
      .replace(/^\|.+\|$/gm, function(match) {
        const cleaned = match.replace(/\|/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (/^[\s\-:]+$/.test(cleaned)) return '';
        return cleaned;
      })
      .replace(/^[\s]*[\+\-]{3,}[\+\-]+$/gm, '')
      .replace(/^[\s]*\|[- ]+\|/gm, '');
  },

  // ==========================================
  // 5. XÓA KÝ TỰ ĐẦU DÒNG (THÔNG MINH)
  // ==========================================
  cleanLeadingSymbols: function(text) {
    const lines = text.split('\n');
    const result = [];
    
    for (let line of lines) {
      if (!line.trim()) {
        result.push(line);
        continue;
      }
      
      let cleaned = line;
      let iterations = 0;
      const maxIter = 10;
      
      while (iterations < maxIter) {
        let changed = false;
        
        const patterns = [
          { regex: /^[\s]*={3,}\s*/, replace: '' },
          { regex: /^[\s]*-{3,}\s*/, replace: '' },
          { regex: /^[\s]*_{3,}\s*/, replace: '' },
          { regex: /^[\s]*~{3,}\s*/, replace: '' },
          { regex: /^[\s]*\*{3,}\s*/, replace: '' },
          { regex: /^[\s]*\+{3,}\s*/, replace: '' },
          { regex: /^[\s]*>{1,3}\s*/, replace: '' },
          { regex: /^[\s]*[-–—]{1,3}\s*/, replace: '' },
          { regex: /^[\s]*\+{1,3}\s*/, replace: '' },
          { regex: /^[\s]*\*{1,3}\s*/, replace: '' },
          { regex: /^[\s]*_{1,3}\s*/, replace: '' },
          { regex: /^[\s]*~{1,3}\s*/, replace: '' },
          { regex: /^[\s]*:{1,2}\s*/, replace: '' },
          { regex: /^[\s]*;{1,2}\s*/, replace: '' },
          { regex: /^[\s]*[←↑→↓↔↕⇐⇑⇒⇓⇔]\s*/, replace: '' },
          { regex: /^[\s]*[☐☑☒✓✔✗✘]\s*/, replace: '' },
          { regex: /^[\s]*\[[ xX]\]\s*/, replace: '' },
          { regex: /^[\s]*\[[ ]\]\s*/, replace: '' },
          { regex: /^[\s]*[┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬]\s*/, replace: '' },
          { regex: /^[\s]*[┃│║║━═\u2500-\u257F]\s*/, replace: '' },
          { regex: /^[\s]*[•◦▪▫●○◼◻◆◇⏺️️]\s*/, replace: '' },
          { regex: /^[\s]*\d+[.)]\s*/, replace: '' },
          { regex: /^[\s]*\d+\)\s*/, replace: '' },
          { regex: /^[\s]*[a-zA-Z][.)]\s*/, replace: '' },
          { regex: /^[\s]*[a-zA-Z]\)\s*/, replace: '' },
          { regex: /^[\s]*[\(（]\d+[\)）]\s*/, replace: '' },
          { regex: /^[\s]*[\(（][a-zA-Z][\)）]\s*/, replace: '' },
          { regex: /^[\s]*[#@$%&]\s*/, replace: '' },
          { regex: /^[\s]*[=]\s*/, replace: '' },
        ];
        
        for (const pattern of patterns) {
          const before = cleaned;
          cleaned = cleaned.replace(pattern.regex, '');
          if (before !== cleaned) {
            changed = true;
            break;
          }
        }
        
        if (!changed) break;
        iterations++;
      }
      
      result.push(cleaned);
    }
    
    return result.join('\n');
  },

  // ==========================================
  // 6. XÓA KÝ TỰ CUỐI DÒNG (THÔNG MINH)
  // ==========================================
  cleanTrailingSymbols: function(text) {
    const lines = text.split('\n');
    const result = [];
    
    for (let line of lines) {
      let cleaned = line;
      cleaned = cleaned
        .replace(/\s*[-=*_~]{3,}\s*$/, '')
        .replace(/\s*[—–\-]{2,}\s*$/, '')
        .replace(/\s*[\.]{3,}\s*$/, '')
        .replace(/\s*[~]{2,}\s*$/, '')
        .replace(/\s*[+]{2,}\s*$/, '')
        .replace(/\s*[:;]{2,}\s*$/, '')
        .replace(/\s*[←↑→↓↔↕⇐⇑⇒⇓⇔]\s*$/, '')
        .replace(/\s*[☐☑☒✓✔✗✘]\s*$/, '')
        .replace(/\s*[•◦▪▫●○◼◻◆◇]\s*$/, '');
      
      result.push(cleaned);
    }
    
    return result.join('\n');
  },

  // ==========================================
  // 7. XÓA BULLET
  // ==========================================
  cleanBullets: function(text) {
    return text
      .replace(/^[\s]*[•◦▪▫●○◼◻◆◇⏺️️]\s*/gm, '')
      .replace(/^[\s]*[-+*]\s+/gm, '')
      .replace(/^[\s]*[→▶►▸]\s*/gm, '');
  },

  // ==========================================
  // 8. XÓA SỐ THỨ TỰ
  // ==========================================
  cleanNumbering: function(text) {
    return text
      .replace(/^[\s]*\d+[.)]\s*/gm, '')
      .replace(/^[\s]*\d+\)\s*/gm, '')
      .replace(/^[\s]*[a-zA-Z][.)]\s*/gm, '')
      .replace(/^[\s]*[a-zA-Z]\)\s*/gm, '')
      .replace(/^[\s]*[\(（]\d+[\)）]\s*/gm, '')
      .replace(/^[\s]*[\(（][a-zA-Z][\)）]\s*/gm, '');
  },

  // ==========================================
  // 9. XÓA QUOTE
  // ==========================================
  cleanQuotes: function(text) {
    return text
      .replace(/^[\s]*>{1,3}\s*/gm, '')
      .replace(/"(.+?)"/g, '$1')
      .replace(/'(.+?)'/g, '$1')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'");
  },

  // ==========================================
  // 10. XÓA DẤU PHÂN CÁCH
  // ==========================================
  cleanSeparators: function(text) {
    return text
      .replace(/^[\s]*[-=*_~]{3,}\s*$/gm, '')
      .replace(/^[\s]*[-=*_~]{3,}\s*/gm, '')
      .replace(/\s*[-=*_~]{3,}\s*$/gm, '')
      .replace(/^[\s]*[—–\-]{2,}\s*$/gm, '')
      .replace(/^[\s]*[\.]{3,}\s*$/gm, '')
      .replace(/^[\s]*[~]{2,}\s*$/gm, '');
  },

  // ==========================================
  // 11. NÂNG CAO
  // ==========================================
  advancedClean: function(text) {
    return text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u2500-\u257F]/g, '')
      .replace(/[\u2190-\u21FF\u27F0-\u27FF]/g, '')
      .replace(/[•◦▪▫◆◇⏺️→✔✓✦✧►▸]/g, '')
      .replace(/[☐☑☒✓✔✗✘]/g, '')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/[—–-]/g, '-')
      .replace(/^\t+/gm, '')
      .replace(/^[ ]{4,}/gm, '  ')
      .trim();
  },

  // ==========================================
  // 12. NORMALIZE WHITESPACE
  // ==========================================
  normalizeWhitespace: function(text) {
    return text
      .replace(/\t/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/^[ \t]+/gm, '')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '');
  }
};

// ============================================
// LOAD HTML TEMPLATE
// ============================================
let textCleanerHTML = '';

async function loadTextCleanerHTML() {
  try {
    const response = await fetch(chrome.runtime.getURL('src/features/textcleaner/textcleaner.html'));
    textCleanerHTML = await response.text();
  } catch (e) {
    console.error('Không thể load textcleaner.html:', e);
    textCleanerHTML = `
      <div class="textcleaner-container">
        <button id="tc-paste-btn" class="action-btn primary" style="width:100%; padding:10px; background: linear-gradient(135deg, #2ECC71, #27AE60); margin-bottom:10px;">
          📋 Dán văn bản từ clipboard
        </button>
        <div style="display:flex; gap:8px; margin-bottom:10px;">
          <select id="tc-level" style="flex:1; padding:8px; border:1px solid var(--border); border-radius:var(--radius-sm);">
            <option value="BASIC">🔰 Cơ bản</option>
            <option value="STANDARD" selected>⭐ Tiêu chuẩn</option>
            <option value="ADVANCED">🚀 Nâng cao</option>
          </select>
          <button id="tc-clean-btn" class="action-btn primary" style="flex:1; padding:8px; background: linear-gradient(135deg, #3498db, #2980b9);">
            🧹 Làm sạch & Copy
          </button>
        </div>
        <div class="form-group">
          <label style="font-size:12px; color:var(--text-muted);">✨ Kết quả:</label>
          <textarea id="tc-output" rows="3" readonly placeholder="Kết quả sẽ hiển thị ở đây..."></textarea>
        </div>
        <div class="status-bar">
          <span class="dot"></span>
          <span id="tc-status">Sẵn sàng</span>
        </div>
      </div>
    `;
  }
}

// ============================================
// POPUP PAGE
// ============================================
PAGES.textcleaner = {
  render: function() {
    return textCleanerHTML || '<p>Đang tải...</p>';
  },

  attachEvents: function() {
    const output = document.getElementById('tc-output');
    const status = document.getElementById('tc-status');
    const statusDot = document.getElementById('tc-status-dot');
    const stats = document.getElementById('tc-stats');

    if (!output) {
      console.error('[TextCleaner] DOM elements not found');
      return;
    }

    // Biến lưu text gốc (ẩn)
    let rawText = '';

    // ==========================================
    // 1. NÚT DÁN TỪ CLIPBOARD
    // ==========================================
    const pasteBtn = document.getElementById('tc-paste-btn');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', async function() {
        const originalText = this.innerText;
        this.innerText = '⏳ Đang đọc...';
        this.style.opacity = '0.7';
        this.style.pointerEvents = 'none';

        try {
          let text = '';

          // Thử đọc clipboard
          try {
            text = await navigator.clipboard.readText();
          } catch (readErr) {
            // Fallback: execCommand
            try {
              const tempInput = document.createElement('textarea');
              tempInput.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
              document.body.appendChild(tempInput);
              tempInput.focus();
              document.execCommand('paste');
              text = tempInput.value;
              document.body.removeChild(tempInput);
            } catch (execErr) {
              console.warn('[TextCleaner] execCommand error:', execErr);
            }
          }

          if (text && text.trim()) {
            rawText = text;
            // Tự động clean
            const cleanBtn = document.getElementById('tc-clean-btn');
            if (cleanBtn) {
              setTimeout(() => cleanBtn.click(), 150);
            }
            if (status) {
              status.textContent = '✅ Đã lấy dữ liệu';
              status.style.color = '#27ae60';
              if (statusDot) statusDot.style.background = '#27ae60';
            }
          } else {
            // Không có text → hướng dẫn dán thủ công
            showToast('📝 Vui lòng dán thủ công (Ctrl+V)', 'info');
            
            // Tạo input tạm để dán thủ công
            const tempInput = document.createElement('textarea');
            tempInput.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 80%;
              height: 200px;
              padding: 16px;
              font-size: 14px;
              border: 2px solid #2ECC71;
              border-radius: 8px;
              z-index: 99999;
              background: white;
              box-shadow: 0 8px 32px rgba(0,0,0,0.2);
              font-family: inherit;
            `;
            tempInput.placeholder = '📝 Dán văn bản vào đây... (Ctrl+V)';
            document.body.appendChild(tempInput);
            tempInput.focus();

            // Xử lý khi dán
            const pasteHandler = function(e) {
              const pasted = e.clipboardData?.getData('text') || tempInput.value;
              if (pasted && pasted.trim()) {
                rawText = pasted;
                document.body.removeChild(tempInput);
                const cleanBtn = document.getElementById('tc-clean-btn');
                if (cleanBtn) setTimeout(() => cleanBtn.click(), 150);
                if (status) {
                  status.textContent = '✅ Đã nhận dữ liệu';
                  status.style.color = '#27ae60';
                  if (statusDot) statusDot.style.background = '#27ae60';
                }
                showToast('✅ Đã nhận văn bản!', 'success');
              }
            };

            tempInput.addEventListener('paste', pasteHandler);
            tempInput.addEventListener('input', function() {
              if (this.value.trim()) {
                rawText = this.value;
                document.body.removeChild(tempInput);
                const cleanBtn = document.getElementById('tc-clean-btn');
                if (cleanBtn) setTimeout(() => cleanBtn.click(), 150);
                if (status) {
                  status.textContent = '✅ Đã nhận dữ liệu';
                  status.style.color = '#27ae60';
                  if (statusDot) statusDot.style.background = '#27ae60';
                }
                showToast('✅ Đã nhận văn bản!', 'success');
              }
            });

            // Tự động đóng sau 30s
            setTimeout(() => {
              if (document.body.contains(tempInput)) {
                document.body.removeChild(tempInput);
                if (status) {
                  status.textContent = '⏰ Hết thời gian chờ';
                  status.style.color = '#e74c3c';
                  if (statusDot) statusDot.style.background = '#e74c3c';
                }
              }
            }, 30000);
          }

        } catch (err) {
          console.error('[TextCleaner] Clipboard error:', err);
          showToast('❌ Lỗi clipboard. Vui lòng dán thủ công', 'error');
          if (status) {
            status.textContent = '❌ Lỗi đọc clipboard';
            status.style.color = '#e74c3c';
            if (statusDot) statusDot.style.background = '#e74c3c';
          }
        }

        this.innerText = originalText;
        this.style.opacity = '1';
        this.style.pointerEvents = 'auto';
      });
    }

    // ==========================================
    // 2. NÚT LÀM SẠCH & COPY
    // ==========================================
    const cleanBtn = document.getElementById('tc-clean-btn');
    if (cleanBtn) {
      cleanBtn.addEventListener('click', function() {
        if (!rawText || !rawText.trim()) {
          showToast('⚠️ Chưa có dữ liệu. Hãy dán từ clipboard trước.', 'warning');
          if (status) {
            status.textContent = '⚠️ Chưa có dữ liệu';
            status.style.color = '#f39c12';
            if (statusDot) statusDot.style.background = '#f39c12';
          }
          return;
        }

        const level = document.getElementById('tc-level')?.value || 'STANDARD';
        const startTime = performance.now();
        
        // Làm sạch
        const result = TextCleanerEngine.clean(rawText, level);
        const elapsed = (performance.now() - startTime).toFixed(1);
        
        output.value = result;
        
        const inputLen = rawText.length;
        const outputLen = result.length;
        const reduction = inputLen > 0 ? ((1 - outputLen / inputLen) * 100).toFixed(1) : 0;
        
        if (stats) {
          stats.textContent = `${inputLen} → ${outputLen} ký tự (giảm ${reduction}%) • ${elapsed}ms`;
        }
        
        // Tự động copy
        if (result && result.trim()) {
          navigator.clipboard.writeText(result)
            .then(() => {
              if (status) {
                status.textContent = `✅ Đã làm sạch & copy (${elapsed}ms)`;
                status.style.color = '#27ae60';
                if (statusDot) statusDot.style.background = '#27ae60';
              }
              showToast('📋 Đã copy kết quả!', 'success');
            })
            .catch(() => {
              output.select();
              document.execCommand('copy');
              if (status) {
                status.textContent = `✅ Đã làm sạch & copy (${elapsed}ms)`;
                status.style.color = '#27ae60';
                if (statusDot) statusDot.style.background = '#27ae60';
              }
              showToast('📋 Đã copy kết quả!', 'success');
            });
        } else {
          if (status) {
            status.textContent = '⚠️ Kết quả trống';
            status.style.color = '#f39c12';
            if (statusDot) statusDot.style.background = '#f39c12';
          }
        }
      });
    }

    // ==========================================
    // 3. PHÍM TẮT Ctrl+V
    // ==========================================
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'v') {
        if (document.activeElement?.tagName !== 'TEXTAREA' && 
            document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          const pasteBtn = document.getElementById('tc-paste-btn');
          if (pasteBtn) pasteBtn.click();
        }
      }
    });

    // ==========================================
    // 4. CLEAN KHI THAY ĐỔI CẤP ĐỘ
    // ==========================================
    const levelSelect = document.getElementById('tc-level');
    if (levelSelect) {
      levelSelect.addEventListener('change', function() {
        if (rawText && rawText.trim()) {
          const cleanBtn = document.getElementById('tc-clean-btn');
          if (cleanBtn) cleanBtn.click();
        }
      });
    }
  },

  title: '🧹 Làm sạch Text'
};

// ============================================
// LOAD HTML KHI KHỞI ĐỘNG
// ============================================
loadTextCleanerHTML();