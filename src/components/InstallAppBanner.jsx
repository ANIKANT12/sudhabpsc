import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Check } from 'lucide-react';

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    // Check if iOS
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos && !window.navigator.standalone) {
      // Show install banner on iOS too
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS or manual trigger
      setShowIosInstructions(true);
    }
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed top-20 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-top-4 duration-300">
      <div className="p-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white rounded-2xl shadow-2xl border border-blue-400/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <Smartphone className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              सुधा BPSC ऐप इंस्टॉल करें
            </h4>
            <p className="text-[11px] text-blue-100 line-clamp-1">
              1-टैप में कैमरा खोलने व ऑफ़लाइन पढ़ने हेतु होम स्क्रीन पर जोड़ें
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-white text-blue-900 font-bold text-xs rounded-xl shadow-md active:scale-95 transition-transform flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>इंस्टॉल करें</span>
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1 rounded-lg text-blue-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIosInstructions && (
        <div className="mt-2 p-3 bg-slate-900/95 border border-slate-700 rounded-2xl text-xs text-slate-300 space-y-1 backdrop-blur-md shadow-xl">
          <p className="font-semibold text-white">iPhone / Safari पर इंस्टॉल करने के लिए:</p>
          <p>
            1. नीचे <span className="text-blue-400 font-bold">शेयर आइकन</span> (तीर वाला बॉक्स) पर टैप करें।
          </p>
          <p>
            2. नीचे स्क्रॉल करें और{' '}
            <span className="text-amber-400 font-bold">"Add to Home Screen"</span> (होम स्क्रीन में जोड़ें) चुनें।
          </p>
          <button
            onClick={() => setShowIosInstructions(false)}
            className="mt-1 text-blue-400 text-[11px] font-semibold"
          >
            समझ गए!
          </button>
        </div>
      )}
    </div>
  );
}
