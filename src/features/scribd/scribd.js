// ============================================
// Multi Tool Hub - Scribd Feature (Popup Logic)
// ============================================

PAGES.scribd = {
  render: function() {
    return `
      <p class="hint-text">(Mẹo: Cuộn chuột tới cuối tài liệu để tải toàn bộ trước khi Tải PDF)</p>

      <button id="scribd-pdf-btn" class="action-btn primary" style="background: linear-gradient(135deg, #0077B5, #00A0DC);">
        <div class="icon-circle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" x2="12" y1="15" y2="3"/>
          </svg>
        </div>
        <div class="btn-info">
          <span class="btn-heading">Tải File PDF</span>
          <span class="btn-sub">Tự động dàn trang in sạch watermark</span>
        </div>
      </button>

      <button id="scribd-clear-btn" class="action-btn secondary" style="color: #0077B5;">
        <div class="icon-circle" style="background: rgba(0, 119, 181, 0.1);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div class="btn-info">
          <span class="btn-heading">Xem file & Xóa Watermark</span>
          <span class="btn-sub">Xóa cookie và reload trang</span>
        </div>
      </button>

      <button id="scribd-capture-btn" class="action-btn secondary" style="color: #0077B5;">
        <div class="icon-circle" style="background: rgba(0, 119, 181, 0.1);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <div class="btn-info">
          <span class="btn-heading">Lưu thành Ảnh</span>
          <span class="btn-sub">Tải trang đang hiển thị (.PNG)</span>
        </div>
      </button>
    `;
  },

  attachEvents: function() {
    // ========== 1. Tải File PDF ==========
    document.getElementById('scribd-pdf-btn').addEventListener('click', async function() {
      console.log('[Scribd] PDF button clicked');
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url || !tab.url.includes('scribd')) {
          alert('⚠️ Tính năng này chỉ hoạt động trên trang Scribd.');
          return;
        }

        const btn = this;
        const originalText = btn.querySelector('.btn-heading').innerText;
        btn.querySelector('.btn-heading').innerText = '⏳ Đang xử lý...';
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';

        // Inject CSS
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles/viewer-styles.css']
        });

        // Inject và chạy hàm tạo PDF
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: runScribdCleanViewer
        });

        btn.querySelector('.btn-heading').innerText = originalText;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      } catch (err) {
        console.error('[Scribd] PDF error:', err);
        alert('❌ Lỗi: ' + err.message);
        const btn = this;
        btn.querySelector('.btn-heading').innerText = 'Tải File PDF';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }
    });

    // ========== 2. Xem file & Xóa Watermark ==========
    document.getElementById('scribd-clear-btn').addEventListener('click', async function() {
      console.log('[Scribd] Clear button clicked');
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url || !tab.url.includes('scribd')) {
          alert('⚠️ Tính năng này chỉ hoạt động trên trang Scribd.');
          return;
        }

        const btn = this;
        const originalText = btn.querySelector('.btn-heading').innerText;
        btn.querySelector('.btn-heading').innerText = '⏳ Đang xóa cookie...';
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';

        // Xóa cookies của Scribd
        const allCookies = await chrome.cookies.getAll({});
        let deletedCount = 0;
        for (const cookie of allCookies) {
          if (cookie.domain && cookie.domain.includes('scribd')) {
            try {
              let cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
              const protocol = cookie.secure ? 'https:' : 'http:';
              const url = `${protocol}//${cleanDomain}${cookie.path || '/'}`;
              await chrome.cookies.remove({ url, name: cookie.name, storeId: cookie.storeId });
              deletedCount++;
            } catch (e) {
              console.warn('[Scribd] Không xóa được cookie:', cookie.name, e);
            }
          }
        }
        console.log(`[Scribd] Đã xóa ${deletedCount} cookie`);

        // Reload trang
        await chrome.tabs.reload(tab.id);
        btn.querySelector('.btn-heading').innerText = originalText;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      } catch (err) {
        console.error('[Scribd] Clear error:', err);
        alert('❌ Lỗi: ' + err.message);
        const btn = this;
        btn.querySelector('.btn-heading').innerText = 'Xem file & Xóa Watermark';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }
    });

    // ========== 3. Lưu thành Ảnh ==========
    document.getElementById('scribd-capture-btn').addEventListener('click', function() {
      console.log('[Scribd] Capture button clicked');
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        if (!tab || !tab.url || !tab.url.includes('scribd')) {
          alert('⚠️ Tính năng này chỉ hoạt động trên trang Scribd.');
          return;
        }

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: captureScribdPages
        }, function(results) {
          if (chrome.runtime.lastError) {
            console.error('[Scribd] Capture error:', chrome.runtime.lastError);
            alert('❌ Lỗi: ' + chrome.runtime.lastError.message);
            return;
          }
          if (results && results[0] && results[0].result) {
            const images = results[0].result;
            if (images.length === 0) {
              alert('⚠️ Không tìm thấy trang nào trên màn hình.');
              return;
            }
            images.forEach(function(imgData) {
              chrome.downloads.download({
                url: imgData.src,
                filename: `Scribd_${imgData.name}`,
                saveAs: false
              });
            });
            alert(`✅ Đang tải ${images.length} ảnh...`);
          }
        });
      });
    });
  },

  title: '📄 Scribd Tools'
};

