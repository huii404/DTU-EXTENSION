// CẤU HÌNH MẶC ĐỊNH
const QR_CONFIG = {
  defaultSize: 256,
  defaultColor: '#000000',
  maxLength: 200,  // ✅ Giới hạn tối đa 200 ký tự (QR an toàn)
  maxChars: 200,   // ✅ Hiển thị cảnh báo khi vượt quá
};


// QR CODE ENGINE

const QREngine = {
  API_URL: 'https://api.qrserver.com/v1/create-qr-code/',
  _currentDataUrl: null,
  _currentText: '',

  generate: function(text, size = QR_CONFIG.defaultSize, color = QR_CONFIG.defaultColor) {
    if (!text || !text.trim()) {
      return { error: 'Vui lòng nhập nội dung' };
    }

    // ✅ KIỂM TRA GIỚI HẠN
    if (text.length > QR_CONFIG.maxLength) {
      return { 
        error: `⚠️ Nội dung quá dài (${text.length} ký tự).\nGiới hạn tối đa ${QR_CONFIG.maxLength} ký tự.\nVui lòng rút gọn nội dung.`,
        isOverLimit: true,
        currentLength: text.length,
        maxLength: QR_CONFIG.maxLength
      };
    }

    const encodedText = encodeURIComponent(text.trim());
    const url = `${this.API_URL}?size=${size}x${size}&data=${encodedText}&color=${color.replace('#', '')}&bgcolor=ffffff&margin=10`;
    
    this._currentText = text.trim();
    this._currentDataUrl = url;
    
    return { 
      success: true, 
      url: url,
      text: text.trim(),
      size: size,
      color: color,
      charCount: text.length
    };
  },

  getCurrentData: function() {
    return {
      dataUrl: this._currentDataUrl,
      text: this._currentText
    };
  },

  reset: function() {
    this._currentDataUrl = null;
    this._currentText = '';
  }
};


// LOAD HTML TEMPLATE

let qrCodeHTML = '';

async function loadQRCodeHTML() {
  try {
    const response = await fetch(chrome.runtime.getURL('src/features/qrcode/qrcode.html'));
    qrCodeHTML = await response.text();
  } catch (e) {
    console.error('Không thể load qrcode.html:', e);
    qrCodeHTML = `
      <div class="qrcode-container">
        <div class="form-group">
          <label>📝 Nhập nội dung (tối đa ${QR_CONFIG.maxLength} ký tự):</label>
          <textarea id="qr-input" rows="3" placeholder="Nhập text, URL..."></textarea>
          <div id="qr-char-counter" style="font-size:11px; color:var(--text-muted); text-align:right; margin-top:4px;">0 / ${QR_CONFIG.maxLength}</div>
        </div>
        <button id="qr-generate-btn" class="action-btn primary" style="background: linear-gradient(135deg, #8e44ad, #9b59b6);">
          <span>Tạo QR</span>
        </button>
        <div id="qr-preview" style="display:none; text-align:center;">
          <img id="qr-image" style="max-width:100%;">
        </div>
        <div class="status-bar">
          <span class="dot"></span>
          <span id="qr-status">Nhập nội dung và bấm "Tạo QR"</span>
        </div>
      </div>
    `;
  }
}


// POPUP PAGE

