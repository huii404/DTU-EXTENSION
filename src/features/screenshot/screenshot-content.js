// ============================================
// src/features/screenshot/screenshot-content.js
// ============================================

function captureWebContent(mode, format, quality) {
  return new Promise((resolve) => {
    try {
      // Kiểm tra html2canvas
      if (typeof html2canvas === 'undefined') {
        resolve({ error: 'Thư viện html2canvas chưa được load' });
        return;
      }

      // Xác định phần tử cần chụp
      let targetElement = null;
      let filename = 'screenshot';

      switch (mode) {
        case 'fullpage':
          targetElement = document.documentElement;
          filename = 'fullpage_' + Date.now() + '.' + (format === 'jpeg' ? 'jpg' : 'png');
          break;
          
        case 'viewport':
          targetElement = document.documentElement;
          filename = 'viewport_' + Date.now() + '.' + (format === 'jpeg' ? 'jpg' : 'png');
          break;
          
        case 'element':
          // Hiển thị hướng dẫn chọn phần tử
          alert('🖱️ Click vào phần tử muốn chụp (hoặc nhấn ESC để hủy)');
          targetElement = null; // Sẽ xử lý bằng event listener
          break;
          
        default:
          targetElement = document.documentElement;
      }

      // Nếu là chế độ element, đợi click
      if (mode === 'element') {
        let selected = null;
        
        const highlight = (el) => {
          if (selected) {
            selected.style.outline = 'none';
          }
          selected = el;
          if (el) {
            el.style.outline = '3px solid #7C3AED';
            el.style.outlineOffset = '2px';
          }
        };

        const mouseMoveHandler = (e) => {
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (el && el !== document.body && el !== document.documentElement) {
            highlight(el);
          }
        };

        const clickHandler = (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (el && el !== document.body && el !== document.documentElement) {
            targetElement = el;
            highlight(null);
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('click', clickHandler, true);
            document.removeEventListener('keydown', keyHandler);
            // Chụp ngay
            doCapture(targetElement, format, quality, filename);
          }
        };

        const keyHandler = (e) => {
          if (e.key === 'Escape') {
            highlight(null);
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('click', clickHandler, true);
            document.removeEventListener('keydown', keyHandler);
            resolve({ error: 'Đã hủy chọn phần tử' });
          }
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('click', clickHandler, true);
        document.addEventListener('keydown', keyHandler);
        
        // Timeout sau 30s
        setTimeout(() => {
          if (targetElement === null) {
            highlight(null);
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('click', clickHandler, true);
            document.removeEventListener('keydown', keyHandler);
            resolve({ error: 'Hết thời gian chờ' });
          }
        }, 30000);
        
        return; // Chờ sự kiện
      }

      // Chụp ngay cho fullpage/viewport
      doCapture(targetElement, format, quality, filename, resolve);

    } catch (err) {
      resolve({ error: err.message });
    }
  });
}

function doCapture(element, format, quality, filename, resolve) {
  const options = {
    scale: 2, // Độ phân giải cao
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: element.scrollWidth || element.clientWidth,
    height: element.scrollHeight || element.clientHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight
  };

  // Chế độ viewport: chỉ lấy phần hiển thị
  if (filename.includes('viewport')) {
    options.width = window.innerWidth;
    options.height = window.innerHeight;
    options.x = window.scrollX;
    options.y = window.scrollY;
  }

  html2canvas(element, options)
    .then(canvas => {
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const dataUrl = canvas.toDataURL(mimeType, quality);
      
      if (resolve) {
        resolve({
          dataUrl: dataUrl,
          filename: filename || `screenshot_${Date.now()}.${ext}`,
          width: canvas.width,
          height: canvas.height
        });
      }
    })
    .catch(err => {
      if (resolve) {
        resolve({ error: 'Lỗi html2canvas: ' + err.message });
      } else {
        console.error('[Screenshot] Capture error:', err);
      }
    });
}