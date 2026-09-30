import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  RotateCw,
  Sparkles,
  Sliders,
  Check,
  AlertTriangle,
  RefreshCw,
  Layers,
  ChevronRight,
  Plus,
  Eye,
  FileText,
  CornerDownRight,
} from 'lucide-react';
import {
  loadImage,
  detectDocumentCorners,
  warpPerspective,
  applyFilter,
  rotateCanvas,
  checkImageQuality,
} from '../utils/imageProcessor';
import { recognizeText } from '../services/ocrService';

export default function ScannerModal({
  isOpen,
  onClose,
  subjects,
  chapters,
  preselectedSubjectId,
  preselectedChapterId,
  onSavePage,
  onNavigateToChapter,
}) {
  if (!isOpen) return null;

  // Step state: 'select_target' | 'capture' | 'crop_adjust' | 'filter_review'
  const [step, setStep] = useState('select_target');

  // Hierarchy Selection
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    preselectedSubjectId || subjects[0]?.id || ''
  );
  const [selectedChapterId, setSelectedChapterId] = useState(
    preselectedChapterId || ''
  );
  const [isCreatingNewSubject, setIsCreatingNewSubject] = useState(false);
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [isCreatingNewChapter, setIsCreatingNewChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // Camera & Image State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // back camera
  const [originalImageObj, setOriginalImageObj] = useState(null);
  const [originalDataUrl, setOriginalDataUrl] = useState('');
  const [corners, setCorners] = useState({
    tl: { x: 0.05, y: 0.05 },
    tr: { x: 0.95, y: 0.05 },
    br: { x: 0.95, y: 0.95 },
    bl: { x: 0.05, y: 0.95 },
  });
  const [selectedFilter, setSelectedFilter] = useState('magic_color');
  const [currentRotation, setCurrentRotation] = useState(0);
  const [qualityInfo, setQualityInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedDataUrl, setProcessedDataUrl] = useState('');
  const [pageNote, setPageNote] = useState('');
  const [sessionPagesScanned, setSessionPagesScanned] = useState(0);

  // Dragging state for corners
  const [activeCorner, setActiveCorner] = useState(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Available chapters for the selected subject
  const availableChapters = chapters.filter(
    (c) => c.subjectId === selectedSubjectId
  );

  // Synchronize preselected IDs
  useEffect(() => {
    if (preselectedSubjectId) setSelectedSubjectId(preselectedSubjectId);
    if (preselectedChapterId) setSelectedChapterId(preselectedChapterId);
    if (preselectedSubjectId && preselectedChapterId) {
      setStep('capture');
    }
  }, [preselectedSubjectId, preselectedChapterId]);

  // Clean up camera stream on close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      stopCamera();
      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable, fallback to file upload:', err);
      alert('Camera access could not be started. You can choose photos from your Gallery/Files.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    setTimeout(startCamera, 100);
  };

  // Capture photo from video stream
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    handleLoadedImage(dataUrl);
  };

  // Handle uploaded file (images or camera file input)
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      handleLoadedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Process newly loaded image
  const handleLoadedImage = async (dataUrl) => {
    setIsProcessing(true);
    setOriginalDataUrl(dataUrl);

    try {
      const img = await loadImage(dataUrl);
      setOriginalImageObj(img);

      // Auto detect corners
      const detected = detectDocumentCorners(img);
      setCorners(detected);

      // Check Quality
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth || img.width;
      tempCanvas.height = img.naturalHeight || img.height;
      tempCanvas.getContext('2d').drawImage(img, 0, 0);

      const quality = checkImageQuality(tempCanvas);
      setQualityInfo(quality);

      // Move to crop adjust step
      setStep('crop_adjust');
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Error loading image. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Draw interactive crop canvas
  useEffect(() => {
    if (step !== 'crop_adjust' || !originalImageObj || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = originalImageObj;

    // Scale canvas to fit container
    const containerW = canvas.parentElement.clientWidth || 360;
    const containerH = Math.min(500, window.innerHeight * 0.55);

    const imgAspect = img.width / img.height;
    const boxAspect = containerW / containerH;

    let displayW, displayH;
    if (imgAspect > boxAspect) {
      displayW = containerW;
      displayH = containerW / imgAspect;
    } else {
      displayH = containerH;
      displayW = containerH * imgAspect;
    }

    canvas.width = displayW;
    canvas.height = displayH;

    // Draw background image
    ctx.drawImage(img, 0, 0, displayW, displayH);

    // Convert normalized corners to display coordinates
    const pTL = { x: corners.tl.x * displayW, y: corners.tl.y * displayH };
    const pTR = { x: corners.tr.x * displayW, y: corners.tr.y * displayH };
    const pBR = { x: corners.br.x * displayW, y: corners.br.y * displayH };
    const pBL = { x: corners.bl.x * displayW, y: corners.bl.y * displayH };

    // Draw shaded mask outside crop polygon
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(0, 0, displayW, displayH);

    // Cut out quad
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(pTL.x, pTL.y);
    ctx.lineTo(pTR.x, pTR.y);
    ctx.lineTo(pBR.x, pBR.y);
    ctx.lineTo(pBL.x, pBL.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Redraw highlighted quad boundary
    ctx.beginPath();
    ctx.moveTo(pTL.x, pTL.y);
    ctx.lineTo(pTR.x, pTR.y);
    ctx.lineTo(pBR.x, pBR.y);
    ctx.lineTo(pBL.x, pBL.y);
    ctx.closePath();
    ctx.strokeStyle = '#3b82f6'; // Bright blue
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Subtle blue fill
    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.fill();

    // Draw corner handles
    const drawHandle = (pt, name) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = activeCorner === name ? '#f59e0b' : '#2563eb';
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = activeCorner === name ? '#f59e0b' : '#2563eb';
      ctx.fill();
    };

    drawHandle(pTL, 'tl');
    drawHandle(pTR, 'tr');
    drawHandle(pBR, 'br');
    drawHandle(pBL, 'bl');
  }, [step, originalImageObj, corners, activeCorner]);

  // Touch and Mouse handlers for dragging corners
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / canvas.width,
      y: (clientY - rect.top) / canvas.height,
    };
  };

  const handlePointerDown = (e) => {
    const coords = getCanvasCoords(e);
    const threshold = 0.08; // sensitivity radius

    let closest = null;
    let minDist = threshold;

    for (const [key, pt] of Object.entries(corners)) {
      const dist = Math.hypot(pt.x - coords.x, pt.y - coords.y);
      if (dist < minDist) {
        minDist = dist;
        closest = key;
      }
    }

    if (closest) {
      setActiveCorner(closest);
    }
  };

  const handlePointerMove = (e) => {
    if (!activeCorner) return;
    const coords = getCanvasCoords(e);
    const clampedX = Math.max(0.01, Math.min(0.99, coords.x));
    const clampedY = Math.max(0.01, Math.min(0.99, coords.y));

    setCorners((prev) => ({
      ...prev,
      [activeCorner]: { x: clampedX, y: clampedY },
    }));
  };

  const handlePointerUp = () => {
    setActiveCorner(null);
  };

  // Proceed to Filter Review
  const applyCropAndPreview = () => {
    if (!originalImageObj) return;
    setIsProcessing(true);

    try {
      // 1. Perspective Warp
      const warpedCanvas = warpPerspective(originalImageObj, corners);

      // 2. Rotation if any
      let finalCanvas = warpedCanvas;
      if (currentRotation !== 0) {
        finalCanvas = rotateCanvas(warpedCanvas, currentRotation);
      }

      // 3. Apply selected filter
      const filtered = applyFilter(finalCanvas, selectedFilter);
      setProcessedDataUrl(filtered.toDataURL('image/jpeg', 0.92));
      setStep('filter_review');
    } catch (err) {
      console.error('Warp transform error:', err);
      alert('Could not warp image. Check corner positions.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Change filter in review step
  const handleFilterChange = (filterType) => {
    setSelectedFilter(filterType);
    if (!originalImageObj) return;

    try {
      const warped = warpPerspective(originalImageObj, corners);
      const rotated = currentRotation !== 0 ? rotateCanvas(warped, currentRotation) : warped;
      const filtered = applyFilter(rotated, filterType);
      setProcessedDataUrl(filtered.toDataURL('image/jpeg', 0.92));
    } catch (e) {
      console.error(e);
    }
  };

  // Rotate in review step
  const handleRotate = () => {
    const nextRot = (currentRotation + 90) % 360;
    setCurrentRotation(nextRot);

    try {
      const warped = warpPerspective(originalImageObj, corners);
      const rotated = rotateCanvas(warped, nextRot);
      const filtered = applyFilter(rotated, selectedFilter);
      setProcessedDataUrl(filtered.toDataURL('image/jpeg', 0.92));
    } catch (e) {
      console.error(e);
    }
  };

  // Save Scanned Page
  const handleSavePage = async (shouldScanNext = false) => {
    setIsProcessing(true);
    let targetSubjectId = selectedSubjectId;
    let targetChapterId = selectedChapterId;

    // Create new subject if requested
    if (isCreatingNewSubject && newSubjectTitle.trim()) {
      targetSubjectId = `subj-${Date.now()}`;
      // Created on the fly
    }

    // Create new chapter if requested
    if (isCreatingNewChapter && newChapterTitle.trim()) {
      targetChapterId = `chap-${Date.now()}`;
    }

    // Background OCR recognition
    let extractedText = '';
    try {
      extractedText = await recognizeText(processedDataUrl);
    } catch (e) {
      console.warn('OCR pass skipped:', e);
    }

    const newPage = {
      subjectId: targetSubjectId,
      chapterId: targetChapterId,
      originalDataUrl,
      processedDataUrl,
      cropCorners: corners,
      filter: selectedFilter,
      rotation: currentRotation,
      bookmarkNote: pageNote,
      ocrText: extractedText,
      isStarred: false,
      isBookmarked: false,
    };

    await onSavePage(newPage, {
      newSubjectTitle: isCreatingNewSubject ? newSubjectTitle : null,
      newChapterTitle: isCreatingNewChapter ? newChapterTitle : null,
    });

    setSessionPagesScanned((prev) => prev + 1);
    setIsProcessing(false);

    if (shouldScanNext) {
      // Reset for next page scan while keeping subject & chapter locked
      setOriginalImageObj(null);
      setOriginalDataUrl('');
      setProcessedDataUrl('');
      setPageNote('');
      setStep('capture');
      startCamera();
    } else {
      // Finished scanning batch
      stopCamera();
      onClose();
      if (targetChapterId) {
        onNavigateToChapter(targetChapterId);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                CamScanner Notes Engine
                {sessionPagesScanned > 0 && (
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                    {sessionPagesScanned} {sessionPagesScanned === 1 ? 'Page' : 'Pages'} Scanned
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'select_target' && 'Step 1: Choose Subject & Chapter'}
                {step === 'capture' && 'Step 2: Capture or Upload Page'}
                {step === 'crop_adjust' && 'Step 3: CamScanner 4-Corner Perspective Crop'}
                {step === 'filter_review' && 'Step 4: Enhance & Review Scan'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ================= STEP 1: SELECT TARGET SUBJECT & CHAPTER ================= */}
          {step === 'select_target' && (
            <div className="space-y-5">
              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  1. Select BPSC Subject
                </label>
                {!isCreatingNewSubject ? (
                  <div className="space-y-2">
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => {
                        setSelectedSubjectId(e.target.value);
                        setSelectedChapterId('');
                      }}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.title} ({s.hindiTitle})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsCreatingNewSubject(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Or Create Custom Subject
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. Bihar Special Economy / Anthropology"
                      value={newSubjectTitle}
                      onChange={(e) => setNewSubjectTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-blue-500 rounded-xl text-white font-medium focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewSubject(false)}
                      className="text-xs text-slate-400 hover:text-slate-300"
                    >
                      Cancel & Choose Existing Subject
                    </button>
                  </div>
                )}
              </div>

              {/* Chapter Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  2. Select Chapter / Topic
                </label>
                {!isCreatingNewChapter ? (
                  <div className="space-y-2">
                    <select
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- Choose an existing chapter --</option>
                      {availableChapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          Chapter {c.chapterNo}: {c.title}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsCreatingNewChapter(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Create New Chapter for this Subject
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. Chapter 4: Governor & State Legislative Assembly"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-blue-500 rounded-xl text-white font-medium focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewChapter(false)}
                      className="text-xs text-slate-400 hover:text-slate-300"
                    >
                      Cancel & Choose Existing Chapter
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={
                    !selectedSubjectId &&
                    (!isCreatingNewSubject || !newSubjectTitle.trim())
                  }
                  onClick={() => {
                    setStep('capture');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2"
                >
                  <span>Continue to Camera & Upload</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: CAPTURE PHOTO OR UPLOAD ================= */}
          {step === 'capture' && (
            <div className="space-y-4">
              {/* Camera Viewfinder */}
              {cameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] max-h-[55vh] flex items-center justify-center border-2 border-blue-500/50 shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Document Grid Overlay */}
                  <div className="absolute inset-6 border border-white/30 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between text-white/50 text-[10px] uppercase font-mono tracking-widest">
                      <span>TL Corner</span>
                      <span>TR Corner</span>
                    </div>
                    {/* Pulsing scanner beam */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent scanner-laser"></div>
                    <div className="flex justify-between text-white/50 text-[10px] uppercase font-mono tracking-widest">
                      <span>BL Corner</span>
                      <span>BR Corner</span>
                    </div>
                  </div>

                  {/* Camera Controls */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6 px-4">
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 backdrop-blur-md border border-slate-700 transition-colors"
                      title="Switch Camera (Front/Rear)"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>

                    {/* Shutter Button */}
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white p-1 shadow-2xl active:scale-95 transition-transform"
                    >
                      <div className="w-full h-full rounded-full border-4 border-slate-900 bg-blue-600 flex items-center justify-center text-white">
                        <Camera className="w-6 h-6" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 backdrop-blur-md border border-slate-700 transition-colors"
                      title="Close Camera"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Capture Options Screen */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  {/* Take Photo Card */}
                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-8 rounded-2xl bg-gradient-to-b from-blue-600/20 to-blue-900/20 border-2 border-dashed border-blue-500/40 hover:border-blue-400 flex flex-col items-center justify-center gap-3 text-center group transition-all hover:scale-[1.01]"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Take Photo with Camera</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Photograph your handwritten notes page. Rear camera with live scanner guide.
                      </p>
                    </div>
                  </button>

                  {/* Choose from Gallery / Files */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-800/40 border-2 border-dashed border-slate-700 hover:border-slate-500 flex flex-col items-center justify-center gap-3 text-center group transition-all hover:scale-[1.01]"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-700 text-slate-200 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Choose from Gallery / Files</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Upload JPEG, PNG, or WebP note photos from your phone or PC.
                      </p>
                    </div>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('select_target')}
                  className="hover:text-white"
                >
                  ← Change Subject / Chapter
                </button>
                <span>CamScanner Auto-Detection Enabled</span>
              </div>
            </div>
          )}

          {/* ================= STEP 3: 4-CORNER PERSPECTIVE CROP ================= */}
          {step === 'crop_adjust' && (
            <div className="space-y-4">
              {/* Quality Alert Banner */}
              {qualityInfo && !qualityInfo.isGood && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{qualityInfo.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('capture');
                      startCamera();
                    }}
                    className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg shrink-0 ml-2"
                  >
                    Retake
                  </button>
                </div>
              )}

              {/* Interactive Cropper Canvas */}
              <div className="relative flex justify-center bg-slate-950 rounded-2xl overflow-hidden p-2 border border-slate-800 shadow-inner">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                  className="cursor-crosshair touch-none rounded-lg"
                />

                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5 shadow">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Drag blue circles to align 4 page corners
                </div>
              </div>

              {/* Corner Controls */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (originalImageObj) {
                        setCorners(detectDocumentCorners(originalImageObj));
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Auto Detect
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCorners({
                        tl: { x: 0.02, y: 0.02 },
                        tr: { x: 0.98, y: 0.02 },
                        br: { x: 0.98, y: 0.98 },
                        bl: { x: 0.02, y: 0.98 },
                      });
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300"
                  >
                    Full Image
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('capture');
                    }}
                    className="px-3 py-1.5 text-slate-400 hover:text-white"
                  >
                    Cancel / Retake
                  </button>

                  <button
                    type="button"
                    onClick={applyCropAndPreview}
                    disabled={isProcessing}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <span>Crop & Straighten</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: ENHANCE FILTER & REVIEW ================= */}
          {step === 'filter_review' && (
            <div className="space-y-5">
              {/* Processed Scan Preview */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center p-3 border border-slate-800 max-h-[48vh]">
                {processedDataUrl && (
                  <img
                    src={processedDataUrl}
                    alt="Processed Note Scan"
                    className="max-h-[45vh] w-auto object-contain rounded-lg shadow-2xl"
                  />
                )}

                {/* Quick actions overlay */}
                <div className="absolute top-5 right-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-slate-700 text-white shadow-lg"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('crop_adjust')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-slate-700 text-xs text-white shadow-lg flex items-center gap-1"
                    title="Re-adjust 4 corners"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Edit Corners</span>
                  </button>
                </div>
              </div>

              {/* CamScanner Filter Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  CamScanner Document Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'magic_color', name: 'Document / Magic Color', desc: 'Whitened paper, sharp ink' },
                    { id: 'bw', name: 'Clean B&W', desc: 'Crisp black text' },
                    { id: 'grayscale', name: 'Grayscale', desc: 'Smooth pencil/pen' },
                    { id: 'enhanced', name: 'Enhanced', desc: 'Vivid contrast' },
                    { id: 'original', name: 'Original', desc: 'Raw camera scan' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFilterChange(f.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedFilter === f.id
                          ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white truncate">{f.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Note / Page Annotation */}
              <div>
                <input
                  type="text"
                  placeholder="Optional page note (e.g. High probability BPSC Mains topic / 1857 dates)"
                  value={pageNote}
                  onChange={(e) => setPageNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('crop_adjust')}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  ← Back to Crop
                </button>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Scan Next Page */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleSavePage(true)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/40 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save & Scan Next Page</span>
                  </button>

                  {/* Finish & View Chapter */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleSavePage(false)}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Done & Review</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
