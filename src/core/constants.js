// ============================================
// Multi Tool Hub - Constants & Config
// ============================================

const CONFIG = {
  // DTU Rating
  DTU: {
    RATING_URL_PATTERN: 'https://mydtu.duytan.edu.vn/sites/index.aspx?p=home_ratingform',
    RADIO_COUNT: 48,      // R0 -> R47
    TEXTAREA_COUNT: 5,    // R48 -> R52
    OPTION_MAP: {
      '1': 'A', '2': 'B', '3': 'C',
      '4': 'D', '5': 'E', '6': 'F'
    },
    DEFAULT_TEXTS: {
      '1': "Giảng viên xuất sắc, nhiệt tình, phương pháp giảng dạy hiệu quả",
      '2': "Giảng viên rất tốt, truyền đạt kiến thức rõ ràng",
      '3': "Giảng viên dạy tốt, có kiến thức chuyên môn",
      '4': "Giảng viên dạy bình thường, đạt yêu cầu cơ bản",
      '5': "Giảng viên cần cải thiện phương pháp giảng dạy",
      '6': "Giảng viên cần nâng cao chất lượng giảng dạy"
    },
    RATING_LABELS: {
      '1': 'Tốt (1)',
      '2': 'Khá (2)',
      '3': 'Trung Bình (3)',
      '4': 'Trung Bình Yếu (4)',
      '5': 'Yếu (5)',
      '6': 'Kém (6)'
    }
  },

  // Studocu
  STUDOCU: {
    URL_PATTERN: 'studocu',
    AUTO_PDF_PARAM: 'banhmi_auto_pdf=1',
    SCALE_FACTOR: 4,
    HEIGHT_SCALE_DIVISOR: 4,
    SCROLL_STEP: 800,
    SCROLL_INTERVAL: 600,
    SAME_COUNT_THRESHOLD: 3
  }
};

// Export for module usage (popup context)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG };
}
