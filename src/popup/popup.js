// ============================================
// Multi Tool Hub - Popup Router
// ============================================

const PAGES = {
  home: {
    render: renderHome,
    title: ''
  },
  dtu: {
    render: renderDtuRating,
    title: '🎓 Đánh giá DTU'
  },
  studocu: {
    render: renderStudocu,
    title: '📚 Studocu Tools'
  }
};

let currentPage = 'home';

function navigateTo(pageName) {
  const container = document.getElementById('app-container');
  const page = PAGES[pageName];
  if (!page) return;

  currentPage = pageName;

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
