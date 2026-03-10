import React, { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Download } from 'lucide-react';

export default function InstallPromptBanner() {
  const { isInstallable, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }
  }, []);

  if (isStandalone || dismissed || !isInstallable) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#4338CA]" />
        
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4338CA] shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="space-y-1 pr-6">
            <h3 className="font-bold text-slate-900 text-[15px]">Install Money Tracker</h3>
            <p className="text-slate-500 text-[13px] leading-relaxed">
              Add Upender's Money Flow to your home screen for quick daily tracking.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button 
            onClick={installApp}
            className="flex-1 rounded-xl h-11 font-bold text-sm bg-[#4338CA] hover:bg-[#3730A3] shadow-lg shadow-indigo-100 gap-2"
          >
            <Download className="w-4 h-4" /> Install Now
          </Button>
          <Button 
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="rounded-xl h-11 px-4 font-bold text-sm text-slate-400"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
