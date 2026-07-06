import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoCloseOutline, 
  IoDownloadOutline, 
  IoDesktopOutline, 
  IoLogoAndroid, 
  IoLogoApple, 
  IoCheckmarkCircleOutline, 
  IoInformationCircleOutline,
  IoShareOutline
} from 'react-icons/io5';

const InstallStrip = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [platform, setPlatform] = useState('windows');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadState, setDownloadState] = useState('idle'); // idle, downloading, completed
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Detect platform and listen for PWA install prompt
  useEffect(() => {
    // Platform detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) {
      setPlatform('android');
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      setPlatform('ios');
    } else if (userAgent.includes('mac')) {
      setPlatform('macos');
    } else if (userAgent.includes('win')) {
      setPlatform('windows');
    } else {
      setPlatform('linux');
    }

    // PWA install prompt intercept
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Trigger file download helper
  const triggerDownload = (fileName) => {
    const link = document.createElement('a');
    link.href = `/downloads/${fileName}`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = () => {
    setDownloadState('downloading');
    setDownloadProgress(0);

    // Simulate download progress animation
    const duration = 2500; // 2.5 seconds
    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setDownloadState('completed');
          // Trigger the actual mock installer download based on detected OS
          if (platform === 'windows') {
            triggerDownload('MyNotes-Installer.exe');
          } else if (platform === 'macos') {
            triggerDownload('MyNotes-Installer.dmg');
          } else if (platform === 'android') {
            triggerDownload('MyNotes.apk');
          }
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);
  };

  const handleOpenDownloadModal = () => {
    setShowModal(true);
    handleDownload();
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowModal(false);
    }
  };

  const getPlatformIcon = (plat) => {
    switch (plat) {
      case 'android':
        return <IoLogoAndroid className="w-5 h-5 text-emerald-400" />;
      case 'ios':
      case 'macos':
        return <IoLogoApple className="w-5 h-5 text-slate-200" />;
      case 'windows':
      default:
        return <IoDesktopOutline className="w-5 h-5 text-sky-400" />;
    }
  };

  const getPlatformName = (plat) => {
    switch (plat) {
      case 'android': return 'Android';
      case 'ios': return 'iOS (iPhone/iPad)';
      case 'macos': return 'macOS';
      case 'windows': return 'Windows';
      default: return 'Desktop/Mobile';
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Top Banner Strip */}
      <div className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900 absolute top-0 left-0 right-0 z-50 py-3 px-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-200 tracking-wide font-outfit">
              Install Our App <span className="hidden md:inline text-slate-400 font-normal">- Synchronize your drawings, voice memos, and notes instantly across devices</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenDownloadModal}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-[11px] sm:text-xs font-bold rounded-xl px-3.5 py-1.5 transition-all shadow-md shadow-violet-600/10 cursor-pointer flex items-center gap-1.5"
            >
              <IoDownloadOutline className="w-3.5 h-3.5" />
              <span>Download the app free</span>
            </button>
            
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-900/60 transition-colors"
              aria-label="Dismiss banner"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Download and Instructions Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-3xl glass-panel bg-slate-950/95 border border-slate-900 shadow-2xl p-6 sm:p-8 relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>

              {/* Progress and Download State content */}
              <div className="flex flex-col items-center text-center mt-2">
                <div className="p-3 bg-violet-600/10 rounded-2xl border border-violet-500/20 mb-4">
                  {getPlatformIcon(platform)}
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-1">
                  {downloadState === 'downloading' 
                    ? `Downloading for ${getPlatformName(platform)}`
                    : 'Download Initiated!'}
                </h3>
                
                <p className="text-xs text-slate-400 max-w-xs mb-6">
                  {downloadState === 'downloading'
                    ? 'Preparing installer bundle...'
                    : `Installation file for ${getPlatformName(platform)} is downloading.`}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-900/60 rounded-full h-2.5 mb-6 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-75"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>

                {/* Instruction details based on platform */}
                {downloadState === 'completed' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full text-left bg-slate-900/30 rounded-2xl border border-slate-900 p-4 mb-6 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-900 pb-2 text-violet-400 font-bold text-xs">
                      <IoInformationCircleOutline className="w-4 h-4 shrink-0" />
                      <span>HOW TO INSTALL ON {getPlatformName(platform).toUpperCase()}</span>
                    </div>

                    {platform === 'windows' && (
                      <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
                        <li>Locate <span className="font-semibold text-slate-100">MyNotes-Installer.exe</span> in your Downloads folder.</li>
                        <li>Double-click the file to open it.</li>
                        <li>Follow the screen prompts to launch the application.</li>
                      </ol>
                    )}

                    {platform === 'macos' && (
                      <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
                        <li>Open <span className="font-semibold text-slate-100">MyNotes-Installer.dmg</span> from downloads.</li>
                        <li>Drag the <span className="font-semibold text-slate-100">My Notes</span> icon into your Applications folder.</li>
                        <li>Launch it from Applications or Launchpad.</li>
                      </ol>
                    )}

                    {platform === 'android' && (
                      <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
                        <li>Tap the downloaded <span className="font-semibold text-slate-100">MyNotes.apk</span> file.</li>
                        <li>If prompted, enable "Install from Unknown Sources".</li>
                        <li>Tap "Install" and open the application.</li>
                      </ol>
                    )}

                    {platform === 'ios' && (
                      <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                        <p>iOS doesn't require download packages! You can install My Notes directly as a mobile app:</p>
                        <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                          <IoShareOutline className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                          <span>Tap the <span className="font-semibold text-slate-100">Share</span> button at the bottom of Safari browser.</span>
                        </div>
                        <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                          <span className="font-semibold text-violet-400 text-xs shrink-0 mt-0.5">➕</span>
                          <span>Select <span className="font-semibold text-slate-100">Add to Home Screen</span> from the list.</span>
                        </div>
                      </div>
                    )}

                    {platform === 'linux' && (
                      <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
                        <li>Extract the downloaded package.</li>
                        <li>Grant execute permission to launcher.</li>
                        <li>Double click launcher to open the app.</li>
                      </ol>
                    )}
                  </motion.div>
                )}

                {/* Alternate downloads */}
                {downloadState === 'completed' && (
                  <div className="w-full border-t border-slate-900 pt-4 flex flex-col items-center gap-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Other Versions</p>
                    
                    <div className="flex flex-wrap justify-center gap-2.5">
                      {platform !== 'windows' && (
                        <button 
                          onClick={() => triggerDownload('MyNotes-Installer.exe')}
                          className="text-[11px] text-slate-400 hover:text-white font-medium flex items-center gap-1 py-1 px-2 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                        >
                          <IoDesktopOutline className="w-3.5 h-3.5 text-sky-400" /> Windows
                        </button>
                      )}
                      {platform !== 'macos' && (
                        <button 
                          onClick={() => triggerDownload('MyNotes-Installer.dmg')}
                          className="text-[11px] text-slate-400 hover:text-white font-medium flex items-center gap-1 py-1 px-2 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                        >
                          <IoLogoApple className="w-3.5 h-3.5 text-slate-400" /> macOS
                        </button>
                      )}
                      {platform !== 'android' && (
                        <button 
                          onClick={() => triggerDownload('MyNotes.apk')}
                          className="text-[11px] text-slate-400 hover:text-white font-medium flex items-center gap-1 py-1 px-2 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                        >
                          <IoLogoAndroid className="w-3.5 h-3.5 text-emerald-400" /> Android
                        </button>
                      )}
                    </div>

                    {/* Native PWA Installer prompt trigger if supported */}
                    {deferredPrompt && (
                      <button
                        onClick={handleNativeInstall}
                        className="mt-3 w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <IoCheckmarkCircleOutline className="w-4 h-4" />
                        <span>Install Web App Directly</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstallStrip;
