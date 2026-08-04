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
  return `
    <div class="page-enter">
      <button class="feature-card dtu" data-page="dtu">
        <div class="icon-box">🎓</div>
        <div class="info">
          <span class="title">Đánh giá DTU</span>
          <span class="desc">Tự động điền form khảo sát giảng viên</span>
        </div>
        <span class="arrow">›</span>
      </button>

      <button class="feature-card studocu" data-page="studocu">
        <div class="icon-box">📚</div>
        <div class="info">
          <span class="title">Studocu Tools</span>
          <span class="desc">Tải PDF, xóa watermark, lưu ảnh</span>
        </div>
        <span class="arrow">›</span>
      </button>

      <button class="feature-card" data-page="scribd" style="border-left: 4px solid #0077B5;">
        <div class="icon-box" style="background: linear-gradient(135deg, #0077B5, #00A0DC); color:white;">📄</div>
        <div class="info">
          <span class="title">Scribd Tools</span>
          <span class="desc">Tải PDF, xóa watermark, lưu ảnh</span>
        </div>
        <span class="arrow">›</span>
      </button>

      <button class="feature-card" data-page="screenshot" style="border-left: 4px solid #7C3AED;">
        <div class="icon-box" style="background: linear-gradient(135deg, #7C3AED, #A78BFA); color:white;">📸</div>
        <div class="info">
          <span class="title">Chụp ảnh Web</span>
          <span class="desc">Chỉ nội dung trang, không UI trình duyệt</span>
        </div>
        <span class="arrow">›</span>
      </button>

      <button class="feature-card" data-page="textcleaner" style="border-left: 4px solid #2ECC71;">
        <div class="icon-box" style="background: linear-gradient(135deg, #2ECC71, #27AE60); color:white;">🧹</div>
        <div class="info">
          <span class="title">Làm sạch Text</span>
          <span class="desc">Xóa định dạng ẩn, HTML, Markdown, bảng</span>
        </div>
        <span class="arrow">›</span>
      </button>

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
document.addEventListener('DOMContentLoaded', () => {
  navigateTo('home');
});