// ============================================
// Multi Tool Hub - Studocu Feature (Popup Logic)
// ============================================

// ============================================
// LOAD HTML TEMPLATE
// ============================================
let studocuHTML = '';

async function loadStudocuHTML() {
  try {
    const response = await fetch(chrome.runtime.getURL('src/features/document-download/studocu/studocu.html'));
    studocuHTML = await response.text();
  } catch (e) {
    console.error('Không thể load studocu.html:', e);
    studocuHTML = `
      <div class="studocu-container">
        <p class="hint-text">(Mẹo: Cuộn chuột tới cuối tài liệu để tải toàn bộ trước khi Tải PDF)</p>
        <button id="stu-pdf-btn" class="action-btn primary">Tải File PDF</button>
        <button id="stu-clear-btn" class="action-btn secondary">Xem file & Xóa Watermark</button>
        <button id="stu-capture-btn" class="action-btn secondary">Lưu thành Ảnh</button>
      </div>
    `;
  }
}

// ============================================
// POPUP PAGE - STUDOCU
// ============================================
PAGES.studocu = {
  render: function() {
    return studocuHTML || '<p>Đang tải...</p>';
  },

  attachEvents: function() {
    // ========== 1. Tải File PDF ==========
    document.getElementById('stu-pdf-btn')?.addEventListener('click', async function() {
      console.log('[Studocu] PDF button clicked');
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url || !tab.url.includes('studocu')) {
          alert('⚠️ Tính năng này chỉ hoạt động trên trang Studocu.');
          return;
        }

        const btn = this;
        const originalText = btn.querySelector('.btn-heading')?.innerText || 'Tải File PDF';
        const heading = btn.querySelector('.btn-heading');
        if (heading) heading.innerText = '⏳ Đang xử lý...';
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';

        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles/viewer-styles.css']
        });

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: runCleanViewerInside
        });

        if (heading) heading.innerText = originalText;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      } catch (err) {
        console.error('[Studocu] PDF error:', err);
        alert('❌ Lỗi: ' + err.message);
        const btn = this;
        const heading = btn.querySelector('.btn-heading');
        if (heading) heading.innerText = 'Tải File PDF';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }
    });

    // ========== 2. Xem file & Xóa Watermark ==========
    document.getElementById('stu-clear-btn')?.addEventListener('click', async function() {
      console.log('[Studocu] Clear button clicked');
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url || !tab.url.includes('studocu')) {
          alert('⚠️ Tính năng này chỉ hoạt động trên trang Studocu.');
          return;
        }

        const btn = this;
        const originalText = btn.querySelector('.btn-heading')?.innerText || 'Xem file & Xóa Watermark';
        const heading = btn.querySelector('.btn-heading');
        if (heading) heading.innerText = '⏳ Đang xóa cookie...';
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';

        const allCookies = await chrome.cookies.getAll({});
        let deletedCount = 0;
        for (const cookie of allCookies) {
          if (cookie.domain && cookie.domain.includes('studocu')) {
            try {
              let cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
              const protocol = cookie.secure ? 'https:' : 'http:';
              const url = `${protocol}//${cleanDomain}${cookie.path || '/'}`;
              await chrome.cookies.remove({ url, name: cookie.name, storeId: cookie.storeId });
              deletedCount++;
            } catch (e) {
              console.warn('[Studocu] Không xóa được cookie:', cookie.name, e);
            }
          }
        }
        console.log(`[Studocu] Đã xóa ${deletedCount} cookie`);

        await chrome.tabs.reload(tab.id);
        if (heading) heading.innerText = originalText;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      } catch (err) {
        console.error('[Studocu] Clear error:', err);
        alert('❌ Lỗi: ' + err.message);
        const btn = this;
        const heading = btn.querySelector('.btn-heading');
        if (heading) heading.innerText = 'Xem file & Xóa Watermark';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }
    });

    // ========== 3. Lưu thành Ảnh ==========
    document.getElementById('stu-capture-btn')?.addEventListener('click', function() {
      console.log('[Studocu] Capture button clicked');
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        if (!tab || !tab.url || !tab.url.includes('studocu')) {
          alert('⚠️ Tính năng này chỉ hoạt động trên trang Studocu.');
          return;
        }

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: captureVisiblePages
        }, function(results) {
          if (chrome.runtime.lastError) {
            console.error('[Studocu] Capture error:', chrome.runtime.lastError);
            alert('❌ Lỗi: ' + chrome.runtime.lastError.message);
            return;
          }
          if (results && results[0] && results[0].result) {
            const images = results[0].result;
            if (images.length === 0) {
              alert('⚠️ Không tìm thấy trang nào trên màn hình.');
              return;
            }
            images.forEach(function(imgData) {
              chrome.downloads.download({
                url: imgData.src,
                filename: `Studocu_${imgData.name}`,
                saveAs: false
              }, function(downloadId) {
                if (chrome.runtime.lastError) {
                  console.error('[Studocu] Download error:', chrome.runtime.lastError);
                }
              });
            });
            alert(`✅ Đang tải ${images.length} ảnh...`);
          }
        });
      });
    });
  },

  title: '📚 Studocu Tools'
};

