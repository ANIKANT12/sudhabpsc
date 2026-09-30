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
