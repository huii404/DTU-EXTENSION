// ============================================
// DTU - Đánh giá giảng viên (Logic)
// ============================================

export function attachEvents() {
  const confirmBtn = document.getElementById('dtu-confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', handleConfirm);
  }
}

async function handleConfirm() {
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

  const cau53Value = document.getElementById('dtu-cau53-select').value;

  try {
    const response = await sendToContent({
      action: 'autoRate',
      optionChar: optionChar,
      text: finalText,
      cau53Value: cau53Value
    });

    if (response && response.success) {
      showToast('Đánh giá thành công! Nhập CAPTCHA để xác nhận', 'success');
    } else {
      showToast('Đánh giá không thành công. Vui lòng thử lại.', 'error');
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}