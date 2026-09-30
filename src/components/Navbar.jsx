import {
  BookOpen,
  Camera,
  Search,
  Star,
  Bookmark,
  Trash2,
  Settings,
  Download,
  Plus,
  Cloud,
  CloudCheck,
  RefreshCw,
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenScanner,
  onOpenSearch,
  onOpenRecycleBin,
  onOpenSettings,
  onOpenAllDownloads,
  starredCount = 0,
  bookmarkedCount = 0,
  syncState = null,
  onTriggerSync = null,
}) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={() => setActiveTab('home')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                सुधा <span className="text-amber-400 font-extrabold">BPSC</span> नोट्स
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                70वीं/71वीं BPSC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              हस्तलिखित नोट्स • डिजिटल स्कैनर • PDF जनरेटर
            </p>
          </div>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl shadow-inner transition-colors group"
          >
            <span className="flex items-center gap-2 text-slate-400">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span>नोट्स, विषय, हस्तलिखित टेक्स्ट खोजें...</span>
            </span>
            <kbd className="text-[11px] font-mono bg-slate-700/60 border border-slate-600 px-1.5 py-0.5 rounded text-slate-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Icon on mobile */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="नोट्स खोजें"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Starred */}
          <button
            onClick={() => setActiveTab('starred')}
            className={`p-2 rounded-xl relative transition-all ${
              activeTab === 'starred'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="महत्वपूर्ण नोट्स (Starred)"
          >
            <Star className="w-5 h-5 fill-current" />
            {starredCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full flex items-center justify-center">
                {starredCount}
              </span>
            )}
          </button>

          {/* Bookmarks */}
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`p-2 rounded-xl relative transition-all ${
              activeTab === 'bookmarks'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="बुकमार्क किए गए पृष्ठ"
          >
            <Bookmark className="w-5 h-5" />
            {bookmarkedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {bookmarkedCount}
              </span>
            )}
          </button>

          {/* All Downloads / ZIP */}
          <button
            onClick={onOpenAllDownloads}
            className="hidden sm:flex p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="सभी PDF डाउनलोड करें (ZIP)"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Recycle Bin */}
          <button
            onClick={onOpenRecycleBin}
            className="hidden sm:flex p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="रीसायकल बिन"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {/* Cloud Sync Status / Manual Sync Button */}
          {onTriggerSync && (
            <button
              onClick={onTriggerSync}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${
                syncState?.status === 'syncing'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : syncState?.status === 'error'
                  ? 'text-rose-400 hover:bg-rose-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={
                syncState?.status === 'syncing'
                  ? 'क्लाउड से नोट्स सिंक हो रहे हैं...'
                  : syncState?.status === 'error'
                  ? `सिंक त्रुटि: ${syncState?.error || 'विफल'}. पुनः प्रयास करने के लिए टैप करें.`
                  : syncState?.lastSyncedAt
                  ? `क्लाउड सिंक सुरक्षित • अभी सिंक करने के लिए क्लिक करें`
                  : 'क्लाउड सिंक • फोन और कंप्यूटर के बीच नोट्स सिंक करें'
              }
            >
              {syncState?.status === 'syncing' ? (
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
              ) : syncState?.status === 'error' ? (
                <Cloud className="w-5 h-5 text-rose-400" />
              ) : (
                <CloudCheck className="w-5 h-5 text-emerald-400" />
              )}
              <span className="hidden xl:inline text-xs font-medium text-slate-300">
                {syncState?.status === 'syncing' ? 'सिंक हो रहा है...' : 'क्लाउड सिंक'}
              </span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="सेटिंग्स एवं बैकअप"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Main "Upload Notes" CTA Button */}
          <button
            onClick={() => onOpenScanner()}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4 sm:w-4 sm:h-4 text-blue-200" />
            <span className="hidden xs:inline">नोट्स अपलोड करें</span>
            <span className="xs:hidden">स्कैन</span>
          </button>
        </div>
      </div>
    </header>
  );
}
