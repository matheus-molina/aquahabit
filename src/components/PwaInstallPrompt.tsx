import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, Droplet } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false);

  useEffect(() => {
    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      // Mostrar após 3 segundos
      const timer = setTimeout(() => setShowInstallBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Detectar Android / Chrome Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* Banner de Instalação PWA */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto bg-slate-900/95 border border-ocean-500/40 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-ocean-500 text-white shadow-md shadow-ocean-500/40">
              <Droplet className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white">Instalar AquaHabit</h4>
              <p className="text-[11px] text-slate-300">Acesse offline como um App nativo!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar
            </button>
            <button
              type="button"
              onClick={() => setShowInstallBanner(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Instruções iOS */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Como instalar no iPhone/iPad</h3>
              <button
                type="button"
                onClick={() => setShowIOSInstructions(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="text-xs text-slate-300 space-y-3">
              <li className="flex items-start gap-2.5">
                <span className="p-1.5 bg-slate-800 rounded-lg text-ocean-400 font-bold shrink-0">1</span>
                <span>Toque no botão <strong className="text-white flex items-center gap-1 inline-flex"><Share className="w-3 h-3 text-ocean-400 inline" /> Compartilhar</strong> na barra do Safari.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="p-1.5 bg-slate-800 rounded-lg text-ocean-400 font-bold shrink-0">2</span>
                <span>Role para baixo e selecione <strong className="text-white flex items-center gap-1 inline-flex"><PlusSquare className="w-3 h-3 text-emerald-400 inline" /> Adicionar à Tela de Início</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="p-1.5 bg-slate-800 rounded-lg text-ocean-400 font-bold shrink-0">3</span>
                <span>Confirme em <strong className="text-white">Adicionar</strong> no canto superior direito.</span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2.5 bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-bold rounded-xl transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
