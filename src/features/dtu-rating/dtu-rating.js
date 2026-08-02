// ============================================
// Multi Tool Hub - DTU Rating Feature
// ============================================

PAGES.dtu = {
  render: function() {
    return `
      <div class="form-group">
        <label for="dtu-rating-select">
          <span class="icon">⭐</span> Chọn xếp loại (câu 1 - 48):
        </label>
        <select id="dtu-rating-select">
          <option value="1" selected>Tốt (1)</option>
          <option value="2">Khá (2)</option>
          <option value="3">Trung Bình (3)</option>
          <option value="4">Trung Bình Yếu (4)</option>
          <option value="5">Yếu (5)</option>
          <option value="6">Kém (6)</option>
        </select>
      </div>

      <div class="form-group">
        <label for="dtu-custom-text">
          <span class="icon">💬</span> Nội dung đánh giá (câu 49 - 52):
        </label>
        <textarea id="dtu-custom-text" placeholder="Bỏ trống sẽ tự động điền nội dung mặc định theo xếp loại"></textarea>
      </div>

      <!-- ========== THÊM CÂU 53 ========== -->
      <div class="form-group">
        <label for="dtu-cau53-select">
          <span class="icon">📊</span> Câu 53: Mức độ hài lòng:
        </label>
        <select id="dtu-cau53-select">
          <option value="1">1 - Rất không hài lòng</option>
          <option value="2">2 - Không hài lòng</option>
          <option value="3">3 - Phân vân</option>
          <option value="4" selected>4 - Hài lòng</option>
          <option value="5">5 - Rất hài lòng</option>
        </select>
      </div>

      <button id="dtu-confirm-btn" class="action-btn dtu-primary">
        <div class="icon-circle">✓</div>
        <div class="btn-info">
          <span class="btn-heading">Xác nhận đánh giá</span>
          <span class="btn-sub">Tự động điền form trên trang DTU</span>
        </div>
      </button>
    `;
  },

  attachEvents: function() {
    document.getElementById('dtu-confirm-btn').addEventListener('click', async function() {
      const tab = await getCurrentTab();

      if (!tab.url.includes(CONFIG.DTU.RATING_URL_PATTERN)) {
        showToast('Vui lòng mở trang đánh giá DTU để sử dụng', 'error');
        return;
      }

      const ratingValue = document.getElementById('dtu-rating-select').value;
      const optionChar = CONFIG.DTU.OPTION_MAP[ratingValue] || 'A';
      const customText = document.getElementById('dtu-custom-text').value;
      const finalText = customText.trim() === ''
        ? (CONFIG.DTU.DEFAULT_TEXTS[ratingValue] || "Giảng viên dạy tốt")
        : customText;

      // Lấy giá trị câu 53
      const cau53Value = document.getElementById('dtu-cau53-select').value;

      try {
        const response = await sendToContent({
          action: 'autoRate',
          optionChar: optionChar,
          text: finalText,
          cau53Value: cau53Value  // Thêm giá trị câu 53
        });

        if (response && response.success) {
          showToast('Đánh giá thành công! Nhập CAPTCHA để xác nhận', 'success');
        } else {
          showToast('Đánh giá không thành công. Vui lòng thử lại.', 'error');
        }
      } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
      }
    });
  },

  title: '🎓 Đánh giá DTU'
};