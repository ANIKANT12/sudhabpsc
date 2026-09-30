import {
  X,
  Settings,
  Download,
  Upload,
  Key,
  Lock,
  Smartphone,
  Laptop,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  Check,
  Cloud,
  CloudCheck,
} from 'lucide-react';
import {
  exportCompleteBackup,
  importBackupData,
} from '../services/storage';
import { downloadAllNotesZip } from '../utils/pdfGenerator';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  subjects,
  chapters,
  pages,
  onDataResetOrImported,
  syncState = null,
  onManualSync = null,
}) {
  if (!isOpen) return null;

  const [geminiKey, setGeminiKey] = useState(settings?.geminiApiKey || '');
  const [pinLock, setPinLock] = useState(settings?.pinLock || '');
  const [isPinEnabled, setIsPinEnabled] = useState(
    settings?.isPinEnabled || false
  );
  const [syncCode, setSyncCode] = useState(settings?.syncCode || 'SudhaBPSC');
  const [autoCloudSync, setAutoCloudSync] = useState(
    settings?.autoCloudSync !== false
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);

  // Synchronize settings state when modal opens or settings update
  useEffect(() => {
    if (settings) {
      setGeminiKey(settings.geminiApiKey || '');
      setPinLock(settings.pinLock || '');
      setIsPinEnabled(!!settings.isPinEnabled);
      setSyncCode(settings.syncCode || 'SudhaBPSC');
      setAutoCloudSync(settings.autoCloudSync !== false);
    }
  }, [settings, isOpen]);

  const fileInputRef = useRef(null);

  const handleManualSyncClick = async () => {
    if (!onManualSync) return;
    setManualSyncLoading(true);
    try {
      await onManualSync(syncCode.trim());
    } finally {
      setTimeout(() => setManualSyncLoading(false), 600);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      geminiApiKey: geminiKey.trim(),
      pinLock: pinLock.trim(),
      isPinEnabled,
      syncCode: syncCode.trim() || 'SudhaBPSC',
      autoCloudSync,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      await exportCompleteBackup();
    } catch (e) {
      console.error(e);
      alert('बैकअप निर्यात करने में त्रुटि।');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await downloadAllNotesZip(subjects, chapters, pages);
    } catch (e) {
      console.error(e);
      alert('ZIP संग्रह बनाने में त्रुटि।');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await importBackupData(event.target.result);
        alert('नोट्स बैकअप सफलतापूर्वक लोड (Import) हो गया!');
        if (onDataResetOrImported) onDataResetOrImported();
        onClose();
      } catch (err) {
        console.error(err);
        alert('बैकअप लोड करने में विफल। कृपया सुनिश्चित करें कि फ़ाइल एक वैध JSON बैकअप है।');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden text-white animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">सेटिंग्स एवं क्लाउड सिंक</h3>
              <p className="text-xs text-slate-400">
                सुधा BPSC नोट्स: व्यक्तिगत सेटिंग्स, बैकअप एवं AI विन्यास
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 0: Multi-Device Cloud Sync */}
          <div className="p-4 bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    मल्टी-डिवाइस क्लाउड सिंक
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                      Neon DB एक्टिव
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    अपने फोन और कंप्यूटर के बीच नोट्स का लाइव सिंक करें
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCloudSync}
                  onChange={(e) => setAutoCloudSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  सिंक कोड (फोन और कंप्यूटर दोनों पर एक जैसा होना चाहिए)
                </label>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>फोन</span>
                  <span>↔</span>
                  <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                  <span>कंप्यूटर</span>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value)}
                  placeholder="उदा. SudhaBPSC"
                  className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={handleManualSyncClick}
                  disabled={manualSyncLoading || syncState?.status === 'syncing'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-md"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      manualSyncLoading || syncState?.status === 'syncing' ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {manualSyncLoading || syncState?.status === 'syncing' ? 'सिंक हो रहा है...' : 'अभी सिंक करें'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                {syncState?.status === 'syncing' ? (
                  <span className="flex items-center gap-1 text-blue-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    नोट्स सिंक किए जा रहे हैं...
                  </span>
                ) : syncState?.status === 'error' ? (
                  <span className="text-rose-400">
                    सिंक समस्या: {syncState.error || 'इंटरनेट कनेक्शन जांचें'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CloudCheck className="w-3.5 h-3.5" />
                    क्लाउड से जुड़ा हुआ है (Connected)
                  </span>
                )}
              </div>
              {syncState?.lastSyncedAt && (
                <span>
                  अंतिम सिंक:{' '}
                  {new Date(syncState.lastSyncedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Section 1: Backup & ZIP Downloads */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              📦 बैकअप एवं ऑफ़लाइन डाउनलोड
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full JSON Backup */}
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl text-left flex flex-col justify-between space-y-2 group transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">.json</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400">
                    सम्पूर्ण नोट्स का बैकअप लें
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    सभी विषय, अध्याय एवं स्कैन की गई कॉपियां एक सुरक्षित बैकअप फ़ाइल में सहेजें
                  </p>
                </div>
              </button>

              {/* Download ZIP of all PDFs */}
              <button
                type="button"
                onClick={handleExportZip}
                disabled={isExportingZip}
                className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl text-left flex flex-col justify-between space-y-2 group transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">.zip</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400">
                    सभी PDF का ZIP डाउनलोड करें
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    प्रत्येक विषय के फोल्डर में सभी अध्यायों की PDF एक क्लिक में पाएं
                  </p>
                </div>
              </button>
            </div>

            {/* Restore */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-slate-800/60 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 text-blue-400" />
                <span>JSON बैकअप फ़ाइल से नोट्स रीस्टोर (पुनर्प्राप्त) करें</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Section 2: AI Configuration */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              🤖 Google Gemini AI कुंजी (वैकल्पिक / Optional)
            </label>
            <p className="text-xs text-slate-400">
              सुधा BPSC असिस्टेंट आपके अपलोड किए गए नोट्स से सीधे जुड़ा हुआ है। यदि आप अपनी Gemini API कुंजी दर्ज करना चाहते हैं तो यहाँ दर्ज कर सकते हैं।
            </p>

            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Section 3: Privacy Lock */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                🔒 4-अंकों का सुरक्षा पिन (Passcode)
              </label>
              <input
                type="checkbox"
                checked={isPinEnabled}
                onChange={(e) => setIsPinEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
            </div>

            {isPinEnabled && (
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  maxLength={4}
                  placeholder="4-अंकों का पिन दर्ज करें (उदा. 1947)"
                  value={pinLock}
                  onChange={(e) => setPinLock(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 tracking-widest font-mono"
                />
              </div>
            )}
          </div>

          {/* Section 4: Mobile PWA Info */}
          <div className="p-4 bg-blue-950/40 border border-blue-500/20 rounded-2xl flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h5 className="font-bold text-white">फोन में ऐप की तरह कैसे इंस्टॉल करें</h5>
              <p className="text-slate-300">
                Android फोन में: क्रोम ब्राउज़र में ऊपर 3 डॉट्स मेनू पर टैप करें →{' '}
                <span className="text-amber-400 font-semibold">"ऐप इंस्टॉल करें (Install App)"</span> या "होम स्क्रीन पर जोड़ें"।
              </p>
              <p className="text-slate-300">
                iPhone Safari में: नीचे शेयर (Share) बटन दबाएं →{' '}
                <span className="text-amber-400 font-semibold">"होम स्क्रीन में जोड़ें (Add to Home Screen)"</span>।
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <span className="text-[11px] text-slate-500">
            सुधा BPSC नोट्स v1.0.0 • PWA एवं क्लाउड सिंक सक्षम
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              रद्द करें
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>सहेज लिया गया!</span>
                </>
              ) : (
                <span>सेटिंग्स सहेजें</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
