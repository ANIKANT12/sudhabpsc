import { createWorker } from 'tesseract.js';

let workerInstance = null;

/**
 * Initializes or reuses the Tesseract worker
 */
const getWorker = async (lang = 'eng') => {
  if (!workerInstance) {
    workerInstance = await createWorker(lang);
  }
  return workerInstance;
};

/**
 * Recognizes text from an image data URL or blob
 * @param {string} imageSource
 * @param {Function} [onProgress]
 * @returns {Promise<string>}
 */
export const recognizeText = async (imageSource, onProgress) => {
  try {
    const worker = await getWorker('eng');
    
    // Tesseract recognition with progress feedback
    const ret = await worker.recognize(imageSource, {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    return ret.data.text.trim();
  } catch (err) {
    console.warn('OCR error or fallback:', err);
    return '';
  }
};

/**
 * Simple keyword search helper across recognized text and metadata
 */
export const searchNotesIndex = (query, subjects, chapters, pages) => {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();

  const results = [];

  for (const page of pages) {
    if (page.isDeleted) continue;
    const chap = chapters.find((c) => c.id === page.chapterId);
    const subj = subjects.find((s) => s.id === page.subjectId);

    let matchScore = 0;
    let matchType = '';
    let matchSnippet = '';

    // Search in OCR text
    if (page.ocrText && page.ocrText.toLowerCase().includes(q)) {
      matchScore += 10;
      matchType = 'Handwritten / Scanned Text';
      const idx = page.ocrText.toLowerCase().indexOf(q);
      const start = Math.max(0, idx - 40);
      const end = Math.min(page.ocrText.length, idx + q.length + 40);
      matchSnippet = `...${page.ocrText.slice(start, end)}...`;
    }

    // Search in Bookmark Notes
    if (page.bookmarkNote && page.bookmarkNote.toLowerCase().includes(q)) {
      matchScore += 8;
      matchType = 'Bookmark Note';
      matchSnippet = page.bookmarkNote;
    }

    // Search in Chapter title or tags
    if (chap && chap.title.toLowerCase().includes(q)) {
      matchScore += 5;
      matchType = matchType || 'Chapter Title';
    }

    if (chap && chap.tags && chap.tags.some((t) => t.toLowerCase().includes(q))) {
      matchScore += 4;
      matchType = matchType || 'Topic Tag';
    }

    // Search in Subject title
    if (subj && subj.title.toLowerCase().includes(q)) {
      matchScore += 3;
      matchType = matchType || 'Subject';
    }

    if (matchScore > 0) {
      results.push({
        page,
        chapter: chap,
        subject: subj,
        score: matchScore,
        matchType,
        snippet: matchSnippet,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
};
