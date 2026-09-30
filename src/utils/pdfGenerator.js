import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { loadImage } from './imageProcessor';

/**
 * Standard A4 dimensions in mm: 210 x 297
 */
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

/**
 * Renders Unicode text (such as Devanagari Hindi) to an offscreen canvas
 * so jsPDF can embed it crisply without font corruption
 */
const renderUnicodeTextToCanvas = (text, fontSpec, fillStyle, width = 600, height = 70) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.font = fontSpec;
  ctx.fillStyle = fillStyle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  return canvas;
};

/**
 * Generates and downloads a single Chapter PDF with all pages in order
 */
export const downloadChapterPDF = async (
  chapter,
  subject,
  pages,
  options = {}
) => {
  const {
    addHeader = true,
    addPageNumbers = true,
    addWatermark = false,
    quality = 0.92,
  } = options;

  if (!pages || pages.length === 0) {
    alert('This chapter does not contain any scanned pages yet.');
    return;
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const imgSrc = page.processedDataUrl || page.originalDataUrl;
    if (!imgSrc) continue;

    try {
      const img = await loadImage(imgSrc);
      const imgW = img.naturalWidth || img.width;
      const imgH = img.naturalHeight || img.height;
      const imgAspect = imgW / imgH;

      // Usable bounds on A4
      const marginX = 10;
      const marginTop = addHeader ? 16 : 10;
      const marginBottom = addPageNumbers ? 14 : 10;
      const printableW = A4_WIDTH - marginX * 2;
      const printableH = A4_HEIGHT - marginTop - marginBottom;
      const printableAspect = printableW / printableH;

      let drawW, drawH, drawX, drawY;

      if (imgAspect > printableAspect) {
        // Limited by width
        drawW = printableW;
        drawH = printableW / imgAspect;
        drawX = marginX;
        drawY = marginTop + (printableH - drawH) / 2;
      } else {
        // Limited by height
        drawH = printableH;
        drawW = printableH * imgAspect;
        drawX = marginX + (printableW - drawW) / 2;
        drawY = marginTop;
      }

      pdf.addImage(img, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');

      // Top Header
      if (addHeader) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(71, 85, 105); // Slate 600
        const headerTitle = `${subject?.title || 'BPSC Notes'} • ${chapter.title}`;
        pdf.text(headerTitle.slice(0, 75), marginX, 10);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184); // Slate 400
        pdf.text('Sudha BPSC Notes', A4_WIDTH - marginX, 10, { align: 'right' });

        // Thin separator rule
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(marginX, 12, A4_WIDTH - marginX, 12);
      }

      // Bottom Footer (Page Numbers)
      if (addPageNumbers) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        const pageStr = `Page ${i + 1} of ${totalPages}`;
        pdf.text(pageStr, A4_WIDTH / 2, A4_HEIGHT - 6, { align: 'center' });

        if (page.isStarred) {
          pdf.setTextColor(217, 119, 6);
          pdf.text('★ High Yield Note', marginX, A4_HEIGHT - 6);
        }
      }

      // Optional Watermark
      if (addWatermark) {
        pdf.saveGraphicsState();
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(36);
        pdf.setTextColor(200, 200, 200);
        pdf.setGState(new pdf.GState({ opacity: 0.15 }));
        pdf.text('SUDHA BPSC', A4_WIDTH / 2, A4_HEIGHT / 2, {
          align: 'center',
          angle: 45,
        });
        pdf.restoreGraphicsState();
      }
    } catch (err) {
      console.error('Error drawing page to PDF:', err);
    }
  }

  const cleanSubject = (subject?.title || 'BPSC').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanTitle = chapter.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const filename = `${cleanSubject}_Ch${chapter.chapterNo || 1}_${cleanTitle}.pdf`;

  pdf.save(filename);
  return filename;
};

/**
 * Generates an entire Subject PDF with Title Page & Table of Contents
 */