PAGES.qrcode = {
  render: function() {
    return qrCodeHTML || '<p>Đang tải...</p>';
  },

  attachEvents: function() {
    const input = document.getElementById('qr-input');
    const preview = document.getElementById('qr-preview');
    const image = document.getElementById('qr-image');
    const info = document.getElementById('qr-info');
    const status = document.getElementById('qr-status');
    const statusDot = document.getElementById('qr-status-dot');
    const charCounter = document.getElementById('qr-char-counter');
    
    const generateBtn = document.getElementById('qr-generate-btn');
    const downloadBtn = document.getElementById('qr-download-btn');
    const resetBtn = document.getElementById('qr-reset-btn');

    if (!input || !generateBtn) {
      console.error('[QRCode] DOM elements not found');
      return;
    }

    // ===== CẬP NHẬT ĐẾM KÝ TỰ =====
    function updateCharCounter() {
      const text = input.value;
      const length = text.length;
      const max = QR_CONFIG.maxLength;
      
      if (charCounter) {
        let color = 'var(--text-muted)';
        let textContent = `${length} / ${max}`;
        
        if (length > max) {
          color = '#e74c3c';
          textContent = `⚠️ ${length} / ${max} (vượt giới hạn)`;
        } else if (length > max * 0.8) {
          color = '#f39c12';
        } else {
          color = '#27ae60';
        }
        
        charCounter.textContent = textContent;
        charCounter.style.color = color;
      }
    }

    // ===== CẬP NHẬT STATUS =====
    function setStatus(text, color = '#333', dotColor = '#22c55e') {
      if (status) {
        status.textContent = text;
        status.style.color = color;
      }
      if (statusDot) {
        statusDot.style.background = dotColor;
      }
    }

    // ===== HIỂN THỊ QR =====
    function showQR(result) {
      image.src = result.url;
      preview.style.display = 'block';
      
      if (info) {
        info.textContent = `📝 ${result.charCount} ký tự • 📐 ${result.size}px`;
      }
      
      if (downloadBtn) {
        downloadBtn.style.opacity = '1';
        downloadBtn.style.pointerEvents = 'auto';
      }
      if (resetBtn) {
        resetBtn.style.opacity = '1';
        resetBtn.style.pointerEvents = 'auto';
      }
      
      setStatus('✅ QR Code đã tạo thành công!', '#27ae60', '#27ae60');
    }

    // ===== ẨN QR =====
    function hideQR() {
      preview.style.display = 'none';
      image.src = '';
      if (info) info.textContent = '';
      
      if (downloadBtn) {
        downloadBtn.style.opacity = '0.5';
        downloadBtn.style.pointerEvents = 'none';
      }
      if (resetBtn) {
        resetBtn.style.opacity = '0.5';
        resetBtn.style.pointerEvents = 'none';
      }
    }

    // ===== TẠO QR =====
    generateBtn.addEventListener('click', function() {
      const text = input.value;
      
      if (!text || !text.trim()) {
        setStatus('⚠️ Vui lòng nhập nội dung', '#f39c12', '#f39c12');
        hideQR();
        return;
      }

      // ✅ KIỂM TRA GIỚI HẠN TRƯỚC KHI TẠO
      if (text.length > QR_CONFIG.maxLength) {
        const msg = `⚠️ Nội dung quá dài (${text.length}/${QR_CONFIG.maxLength} ký tự)`;
        setStatus(msg, '#e74c3c', '#e74c3c');
        hideQR();
        showToast(`❌ Nội dung vượt quá giới hạn ${QR_CONFIG.maxLength} ký tự`, 'error');
        return;
      }

      setStatus('⏳ Đang tạo QR Code...', '#3498db', '#3498db');
      generateBtn.style.opacity = '0.7';
      generateBtn.style.pointerEvents = 'none';

      setTimeout(() => {
        const result = QREngine.generate(
          text, 
          QR_CONFIG.defaultSize, 
          QR_CONFIG.defaultColor
        );
        
        if (result.error) {
          setStatus('❌ ' + result.error, '#e74c3c', '#e74c3c');
          hideQR();
          if (result.isOverLimit) {
            showToast(`❌ Vượt quá ${result.maxLength} ký tự (${result.currentLength})`, 'error');
          }
        } else {
          showQR(result);
        }
        
        generateBtn.style.opacity = '1';
        generateBtn.style.pointerEvents = 'auto';
      }, 100);
    });

    // ===== TẢI XUỐNG =====
    downloadBtn?.addEventListener('click', function() {
      const data = QREngine.getCurrentData();
      if (!data.dataUrl) {
        setStatus('⚠️ Chưa có QR Code để tải', '#f39c12', '#f39c12');
        return;
      }

      chrome.downloads.download({
        url: data.dataUrl,
        filename: `QR_${Date.now()}.png`,
        saveAs: true
      }, function(downloadId) {
        if (chrome.runtime.lastError) {
          setStatus('❌ Lỗi tải xuống: ' + chrome.runtime.lastError.message, '#e74c3c', '#e74c3c');
        } else {
          setStatus('✅ Đang tải xuống...', '#27ae60', '#27ae60');
        }
      });
    });

    // ===== RESET =====
    resetBtn?.addEventListener('click', function() {
      input.value = '';
      QREngine.reset();
      hideQR();
      updateCharCounter();
      setStatus('🔄 Đã reset, nhập nội dung mới', '#333', '#22c55e');
    });

    // ===== PHÍM TẮT: Ctrl+Enter =====
    input.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        generateBtn.click();
      }
    });

    // ===== CẬP NHẬT ĐẾM KÝ TỰ KHI NHẬP =====
    input.addEventListener('input', function() {
      updateCharCounter();
      
      // ✅ Nếu vượt quá giới hạn, hiển thị cảnh báo ngay
      if (this.value.length > QR_CONFIG.maxLength) {
        setStatus(`⚠️ Vượt quá giới hạn ${QR_CONFIG.maxLength} ký tự`, '#e74c3c', '#e74c3c');
        hideQR();
      } else {
        // Nếu đang trong giới hạn và không có lỗi, reset status
        if (!status.textContent.includes('✅') && !status.textContent.includes('⏳')) {
          setStatus('Nhập nội dung và bấm "Tạo QR"', '#333', '#22c55e');
        }
      }
    });

    // ===== SET DEFAULT =====
    updateCharCounter();
    setStatus(`Nhập nội dung (tối đa ${QR_CONFIG.maxLength} ký tự)`, '#333', '#22c55e');
  },

  title: '📱 Tạo mã QR'
};


// LOAD HTML KHI KHỞI ĐỘNG

loadQRCodeHTML();