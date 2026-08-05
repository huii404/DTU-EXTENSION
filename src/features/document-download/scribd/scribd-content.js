
const CONFIG_SCRIBD = {
  AUTO_PDF_PARAM: 'banhmi_auto_pdf=1',
  SCROLL_STEP: 800,
  SCROLL_INTERVAL: 600,
  SAME_COUNT_THRESHOLD: 3
};

// Auto-PDF via URL Param
if (window.location.href.includes(CONFIG_SCRIBD.AUTO_PDF_PARAM)) {
  console.log('[Scribd Content] Auto-PDF triggered via URL param');
  
  const newUrl = window.location.href
    .replace(/([&?])banhmi_auto_pdf=1&?/, '$1')
    .replace(/[&?]$/, '');
  window.history.replaceState({}, document.title, newUrl);

  setTimeout(startScribdAutoPDF, 1000);
}

function startScribdAutoPDF() {
  console.log('[Scribd Content] Starting auto PDF process');
  
  // Inject viewer styles
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('styles/viewer-styles.css');
  document.head.appendChild(link);

  const overlay = document.createElement('div');
  overlay.id = 'banhmi-overlay-status';
  overlay.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: #0077B5; color: white;
    padding: 15px 25px; border-radius: 10px;
    font-family: sans-serif; font-weight: bold;
    z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: opacity 0.3s ease;
  `;
  overlay.innerText = '🚀 Đang tự động load toàn trang để tạo PDF...';
  document.body.appendChild(overlay);

  let oldScrollY = -1;
  let sameCount = 0;

  const scrollInterval = setInterval(() => {
    window.scrollBy(0, CONFIG_SCRIBD.SCROLL_STEP);

    if (window.scrollY === oldScrollY) {
      sameCount++;
      if (sameCount >= CONFIG_SCRIBD.SAME_COUNT_THRESHOLD) {
        clearInterval(scrollInterval);
        overlay.innerText = '✅ Đã tải xong! Đang chuẩn bị PDF...';
        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => overlay.remove(), 300);
          
          // Gọi hàm tạo PDF từ popup logic
          if (typeof runScribdPDFWithLibraries === 'function') {
            runScribdPDFWithLibraries();
          } else {
            alert('⚠️ Vui lòng dùng nút "Tải File PDF" trong popup để tạo PDF!');
          }
        }, 1000);
      }
    } else {
      sameCount = 0;
      oldScrollY = window.scrollY;
    }
  }, CONFIG_SCRIBD.SCROLL_INTERVAL);
}

// Xóa watermark/paywall khi trang load
function removeScribdOverlays() {
  const selectors = [
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
    '[class*="banner"]'
  ];
  
  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach(el => {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
      el.style.opacity = '0';
      el.style.zIndex = '-9999';
    });
  }
  
  // Thử xóa blur
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.filter && style.filter.includes('blur')) {
      el.style.filter = 'none';
      el.style.webkitFilter = 'none';
    }
  });
}

// Chạy khi document load
if (document.readyState === 'complete') {
  removeScribdOverlays();
} else {
  window.addEventListener('load', removeScribdOverlays);
}

// Observer để bắt các overlay được thêm sau
const observer = new MutationObserver(() => {
  removeScribdOverlays();
});
observer.observe(document.body, {
  childList: true,
  subtree: true
});