// ============================================
// SCRIBD - POPUP LOGIC (DÙNG MESSAGING CHỐNG 404)
// ============================================

const SCRIBD_HTML = `
<div class="scribd-container" style="border: none !important; padding: 0; margin: 0;">
  <div class="form-group" style="margin-bottom: 10px;">
    <label style="font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 6px; display: block;">
      🔗 Nhập Link tài liệu Scribd:
    </label>
    <input type="text" id="scribd-url-input" placeholder="https://www.scribd.com/document/..." style="width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12px; background: var(--surface); color: var(--text);" />
  </div>

  <button id="scribd-pdf-btn" class="action-btn primary" style="background: linear-gradient(135deg, #0077B5, #00A0DC); margin-bottom: 0; border: none !important; justify-content: center;">
    <span style="font-size: 16px; margin-right: 8px;">📥</span>
    <span class="btn-heading" style="font-size: 13px; font-weight: 700;">Tải File PDF</span>
  </button>
</div>
`;

PAGES.scribd = {
  render: function() {
    return SCRIBD_HTML;
  },
  attachEvents: function() {
    const input = document.getElementById('scribd-url-input');
    const pdfBtn = document.getElementById('scribd-pdf-btn');

    // Tự động điền URL nếu tab hiện tại là Scribd
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('scribd.com/document/')) {
        if (input) input.value = tabs[0].url;
      }
    });

    pdfBtn?.addEventListener('click', async function() {
  let urlValue = input ? input.value.trim() : '';

  if (!urlValue) {
    if (typeof showToast === 'function') showToast('⚠️ Vui lòng nhập link Scribd!', 'warning');
    return;
  }

  // Chuẩn hóa URL: Bóc tách nếu bị dán dính link
  const match = urlValue.match(/(https?:\/\/[^\s]+)/g);
  if (match) {
    urlValue = match[match.length - 1]; // Lấy link hợp lệ cuối cùng
  }

  if (!urlValue.includes('scribd.com/document/')) {
    if (typeof showToast === 'function') showToast('❌ Link Scribd không đúng cấu trúc!', 'error');
    return;
  }

  try {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // So sánh đường dẫn sạch (Loại bỏ URL trùng)
    const cleanTargetUrl = new URL(urlValue).origin + new URL(urlValue).pathname;
    const cleanCurrentUrl = currentTab?.url ? (new URL(currentTab.url).origin + new URL(currentTab.url).pathname) : '';

    let targetTabId = currentTab?.id;

    // Nếu khác tab hiện tại -> Mở tab mới với URL chuẩn
    if (cleanTargetUrl !== cleanCurrentUrl) {
      const newTab = await chrome.tabs.create({ url: cleanTargetUrl, active: true });
      targetTabId = newTab.id;
      await new Promise(r => setTimeout(r, 2500)); // Chờ tab mới load
    }

    // Gửi tín hiệu thực thi tới Content Script
    chrome.tabs.sendMessage(targetTabId, { action: 'START_SCRIBD_AUTO_PDF' }, (response) => {
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          files: ['src/features/document-download/scribd/scribd-content.js']
        }, () => {
          chrome.tabs.sendMessage(targetTabId, { action: 'START_SCRIBD_AUTO_PDF' });
        });
      }
    });

    if (typeof showToast === 'function') showToast('🚀 Đang bắt đầu xử lý...', 'success');
    setTimeout(() => window.close(), 500);
  } catch (e) {
    if (typeof showToast === 'function') showToast('❌ Lỗi xử lý đường dẫn!', 'error');
  }
});

    input?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') pdfBtn?.click();
    });
  },
  title: '📄 Scribd Tools'
};