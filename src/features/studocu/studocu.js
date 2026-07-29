// ============================================
// Multi Tool Hub - Studocu Feature (Popup Logic)
// ============================================

PAGES.studocu.render = function() {
  return `
    <p class="hint-text">(Mẹo: Cuộn chuột tới cuối tài liệu để tải toàn bộ trước khi Tải PDF)</p>

    <button id="stu-pdf-btn" class="action-btn primary">
      <div class="icon-circle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" x2="12" y1="15" y2="3"/>
        </svg>
      </div>
      <div class="btn-info">
        <span class="btn-heading">Tải File PDF</span>
        <span class="btn-sub">Tự động dàn trang in sạch watermark</span>
      </div>
    </button>

    <button id="stu-clear-btn" class="action-btn secondary">
      <div class="icon-circle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
      <div class="btn-info">
        <span class="btn-heading">Xem file & Xóa Watermark</span>
        <span class="btn-sub">Xóa cookie và reload trang</span>
      </div>
    </button>

    <button id="stu-capture-btn" class="action-btn secondary">
      <div class="icon-circle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
      <div class="btn-info">
        <span class="btn-heading">Lưu thành Ảnh</span>
        <span class="btn-sub">Tải trang đang hiển thị (.PNG)</span>
      </div>
    </button>
  `;
};

PAGES.studocu.attachEvents = function() {
  // 1. Tải File PDF
  document.getElementById('stu-pdf-btn').addEventListener('click', async (e) => {
    const tab = await getCurrentTab();
    if (!tab.url.includes(CONFIG.STUDOCU.URL_PATTERN)) {
      showToast('Tính năng này chỉ hoạt động trên Studocu', 'error');
      return;
    }

    const btn = e.currentTarget;
    const originalHeading = btn.querySelector('.btn-heading').innerText;
    btn.querySelector('.btn-heading').innerText = 'Đang xử lý...';
    btn.style.opacity = '0.7';

    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['styles/viewer-styles.css']
      });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: runCleanViewerInside
      });

      showToast('Đang chuẩn bị PDF...', 'info');
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      btn.querySelector('.btn-heading').innerText = originalHeading;
      btn.style.opacity = '1';
    }
  });

  // 2. Xem file & Xóa Watermark
  document.getElementById('stu-clear-btn').addEventListener('click', async (e) => {
    const tab = await getCurrentTab();
    if (!tab.url.includes(CONFIG.STUDOCU.URL_PATTERN)) {
      showToast('Tính năng này chỉ hoạt động trên Studocu', 'error');
      return;
    }

    const btn = e.currentTarget;
    const originalHeading = btn.querySelector('.btn-heading').innerText;
    btn.querySelector('.btn-heading').innerText = 'Đang xử lý...';
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';

    try {
      const allCookies = await chrome.cookies.getAll({});
      for (const cookie of allCookies) {
        if (cookie.domain.includes('studocu')) {
          let cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
          const protocol = cookie.secure ? 'https:' : 'http:';
          const url = `${protocol}//${cleanDomain}${cookie.path}`;
          await chrome.cookies.remove({ url, name: cookie.name, storeId: cookie.storeId });
        }
      }
      await new Promise(r => setTimeout(r, 300));
      chrome.tabs.reload(tab.id);
      showToast('Đã xóa cookie, đang reload trang...', 'success');
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
      btn.querySelector('.btn-heading').innerText = originalHeading;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
  });

  // 3. Lưu thành Ảnh
  document.getElementById('stu-capture-btn').addEventListener('click', async () => {
    const tab = await getCurrentTab();
    if (!tab.url.includes(CONFIG.STUDOCU.URL_PATTERN)) {
      showToast('Tính năng này chỉ hoạt động trên Studocu', 'error');
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const visiblePages = [];
        const pages = document.querySelectorAll('div[data-page-index]');

        pages.forEach((page, index) => {
          const rect = page.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            visiblePages.push({ element: page, index: index + 1 });
          }
        });

        if (visiblePages.length === 0) {
          alert('Không tìm thấy trang nào trên màn hình. Hãy cuộn đến trang muốn chụp!');
          return [];
        }

        const imagesToDownload = [];
        visiblePages.forEach(item => {
          const img = item.element.querySelector('img.bi') || item.element.querySelector('img');
          if (img && img.src) {
            imagesToDownload.push({ src: img.src, name: `page_${item.index}.png` });
          }
        });

        if (imagesToDownload.length === 0) {
          alert('Không tìm thấy dữ liệu ảnh. Trang có thể chưa tải xong.');
        }
        return imagesToDownload;
      }
    }, (results) => {
      if (chrome.runtime.lastError) {
        showToast('Lỗi: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      if (results && results[0] && results[0].result && results[0].result.length > 0) {
        results[0].result.forEach(imgData => {
          chrome.downloads.download({
            url: imgData.src,
            filename: `Studocu_${imgData.name}`,
            saveAs: false
          });
        });
        showToast(`Đang tải ${results[0].result.length} ảnh...`, 'success');
      }
    });
  });
};

