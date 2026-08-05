
/**
 * Hiển thị thông báo toast trong popup
 * @param {string} message - Nội dung thông báo
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - Thờigian hiển thị (ms)
 */
function showToast(message, type = 'info', duration = 4000) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.style.cssText = `
      position: fixed;
      top: 12px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      z-index: 10000;
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
  }

  const colors = {
    success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
    error:   { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
    info:    { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' },
    warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' }
  };

  const c = colors[type] || colors.info;
  toast.style.background = c.bg;
  toast.style.color = c.color;
  toast.style.border = `1px solid ${c.border}`;
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  if (toast._timeout) clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
  }, duration);
}

/**
 * Kiểm tra URL hiện tại có khớp pattern không
 * @param {string} pattern - Chuỗi cần tìm trong URL
 * @returns {Promise<boolean>}
 */
async function checkCurrentUrl(pattern) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      resolve(tab && tab.url && tab.url.includes(pattern));
    });
  });
}

/**
 * Lấy tab hiện tại
 * @returns {Promise<chrome.tabs.Tab>}
 */
async function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

/**
 * Gửi message đến content script của tab hiện tại
 * @param {object} message
 * @returns {Promise<any>}
 */
async function sendToContent(message) {
  const tab = await getCurrentTab();
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Debounce helper
 */
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Format số trang
 */
function formatPageCount(n) {
  return n === 1 ? '1 trang' : `${n} trang`;
}