export const downloadSubjectPDF = async (
  subject,
  chapters,
  allPages,
  options = {}
) => {
  const activeChapters = chapters.filter((c) => c.subjectId === subject.id);
  if (activeChapters.length === 0) {
    alert('This subject does not have any chapters yet.');
    return;
  }

  const chaptersWithPages = activeChapters.map((chap) => {
    const chPages = allPages.filter(
      (p) => p.chapterId === chap.id && !p.isDeleted
    );
    return { chapter: chap, pages: chPages };
  });

  const totalScans = chaptersWithPages.reduce(
    (acc, curr) => acc + curr.pages.length,
    0
  );
  if (totalScans === 0) {
    alert('No scanned pages found in this subject.');
    return;
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Cover Page
  pdf.setFillColor(15, 23, 42); // Navy slate 900
  pdf.rect(0, 0, A4_WIDTH, A4_HEIGHT, 'F');

  // Decorative border
  pdf.setDrawColor(212, 175, 55); // BPSC Gold
  pdf.setLineWidth(1.2);
  pdf.rect(12, 12, A4_WIDTH - 24, A4_HEIGHT - 24);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text('BPSC STUDY NOTES', A4_WIDTH / 2, 75, { align: 'center' });

  pdf.setFontSize(22);
  pdf.setTextColor(212, 175, 55); // Gold
  pdf.text(subject.title.toUpperCase(), A4_WIDTH / 2, 95, { align: 'center' });

  if (subject.hindiTitle) {
    try {
      const hCanvas = renderUnicodeTextToCanvas(
        subject.hindiTitle,
        'bold 28px "Segoe UI", system-ui, -apple-system, sans-serif',
        '#cbd5e1',
        600,
        70
      );
      pdf.addImage(hCanvas, 'PNG', (A4_WIDTH - 120) / 2, 102, 120, 14);
    } catch (e) {
      console.warn('Cover page Hindi canvas fallback:', e);
    }
  }

  // Divider
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.4);
  pdf.line(50, 120, A4_WIDTH - 50, 120);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(226, 232, 240);
  pdf.text(`Comprehensive Notes for BPSC Prelims & Mains`, A4_WIDTH / 2, 135, {
    align: 'center',
  });
  pdf.text(
    `Total Chapters: ${activeChapters.length}  |  Total Scanned Pages: ${totalScans}`,
    A4_WIDTH / 2,
    145,
    { align: 'center' }
  );

  pdf.setFontSize(11);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Candidate: Sudha`, A4_WIDTH / 2, 220, { align: 'center' });
  pdf.text(
    `Compiled on: ${new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    A4_WIDTH / 2,
    228,
    { align: 'center' }
  );

  // 2. Table of Contents Page
  pdf.addPage('a4', 'portrait');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(15, 23, 42);
  pdf.text('TABLE OF CONTENTS', 20, 30);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Subject: ${subject.title}`, 20, 38);

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(20, 42, A4_WIDTH - 20, 42);

  let curY = 54;
  let runningPageOffset = 3; // TOC is page 2, content starts at page 3

  chaptersWithPages.forEach((item, idx) => {
    if (curY > 260) {
      pdf.addPage('a4', 'portrait');
      curY = 30;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);

    const chLabel = `${idx + 1}. ${item.chapter.title}`;
    pdf.text(chLabel.slice(0, 60), 20, curY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105);

    const pageCountLabel = `(${item.pages.length} pages)`;
    pdf.text(pageCountLabel, 140, curY);

    const startPageStr = `Page ${runningPageOffset}`;
    pdf.text(startPageStr, A4_WIDTH - 20, curY, { align: 'right' });

    // Dotted guide line
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineDashPattern([1, 2], 0);
    pdf.line(20 + pdf.getTextWidth(chLabel) + 4, curY - 1, 135, curY - 1);
    pdf.setLineDashPattern([], 0);

    curY += 12;
    runningPageOffset += item.pages.length;
  });

  // 3. Append Pages for each chapter
  for (const item of chaptersWithPages) {
    for (let pIdx = 0; pIdx < item.pages.length; pIdx++) {
      pdf.addPage('a4', 'portrait');
      const page = item.pages[pIdx];
      const imgSrc = page.processedDataUrl || page.originalDataUrl;
      if (!imgSrc) continue;

      try {
        const img = await loadImage(imgSrc);
        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;
        const imgAspect = imgW / imgH;

        const marginX = 10;
        const marginTop = 16;
        const marginBottom = 14;
        const printableW = A4_WIDTH - marginX * 2;
        const printableH = A4_HEIGHT - marginTop - marginBottom;
        const printableAspect = printableW / printableH;

        let drawW, drawH, drawX, drawY;
        if (imgAspect > printableAspect) {
          drawW = printableW;
          drawH = printableW / imgAspect;
          drawX = marginX;
          drawY = marginTop + (printableH - drawH) / 2;
        } else {
          drawH = printableH;
          drawW = printableH * imgAspect;
          drawX = marginX + (printableW - drawW) / 2;
          drawY = marginTop;
        }

        pdf.addImage(img, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');

        // Header
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        pdf.text(`${subject.title} • ${item.chapter.title}`, marginX, 10);
        pdf.text('Sudha BPSC Notes', A4_WIDTH - marginX, 10, { align: 'right' });

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(marginX, 12, A4_WIDTH - marginX, 12);

        // Footer
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          `${item.chapter.title} (Page ${pIdx + 1}/${item.pages.length})`,
          A4_WIDTH / 2,
          A4_HEIGHT - 6,
          { align: 'center' }
        );
      } catch (err) {
        console.error('Failed to embed page in subject PDF:', err);
      }
    }
  }

  const cleanSubject = subject.title.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `BPSC_${cleanSubject}_Complete_Notes.pdf`;
  pdf.save(filename);
  return filename;
};

/**
 * Downloads all notes organized in a ZIP file with subject directories
 */
export const downloadAllNotesZip = async (subjects, chapters, allPages) => {
  const zip = new JSZip();
  const rootFolder = zip.folder('Sudha_BPSC_Notes');

  let hasAnyNotes = false;

  for (const subject of subjects) {
    const subjChapters = chapters.filter((c) => c.subjectId === subject.id);
    if (subjChapters.length === 0) continue;

    const subjFolder = rootFolder.folder(
      subject.title.replace(/[^a-zA-Z0-9 ]/g, '')
    );

    for (const chap of subjChapters) {
      const chPages = allPages.filter(
        (p) => p.chapterId === chap.id && !p.isDeleted
      );
      if (chPages.length === 0) continue;

      hasAnyNotes = true;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      for (let i = 0; i < chPages.length; i++) {
        if (i > 0) pdf.addPage('a4', 'portrait');
        const page = chPages[i];
        const imgSrc = page.processedDataUrl || page.originalDataUrl;
        if (!imgSrc) continue;

        try {
          const img = await loadImage(imgSrc);
          const imgW = img.naturalWidth || img.width;
          const imgH = img.naturalHeight || img.height;
          const imgAspect = imgW / imgH;

          const marginX = 10;
          const marginTop = 16;
          const marginBottom = 14;
          const printableW = A4_WIDTH - marginX * 2;
          const printableH = A4_HEIGHT - marginTop - marginBottom;

          let drawW = printableW;
          let drawH = printableW / imgAspect;
          let drawX = marginX;
          let drawY = marginTop + (printableH - drawH) / 2;

          if (imgAspect <= printableW / printableH) {
            drawH = printableH;
            drawW = printableH * imgAspect;
            drawX = marginX + (printableW - drawW) / 2;
            drawY = marginTop;
          }

          pdf.addImage(img, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          pdf.text(
            `${subject.title} • ${chap.title} • Page ${i + 1}/${chPages.length}`,
            A4_WIDTH / 2,
            A4_HEIGHT - 6,
            { align: 'center' }
          );
        } catch (e) {
          console.error(e);
        }
      }

      const pdfArrayBuffer = pdf.output('arraybuffer');
      const filename = `Ch${chap.chapterNo || 1}_${chap.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      subjFolder.file(filename, pdfArrayBuffer);
    }
  }

  if (!hasAnyNotes) {
    alert('No scanned notes available to export in ZIP.');
    return;
  }

  // Add Index file
  rootFolder.file(
    'INDEX_NOTES.txt',
    `SUDHA BPSC NOTES ARCHIVE\nExported: ${new Date().toLocaleString()}\nCandidate: Sudha\nExam Target: BPSC 70th/71st\n`
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Sudha_BPSC_Complete_Notes_${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Text wrapper utility for Canvas 2D
 */
function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
  return curY + lineHeight;
}

/**
 * Helper to create an A4 Canvas
 */
function createA4Canvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1697;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

/**
 * Draw Top Header on A4 Canvas
 */
function drawPageHeader(ctx, subjectTitle, chapterTitle, pageNo, totalPages) {
  // Top brand strip
  ctx.fillStyle = '#1e1b4b'; // deep indigo
  ctx.fillRect(0, 0, 1200, 75);

  ctx.font = 'bold 20px "Segoe UI", "Nirmala UI", Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('सुधा BPSC अध्ययन गाइड  •  BPSC 70th/71st परीक्षा विशेष', 50, 45);

  ctx.font = 'normal 15px "Segoe UI", Arial';
  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'right';
  ctx.fillText(`पृष्ठ ${pageNo} / ${totalPages}`, 1150, 45);

  // Subtitle strip
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 75, 1200, 40);

  ctx.font = 'bold 15px "Segoe UI", "Nirmala UI", Arial';
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'left';
  ctx.fillText(`${subjectTitle} : ${chapterTitle}`, 50, 100);

  ctx.font = 'italic 13px "Segoe UI", Arial';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';
  ctx.fillText('हस्तलिखित नोट्स + BPSC मानक मूल्य संवर्धन', 1150, 100);

  // Reset text align
  ctx.textAlign = 'left';
}

