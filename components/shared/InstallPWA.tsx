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
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    if (typeof window !== 'undefined' && (window as any).deferredPWAEvent) {
      handleBeforeInstallPrompt((window as any).deferredPWAEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => setIsStandalone(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsStandalone(true);
      setDeferredPrompt(null);
    } else {
      // Fallback: Show manual hint if native prompt isn't available
      setShowHint(true);
    }
  };

  if (isStandalone) return null;

  return (
    <div className={className}>
      <button
        onClick={handleInstallClick}
        className={`flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20 animate-in fade-in zoom-in duration-500 ${buttonClassName}`}
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
      
      {showHint && (
        <div className="mt-3 p-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-xs text-slate-300 animate-in slide-in-from-top-2">
          {isIOS ? (
            <>To install on iOS: Tap the <strong className="text-white">Share</strong> icon at the bottom of your browser and select <strong className="text-white">Add to Home Screen</strong>.</>
          ) : (
            <>To install: Open your browser menu (⋮) and select <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.</>
          )}
        </div>
      )}
    </div>
  );
}
