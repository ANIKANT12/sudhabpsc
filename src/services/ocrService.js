import { createWorker } from 'tesseract.js';
import { getActiveGeminiKey } from './aiAssistant';

let workerInstance = null;

const getWorker = async (lang = 'hin+eng') => {
  if (!workerInstance) {
    try {
      workerInstance = await createWorker(lang);
    } catch (e) {
      workerInstance = await createWorker('eng');
    }
  }
  return workerInstance;
};

/**
 * Recognizes handwritten Hindi / Devanagari text from an image.
 * Uses Gemini Vision for superior accuracy with Hindi cursive,
 * with graceful fallback to local Tesseract OCR.
 */
export const recognizeText = async (imageSource, onProgress, apiKey = '') => {
  const activeKey = getActiveGeminiKey(apiKey);

  // 1. Try Gemini Vision for precise Hindi handwriting recognition
  if (activeKey && typeof imageSource === 'string' && imageSource.startsWith('data:image')) {
    try {
      const match = imageSource.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        if (onProgress) onProgress(30);

        const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
        for (const model of modelsToTry) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        inline_data: {
                          mime_type: match[1],
                          data: match[2],
                        },
                      },
                      {
                        text: 'इस छवि में लिखा गया पूरा हस्तलिखित पाठ (Handwritten Notes) शुद्ध देवनागरी हिंदी में हूबहू ट्रांसक्राइब करें। केवल छवि में लिखे गए शब्दों व वाक्यों को निकालें, कोई अतिरिक्त टिप्पणी या शीर्षक न जोड़ें।',
                      },
                    ],
                  },
                ],
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              if (text) {
                if (onProgress) onProgress(100);
                return text;
              }
            }
          } catch (modelErr) {
            console.warn(`Gemini OCR failed with ${model}:`, modelErr.message);
          }
        }
      }
    } catch (err) {
      console.warn('Gemini handwriting OCR note:', err);
    }
  }

  // 2. Fallback to Tesseract OCR
  try {
    const worker = await getWorker('hin+eng');
    const ret = await worker.recognize(imageSource, {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    return ret.data.text.trim();
  } catch (err) {
    console.warn('Tesseract fallback OCR error:', err);
    return '';
  }
};

/**
 * Keyword search helper across recognized text and metadata in Hindi & English
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
      matchType = 'हस्तलिखित नोट्स (OCR)';
      const idx = page.ocrText.toLowerCase().indexOf(q);
      const start = Math.max(0, idx - 40);
      const end = Math.min(page.ocrText.length, idx + q.length + 40);
      matchSnippet = `...${page.ocrText.slice(start, end)}...`;
    }

    // Search in Bookmark Notes
    if (page.bookmarkNote && page.bookmarkNote.toLowerCase().includes(q)) {
      matchScore += 8;
      matchType = 'बुकमार्क टिप्पणी';
      matchSnippet = page.bookmarkNote;
    }

    // Search in Chapter title
    if (chap) {
      const cTitle = (chap.hindiTitle || chap.title || '').toLowerCase();
      if (cTitle.includes(q)) {
        matchScore += 5;
        matchType = matchType || 'अध्याय का शीर्षक';
      }
      if (chap.tags && chap.tags.some((t) => t.toLowerCase().includes(q))) {
        matchScore += 4;
        matchType = matchType || 'विषय टैग';
      }
    }

    // Search in Subject title
    if (subj) {
      const sTitle = (subj.hindiTitle || subj.title || '').toLowerCase();
      if (sTitle.includes(q)) {
        matchScore += 3;
        matchType = matchType || 'विषय';
      }
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
