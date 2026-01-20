import React, { useState, useEffect } from 'react';
import { DownloadIcon, XIcon, ShareIcon } from './icons/Icons';

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect if it's iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (ios) {
            // Check if already in standalone mode on iOS
            if (!isStandalone) {
                // Show prompt after a short delay on iOS
                const timer = setTimeout(() => setIsVisible(true), 3000);
                return () => clearTimeout(timer);
            }
        } else {
            // Android/Chrome logic
            const handler = (e: any) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setIsVisible(true);
            };

            window.addEventListener('beforeinstallprompt', handler);

            if (isStandalone) {
                setIsVisible(false);
            }

            return () => {
                window.removeEventListener('beforeinstallprompt', handler);
            };
        }
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[100] animate-fade-in-up">
            <div className="bg-primary-gradient p-1 rounded-[2rem] shadow-2xl shadow-primary/40">
                <div className="bg-slate-900/90 backdrop-blur-xl rounded-[1.9rem] p-6 relative overflow-hidden group">
                    {/* Background Decorative Circles */}
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />

                    <div className="relative flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary-gradient rounded-2xl flex items-center justify-center flex-none shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                            {isIOS ? <ShareIcon className="w-8 h-8 text-white" /> : <DownloadIcon className="w-8 h-8 text-white" />}
                        </div>

                        <div className="flex-1">
                            <h4 className="text-white font-black text-lg italic tracking-tight leading-tight">
                                {isIOS ? 'Salvar no iPhone' : 'App MeusMangás'}
                            </h4>
                            <p className="text-indigo-200 text-xs font-bold leading-relaxed">
                                {isIOS
                                    ? 'Toque em Compartilhar e depois em "Adicionar à Tela de Início"'
                                    : 'Instale agora para acessar sua coleção em um clique!'}
                            </p>
                        </div>

                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute -top-1 -right-1 p-2 text-indigo-300/50 hover:text-white transition-colors"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {!isIOS && (
                        <button
                            onClick={handleInstallClick}
                            className="w-full mt-5 bg-white text-slate-900 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary-gradient hover:text-white transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl"
                        >
                            Instalar Agora
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
