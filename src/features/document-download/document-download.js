// ============================================
// Multi Tool Hub - Tải tài liệu (Document Download Hub)
// ============================================

// ============================================
// DANH SÁCH SKILL CON
// ============================================
const DOC_SKILLS = {
  studocu: {
    id: 'studocu',
    title: 'Studocu Tools',
    desc: 'Tải PDF, xóa watermark, lưu ảnh',
    icon: '📚',
    color: 'linear-gradient(135deg, #FF6B00, #FFB000)',
    pageName: 'studocu',
  },
  scribd: {
    id: 'scribd',
    title: 'Scribd Tools',
    desc: 'Tải PDF, xóa watermark, lưu ảnh',
    icon: '📄',
    color: 'linear-gradient(135deg, #0077B5, #00A0DC)',
    pageName: 'scribd',
  },
};

// ============================================
// LOAD HTML TEMPLATE
// ============================================
let docDownloadHTML = '';

async function loadDocDownloadHTML() {
  try {
    const response = await fetch(chrome.runtime.getURL('src/features/document-download/document-download.html'));
    docDownloadHTML = await response.text();
  } catch (e) {
    console.error('Không thể load document-download.html:', e);
    docDownloadHTML = `
      <div class="doc-download-container">
        <button class="doc-skill-btn" data-skill="studocu">
          <div class="doc-skill-icon" style="background: linear-gradient(135deg, #FF6B00, #FFB000);">📚</div>
          <div class="doc-skill-info">
            <span class="doc-skill-title">Studocu Tools</span>
            <span class="doc-skill-desc">Tải PDF, xóa watermark, lưu ảnh</span>
          </div>
          <span class="doc-skill-arrow">›</span>
        </button>
        <button class="doc-skill-btn" data-skill="scribd">
          <div class="doc-skill-icon" style="background: linear-gradient(135deg, #0077B5, #00A0DC);">📄</div>
          <div class="doc-skill-info">
            <span class="doc-skill-title">Scribd Tools</span>
            <span class="doc-skill-desc">Tải PDF, xóa watermark, lưu ảnh</span>
          </div>
          <span class="doc-skill-arrow">›</span>
        </button>
        <div class="status-bar">
          <span class="dot"></span>
          <span>Chọn dịch vụ tài liệu</span>
        </div>
        <div id="doc-skill-content" style="display:none;">
          <div id="doc-skill-body"></div>
        </div>
      </div>
    `;
  }
}

// ============================================
// POPUP PAGE
// ============================================
PAGES['document-download'] = {
  render: function() {
    return docDownloadHTML || '<p>Đang tải...</p>';
  },

  attachEvents: function() {
    const container = document.getElementById('doc-skill-content');
    const body = document.getElementById('doc-skill-body');

    if (!container || !body) {
      console.error('[Document Download] DOM elements not found');
      return;
    }

    // ===== CLICK VÀO SKILL CON =====
    document.querySelectorAll('.doc-skill-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const skillId = this.dataset.skill;
        const skill = DOC_SKILLS[skillId];
        
        if (!skill) return;

        // Ẩn danh sách, hiển thị content
        document.querySelectorAll('.doc-skill-btn').forEach(el => el.style.display = 'none');
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) statusBar.style.display = 'none';
        container.style.display = 'block';
        
        // Reset body trước khi render
        body.innerHTML = '';
        body.style.border = 'none';

        // Lấy page từ PAGES đã đăng ký
        const page = PAGES[skill.pageName];
        
        if (page) {
          body.innerHTML = page.render();
          if (page.attachEvents) {
            setTimeout(() => page.attachEvents(), 50);
          }
        } else {
          body.innerHTML = `
            <div class="form-group">
              <p style="color: var(--text-muted);">⚠️ Không thể tải ${skill.title}.</p>
              <button class="action-btn secondary" style="margin-top:8px;" onclick="
                document.querySelectorAll('.doc-skill-btn').forEach(el => el.style.display = 'flex');
                document.querySelector('.status-bar').style.display = 'flex';
                document.getElementById('doc-skill-content').style.display = 'none';
                document.getElementById('doc-skill-body').innerHTML = '';
              ">
                🔄 Quay lại danh sách
              </button>
            </div>
          `;
        }
      });
    });

    // ===== QUAY LẠI: Về menu document-download (không ra home) =====
    // Lưu ý: Nút back trong popup.js đã xử lý quay về trang trước đó
    // Nên không cần thêm logic ở đây
  },

  title: '📚 Tải tài liệu'
};

// ============================================
// LOAD HTML KHI KHỞI ĐỘNG
// ============================================
loadDocDownloadHTML();