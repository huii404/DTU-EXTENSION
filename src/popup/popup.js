// ============================================
// Multi Tool Hub - Popup Router
// ============================================

const PAGES = {
  home: {
    render: renderHome,
    title: ''
  }
};

let currentPage = 'home';
let SHORTCUTS = {};

async function loadShortcuts() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SHORTCUTS' });
    if (response) {
      SHORTCUTS = response;
    }
  } catch (e) {
    console.warn('[Popup] Không thể lấy shortcuts:', e);
  }
}

function navigateTo(pageName) {
  const container = document.getElementById('app-container');
  const page = PAGES[pageName];
  if (!page) {
    console.error('Page not found:', pageName);
    return;
  }

  currentPage = pageName;
  container.scrollTop = 0;

  if (pageName === 'home') {
    container.innerHTML = page.render();
    attachHomeEvents();
  } else {
    const shortcut = SHORTCUTS[pageName] || '';
    container.innerHTML = `
      <div class="page-enter">
        <div class="back-bar">
          <button id="backBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay lại
          </button>
          <span class="page-title">${page.title}</span>
          ${shortcut ? `<span class="page-shortcut">⌨️ ${shortcut.replace('Ctrl+Shift+', '').replace('Alt+Shift+', '')}</span>` : ''}
        </div>
        ${page.render()}
      </div>
    `;
    document.getElementById('backBtn').addEventListener('click', () => navigateTo('home'));
    page.attachEvents && page.attachEvents();
  }
}

// ---------- HOME PAGE ----------
function renderHome() {
  function getShortcutBadge(pageName) {
    const shortcut = SHORTCUTS[pageName];
    if (shortcut) {
      const short = shortcut.replace(/Ctrl\+Shift\+/g, '⌨️ ').replace(/Alt\+Shift\+/g, '');
      return `<span class="shortcut-badge">${short}</span>`;
    }
    return '';
  }

  return `
    <div class="page-enter">
      <!-- DTU Hub -->
      <button class="feature-card" data-page="dtu" style="border-left: 4px solid #d52b1e;">
        <div class="icon-box" style="background: linear-gradient(135deg, #d52b1e, #ff6b6b); color:white;">🏛️</div>
        <div class="info">
          <span class="title">SINHVIEN DTU</span>
          <span class="desc">Đánh giá giảng viên và các tiện ích sinh viên</span>
        </div>
        <span style="display:flex;align-items:center;gap:4px;">
          ${getShortcutBadge('dtu')}
          <span class="arrow">›</span>
        </span>
      </button>

      <!-- Studocu -->
      <button class="feature-card studocu" data-page="studocu">
        <div class="icon-box">📚</div>
        <div class="info">
          <span class="title">Studocu Tools</span>
          <span class="desc">Tải PDF, xóa watermark, lưu ảnh</span>
        </div>
        <span style="display:flex;align-items:center;gap:4px;">
          ${getShortcutBadge('studocu')}
          <span class="arrow">›</span>
        </span>
      </button>

      <!-- Scribd -->
      <button class="feature-card" data-page="scribd" style="border-left: 4px solid #0077B5;">
        <div class="icon-box" style="background: linear-gradient(135deg, #0077B5, #00A0DC); color:white;">📄</div>
        <div class="info">
          <span class="title">Scribd Tools</span>
          <span class="desc">Tải PDF, xóa watermark, lưu ảnh</span>
        </div>
        <span style="display:flex;align-items:center;gap:4px;">
          ${getShortcutBadge('scribd')}
          <span class="arrow">›</span>
        </span>
      </button>

      <!-- Screenshot -->
      <button class="feature-card" data-page="screenshot" style="border-left: 4px solid #7C3AED;">
        <div class="icon-box" style="background: linear-gradient(135deg, #7C3AED, #A78BFA); color:white;">📸</div>
        <div class="info">
          <span class="title">Chụp ảnh Web</span>
          <span class="desc">Chỉ nội dung trang, không UI trình duyệt</span>
        </div>
        <span style="display:flex;align-items:center;gap:4px;">
          ${getShortcutBadge('screenshot')}
          <span class="arrow">›</span>
        </span>
      </button>

      <!-- Text Cleaner -->
      <button class="feature-card" data-page="textcleaner" style="border-left: 4px solid #2ECC71;">
        <div class="icon-box" style="background: linear-gradient(135deg, #2ECC71, #27AE60); color:white;">🧹</div>
        <div class="info">
          <span class="title">Làm sạch Text</span>
          <span class="desc">Xóa định dạng ẩn, HTML, Markdown, bảng</span>
        </div>
        <span style="display:flex;align-items:center;gap:4px;">
          <span class="arrow">›</span>
        </span>
      </button>

      <!-- ✅ QR CODE -->
      <button class="feature-card" data-page="qrcode" style="border-left: 4px solid #8e44ad;">
        <div class="icon-box" style="background: linear-gradient(135deg, #8e44ad, #9b59b6); color:white;">📱</div>
        <div class="info">
          <span class="title">Tạo mã QR</span>
          <span class="desc">Tạo QR Code từ văn bản, URL, số điện thoại...</span>
        </div>
        <span style="display:flex;align-items:center;gap:4px;">
          <span class="arrow">›</span>
        </span>
      </button>

      <!-- Shortcut hint -->
      <div class="shortcut-hint">
        💡 Phím tắt: 
        ${Object.entries(SHORTCUTS).map(([page, shortcut]) => 
          `<kbd>${shortcut.replace('Ctrl+Shift+', '').replace('Alt+Shift+', '')}</kbd>`
        ).join(' ')}
      </div>

      <div class="status-bar">
        <span class="dot"></span>
        <span>Sẵn sàng hoạt động</span>
      </div>
    </div>
  `;
}

function attachHomeEvents() {
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
      const page = card.getAttribute('data-page');
      navigateTo(page);
    });
  });
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', async () => {
  await loadShortcuts();
  navigateTo('home');
});

// ===== LẮNG NGHE MESSAGE TỪ BACKGROUND =====
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'NAVIGATE_TO') {
    const page = message.payload.page;
    if (PAGES[page]) {
      navigateTo(page);
    }
  }
});