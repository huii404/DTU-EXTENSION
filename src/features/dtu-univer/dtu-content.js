// DTU CONTENT SCRIPT - HANDLE Q53 & AUTO RATE

if (!window.dtuMasterInjected) {
  window.dtuMasterInjected = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autoRate' || request.action === 'AUTO_RATING_DTU') {
      try {
        const optionChar = request.optionChar || 'A';
        const finalText = request.text || 'Giảng viên dạy tốt';
        const cau53Val = request.cau53Value || '4'; // Mặc định chọn mức 4 (Hài lòng)

        // 1. Tick Radio chọn xếp loại (Câu 1 -> 48: R0A -> R47A)
        for (let i = 0; i <= 47; i++) {
          const radioId = `R${i}${optionChar}`;
          const radio = document.getElementById(radioId);
          if (radio) {
            radio.checked = true;
            radio.click();
            radio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }

        // 2. Điền Textarea nhận xét (Câu 49 -> 52: R48 -> R51)
        for (let j = 48; j <= 51; j++) {
          const textareaId = `R${j}`;
          const textarea = document.getElementById(textareaId);
          if (textarea) {
            textarea.value = finalText;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }

        // 3. XỬ LÝ CÂU 53 (Mức độ hài lòng: 1 -> 5)
        const possible53Ids = [
          `R52${cau53Val}`, 
          `R53${cau53Val}`, 
          `R52${getOptionLetter(cau53Val)}`, 
          `R53${getOptionLetter(cau53Val)}`
        ];
        let q53Handled = false;

        for (const id of possible53Ids) {
          const r = document.getElementById(id);
          if (r) {
            r.checked = true;
            r.click();
            r.dispatchEvent(new Event('change', { bubbles: true }));
            q53Handled = true;
            break;
          }
        }

        // Fallback chọn radio câu 53 nếu ID thay đổi
        if (!q53Handled) {
          const allRadios = Array.from(document.querySelectorAll('input[type="radio"]'));
          const q53Radios = allRadios.filter(r => !r.id || (!r.id.match(/^R([0-3]?[0-9]|4[0-7])[A-Z0-9]/)));
          const targetIndex = parseInt(cau53Val, 10) - 1;
          if (q53Radios[targetIndex]) {
            q53Radios[targetIndex].checked = true;
            q53Radios[targetIndex].click();
            q53Radios[targetIndex].dispatchEvent(new Event('change', { bubbles: true }));
          }
        }

        // 4. Cuộn mượt xuống ngay ô CAPTCHA
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });

        sendResponse({ success: true });
      } catch (error) {
        console.error('Lỗi khi thực hiện autoRate:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }
  });
}

function getOptionLetter(val) {
  const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
  return map[val] || 'D';
}
// LOGIC XUẤT LỊCH HỌC
async function handleDTUScheduleProcess(rangeMode, formatType) {
  const courses = parseExactCourseBlocks();
  if (!courses || courses.length === 0) {
    alert('⚠️ Không tìm thấy môn học nào trên màn hình!');
    throw new Error('Không tìm thấy môn học.');
  }

  if (formatType === 'CSV') {
    exportExactCSV(courses, rangeMode);
  } else if (formatType === 'ICS') {
    exportExactICS(courses, rangeMode);
  }
}

function parseExactCourseBlocks() {
  const courseList = [];
  const allDivs = document.querySelectorAll('div, td');

  allDivs.forEach((el) => {
    const text = el.innerText || '';
    if (text.includes('|') && (text.includes('07:00') || text.includes('09:15') || text.includes('14:00') || text.includes('Online') || text.includes('P.'))) {
      if (el.children.length <= 3) {
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length >= 2 && !courseList.some((c) => c.rawText === text)) {
          courseList.push({
            rawText: text,
            subject: lines[0] || 'Môn học DTU',
            location: lines[1] || 'MyDTU',
            time: lines[2] || lines[1] || 'Theo lịch'
          });
        }
      }
    }
  });

  return courseList;
}

function exportExactCSV(courses, rangeMode) {
  let csv = 'sep=;\n\uFEFFSTT;Tên Môn Học & Mã LHP;Địa Điểm / Phòng Học;Khung Giờ Học\n';
  courses.forEach((item, index) => {
    csv += `"${index + 1}";"${item.subject.replace(/;/g, '-')}";"${item.location.replace(/;/g, '-')}";"${item.time.replace(/;/g, '-')}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LichHoc_DTU_${rangeMode}_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportExactICS(courses, rangeMode) {
  let ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DTU//Timetable//VN', 'METHOD:PUBLISH'];
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  courses.forEach((item, idx) => {
    ics.push('BEGIN:VEVENT');
    ics.push(`UID:dtu-course-${idx}-${Date.now()}@mydtu`);
    ics.push(`SUMMARY:[DTU] ${item.subject}`);
    ics.push(`LOCATION:${item.location}`);
    ics.push(`DESCRIPTION:${item.time}`);
    ics.push(`DTSTART:${now}`);
    ics.push(`DTEND:${now}`);
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LichHoc_DTU_${rangeMode}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}