// ============================================
// Multi Tool Hub - Screenshot Feature (Popup Logic)
// ============================================

// ✅ Cấu hình cố định
const SCREENSHOT_CONFIG = {
  defaultFormat: 'png',     // Mặc định PNG
  jpegQuality: 0.85,        // Chất lượng JPEG (không hiển thị)
  maxDimension: 3000,       // Giới hạn kích thước tối đa
  scale: 2,                 // Scale vừa đủ
};

PAGES.screenshot = {
  render: function() {
    return `
      <div class="screenshot-options">
        <div class="form-group">
          <label>
            <span class="icon">📐</span> Chọn chế độ chụp:
          </label>
          <select id="ss-mode">
            <option value="viewport" selected>📱 Khung nhìn hiện tại</option>
            <option value="fullpage">📄 Toàn bộ trang</option>
            <option value="element">🎯 Chọn phần tử (click chọn)</option>
          </select>
        </div>

        <button id="ss-capture-btn" class="action-btn primary" style="background: linear-gradient(135deg, #7C3AED, #A78BFA);">
          <div class="icon-circle">📸</div>
          <div class="btn-info">
            <span class="btn-heading">Chụp ảnh</span>
            <span class="btn-sub">Định dạng PNG, chất lượng cao</span>
          </div>
        </button>

        <div id="ss-preview" style="display:none; margin-top:12px;">
          <img id="ss-preview-img" style="width:100%; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button id="ss-download-btn" class="action-btn secondary" style="flex:1; padding:8px; font-size:12px; text-align:center;">
              💾 Tải xuống
            </button>
            <button id="ss-copy-btn" class="action-btn secondary" style="flex:1; padding:8px; font-size:12px; text-align:center;">
              📋 Sao chép
            </button>
          </div>
        </div>

        <div class="status-bar" style="margin-top:12px;">
          <span class="dot" id="ss-status-dot"></span>
          <span id="ss-status-text">Sẵn sàng chụp ảnh</span>
        </div>
      </div>
    `;
  },

  attachEvents: function() {
    // === NÚT CHỤP ===
    document.getElementById('ss-capture-btn').addEventListener('click', async function() {
      const tab = await getCurrentTab();
      const statusText = document.getElementById('ss-status-text');
      const statusDot = document.getElementById('ss-status-dot');
      
      if (!tab) {
        showToast('Không tìm thấy tab', 'error');
        return;
      }

      // ✅ Kiểm tra URL - KHÔNG CHỤP TRANG HỆ THỐNG
      const blockedSchemes = ['chrome://', 'edge://', 'about:', 'chrome-extension://', 'devtools://', 'view-source:'];
      const isBlocked = blockedSchemes.some(scheme => tab.url.startsWith(scheme));
      
      if (isBlocked) {
        const msg = '❌ Không thể chụp trang hệ thống trình duyệt';
        showToast(msg, 'error');
        statusText.textContent = msg;
        statusText.style.color = '#e74c3c';
        statusDot.style.background = '#e74c3c';
        return;
      }

      if (tab.url === '' || tab.url === 'about:blank') {
        const msg = '❌ Không thể chụp trang trống';
        showToast(msg, 'error');
        statusText.textContent = msg;
        statusText.style.color = '#e74c3c';
        statusDot.style.background = '#e74c3c';
        return;
      }

      const mode = document.getElementById('ss-mode').value;

      const btn = this;
      const originalText = btn.querySelector('.btn-heading').innerText;
      btn.querySelector('.btn-heading').innerText = '⏳ Đang chụp...';
      btn.style.opacity = '0.7';
      btn.style.pointerEvents = 'none';
      statusText.textContent = '⏳ Đang xử lý...';
      statusText.style.color = '#f39c12';
      statusDot.style.background = '#f39c12';

      try {
        // Kiểm tra html2canvas
        let hasLibrary = false;
        try {
          const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: function() { return typeof html2canvas !== 'undefined'; }
          });
          hasLibrary = result && result[0] && result[0].result;
        } catch (e) {
          hasLibrary = false;
        }

        if (!hasLibrary) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['libs/html2canvas/html2canvas.min.js']
            });
          } catch (injectErr) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: function() {
                  return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                  });
                }
              });
              await new Promise(r => setTimeout(r, 1500));
            } catch (cdnErr) {
              console.warn('[Screenshot] CDN load failed:', cdnErr);
            }
          }
        }

        const startTime = performance.now();
        
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: captureWebContentFull,
          args: [mode, SCREENSHOT_CONFIG.defaultFormat, SCREENSHOT_CONFIG.jpegQuality, SCREENSHOT_CONFIG.scale, SCREENSHOT_CONFIG.maxDimension]
        });

        const elapsed = (performance.now() - startTime).toFixed(0);

        if (result && result[0] && result[0].result) {
          const imageData = result[0].result;
          
          if (imageData.error) {
            showToast('❌ ' + imageData.error, 'error');
            statusText.textContent = '❌ ' + imageData.error;
            statusText.style.color = '#e74c3c';
            statusDot.style.background = '#e74c3c';
          } else {
            const preview = document.getElementById('ss-preview');
            const img = document.getElementById('ss-preview-img');
            img.src = imageData.dataUrl;
            preview.style.display = 'block';
            preview.dataset.dataUrl = imageData.dataUrl;
            preview.dataset.filename = imageData.filename;
            
            const sizeKB = (imageData.dataUrl.length * 3/4 / 1024).toFixed(1);
            showToast(`✅ Đã chụp (${elapsed}ms, ${sizeKB}KB)`, 'success');
            statusText.textContent = `✅ ${imageData.width}×${imageData.height} - ${elapsed}ms`;
            statusText.style.color = '#27ae60';
            statusDot.style.background = '#27ae60';
          }
        }
      } catch (err) {
        console.error('[Screenshot] Error:', err);
        let errorMsg = err.message || 'Lỗi không xác định';
        showToast('❌ ' + errorMsg, 'error');
        statusText.textContent = '❌ ' + errorMsg;
        statusText.style.color = '#e74c3c';
        statusDot.style.background = '#e74c3c';
      }

      btn.querySelector('.btn-heading').innerText = originalText;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    });

    // === TẢI XUỐNG ===
    document.getElementById('ss-download-btn').addEventListener('click', function() {
      const preview = document.getElementById('ss-preview');
      const dataUrl = preview.dataset.dataUrl;
      const filename = preview.dataset.filename || 'screenshot.png';
      
      if (dataUrl) {
        chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: true
        }, function(downloadId) {
          if (chrome.runtime.lastError) {
            showToast('❌ Lỗi tải xuống: ' + chrome.runtime.lastError.message, 'error');
          } else {
            showToast('📥 Đang tải xuống...', 'success');
          }
        });
      }
    });

    // === SAO CHÉP ===
    document.getElementById('ss-copy-btn').addEventListener('click', async function() {
      const preview = document.getElementById('ss-preview');
      const dataUrl = preview.dataset.dataUrl;
      const statusText = document.getElementById('ss-status-text');
      
      if (!dataUrl) {
        showToast('❌ Chưa có ảnh để sao chép', 'error');
        return;
      }

      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
          ]);
          showToast('📋 Đã sao chép ảnh!', 'success');
          statusText.textContent = '📋 Đã sao chép';
          return;
        }
        
        // Fallback
        const img = document.getElementById('ss-preview-img');
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(async function(blob) {
          try {
            if (navigator.clipboard && navigator.clipboard.write) {
              await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
              ]);
              showToast('📋 Đã sao chép ảnh!', 'success');
              statusText.textContent = '📋 Đã sao chép';
            } else {
              const dataUrl = canvas.toDataURL('image/png');
              await navigator.clipboard.writeText(dataUrl);
              showToast('📋 Đã sao chép (base64)', 'info');
            }
          } catch (e) {
            const win = window.open(dataUrl, '_blank');
            if (win) {
              showToast('🖼️ Ảnh đã mở trong tab mới', 'info');
            } else {
              showToast('❌ Vui lòng tải ảnh về và copy thủ công', 'error');
            }
          }
        });
        
      } catch (err) {
        console.error('[Screenshot] Copy error:', err);
        showToast('❌ Lỗi sao chép: ' + err.message, 'error');
      }
    });
  },

  title: '📸 Chụp ảnh Web'
};

