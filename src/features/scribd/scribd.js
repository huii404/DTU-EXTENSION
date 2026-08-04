// ============================================
// Multi Tool Hub - Scribd Feature (Popup Logic)
// ============================================

let scribdHTML = '';

// Load HTML từ file
async function loadScribdHTML() {
  try {
    const response = await fetch(chrome.runtime.getURL('src/features/scribd/scribd.html'));
    scribdHTML = await response.text();
  } catch (e) {
    console.error('Không thể load scribd.html:', e);
    scribdHTML = '<p class="hint-text">(Mẹo: Cuộn chuột tới cuối tài liệu để tải toàn bộ trước khi Tải PDF)</p>';
  }
}

PAGES.scribd = {
  render: function() {
    return scribdHTML || '<p>Đang tải...</p>';
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

        // Inject thư viện
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [
            'libs/jsPDF/jspdf.umd.min.js',
            'libs/html2canvas/html2canvas.min.js'
          ]
        });

        // Inject CSS
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles/viewer-styles.css']
        });

        // Inject và chạy hàm tạo PDF
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: runScribdPDFWithLibraries
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
  
  // Lấy tất cả trang
  const pages = [];
  const selectors = [
    '.page',
    '.absolute-page',
    '[data-page-number]',
    '.document-page',
    '.page-container'
  ];
  
  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      found.forEach(el => pages.push(el));
      break;
    }
  }
  
  if (pages.length === 0) {
    // Scan tất cả div có class chứa "page"
    document.querySelectorAll('div').forEach(el => {
      if (el.className && typeof el.className === 'string') {
        if (el.className.toLowerCase().includes('page') && 
            !el.className.toLowerCase().includes('header') &&
            !el.className.toLowerCase().includes('footer') &&
            !el.className.toLowerCase().includes('navigation')) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 200 && rect.height > 200) {
            pages.push(el);
          }
        }
      }
    });
  }
  
  console.log('[Scribd] Found pages:', pages.length);
  
  if (pages.length === 0) {
    alert('⚠️ Không tìm thấy trang nào.\nHãy cuộn xuống cuối để tải hết nội dung!');
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
    alert('⚠️ Không tìm thấy trang nào hiển thị trên màn hình.');
    return [];
  }

  const imagesToDownload = [];
  visiblePages.forEach(function(item) {
    // Tìm ảnh hoặc canvas trong page
    let img = item.element.querySelector('img');
    if (!img) {
      const canvas = item.element.querySelector('canvas');
      if (canvas) {
        try {
          imagesToDownload.push({ 
            src: canvas.toDataURL('image/png'), 
            name: `page_${item.index}.png` 
          });
          return;
        } catch (e) {
          console.warn('[Scribd] Canvas error:', e);
        }
      }
    }
    if (img && img.src) {
      imagesToDownload.push({ src: img.src, name: `page_${item.index}.png` });
    }
  });

  if (imagesToDownload.length === 0) {
    alert('⚠️ Không tìm thấy dữ liệu ảnh.\nTrang có thể dùng canvas hoặc chưa tải xong.');
  }
  
  return imagesToDownload;
}

// ============================================
// HÀM TẠO PDF CHO SCRIBD (CẢI TIẾN HOÀN CHỈNH)
// ============================================
async function runScribdPDFWithLibraries() {
  console.log('[Scribd] runScribdPDFWithLibraries running');
  
  if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
    alert('⚠️ Thư viện jsPDF chưa được load. Vui lòng thử lại!');
    return;
  }
  
  const { jsPDF } = window.jspdf || window;
  
  // 1. Quét các phần tử trang trên Scribd
  let pages = [];
  const selectors = [
    '.outer_page',
    '.document_page',
    '.page_blur_container',
    '.page_render',
    '[data-page-number]',
    'div[id^="page_"]',
    '.page'
  ];
  
  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      found.forEach(el => pages.push(el));
      break;
    }
  }
  
  if (pages.length === 0) {
    document.querySelectorAll('.document_renderer img, .document_renderer canvas, [class*="page"] img').forEach(el => {
      const parent = el.closest('div');
      if (parent && !pages.includes(parent)) {
        pages.push(parent);
      }
    });
  }
  
  if (pages.length === 0) {
    alert('⚠️ Không tìm thấy trang nào.\nHãy cuộn chuột xuống hết tài liệu rồi bấm lại!');
    return;
  }

  if (!confirm(`📄 Sẵn sàng tạo PDF cho ${pages.length} trang.\nBấm OK để bắt đầu...`)) return;

  // Tạo khung thông báo tiến trình trên màn hình
  const progressBox = document.createElement('div');
  progressBox.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 999999;
    background: #0077B5; color: white; padding: 15px 20px;
    border-radius: 8px; font-family: sans-serif; font-size: 14px;
    font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  progressBox.innerText = `⏳ Đang khởi tạo PDF (0/${pages.length})...`;
  document.body.appendChild(progressBox);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: 'a4'
  });

  let processedCount = 0;

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      progressBox.innerText = `⏳ Đang xử lý trang ${i + 1}/${pages.length}...`;
      
      // Cuộn tới từng trang để ép Scribd load ảnh
      page.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise(r => setTimeout(r, 300));

      // Dọn dẹp overlay
      const removeSelectors = [
        '.paywall', '.overlay', '.banner', '.upsell',
        '.premium-banner', '.subscribe-banner', '.ad-container',
        '[class*="paywall"]', '[class*="blur"]'
      ];
      removeSelectors.forEach(sel => {
        page.querySelectorAll(sel).forEach(el => el.remove());
      });

      page.style.filter = 'none';
      page.style.webkitFilter = 'none';

      // Chụp hình trang
      const canvas = await html2canvas(page, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
        console.warn(`[Scribd] Trang ${i + 1} bị lỗi kích thước canvas.`);
        continue;
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.85);

      if (processedCount > 0) {
        pdf.addPage();
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const cWidth = Number(canvas.width) || pageWidth;
      const cHeight = Number(canvas.height) || pageHeight;

      const ratio = Math.min(pageWidth / cWidth, pageHeight / cHeight);
      const imgWidth = Math.max(1, cWidth * ratio);
      const imgHeight = Math.max(1, cHeight * ratio);
      
      const x = Math.max(0, (pageWidth - imgWidth) / 2);
      const y = Math.max(0, (pageHeight - imgHeight) / 2);

      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
      processedCount++;
    }

    if (processedCount === 0) {
      alert('❌ Không thể chụp được nội dung trang nào!');
      progressBox.remove();
      return;
    }

    progressBox.innerText = '💾 Đang xuất file PDF...';

    // Tạo blob và kích hoạt lệnh tải tự động
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = 'Scribd_Document.pdf';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
      progressBox.remove();
      alert(`✅ Đã tạo PDF thành công! (${processedCount} trang)`);
    }, 1000);

  } catch (error) {
    console.error('[Scribd] PDF creation error:', error);
    progressBox.remove();
    alert('❌ Lỗi tạo PDF: ' + error.message);
  }
}

// Load HTML khi khởi động
loadScribdHTML();