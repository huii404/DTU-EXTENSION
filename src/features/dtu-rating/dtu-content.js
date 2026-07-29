// ============================================
// Multi Tool Hub - DTU Rating Content Script
// ============================================

if (window.location.href.includes('https://mydtu.duytan.edu.vn/sites/index.aspx?p=home_ratingform')) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'autoRate') {
            try {
                // Auto-check radio buttons R0 -> R47
                for (let i = 0; i <= 47; i++) {
                    const radioId = `R${i}${request.optionChar}`;
                    const radio = document.getElementById(radioId);
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }

                // Auto-fill textareas R48 -> R52
                for (let j = 48; j <= 52; j++) {
                    const textareaId = `R${j}`;
                    const textarea = document.getElementById(textareaId);
                    if (textarea) {
                        textarea.value = request.text;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }

                // Scroll to bottom for CAPTCHA
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });

                sendResponse({ success: true });

            } catch (error) {
                console.error('Lỗi khi thực hiện autoRate:', error);
                sendResponse({ success: false, error: error.message });
            }
            return true; // Keep channel open for async
        }
    });
}