// ============================================
// HÀM CHỤP ẢNH (injected vào trang)
// ============================================
function captureVisiblePages() {
  console.log('[Studocu] captureVisiblePages running');
  const visiblePages = [];
  const pages = document.querySelectorAll('div[data-page-index]');
  if (pages.length === 0) {
    console.warn('[Studocu] Không tìm thấy trang nào');
    return [];
  }

  pages.forEach(function(page, index) {
    const rect = page.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0 && rect.height > 0) {
      visiblePages.push({ element: page, index: index + 1 });
    }
  });

  if (visiblePages.length === 0) {
    alert('⚠️ Không tìm thấy trang nào trên màn hình. Hãy cuộn đến trang muốn chụp!');
    return [];
  }

  const imagesToDownload = [];
  visiblePages.forEach(function(item) {
    const img = item.element.querySelector('img.bi') || 
                item.element.querySelector('img') || 
                item.element.querySelector('img[src*="studocu"]');
    if (img && img.src) {
      let src = img.src;
      if (img.srcset) {
        const srcsetParts = img.srcset.split(',');
        if (srcsetParts.length > 0) {
          let maxSize = 0;
          let bestSrc = src;
          srcsetParts.forEach(function(part) {
            const match = part.trim().match(/^(.*?)\s+(\d+)w$/);
            if (match) {
              const size = parseInt(match[2]);
              if (size > maxSize) {
                maxSize = size;
                bestSrc = match[1];
              }
            }
          });
          if (bestSrc) src = bestSrc;
        }
      }
      imagesToDownload.push({ src: src, name: `page_${item.index}.png` });
    }
  });

  if (imagesToDownload.length === 0) {
    alert('⚠️ Không tìm thấy dữ liệu ảnh. Trang có thể chưa tải xong hoặc bị che mờ.');
  }
  return imagesToDownload;
}

// ============================================
// HÀM TẠO PDF VIEWER (injected vào trang)
// ============================================
function runCleanViewerInside() {
  console.log('[Studocu] runCleanViewerInside running');
  const pages = document.querySelectorAll('div[data-page-index]');
  if (pages.length === 0) {
    alert('⚠️ Không tìm thấy trang nào.\nHãy cuộn xuống cuối để web tải hết nội dung!');
    return;
  }

  if (!confirm(`📄 Sẵn sàng tạo PDF cho ${pages.length} trang.\nBấm OK để bắt đầu xử lý...`)) return;

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

    normalProps.forEach(function(prop) {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
        styleString += prop + ': ' + value + ' !important; ';
      }
    });

    const widthValue = computedStyle.getPropertyValue('width');
    if (widthValue && widthValue !== 'none' && widthValue !== 'auto') {
      if (shouldScaleWidth) {
        const numValue = parseFloat(widthValue);
        if (!isNaN(numValue) && numValue > 0) {
          const unit = widthValue.replace(numValue.toString(), '');
          styleString += 'width: ' + (numValue / widthScaleDivisor) + unit + ' !important; ';
        } else {
          styleString += 'width: ' + widthValue + ' !important; ';
        }
      } else {
        styleString += 'width: ' + widthValue + ' !important; ';
      }
    }

    const heightValue = computedStyle.getPropertyValue('height');
    if (heightValue && heightValue !== 'none' && heightValue !== 'auto') {
      if (shouldScaleHeight) {
        const numValue = parseFloat(heightValue);
        if (!isNaN(numValue) && numValue > 0) {
          const unit = heightValue.replace(numValue.toString(), '');
          styleString += 'height: ' + (numValue / heightScaleDivisor) + unit + ' !important; ';
        } else {
          styleString += 'height: ' + heightValue + ' !important; ';
        }
      } else {
        styleString += 'height: ' + heightValue + ' !important; ';
      }
    }

    ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'].forEach(function(prop) {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'auto') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          if (shouldScaleMargin && numValue !== 0) {
            const unit = value.replace(numValue.toString(), '');
            styleString += prop + ': ' + (numValue / marginScaleDivisor) + unit + ' !important; ';
          } else {
            styleString += prop + ': ' + value + ' !important; ';
          }
        }
      }
    });

    scaleProps.forEach(function(prop) {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue !== 0) {
          const unit = value.replace(numValue.toString(), '');
          styleString += prop + ': ' + (numValue / scaleFactor) + unit + ' !important; ';
        } else {
          styleString += prop + ': ' + value + ' !important; ';
        }
      }
    });

    let transformOrigin = computedStyle.getPropertyValue('transform-origin');
    if (transformOrigin) {
      styleString += 'transform-origin: ' + transformOrigin + ' !important; -webkit-transform-origin: ' + transformOrigin + ' !important; ';
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
      Array.from(element.classList).some(function(cls) {
        return /^_(?:\d+[a-z]*|[a-z]+\d*)$/i.test(cls);
      });

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
      element.childNodes.forEach(function(child) {
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

  pages.forEach(function(page, index) {
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
    newPage.id = 'page-' + (index + 1);
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
      pcClone.querySelectorAll('img').forEach(function(img) {
        img.style.display = 'none';
      });
      textLayer.appendChild(pcClone);
      newPage.appendChild(textLayer);
    }

    viewerContainer.appendChild(newPage);
  });

  document.body.appendChild(viewerContainer);

  setTimeout(function() {
    window.print();
  }, 1000);
}

// ============================================
// LOAD HTML KHI KHỞI ĐỘNG
// ============================================
loadStudocuHTML();