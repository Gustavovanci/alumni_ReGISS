import React from 'react';

export const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#142239]">
            <div className="relative flex flex-col items-center">
                {/* Glow background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#D5205D]/20 blur-[50px] rounded-full"></div>

                <img
                    src="/apple-touch-icon.png"
                    alt="ReGISS"
                    className="w-24 h-24 object-contain rounded-3xl shadow-[0_0_30px_rgba(213,32,93,0.4)] animate-[pulse_1.5s_ease-in-out_infinite] relative z-10"
                />

                <div className="mt-12 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 relative">
                        <div className="w-8 h-8 rounded-full border-2 border-white/10 animate-spin absolute"></div>
                        <div className="w-8 h-8 rounded-full border-t-2 border-[#D5205D] animate-spin absolute"></div>
                    </div>
                    <p className="text-slate-400 font-bold text-xs tracking-widest uppercase animate-pulse">
                        Autenticando...
                    </p>
                </div>
            </div>
        </div>
    );
};
