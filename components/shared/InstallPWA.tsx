"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallPWA({ 
  className = "px-3 py-4 flex flex-col items-center", 
  buttonClassName = "w-full" 
}: { 
  className?: string, 
  buttonClassName?: string 
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      return; // Already installed, don't show anything
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    if (typeof window !== 'undefined' && (window as any).deferredPWAEvent) {
      handleBeforeInstallPrompt((window as any).deferredPWAEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => setIsInstallable(false));

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSHint(true);
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstallable(false);
    setDeferredPrompt(null);
  };

  if (!isInstallable) return null;

  return (
    <div className={className}>
      <button
        onClick={handleInstallClick}
        className={`flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20 animate-in fade-in zoom-in duration-500 ${buttonClassName}`}
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
      
      {showIOSHint && (
        <div className="mt-3 p-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-xs text-slate-300 animate-in slide-in-from-top-2">
          To install on iOS: Tap the <strong className="text-white">Share</strong> icon at the bottom of your browser and select <strong className="text-white">Add to Home Screen</strong>.
        </div>
      )}
    </div>
  );
}