// ============================================
// HÀM CHỤP ẢNH SCRIBD (injected vào trang)
// ============================================
function captureScribdPages() {
  console.log('[Scribd] captureScribdPages running');
  
  // ===== THỬ NHIỀU SELECTOR KHÁC NHAU =====
  let pages = [];
  
  // Thử selector 1: .page
  pages = document.querySelectorAll('.page');
  if (pages.length === 0) {
    // Thử selector 2: .absolute-page
    pages = document.querySelectorAll('.absolute-page');
  }
  if (pages.length === 0) {
    // Thử selector 3: [data-page-number]
    pages = document.querySelectorAll('[data-page-number]');
  }
  if (pages.length === 0) {
    // Thử selector 4: .document-page
    pages = document.querySelectorAll('.document-page');
  }
  if (pages.length === 0) {
    // Thử selector 5: .page-container
    pages = document.querySelectorAll('.page-container');
  }
  if (pages.length === 0) {
    // Thử selector 6: Tìm tất cả div có chứa ảnh lớn
    pages = document.querySelectorAll('div[style*="transform"]');
  }
  if (pages.length === 0) {
    // Thử selector 7: Tìm tất cả img trong document viewer
    const viewer = document.querySelector('.document-viewer, .viewer, #doc_viewer, #document_viewer');
    if (viewer) {
      pages = viewer.querySelectorAll('img');
    }
  }
  
  console.log('[Scribd] Found pages:', pages.length);
  
  if (pages.length === 0) {
    // Debug: Log toàn bộ DOM để tìm selector đúng
    console.log('[Scribd] DOM structure:', document.body.innerHTML.substring(0, 500));
    alert('⚠️ Không tìm thấy trang nào.\n' +
          'Vui lòng cuộn xuống cuối tài liệu để tải hết nội dung!\n' +
          'Nếu vẫn lỗi, hãy mở Console (F12) và chụp ảnh màn hình gửi dev.');
    return [];
  }

  const visiblePages = [];
  pages.forEach(function(page, index) {
    const rect = page.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0 && rect.height > 0) {
      visiblePages.push({ element: page, index: index + 1 });
    }
  });

  if (visiblePages.length === 0) {
    alert('⚠️ Không tìm thấy trang nào hiển thị trên màn hình.\nHãy cuộn đến trang muốn chụp!');
    return [];
  }

  const imagesToDownload = [];
  visiblePages.forEach(function(item) {
    // Tìm ảnh trong page
    let img = item.element.querySelector('img');
    if (!img) {
      // Thử tìm canvas
      const canvas = item.element.querySelector('canvas');
      if (canvas) {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          imagesToDownload.push({ src: dataUrl, name: `page_${item.index}.png` });
          return;
        } catch (e) {
          console.warn('[Scribd] Canvas toDataURL error:', e);
        }
      }
      // Thử tìm background-image
      const style = window.getComputedStyle(item.element);
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage.includes('url')) {
        const url = bgImage.replace(/url\(["']?(.*?)["']?\)/i, '$1');
        if (url && url.startsWith('http')) {
          imagesToDownload.push({ src: url, name: `page_${item.index}.png` });
          return;
        }
      }
    }
    if (img && img.src) {
      imagesToDownload.push({ src: img.src, name: `page_${item.index}.png` });
    }
  });

  if (imagesToDownload.length === 0) {
    alert('⚠️ Không tìm thấy dữ liệu ảnh.\n' +
          'Trang có thể đang sử dụng canvas hoặc chưa tải xong.\n' +
          'Thử cuộn trang và bấm lại!');
  }
  
  console.log('[Scribd] Images found:', imagesToDownload.length);
  return imagesToDownload;
}