// ============================================
// HÀM CAPTURE ĐẦY ĐỦ (injected vào tab)
// ============================================

function captureWebContentFull(mode, format, quality, scale, maxDim) {
  function doCapture(element, format, quality, filename, resolve) {
    setTimeout(function() {
      if (typeof html2canvas === 'undefined') {
        // Fallback đơn giản
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const s = Math.min(window.devicePixelRatio || 2, scale);
          
          if (mode === 'viewport') {
            canvas.width = Math.min(window.innerWidth * s, maxDim);
            canvas.height = Math.min(window.innerHeight * s, maxDim);
          } else {
            canvas.width = Math.min(document.documentElement.scrollWidth * s, maxDim);
            canvas.height = Math.min(document.documentElement.scrollHeight * s, maxDim);
          }
          
          ctx.scale(s, s);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width / s, canvas.height / s);
          
          const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
          const ext = format === 'jpeg' ? 'jpg' : 'png';
          const dataUrl = canvas.toDataURL(mimeType, quality);
          
          resolve({
            dataUrl: dataUrl,
            filename: filename || 'screenshot_' + Date.now() + '.' + ext,
            width: canvas.width,
            height: canvas.height
          });
          return;
        } catch (fallbackErr) {
          resolve({ error: 'Không thể chụp: ' + fallbackErr.message });
          return;
        }
      }

      // html2canvas với tối ưu
      const s = Math.min(window.devicePixelRatio || 2, scale);
      const maxD = maxDim;
      
      const options = {
        scale: s,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: Math.min(element.scrollWidth || element.clientWidth, maxD / s),
        height: Math.min(element.scrollHeight || element.clientHeight, maxD / s),
        windowWidth: Math.min(window.innerWidth, maxD / s),
        windowHeight: Math.min(window.innerHeight, maxD / s),
        ignoreElements: function(el) {
          return el.classList && (
            el.classList.contains('ad') ||
            el.classList.contains('advertisement') ||
            el.classList.contains('banner') ||
            el.tagName === 'SCRIPT' ||
            el.tagName === 'STYLE'
          );
        },
        onclone: function(doc) {
          const overlays = doc.querySelectorAll('[style*="position: fixed"], [style*="position:sticky"], .modal, .popup, .overlay');
          overlays.forEach(function(el) {
            if (el.id !== 'ss-element-hint') {
              el.style.display = 'none';
            }
          });
        }
      };

      if (mode === 'viewport') {
        options.width = Math.min(window.innerWidth, maxD / s);
        options.height = Math.min(window.innerHeight, maxD / s);
        options.x = window.scrollX;
        options.y = window.scrollY;
      }

      html2canvas(element, options)
        .then(function(canvas) {
          const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
          const ext = format === 'jpeg' ? 'jpg' : 'png';
          const dataUrl = canvas.toDataURL(mimeType, quality);
          
          resolve({
            dataUrl: dataUrl,
            filename: filename || 'screenshot_' + Date.now() + '.' + ext,
            width: canvas.width,
            height: canvas.height
          });
        })
        .catch(function(err) {
          resolve({ error: 'Lỗi: ' + err.message });
        });
    }, 300);
  }

  // === XỬ LÝ CHÍNH ===
  return new Promise((resolve) => {
    try {
      let targetElement = null;
      let filename = 'screenshot';

      switch (mode) {
        case 'fullpage':
          targetElement = document.documentElement;
          filename = 'fullpage_' + Date.now() + '.' + (format === 'jpeg' ? 'jpg' : 'png');
          break;
          
        case 'viewport':
        default:
          targetElement = document.documentElement;
          filename = 'viewport_' + Date.now() + '.' + (format === 'jpeg' ? 'jpg' : 'png');
          break;
          
        case 'element':
          let selected = null;
          let isActive = true;
          let timeoutId = null;
          
          const highlight = (el) => {
            if (selected) {
              selected.style.outline = 'none';
              selected.style.outlineOffset = '0px';
            }
            selected = el;
            if (el) {
              el.style.outline = '2px solid #7C3AED';
              el.style.outlineOffset = '1px';
            }
          };

          const mouseMoveHandler = (e) => {
            if (!isActive) return;
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if (el && el !== document.body && el !== document.documentElement) {
              highlight(el);
            }
          };

          const clickHandler = (e) => {
            if (!isActive) return;
            e.stopPropagation();
            e.preventDefault();
            
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if (el && el !== document.body && el !== document.documentElement) {
              targetElement = el;
              highlight(null);
              cleanup();
              doCapture(targetElement, format, quality, filename, resolve);
            }
          };

          const keyHandler = (e) => {
            if (e.key === 'Escape') {
              cleanup();
              resolve({ error: 'Đã hủy chọn phần tử' });
            }
          };

          const cleanup = () => {
            isActive = false;
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('click', clickHandler, true);
            document.removeEventListener('keydown', keyHandler);
            if (selected) {
              selected.style.outline = 'none';
              selected.style.outlineOffset = '0px';
              selected = null;
            }
            const hint = document.getElementById('ss-element-hint');
            if (hint) hint.remove();
          };

          const div = document.createElement('div');
          div.id = 'ss-element-hint';
          div.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(124, 58, 237, 0.92);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-family: sans-serif;
            font-size: 13px;
            z-index: 999999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            pointer-events: none;
            text-align: center;
          `;
          div.innerHTML = '🖱️ Click chọn phần tử &nbsp;|&nbsp; <kbd style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;">ESC</kbd> hủy';
          document.body.appendChild(div);

          document.addEventListener('mousemove', mouseMoveHandler);
          document.addEventListener('click', clickHandler, true);
          document.addEventListener('keydown', keyHandler);
          
          timeoutId = setTimeout(() => {
            if (targetElement === null) {
              cleanup();
              resolve({ error: 'Hết thời gian' });
            }
          }, 20000);
          
          return;
      }

      if (targetElement) {
        doCapture(targetElement, format, quality, filename, resolve);
      } else {
        resolve({ error: 'Không tìm thấy phần tử' });
      }

    } catch (err) {
      resolve({ error: err.message });
    }
  });
}