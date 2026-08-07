// ============================================
// SCRIBD CONTENT SCRIPT - TỰ ĐỘNG TẠI TRANG
// ============================================

// Lắng nghe lệnh tải từ Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'START_SCRIBD_AUTO_PDF') {
    processAndExportPDF();
    sendResponse({ status: 'ok' });
  }
});

async function processAndExportPDF() {
  if (document.getElementById('banhmi-loading-overlay')) return;

  // 1. Hiện Overlay thông báo cho người dùng biết Extension đang làm việc
  const overlay = document.createElement('div');
  overlay.id = 'banhmi-loading-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.75); color: white; z-index: 9999999;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: sans-serif; font-size: 16px; font-weight: bold;
  `;
  overlay.innerHTML = `
    <div style="background: #0077B5; padding: 20px 30px; border-radius: 12px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      <div style="font-size: 24px; margin-bottom: 10px;">⏳ Đang xử lý tài liệu...</div>
      <div id="banhmi-status-text" style="font-size: 14px; opacity: 0.9;">Đang tải toàn bộ các trang...</div>
    </div>
  `;
  document.body.appendChild(overlay);

  const statusText = document.getElementById('banhmi-status-text');

  // 2. Xóa sạch Paywall, Quảng cáo & Blur (Mờ)
  const removePaywall = () => {
    const selectors = [
      '.paywall', '.overlay', '.banner', '.upsell',
      '.premium-banner', '.subscribe-banner', '.ad-container',
      '[class*="paywall"]', '[class*="blur"]', '.auto__doc_page_webpack_doc_page_blur_promos'
    ];
    selectors.forEach(sel => document.querySelectorAll(sel).forEach(el => el.remove()));

    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.filter && style.filter.includes('blur')) {
        el.style.filter = 'none';
        el.style.webkitFilter = 'none';
      }
    });
  };

  removePaywall();

  // 3. Tự động cuộn thật nhanh để load hết trang
  let lastScroll = -1;
  await new Promise((resolve) => {
    const timer = setInterval(() => {
      window.scrollBy(0, 800);
      removePaywall(); // Xóa liên tục nếu trang nạp thêm paywall mới
      
      if (window.scrollY === lastScroll || (window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        clearInterval(timer);
        resolve();
      }
      lastScroll = window.scrollY;
    }, 250);
  });

  if (statusText) statusText.innerText = '✨ Chuẩn bị xuất file PDF...';
  window.scrollTo(0, 0);

  // 4. Kích hoạt hộp thoại In PDF gốc của Chrome
  setTimeout(() => {
    overlay.remove();
    window.print(); // Mở bảng Save as PDF chuẩn nét 100%
  }, 600);
}