// ============================================
// HÀM TẠO PDF VIEWER CHO SCRIBD (injected vào trang)
// ============================================
function runScribdCleanViewer() {
  console.log('[Scribd] runScribdCleanViewer running');
  
  // ===== TÌM TẤT CẢ CÁC TRANG =====
  let pages = [];
  
  // Thử các selector khác nhau
  const selectors = [
    '.page',
    '.absolute-page',
    '[data-page-number]',
    '.document-page',
    '.page-container',
    '.text-layer',
    '.page-viewer .page',
    '#document_viewer .page'
  ];
  
  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      pages = found;
      console.log(`[Scribd] Found ${pages.length} pages with selector: ${selector}`);
      break;
    }
  }
  
  // Nếu vẫn chưa tìm thấy, thử tìm tất cả các div có class chứa "page"
  if (pages.length === 0) {
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(function(div) {
      if (div.className && typeof div.className === 'string') {
        const classNames = div.className.split(' ');
        for (const cls of classNames) {
          if (cls.toLowerCase().includes('page') && 
              !cls.toLowerCase().includes('header') && 
              !cls.toLowerCase().includes('footer') &&
              !cls.toLowerCase().includes('navigation') &&
              !cls.toLowerCase().includes('toolbar')) {
            // Kiểm tra kích thước
            const rect = div.getBoundingClientRect();
            if (rect.width > 100 && rect.height > 100) {
              pages.push(div);
              break;
            }
          }
        }
      }
    });
    console.log(`[Scribd] Found ${pages.length} pages by class scanning`);
  }
  
  if (pages.length === 0) {
    alert('⚠️ Không tìm thấy trang nào.\n' +
          'Hãy cuộn xuống cuối để web tải hết nội dung!\n' +
          'Nếu vẫn lỗi, hãy mở Console (F12) và chụp ảnh màn hình gửi dev.');
    return;
  }

  if (!confirm(`📄 Sẵn sàng tạo PDF cho ${pages.length} trang.\nBấm OK để bắt đầu xử lý...`)) return;

  const viewerContainer = document.createElement('div');
  viewerContainer.id = 'clean-viewer-container';

  pages.forEach(function(page, index) {
    const newPage = document.createElement('div');
    newPage.className = 'std-page';
    newPage.id = 'page-' + (index + 1);
    newPage.setAttribute('data-page-number', index + 1);
    
    // Lấy kích thước từ page
    let width = 595.3;
    let height = 841.9;
    
    // Thử lấy từ style
    const style = page.getAttribute('style') || '';
    const widthMatch = style.match(/width:\s*([\d.]+)px/);
    const heightMatch = style.match(/height:\s*([\d.]+)px/);
    
    if (widthMatch) width = parseFloat(widthMatch[1]);
    if (heightMatch) height = parseFloat(heightMatch[1]);
    
    // Nếu không có, lấy từ getBoundingClientRect
    if (!widthMatch || !heightMatch) {
      const rect = page.getBoundingClientRect();
      if (rect.width > 0) width = rect.width;
      if (rect.height > 0) height = rect.height;
    }
    
    newPage.style.width = width + 'px';
    newPage.style.height = height + 'px';

    // Clone nội dung page
    const clone = page.cloneNode(true);
    clone.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    `;
    
    // Xóa các element không cần thiết (paywall, overlay, ...)
    const removeSelectors = [
      '.paywall',
      '.overlay',
      '.banner',
      '.upsell',
      '.premium-banner',
      '.subscribe-banner',
      '.ad-container',
      '.advertisement',
      '[class*="paywall"]',
      '[class*="overlay"]',
      '[class*="banner"]',
      '[class*="upsell"]'
    ];
    
    for (const sel of removeSelectors) {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    }
    
    newPage.appendChild(clone);
    viewerContainer.appendChild(newPage);
  });

  document.body.appendChild(viewerContainer);

  setTimeout(function() {
    window.print();
  }, 1000);
}