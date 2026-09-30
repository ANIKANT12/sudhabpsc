import React from 'react';
import { Home, BookOpen, Camera, Star, Sparkles } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenScanner }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'home' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px]">होम</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'subjects' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-[10px]">विषय</span>
        </button>

        {/* Center Scanner Button */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={() => onOpenScanner()}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-xl shadow-blue-600/40 active:scale-95 transition-transform"
            title="नोट्स स्कैन करें"
          >
            <div className="w-full h-full bg-blue-600 rounded-full flex flex-col items-center justify-center text-white">
              <Camera className="w-6 h-6" />
            </div>
          </button>
        </div>

        <button
          onClick={() => setActiveTab('starred')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'starred' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Star className="w-5 h-5 mb-1" />
          <span className="text-[10px]">महत्वपूर्ण</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'ai' ? 'text-purple-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-1" />
          <span className="text-[10px]">AI अध्ययन</span>
        </button>
      </div>
    </div>
  );
}
