# 📚 Sudha BPSC Notes — CamScanner & Digital Notebook

A dedicated, personal BPSC examination notes management website designed for **Sudha**. It combines a CamScanner-grade document scanner, digital notebook organizer, client-side PDF generator, in-browser handwritten OCR, and an AI BPSC revision mentor.

---

## 🌟 Key Features

### 1. 📷 CamScanner-Style Document Processing
- **Rear Camera Viewfinder**: Live camera guide with document alignment markers.
- **Automatic 4-Corner Boundary Detection**: Intelligently locates document edges.
- **Interactive Quadrilateral Editor**: Drag corner handles to fine-tune cropping on mobile or desktop.
- **Perspective Warp Transformation**: Bilinear perspective warp straightens angled or tilted photographs into flat rectangular pages.
- **Preserves Original & Processed Images**: The original camera photo is always preserved alongside the processed scan so corners can be re-adjusted anytime.
- **CamScanner Document Modes**:
  - `Document / Magic Color`: Whitens shadowed page backgrounds while keeping handwritten ink vivid.
  - `Clean B&W`: High-contrast black & white text.
  - `Grayscale`: Smooth monochrome for pencil/pen sketches.
  - `Enhanced`: Boosted contrast and sharpness.
  - `Original`: Unfiltered perspective-cropped photo.
- **Quality Inspection**: Warns if the lighting is too dark or the camera capture is blurry with instant *Retake* or *Keep Anyway* options.

### 2. 🏛️ BPSC Subject & Chapter Hierarchy
- Pre-loaded with official BPSC subjects:
  - 📜 Indian History (Ancient, Medieval, Modern)
  - 🏛️ Bihar History & Culture (Champaran, 1857, Magadha)
  - 🌍 Geography & Bihar Mapping
  - ⚖️ Indian Polity & Constitution
  - 💰 Economy & Bihar Economic Survey
  - 🔬 General Science (Physics, Chemistry, Biology)
  - 🌿 Environment & Ecology
  - 📰 Current Affairs (National & Bihar Special)
  - 📖 General Hindi
  - 🎯 BPSC Special & Previous Years Questions (PYQs)
- Add custom subjects and chapters anytime with custom tags (Prelims, Mains, High Priority).

### 3. 📑 Page Review & Reordering
- Visual thumbnail grid of all pages in a chapter.
- Move pages left/right or drag to reorder.
- Rotate 90° clockwise/counter-clockwise.
- Add more pages at any time.
- High-yield starring (⭐) and exam bookmarks (🔖) with personal revision notes.
- Soft-delete to Recycle Bin with one-click restore.

### 4. 📥 PDF & ZIP Generator (100% Client-Side)
- **Download Chapter PDF**: Compiles all pages in order into an A4 PDF with custom header, page numbers (`Page X of Y`), and optional watermark.
- **Download Full Subject PDF**: Generates a complete multi-chapter book with an **automatic Cover Page** and **Table of Contents (TOC)** showing page start numbers!
- **Download All Notes ZIP**: Generates an organized ZIP containing folder structures for every subject with individual chapter PDFs.

### 5. 🔍 In-Browser OCR & Search
- Integrated **Tesseract.js** runs directly in a client-side Web Worker.
- Extracts text from handwritten or printed note pages.
- Search bar (`Ctrl + K`) instantly finds words inside scanned notes (e.g. searching *"Cornwallis"*, *"1857"*, *"Champaran"*).

### 6. 🤖 AI BPSC Study Assistant
- **Dual-Mode**: Works 100% offline with built-in BPSC revision engine, or with an optional Google Gemini API key configured in Settings.
- **Features**:
  - 📝 BPSC High-Yield Chapter Summary.
  - ❓ 20 BPSC-format MCQs with answer explanations.
  - 🧠 Flip Flashcards for rapid memorization.
  - 📌 Crucial Dates, Figures, and Chronology list.

### 7. 📱 Mobile PWA & Offline Support
- Built as a Progressive Web App (PWA) with `manifest.json` and `sw.js`.
- Sudha can tap **"Add to Home Screen"** on Chrome (Android) or Safari (iPhone) to use it like a native mobile app!
- Unlimited persistent local storage using IndexedDB (`idb-keyval`).
- JSON backup export & restore to save to Google Drive or switch devices.
- Optional 4-digit PIN security lock.

---

## 🚀 How to Deploy on Netlify

### Option 1: Instant Netlify Drop (Simplest — 1 Minute)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop) in your web browser.
2. Sign in to your Netlify account (free).
3. Drag and drop the `dist` folder located inside this project directory:
   ```
   C:\Users\anika\OneDrive\Desktop\Sudha project\dist
   ```
4. Netlify will deploy the website in under 5 seconds and give you a live URL (e.g. `https://sudha-bpsc-notes.netlify.app`)!

---

### Option 2: Deploy via GitHub & Netlify CLI
The repository already includes `netlify.toml` configured with:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
1. Push this folder to a GitHub repository.
2. In Netlify, click **"Add new site"** → **"Import an existing project"** → select your GitHub repository.
3. Netlify will automatically detect the settings and deploy on every push!

---

## 💻 Local Development

To run the website locally on your computer:

```bash
# Start local development server
npm run dev

# Build production bundle (outputs to /dist)
npm run build

# Preview production build locally
npm run preview
```

Open `http://localhost:3000` in your browser.
