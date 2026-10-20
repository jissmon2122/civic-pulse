import React, { useState, useEffect } from 'react';
import { Download, WifiOff, X, Share2, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed (standalone mode)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    setIsIOS(isIOSDevice && isSafari);

    // 3. Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. Online / Offline listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check localStorage dismissal
    const dismissedUntil = localStorage.getItem('civic_pulse_pwa_dismissed');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowIOSGuide(false);
    // Dismiss for 24 hours
    localStorage.setItem('civic_pulse_pwa_dismissed', String(Date.now() + 24 * 60 * 60 * 1000));
  };

  return (
    <>
      {/* 1. Offline Notification Bar */}
      {isOffline && (
        <div
          role="status"
          className="bg-amber-600 text-white text-xs sm:text-sm font-medium py-2 px-4 shadow-md flex items-center justify-center gap-2 sticky top-0 z-50 transition-all animate-in fade-in slide-in-from-top-1"
        >
          <WifiOff size={16} className="animate-pulse" />
          <span>
            <strong>Offline Mode:</strong> You are viewing cached app data. Please reconnect to submit reports or sync municipal updates.
          </span>
        </div>
      )}

      {/* 2. iOS Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl p-5 max-w-sm w-full shadow-2xl relative text-text-primary">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-3 right-3 text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-surface-subtle"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <img src="/pwa-192x192.png" alt="Civic Pulse" className="w-10 h-10 rounded-xl shadow-sm" />
              <div>
                <h4 className="font-heading font-bold text-sm">Install Civic Pulse on iPhone</h4>
                <p className="text-xs text-text-secondary">Tamil Nadu Civic Intelligence</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-text-secondary mt-3">
              <div className="flex items-start gap-2.5 bg-surface-subtle p-2.5 rounded-lg border border-border/60">
                <Share2 size={18} className="text-primary shrink-0 mt-0.5" />
                <span>
                  1. Tap the <strong>Share</strong> button at the bottom of your Safari browser.
                </span>
              </div>
              <div className="flex items-start gap-2.5 bg-surface-subtle p-2.5 rounded-lg border border-border/60">
                <Smartphone size={18} className="text-primary shrink-0 mt-0.5" />
                <span>
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2 bg-primary text-white rounded-lg font-medium text-xs hover:bg-primary-hover transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* 3. Install Banner (Android / Chrome / Desktop or iOS prompt) */}
      {!isInstalled && !isDismissed && (deferredPrompt || isIOS) && (
        <aside
          aria-label="Install Civic Pulse app"
          className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-40 bg-surface/98 backdrop-blur-md border border-primary/20 rounded-2xl p-3.5 shadow-2xl transition-all animate-in slide-in-from-bottom-4"
        >
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="Civic Pulse App Icon"
              className="w-11 h-11 rounded-xl shadow-md border border-border shrink-0 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-text-primary truncate">
                  Civic Pulse App
                </h4>
                <span className="text-[10px] font-semibold bg-primary-tint text-primary px-1.5 py-0.5 rounded">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-text-secondary truncate mt-0.5">
                Install for instant reporting & full-screen resolution
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-transform active:scale-95"
              >
                <Download size={14} />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-subtle transition-colors"
                aria-label="Dismiss install banner"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
