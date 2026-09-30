import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';

export default function PinLockScreen({ expectedPin, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === expectedPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-xs flex flex-col items-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-2xl">
          <Lock className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Sudha BPSC Notes
          </h2>
          <p className="text-xs text-slate-400">
            Enter 4-digit security PIN to unlock
          </p>
        </div>

        {/* PIN Dots */}
        <div
          className={`flex items-center gap-4 py-2 ${
            error ? 'animate-shake' : ''
          }`}
        >
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/50'
                  : 'border-slate-700 bg-slate-900'
              } ${error ? 'border-red-500 bg-red-500' : ''}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-400">
            Incorrect PIN. Try again.
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full pt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-95 text-xl font-semibold flex items-center justify-center mx-auto transition-all shadow-md"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-95 text-xl font-semibold flex items-center justify-center mx-auto transition-all shadow-md"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-slate-900/50 hover:bg-slate-800 active:scale-95 text-slate-400 flex items-center justify-center mx-auto transition-all"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