/**
 * Draw Bottom Footer on A4 Canvas
 */
function drawPageFooter(ctx, pageNo, totalPages) {
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 1630);
  ctx.lineTo(1150, 1630);
  ctx.stroke();

  ctx.font = '13px "Segoe UI", "Nirmala UI", Arial';
  ctx.fillStyle = '#64748b';
  ctx.fillText('उम्मीदवार: सुधा | लक्ष्य: 70वीं/71वीं BPSC परीक्षा | तैयारकर्ता: BPSC AI Study Engine', 50, 1660);

  ctx.textAlign = 'right';
  ctx.fillText(`Page ${pageNo} of ${totalPages}`, 1150, 1660);
  ctx.textAlign = 'left';
}

/**
 * Download Comprehensive AI BPSC Book PDF
 */
export const downloadAiBookPDF = async (chapter, subject, aiNotes, options = {}) => {
  if (!aiNotes) {
    alert('AI अध्ययन सामग्री उपलब्ध नहीं है। कृपया पहले AI नोट्स तैयार करें।');
    return;
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const subjectTitle = subject?.hindiTitle || subject?.title || 'सामान्य अध्ययन';
  const chapterTitle = chapter?.hindiTitle || chapter?.title || 'BPSC अध्याय';
  const totalPages = 3;

  // ================= PAGE 1 =================
  const p1 = createA4Canvas();
  drawPageHeader(p1.ctx, subjectTitle, chapterTitle, 1, totalPages);

  let curY = 150;

  // Chapter Header Box
  p1.ctx.fillStyle = '#f8fafc';
  p1.ctx.strokeStyle = '#cbd5e1';
  p1.ctx.lineWidth = 2;
  p1.ctx.beginPath();
  p1.ctx.roundRect(50, curY, 1100, 110, 16);
  p1.ctx.fill();
  p1.ctx.stroke();

  p1.ctx.font = 'bold 26px "Segoe UI", "Nirmala UI", Arial';
  p1.ctx.fillStyle = '#0f172a';
  p1.ctx.fillText(chapterTitle, 75, curY + 45);

  p1.ctx.font = '15px "Segoe UI", "Nirmala UI", Arial';
  p1.ctx.fillStyle = '#475569';
  p1.ctx.fillText(
    `फोकस: ${aiNotes.metadata?.examFocus === 'mains' ? 'BPSC मुख्य परीक्षा' : 'प्रारंभिक + मुख्य परीक्षा'} • शैली: विस्तृत पाठ्यपुस्तक`,
    75,
    curY + 80
  );

  curY += 135;

  // Executive Summary Box
  p1.ctx.fillStyle = '#eff6ff';
  p1.ctx.strokeStyle = '#93c5fd';
  p1.ctx.beginPath();
  p1.ctx.roundRect(50, curY, 1100, 140, 12);
  p1.ctx.fill();
  p1.ctx.stroke();

  p1.ctx.font = 'bold 18px "Segoe UI", "Nirmala UI", Arial';
  p1.ctx.fillStyle = '#1e3a8a';
  p1.ctx.fillText('📖 अध्याय सारांश एवं BPSC परीक्षा दृष्टिकोण', 75, curY + 35);

  p1.ctx.font = '14px "Segoe UI", "Nirmala UI", Arial';
  p1.ctx.fillStyle = '#1e293b';
  wrapCanvasText(p1.ctx, aiNotes.executiveSummary || '', 75, curY + 65, 1050, 24);

  curY += 160;

  // Concept Flowchart Box (Napkin Style)
  if (aiNotes.diagrams && aiNotes.diagrams[0]) {
    const diag = aiNotes.diagrams[0];
    p1.ctx.fillStyle = '#ffffff';
    p1.ctx.strokeStyle = '#e2e8f0';
    p1.ctx.beginPath();
    p1.ctx.roundRect(50, curY, 1100, 220, 16);
    p1.ctx.fill();
    p1.ctx.stroke();

    p1.ctx.font = 'bold 18px "Segoe UI", "Nirmala UI", Arial';
    p1.ctx.fillStyle = '#0f172a';
    p1.ctx.fillText(`📊 ${diag.title || 'अवधारणा आरेख (Flowchart)'}`, 75, curY + 35);

    // Draw nodes
    const nodes = (diag.nodes || []).slice(0, 4);
    const nodeW = 240;
    const nodeH = 110;
    const gap = (1050 - nodeW * nodes.length) / Math.max(1, nodes.length - 1);

    nodes.forEach((nd, i) => {
      const nx = 75 + i * (nodeW + gap);
      const ny = curY + 60;

      p1.ctx.fillStyle = i === 2 ? '#fff1f2' : i === 3 ? '#ecfdf5' : '#f8fafc';
      p1.ctx.strokeStyle = i === 2 ? '#f43f5e' : i === 3 ? '#10b981' : '#3b82f6';
      p1.ctx.lineWidth = 1.5;
      p1.ctx.beginPath();
      p1.ctx.roundRect(nx, ny, nodeW, nodeH, 10);
      p1.ctx.fill();
      p1.ctx.stroke();

      p1.ctx.font = 'bold 14px "Segoe UI", "Nirmala UI", Arial';
      p1.ctx.fillStyle = '#0f172a';
      p1.ctx.fillText(nd.label, nx + 15, ny + 30);

      p1.ctx.font = '12px "Segoe UI", "Nirmala UI", Arial';
      p1.ctx.fillStyle = '#475569';
      wrapCanvasText(p1.ctx, nd.subtext || '', nx + 15, ny + 55, nodeW - 30, 18);
    });

    curY += 240;
  }

  // Timeline Box
  if (aiNotes.timeline && aiNotes.timeline.length > 0) {
    p1.ctx.font = 'bold 18px "Segoe UI", "Nirmala UI", Arial';
    p1.ctx.fillStyle = '#0f172a';
    p1.ctx.fillText('🗓️ BPSC ऐतिहासिक कालक्रम एवं प्रमुख तिथियां', 50, curY + 25);
    curY += 45;

    const timelineItems = aiNotes.timeline.slice(0, 5);
    timelineItems.forEach((t) => {
      p1.ctx.fillStyle = '#f8fafc';
      p1.ctx.strokeStyle = t.biharContext ? '#f59e0b' : '#cbd5e1';
      p1.ctx.lineWidth = 1.5;
      p1.ctx.beginPath();
      p1.ctx.roundRect(50, curY, 1100, 60, 10);
      p1.ctx.fill();
      p1.ctx.stroke();

      // Date badge
      p1.ctx.fillStyle = t.biharContext ? '#fef3c7' : '#e0e7ff';
      p1.ctx.beginPath();
      p1.ctx.roundRect(65, curY + 12, 160, 36, 6);
      p1.ctx.fill();

      p1.ctx.font = 'bold 13px "Segoe UI", "Nirmala UI", Arial';
      p1.ctx.fillStyle = t.biharContext ? '#b45309' : '#3730a3';
      p1.ctx.fillText(t.dateOrYear, 75, curY + 35);

      // Title & Desc
      p1.ctx.font = 'bold 14px "Segoe UI", "Nirmala UI", Arial';
      p1.ctx.fillStyle = '#0f172a';
      p1.ctx.fillText(t.title, 245, curY + 35);

      p1.ctx.font = '13px "Segoe UI", "Nirmala UI", Arial';
      p1.ctx.fillStyle = '#475569';
      p1.ctx.fillText(t.description?.slice(0, 75) || '', 550, curY + 35);

      if (t.biharContext) {
        p1.ctx.fillStyle = '#d97706';
        p1.ctx.font = 'bold 12px "Segoe UI", Arial';
        p1.ctx.fillText('🟡 बिहार', 1080, curY + 35);
      }

      curY += 72;
    });
  }

  drawPageFooter(p1.ctx, 1, totalPages);
  pdf.addImage(p1.canvas, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');

  // ================= PAGE 2 =================
  pdf.addPage('a4', 'portrait');
  const p2 = createA4Canvas();
  drawPageHeader(p2.ctx, subjectTitle, chapterTitle, 2, totalPages);

  curY = 145;

  // Comparison Table
  if (aiNotes.comparisonTables && aiNotes.comparisonTables[0]) {
    const tbl = aiNotes.comparisonTables[0];
    p2.ctx.font = 'bold 18px "Segoe UI", "Nirmala UI", Arial';
    p2.ctx.fillStyle = '#0f172a';
    p2.ctx.fillText(`📋 ${tbl.title}`, 50, curY);
    curY += 20;

    // Table Header
    p2.ctx.fillStyle = '#1e293b';
    p2.ctx.beginPath();
    p2.ctx.roundRect(50, curY, 1100, 40, 8);
    p2.ctx.fill();

    p2.ctx.font = 'bold 13px "Segoe UI", "Nirmala UI", Arial';
    p2.ctx.fillStyle = '#ffffff';
    const colW = 275;
    (tbl.headers || []).forEach((h, i) => {
      p2.ctx.fillText(h, 65 + i * colW, curY + 25);
    });
    curY += 45;

    // Table Rows
    (tbl.rows || []).slice(0, 4).forEach((r, rIdx) => {
      p2.ctx.fillStyle = rIdx % 2 === 0 ? '#f8fafc' : '#ffffff';
      p2.ctx.strokeStyle = '#e2e8f0';
      p2.ctx.beginPath();
      p2.ctx.roundRect(50, curY, 1100, 45, 6);
      p2.ctx.fill();
      p2.ctx.stroke();

      p2.ctx.font = '12px "Segoe UI", "Nirmala UI", Arial';
      p2.ctx.fillStyle = '#1e293b';
      r.forEach((cell, cIdx) => {
        p2.ctx.fillText(String(cell).slice(0, 32), 65 + cIdx * colW, curY + 28);
      });
      curY += 50;
    });

    curY += 20;
  }

  // Section Analysis with Dual Attribution
  p2.ctx.font = 'bold 18px "Segoe UI", "Nirmala UI", Arial';
  p2.ctx.fillStyle = '#0f172a';
  p2.ctx.fillText('📚 विस्तृत BPSC सेक्शन विश्लेषण (स्रोत नोट्स + मूल्य संवर्धन)', 50, curY);
  curY += 25;

  const sectionsToDraw = (aiNotes.sections || []).slice(0, 2);
  sectionsToDraw.forEach((sec, idx) => {
    p2.ctx.fillStyle = '#ffffff';
    p2.ctx.strokeStyle = '#cbd5e1';
    p2.ctx.beginPath();
    p2.ctx.roundRect(50, curY, 1100, 240, 12);
    p2.ctx.fill();
    p2.ctx.stroke();

    // Section title
    p2.ctx.font = 'bold 15px "Segoe UI", "Nirmala UI", Arial';
    p2.ctx.fillStyle = '#0f172a';
    p2.ctx.fillText(sec.title, 70, curY + 30);

    // Left Box: From Notes
    p2.ctx.fillStyle = '#ecfdf5';
    p2.ctx.strokeStyle = '#a7f3d0';
    p2.ctx.beginPath();
    p2.ctx.roundRect(70, curY + 45, 510, 130, 8);
    p2.ctx.fill();
    p2.ctx.stroke();

    p2.ctx.font = 'bold 12px "Segoe UI", "Nirmala UI", Arial';
    p2.ctx.fillStyle = '#065f46';
    p2.ctx.fillText('📝 आपकी कॉपी से (From Your Notes):', 85, curY + 68);

    p2.ctx.font = '12px "Segoe UI", "Nirmala UI", Arial';
    p2.ctx.fillStyle = '#1e293b';
    const noteText = (sec.sourceNotes || []).join(' • ');
    wrapCanvasText(p2.ctx, noteText, 85, curY + 92, 480, 20);

    // Right Box: BPSC Value Add
    p2.ctx.fillStyle = '#eff6ff';
    p2.ctx.strokeStyle = '#bfdbfe';
    p2.ctx.beginPath();
    p2.ctx.roundRect(610, curY + 45, 510, 130, 8);
    p2.ctx.fill();
    p2.ctx.stroke();

    p2.ctx.font = 'bold 12px "Segoe UI", "Nirmala UI", Arial';
    p2.ctx.fillStyle = '#1e40af';
    p2.ctx.fillText('🌐 BPSC मूल्य संवर्धन (Syllabus Context):', 625, curY + 68);

    p2.ctx.font = '12px "Segoe UI", "Nirmala UI", Arial';
    p2.ctx.fillStyle = '#1e293b';
    const enrichText = (sec.bpscEnrichment || []).join(' • ');
    wrapCanvasText(p2.ctx, enrichText, 625, curY + 92, 480, 20);

    // High Yield note banner
    if (sec.bpscHighYield) {
      p2.ctx.fillStyle = '#fff1f2';
      p2.ctx.strokeStyle = '#fecdd3';
      p2.ctx.beginPath();
      p2.ctx.roundRect(70, curY + 185, 1050, 40, 6);
      p2.ctx.fill();
      p2.ctx.stroke();

      p2.ctx.font = 'bold 11px "Segoe UI", "Nirmala UI", Arial';
      p2.ctx.fillStyle = '#be123c';
      p2.ctx.fillText(sec.bpscHighYield, 85, curY + 210);
    }

    curY += 260;
  });

  drawPageFooter(p2.ctx, 2, totalPages);
  pdf.addImage(p2.canvas, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');

  // ================= PAGE 3 =================
  pdf.addPage('a4', 'portrait');
  const p3 = createA4Canvas();
  drawPageHeader(p3.ctx, subjectTitle, chapterTitle, 3, totalPages);

  curY = 145;

  // Bihar Special Section
  if (aiNotes.biharSpecial && aiNotes.biharSpecial.length > 0) {
    p3.ctx.font = 'bold 18px "Segoe UI", "Nirmala UI", Arial';
    p3.ctx.fillStyle = '#0f172a';
    p3.ctx.fillText('🟡 बिहार विशेष संदर्भ एवं प्रमुख व्यक्तित्व (Bihar Special)', 50, curY);
    curY += 25;

    p3.ctx.fillStyle = '#fffbeb';
    p3.ctx.strokeStyle = '#fde68a';
    p3.ctx.beginPath();
    p3.ctx.roundRect(50, curY, 1100, 220, 12);
    p3.ctx.fill();
    p3.ctx.stroke();

    const biharItems = aiNotes.biharSpecial.slice(0, 3);
    biharItems.forEach((b, bIdx) => {
      const by = curY + 20 + bIdx * 65;
      p3.ctx.font = 'bold 14px "Segoe UI", "Nirmala UI", Arial';
      p3.ctx.fillStyle = '#92400e';
      p3.ctx.fillText(`• ${b.name} (${b.place || 'बिहार'}):`, 75, by);

      p3.ctx.font = '13px "Segoe UI", "Nirmala UI", Arial';
      p3.ctx.fillStyle = '#1e293b';
      p3.ctx.fillText(b.role?.slice(0, 100) || '', 75, by + 22);

      if (b.bpscRelevance) {
        p3.ctx.font = 'italic 11px "Segoe UI", Arial';
        p3.ctx.fillStyle = '#b45309';
        p3.ctx.fillText(`[BPSC प्रासंगिकता: ${b.bpscRelevance}]`, 75, by + 40);
      }
    });

    curY += 245;
  }

  // Mains 38-Mark Framework
  if (aiNotes.mainsAnswerFramework) {
    const fw = aiNotes.mainsAnswerFramework;
    p3.ctx.font = 'bold 18px "Segoe UI", "Nirmala UI", Arial';
    p3.ctx.fillStyle = '#0f172a';
    p3.ctx.fillText('🖋️ BPSC मुख्य परीक्षा (Mains) 38-अंक आदर्श उत्तर संरचना', 50, curY);
    curY += 25;

    p3.ctx.fillStyle = '#faf5ff';
    p3.ctx.strokeStyle = '#e9d5ff';
    p3.ctx.beginPath();
    p3.ctx.roundRect(50, curY, 1100, 260, 12);
    p3.ctx.fill();
    p3.ctx.stroke();

    p3.ctx.font = 'bold 13px "Segoe UI", "Nirmala UI", Arial';
    p3.ctx.fillStyle = '#6b21a8';
    p3.ctx.fillText(`प्रश्न: "${fw.question || ''}"`, 75, curY + 30);

    let fy = curY + 60;
    (fw.structure || []).slice(0, 4).forEach((part) => {
      p3.ctx.font = 'bold 12px "Segoe UI", "Nirmala UI", Arial';
      p3.ctx.fillStyle = '#581c87';
      p3.ctx.fillText(`▶ ${part.part}:`, 75, fy);

      p3.ctx.font = '12px "Segoe UI", "Nirmala UI", Arial';
      p3.ctx.fillStyle = '#334155';
      const pts = (part.points || []).join('; ');
      wrapCanvasText(p3.ctx, pts, 95, fy + 20, 1020, 18);

      fy += 45;
    });

    curY += 280;
  }

  // High Yield Prelims Facts
  if (aiNotes.highYieldFacts && aiNotes.highYieldFacts.length > 0) {
    p3.ctx.font = 'bold 18px "Segoe UI", "Nirmala UI", Arial';
    p3.ctx.fillStyle = '#0f172a';
    p3.ctx.fillText('⭐ BPSC प्रारंभिक परीक्षा 1-पंक्ति तथ्य (High-Yield Facts)', 50, curY);
    curY += 25;

    p3.ctx.fillStyle = '#f8fafc';
    p3.ctx.strokeStyle = '#cbd5e1';
    p3.ctx.beginPath();
    p3.ctx.roundRect(50, curY, 1100, 180, 12);
    p3.ctx.fill();
    p3.ctx.stroke();

    aiNotes.highYieldFacts.slice(0, 5).forEach((f, fIdx) => {
      p3.ctx.font = 'bold 12px "Segoe UI", Arial';
      p3.ctx.fillStyle = '#d97706';
      p3.ctx.fillText(`[#${fIdx + 1}]`, 75, curY + 28 + fIdx * 30);

      p3.ctx.font = '12px "Segoe UI", "Nirmala UI", Arial';
      p3.ctx.fillStyle = '#1e293b';
      p3.ctx.fillText(f.slice(0, 110), 120, curY + 28 + fIdx * 30);
    });
  }

  drawPageFooter(p3.ctx, 3, totalPages);
  pdf.addImage(p3.canvas, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');

  // Trigger download
  const cleanTitle = (chapter.hindiTitle || chapter.title).replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
  pdf.save(`Sudha_BPSC_AI_Book_${cleanTitle}.pdf`);
};

/**
 * Download Quick Revision Sheet PDF (1-2 pages)
 */
export const downloadQuickRevisionPDF = async (chapter, subject, aiNotes, options = {}) => {
  if (!aiNotes) {
    alert('AI अध्ययन सामग्री उपलब्ध नहीं है।');
    return;
  }
  // Generates 1-page high-yield cheat sheet
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const subjectTitle = subject?.hindiTitle || subject?.title || 'सामान्य अध्ययन';
  const chapterTitle = chapter?.hindiTitle || chapter?.title || 'BPSC अध्याय';

  const p1 = createA4Canvas();
  drawPageHeader(p1.ctx, subjectTitle, `${chapterTitle} (त्वरित रिविजन)`, 1, 1);

  let curY = 145;

  // Title Box
  p1.ctx.fillStyle = '#fef3c7';
  p1.ctx.strokeStyle = '#f59e0b';
  p1.ctx.beginPath();
  p1.ctx.roundRect(50, curY, 1100, 90, 12);
  p1.ctx.fill();
  p1.ctx.stroke();

  p1.ctx.font = 'bold 22px "Segoe UI", "Nirmala UI", Arial';
  p1.ctx.fillStyle = '#92400e';
  p1.ctx.fillText(`⚡ त्वरित रिविजन शीट: ${chapterTitle}`, 75, curY + 40);

  p1.ctx.font = '13px "Segoe UI", "Nirmala UI", Arial';
  p1.ctx.fillStyle = '#78350f';
  p1.ctx.fillText('परीक्षा से पहले 10 मिनट में दोहराने योग्य मुख्य कालक्रम, बिहार संदर्भ एवं तथ्य', 75, curY + 70);

  curY += 115;

  // Timeline
  if (aiNotes.timeline) {
    p1.ctx.font = 'bold 17px "Segoe UI", "Nirmala UI", Arial';
    p1.ctx.fillStyle = '#0f172a';
    p1.ctx.fillText('🗓️ महत्वपूर्ण तिथियां एवं घटनाएं', 50, curY);
    curY += 20;

    aiNotes.timeline.slice(0, 6).forEach((t) => {
      p1.ctx.fillStyle = '#f8fafc';
      p1.ctx.strokeStyle = t.biharContext ? '#f59e0b' : '#e2e8f0';
      p1.ctx.beginPath();
      p1.ctx.roundRect(50, curY, 1100, 50, 8);
      p1.ctx.fill();
      p1.ctx.stroke();

      p1.ctx.font = 'bold 13px "Segoe UI", "Nirmala UI", Arial';
      p1.ctx.fillStyle = t.biharContext ? '#d97706' : '#2563eb';
      p1.ctx.fillText(t.dateOrYear, 75, curY + 30);

      p1.ctx.font = 'bold 13px "Segoe UI", "Nirmala UI", Arial';
      p1.ctx.fillStyle = '#0f172a';
      p1.ctx.fillText(t.title, 240, curY + 30);

      p1.ctx.font = '12px "Segoe UI", "Nirmala UI", Arial';
      p1.ctx.fillStyle = '#475569';
      p1.ctx.fillText(t.description?.slice(0, 80) || '', 550, curY + 30);

      curY += 58;
    });
    curY += 15;
  }

  // Bihar Special Box
  if (aiNotes.biharSpecial) {
    p1.ctx.font = 'bold 17px "Segoe UI", "Nirmala UI", Arial';
    p1.ctx.fillStyle = '#0f172a';
    p1.ctx.fillText('🟡 बिहार विशेष संदर्भ', 50, curY);
    curY += 20;

    p1.ctx.fillStyle = '#fffbeb';
    p1.ctx.strokeStyle = '#fde68a';
    p1.ctx.beginPath();
    p1.ctx.roundRect(50, curY, 1100, 160, 12);
    p1.ctx.fill();
    p1.ctx.stroke();

    aiNotes.biharSpecial.slice(0, 3).forEach((b, idx) => {
      p1.ctx.font = 'bold 13px "Segoe UI", "Nirmala UI", Arial';
      p1.ctx.fillStyle = '#92400e';
      p1.ctx.fillText(`• ${b.name}: ${b.role?.slice(0, 85) || ''}`, 75, curY + 35 + idx * 45);

      if (b.bpscRelevance) {
        p1.ctx.font = 'italic 11px "Segoe UI", Arial';
        p1.ctx.fillStyle = '#b45309';
        p1.ctx.fillText(`[${b.bpscRelevance}]`, 75, curY + 52 + idx * 45);
      }
    });

    curY += 180;
  }

  // High Yield Bullet Facts
  if (aiNotes.highYieldFacts) {
    p1.ctx.font = 'bold 17px "Segoe UI", "Nirmala UI", Arial';
    p1.ctx.fillStyle = '#0f172a';
    p1.ctx.fillText('⭐ 1-पंक्ति परीक्षा तथ्य (Quick Facts)', 50, curY);
    curY += 20;

    aiNotes.highYieldFacts.slice(0, 6).forEach((f, idx) => {
      p1.ctx.fillStyle = '#f8fafc';
      p1.ctx.strokeStyle = '#e2e8f0';
      p1.ctx.beginPath();
      p1.ctx.roundRect(50, curY, 1100, 42, 6);
      p1.ctx.fill();
      p1.ctx.stroke();

      p1.ctx.font = 'bold 12px "Segoe UI", Arial';
      p1.ctx.fillStyle = '#d97706';
      p1.ctx.fillText(`✓`, 75, curY + 26);

      p1.ctx.font = '12px "Segoe UI", "Nirmala UI", Arial';
      p1.ctx.fillStyle = '#1e293b';
      p1.ctx.fillText(f.slice(0, 120), 105, curY + 26);

      curY += 48;
    });
  }

  drawPageFooter(p1.ctx, 1, 1);
  pdf.addImage(p1.canvas, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');

  const cleanTitle = (chapter.hindiTitle || chapter.title).replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
  pdf.save(`Sudha_BPSC_QuickRevision_${cleanTitle}.pdf`);
};

