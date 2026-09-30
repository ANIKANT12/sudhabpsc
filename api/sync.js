import { neon } from '@neondatabase/serverless';

const DEFAULT_CONN_B64 =
  'cG9zdGdyZXNxbDovL25lb25kYl9vd25lcjpucGdfdGd1bmgydnA4Tk1BQGVwLW1pc3R5LW1lYWRvdy1hemY3MzMzcy1wb29sZXIuYy0zLmFwLXNvdXRoZWFzdC0xLmF3cy5uZW9uLnRlY2gvc3VkaGFicHNjP3NzbG1vZGU9cmVxdWlyZQ==';

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    return Buffer.from(DEFAULT_CONN_B64, 'base64').toString('utf8');
  } catch (e) {
    return '';
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS headers for multi-device sync
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const connStr = getDatabaseUrl();
  if (!connStr) {
    res.status(500).json({ error: 'Database connection string not configured' });
    return;
  }

  const sql = neon(connStr);

  // 1. GET: Fetch cloud-synced notes for sync code
  if (req.method === 'GET') {
    const code = (req.query?.code || 'SudhaBPSC').trim();
    try {
      // Fetch metadata store (subjects, chapters)
      const storeRows = await sql.query(
        'SELECT key, data FROM bpsc_sync_store WHERE key = $1 OR key = $2',
        [`${code}:subjects`, `${code}:chapters`]
      );

      let subjects = null;
      let chapters = null;
      for (const row of storeRows) {
        if (row.key === `${code}:subjects`) subjects = row.data;
        if (row.key === `${code}:chapters`) chapters = row.data;
      }

      // Fetch pages
      const pageRows = await sql.query(
        'SELECT id, subject_id, chapter_id, page_no, original_data_url, processed_data_url, crop_corners, filter, rotation, bookmark_note, ocr_text, is_starred, is_bookmarked, is_deleted, created_at, updated_at FROM bpsc_pages WHERE sync_code = $1 ORDER BY page_no ASC',
        [code]
      );

      const pages = pageRows.map((r) => {
        const img = r.processed_data_url || r.original_data_url || '';
        let parsedCorners = {};
        if (typeof r.crop_corners === 'object' && r.crop_corners !== null) {
          parsedCorners = r.crop_corners;
        } else if (typeof r.crop_corners === 'string' && r.crop_corners.trim()) {
          try {
            parsedCorners = JSON.parse(r.crop_corners);
          } catch (e) {}
        }

        return {
          id: r.id,
          subjectId: r.subject_id,
          chapterId: r.chapter_id,
          pageNo: r.page_no || 1,
          originalDataUrl: img,
          processedDataUrl: img,
          cropCorners: parsedCorners,
          filter: r.filter || 'magic_color',
          rotation: r.rotation || 0,
          bookmarkNote: r.bookmark_note || '',
          ocrText: r.ocr_text || '',
          isStarred: !!r.is_starred,
          isBookmarked: !!r.is_bookmarked,
          isDeleted: !!r.is_deleted,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      });

      res.status(200).json({
        success: true,
        code,
        subjects,
        chapters,
        pages,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Sync GET error:', err);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  // 2. POST: Upsert notes data from phone or computer to Cloud
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
      }
    }

    const { code = 'SudhaBPSC', subjects, chapters, pages, singlePage, deletePageId } = body || {};

    try {
      // Delete page if requested
      if (deletePageId) {
        await sql.query('DELETE FROM bpsc_pages WHERE id = $1 AND sync_code = $2', [
          deletePageId,
          code,
        ]);
      }
      // Upsert subjects if provided
      if (subjects && Array.isArray(subjects) && subjects.length > 0) {
        await sql.query(
          `INSERT INTO bpsc_sync_store (key, data, updated_at) VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
          [`${code}:subjects`, JSON.stringify(subjects)]
        );
      }

      // Upsert chapters if provided
      if (chapters && Array.isArray(chapters) && chapters.length > 0) {
        await sql.query(
          `INSERT INTO bpsc_sync_store (key, data, updated_at) VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
          [`${code}:chapters`, JSON.stringify(chapters)]
        );
      }

      // Upsert single page if provided (fast incremental upload)
      if (singlePage && singlePage.id) {
        const pageImg = singlePage.processedDataUrl || singlePage.originalDataUrl || '';
        await sql.query(
          `INSERT INTO bpsc_pages (
            id, sync_code, subject_id, chapter_id, page_no,
            original_data_url, processed_data_url, crop_corners, filter, rotation,
            bookmark_note, ocr_text, is_starred, is_bookmarked, is_deleted, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
          ON CONFLICT (id) DO UPDATE SET
            subject_id = EXCLUDED.subject_id,
            chapter_id = EXCLUDED.chapter_id,
            page_no = EXCLUDED.page_no,
            original_data_url = EXCLUDED.original_data_url,
            processed_data_url = EXCLUDED.processed_data_url,
            crop_corners = EXCLUDED.crop_corners,
            filter = EXCLUDED.filter,
            rotation = EXCLUDED.rotation,
            bookmark_note = EXCLUDED.bookmark_note,
            ocr_text = EXCLUDED.ocr_text,
            is_starred = EXCLUDED.is_starred,
            is_bookmarked = EXCLUDED.is_bookmarked,
            is_deleted = EXCLUDED.is_deleted,
            updated_at = NOW()`,
          [
            singlePage.id,
            code,
            singlePage.subjectId,
            singlePage.chapterId,
            singlePage.pageNo || 1,
            pageImg,
            pageImg,
            JSON.stringify(singlePage.cropCorners || {}),
            singlePage.filter || 'magic_color',
            singlePage.rotation || 0,
            singlePage.bookmarkNote || '',
            singlePage.ocrText || '',
            !!singlePage.isStarred,
            !!singlePage.isBookmarked,
            !!singlePage.isDeleted,
          ]
        );
      }

      // Upsert full page list if provided
      if (pages && Array.isArray(pages)) {
        for (const p of pages) {
          if (!p.id) continue;
          const pImg = p.processedDataUrl || p.originalDataUrl || '';
          await sql.query(
            `INSERT INTO bpsc_pages (
              id, sync_code, subject_id, chapter_id, page_no,
              original_data_url, processed_data_url, crop_corners, filter, rotation,
              bookmark_note, ocr_text, is_starred, is_bookmarked, is_deleted, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
            ON CONFLICT (id) DO UPDATE SET
              subject_id = EXCLUDED.subject_id,
              chapter_id = EXCLUDED.chapter_id,
              page_no = EXCLUDED.page_no,
              original_data_url = EXCLUDED.original_data_url,
              processed_data_url = EXCLUDED.processed_data_url,
              crop_corners = EXCLUDED.crop_corners,
              filter = EXCLUDED.filter,
              rotation = EXCLUDED.rotation,
              bookmark_note = EXCLUDED.bookmark_note,
              ocr_text = EXCLUDED.ocr_text,
              is_starred = EXCLUDED.is_starred,
              is_bookmarked = EXCLUDED.is_bookmarked,
              is_deleted = EXCLUDED.is_deleted,
              updated_at = NOW()`,
            [
              p.id,
              code,
              p.subjectId,
              p.chapterId,
              p.pageNo || 1,
              pImg,
              pImg,
              JSON.stringify(p.cropCorners || {}),
              p.filter || 'magic_color',
              p.rotation || 0,
              p.bookmarkNote || '',
              p.ocrText || '',
              !!p.isStarred,
              !!p.isBookmarked,
              !!p.isDeleted,
            ]
          );
        }
      }

      res.status(200).json({
        success: true,
        message: 'Synced to Neon Cloud successfully',
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Sync POST error:', err);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
