// ============================================
// Multi Tool Hub - Text Cleaner Feature
// ============================================

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
    
    // Xóa code block ```...``` nhưng giữ nội dung
    result = result.replace(/```([\s\S]*?)```/g, function(match, code) {
      return code.trim();
    });
    
    // Xóa inline code `...` nhưng giữ nội dung
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
  },

  // ==========================================
  // PHÁT HIỆN ĐỊNH DẠNG
  // ==========================================
  detect: function(text) {
    const result = {
      hasHtml: false,
      hasMarkdown: false,
      hasUnicodeControl: false,
      hasTable: false,
      hasBullets: false,
      hasNumbering: false,
      hasQuotes: false,
      hasSeparators: false,
      hasEmoji: false,
      hasBoxDrawing: false,
      hasArrows: false,
      hasCodeBlock: false,
      details: []
    };
    
    if (/<[a-z][\s\S]*>/i.test(text) || /&[a-zA-Z]+;/.test(text)) {
      result.hasHtml = true;
      result.details.push('HTML tags');
    }
    
    if (/\*\*|__|```|`|\[.*\]\(/.test(text)) {
      result.hasMarkdown = true;
      result.details.push('Markdown');
    }
    
    if (/[\u200B-\u200F\uFEFF\u2060\u00AD]/.test(text)) {
      result.hasUnicodeControl = true;
      result.details.push('Unicode control chars');
    }
    
    if (/\|.*\|/.test(text) || /[\+\-]{10,}/.test(text) || /<table/i.test(text)) {
      result.hasTable = true;
      result.details.push('Table');
    }
    
    if (/^[\s]*[•◦▪▫●○◼◻◆◇⏺️]\s/m.test(text)) {
      result.hasBullets = true;
      result.details.push('Bullets');
    }
    
    if (/^[\s]*\d+[.)]\s/m.test(text) || /^[\s]*[a-zA-Z][.)]\s/m.test(text)) {
      result.hasNumbering = true;
      result.details.push('Numbering');
    }
    
    if (/^[\s]*>+\s/m.test(text) || /^[\s]*\[[ x]\].*/m.test(text)) {
      result.hasQuotes = true;
      result.details.push('Quotes/Checkbox');
    }
    
    if (/^[\s]*[-=*_~]{3,}\s*$/m.test(text)) {
      result.hasSeparators = true;
      result.details.push('Separators');
    }
    
    if (/[\u{1F600}-\u{1F64F}]/u.test(text)) {
      result.hasEmoji = true;
      result.details.push('Emoji');
    }
    
    if (/[\u2500-\u257F]/.test(text)) {
      result.hasBoxDrawing = true;
      result.details.push('Box drawing');
    }
    
    if (/[\u2190-\u21FF]/.test(text)) {
      result.hasArrows = true;
      result.details.push('Arrows');
    }
    
    if (/```|`[^`]+`/.test(text)) {
      result.hasCodeBlock = true;
      result.details.push('Code blocks');
    }
    
    return result;
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
    // Fallback HTML nếu không load được
    textCleanerHTML = `
      <div class="textcleaner-container">
        <div class="form-group">
          <label><span class="icon">📝</span> Dán văn bản cần làm sạch:</label>
          <textarea id="tc-input" rows="6" placeholder="Paste text..."></textarea>
        </div>
        <button id="tc-clean-btn" class="action-btn primary" style="background: linear-gradient(135deg, #2ECC71, #27AE60);">
          <span class="icon-circle">🧹</span>
          <span>Làm sạch</span>
        </button>
        <div class="form-group">
          <label><span class="icon">✨</span> Kết quả:</label>
          <textarea id="tc-output" rows="6" readonly></textarea>
        </div>
        <div class="status-bar">
          <span class="dot"></span>
          <span id="tc-status">Dán text và bấm "Làm sạch"</span>
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
    const input = document.getElementById('tc-input');
    const output = document.getElementById('tc-output');
    const status = document.getElementById('tc-status');
    const statusDot = document.getElementById('tc-status-dot');
    const stats = document.getElementById('tc-stats');
    const detection = document.getElementById('tc-detection');
    const detectionText = document.getElementById('tc-detection-text');

    // Kiểm tra các element đã tồn tại chưa
    if (!input || !output) {
      console.error('[TextCleaner] DOM elements not found');
      return;
    }

    // ===== NÚT LÀM SẠCH =====
    const cleanBtn = document.getElementById('tc-clean-btn');
    if (cleanBtn) {
      cleanBtn.addEventListener('click', function() {
        const text = input.value;
        
        if (!text.trim()) {
          if (status) {
            status.textContent = '⚠️ Vui lòng dán văn bản cần làm sạch';
            status.style.color = '#f39c12';
            if (statusDot) statusDot.style.background = '#f39c12';
          }
          return;
        }

        const level = document.getElementById('tc-level')?.value || 'STANDARD';
        const startTime = performance.now();
        
        // Phát hiện định dạng
        const detectResult = TextCleanerEngine.detect(text);
        if (detection && detectionText) {
          if (detectResult.details.length > 0) {
            detection.style.display = 'block';
            detectionText.textContent = detectResult.details.join(' • ');
          } else {
            detection.style.display = 'none';
          }
        }
        
        // Làm sạch
        const result = TextCleanerEngine.clean(text, level);
        const elapsed = (performance.now() - startTime).toFixed(1);
        
        output.value = result;
        
        const inputLen = text.length;
        const outputLen = result.length;
        const reduction = inputLen > 0 ? ((1 - outputLen / inputLen) * 100).toFixed(1) : 0;
        
        if (stats) {
          stats.textContent = `${inputLen} → ${outputLen} ký tự (giảm ${reduction}%) • ${elapsed}ms`;
        }
        
        if (status) {
          status.textContent = `✅ Làm sạch thành công!`;
          status.style.color = '#27ae60';
          if (statusDot) statusDot.style.background = '#27ae60';
        }
      });
    }

    // ===== NÚT COPY =====
    const copyBtn = document.getElementById('tc-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        const text = output.value;
        if (!text) {
          showToast('⚠️ Chưa có kết quả để copy', 'warning');
          return;
        }
        
        navigator.clipboard.writeText(text)
          .then(() => {
            showToast('📋 Đã copy vào clipboard!', 'success');
            if (status) {
              status.textContent = '📋 Đã copy!';
              status.style.color = '#3498db';
              if (statusDot) statusDot.style.background = '#3498db';
            }
          })
          .catch(() => {
            output.select();
            document.execCommand('copy');
            showToast('📋 Đã copy!', 'success');
          });
      });
    }

    // ===== TỰ ĐỘNG CLEAN KHI DÁN =====
    if (input) {
      input.addEventListener('paste', function() {
        setTimeout(() => {
          const cleanBtn = document.getElementById('tc-clean-btn');
          if (cleanBtn) cleanBtn.click();
        }, 100);
      });

      // ===== CLEAN KHI NHẤN CTRL+ENTER =====
      input.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          const cleanBtn = document.getElementById('tc-clean-btn');
          if (cleanBtn) cleanBtn.click();
        }
      });

      // ===== RESET STATUS KHI NHẬP =====
      input.addEventListener('input', function() {
        if (status && status.textContent.includes('✅')) {
          status.textContent = '✏️ Đang chỉnh sửa...';
          status.style.color = '#f39c12';
          if (statusDot) statusDot.style.background = '#f39c12';
        }
      });
    }

    // ===== CLEAN KHI THAY ĐỔI CẤP ĐỘ =====
    const levelSelect = document.getElementById('tc-level');
    if (levelSelect) {
      levelSelect.addEventListener('change', function() {
        if (input && input.value.trim()) {
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