// ========== PDF Viewer Function (injected to page) ==========
function runCleanViewerInside() {
  const pages = document.querySelectorAll('div[data-page-index]');
  if (pages.length === 0) {
    alert('Không tìm thấy trang nào.\nHãy cuộn xuống cuối để web tải hết nội dung!');
    return;
  }

  if (!confirm(`Sẵn sàng tạo PDF cho ${pages.length} trang.\nBấm OK để xử lý...`)) return;

  const SCALE_FACTOR = 4;
  const HEIGHT_SCALE_DIVISOR = 4;

  function copyComputedStyle(source, target, scaleFactor, shouldScaleHeight, shouldScaleWidth, heightScaleDivisor, widthScaleDivisor, shouldScaleMargin, marginScaleDivisor) {
    const computedStyle = window.getComputedStyle(source);
    const normalProps = [
      'position', 'left', 'top', 'bottom', 'right',
      'font-family', 'font-weight', 'font-style',
      'color', 'background-color',
      'text-align', 'white-space',
      'display', 'visibility', 'opacity', 'z-index',
      'text-shadow', 'unicode-bidi', 'font-feature-settings', 'padding'
    ];
    const scaleProps = ['font-size', 'line-height'];
    let styleString = '';

    normalProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
        styleString += `${prop}: ${value} !important; `;
      }
    });

    const widthValue = computedStyle.getPropertyValue('width');
    if (widthValue && widthValue !== 'none' && widthValue !== 'auto') {
      if (shouldScaleWidth) {
        const numValue = parseFloat(widthValue);
        if (!isNaN(numValue) && numValue > 0) {
          const unit = widthValue.replace(numValue.toString(), '');
          styleString += `width: ${numValue / widthScaleDivisor}${unit} !important; `;
        } else {
          styleString += `width: ${widthValue} !important; `;
        }
      } else {
        styleString += `width: ${widthValue} !important; `;
      }
    }

    const heightValue = computedStyle.getPropertyValue('height');
    if (heightValue && heightValue !== 'none' && heightValue !== 'auto') {
      if (shouldScaleHeight) {
        const numValue = parseFloat(heightValue);
        if (!isNaN(numValue) && numValue > 0) {
          const unit = heightValue.replace(numValue.toString(), '');
          styleString += `height: ${numValue / heightScaleDivisor}${unit} !important; `;
        } else {
          styleString += `height: ${heightValue} !important; `;
        }
      } else {
        styleString += `height: ${heightValue} !important; `;
      }
    }

    ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'].forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'auto') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          if (shouldScaleMargin && numValue !== 0) {
            const unit = value.replace(numValue.toString(), '');
            styleString += `${prop}: ${numValue / marginScaleDivisor}${unit} !important; `;
          } else {
            styleString += `${prop}: ${value} !important; `;
          }
        }
      }
    });

    scaleProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue !== 0) {
          const unit = value.replace(numValue.toString(), '');
          styleString += `${prop}: ${numValue / scaleFactor}${unit} !important; `;
        } else {
          styleString += `${prop}: ${value} !important; `;
        }
      }
    });

    let transformOrigin = computedStyle.getPropertyValue('transform-origin');
    if (transformOrigin) {
      styleString += `transform-origin: ${transformOrigin} !important; -webkit-transform-origin: ${transformOrigin} !important; `;
    }

    styleString += 'overflow: visible !important; max-width: none !important; max-height: none !important; clip: auto !important; clip-path: none !important; ';
    target.style.cssText += styleString;
  }

  function deepCloneWithStyles(element, scaleFactor, heightScaleDivisor) {
    const clone = element.cloneNode(false);
    const hasTextClass = element.classList && element.classList.contains('t');
    const hasUnderscoreClass = element.classList && element.classList.contains('_');

    const shouldScaleMargin = element.tagName === 'SPAN' &&
      element.classList &&
      element.classList.contains('_') &&
      Array.from(element.classList).some(cls => /^_(?:\d+[a-z]*|[a-z]+\d*)$/i.test(cls));

    copyComputedStyle(element, clone, scaleFactor, hasTextClass, hasUnderscoreClass, heightScaleDivisor, 4, shouldScaleMargin, scaleFactor);

    if (element.classList && element.classList.contains('pc')) {
      clone.style.setProperty('transform', 'none', 'important');
      clone.style.setProperty('-webkit-transform', 'none', 'important');
      clone.style.setProperty('overflow', 'visible', 'important');
      clone.style.setProperty('max-width', 'none', 'important');
      clone.style.setProperty('max-height', 'none', 'important');
    }

    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
      clone.textContent = element.textContent;
    } else {
      element.childNodes.forEach(child => {
        if (child.nodeType === 1) {
          clone.appendChild(deepCloneWithStyles(child, scaleFactor, heightScaleDivisor));
        } else if (child.nodeType === 3) {
          clone.appendChild(child.cloneNode(true));
        }
      });
    }
    return clone;
  }

  const viewerContainer = document.createElement('div');
  viewerContainer.id = 'clean-viewer-container';

  pages.forEach((page, index) => {
    const pc = page.querySelector('.pc');
    let width = 595.3;
    let height = 841.9;

    if (pc) {
      const pcStyle = window.getComputedStyle(pc);
      const pcWidth = parseFloat(pcStyle.width);
      const pcHeight = parseFloat(pcStyle.height);
      if (!isNaN(pcWidth) && pcWidth > 0 && !isNaN(pcHeight) && pcHeight > 0) {
        width = pcWidth;
        height = pcHeight;
      } else {
        const rect = pc.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10) {
          width = rect.width;
          height = rect.height;
        }
      }
    }

    const newPage = document.createElement('div');
    newPage.className = 'std-page';
    newPage.id = `page-${index + 1}`;
    newPage.setAttribute('data-page-number', index + 1);
    newPage.style.width = width + 'px';
    newPage.style.height = height + 'px';

    const originalImg = page.querySelector('img.bi') || page.querySelector('img');
    if (originalImg) {
      const bgLayer = document.createElement('div');
      bgLayer.className = 'layer-bg';
      const imgClone = originalImg.cloneNode(true);
      imgClone.style.cssText = 'width: 100%; height: 100%; object-fit: cover; object-position: top center';
      bgLayer.appendChild(imgClone);
      newPage.appendChild(bgLayer);
    }

    const originalPc = page.querySelector('.pc');
    if (originalPc) {
      const textLayer = document.createElement('div');
      textLayer.className = 'layer-text';
      const pcClone = deepCloneWithStyles(originalPc, SCALE_FACTOR, HEIGHT_SCALE_DIVISOR);
      pcClone.querySelectorAll('img').forEach(img => img.style.display = 'none');
      textLayer.appendChild(pcClone);
      newPage.appendChild(textLayer);
    }

    viewerContainer.appendChild(newPage);
  });

  document.body.appendChild(viewerContainer);

  setTimeout(() => {
    window.print();
  }, 1000);
}
