import React from 'react';

export const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#142239] pb-12 pt-0">
            <div className="flex-1 flex flex-col items-center justify-center relative w-full">
                {/* Glow background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#D5205D]/20 blur-[60px] rounded-full"></div>

                <img
                    src="/apple-touch-icon.png"
                    alt="ReGISS"
                    className="w-28 h-28 object-contain rounded-3xl shadow-[0_0_40px_rgba(213,32,93,0.4)] relative z-10"
                />
            </div>

            <div className="flex flex-col items-center justify-center pb-8 animate-fadeIn">
                <span className="text-slate-500 text-xs font-medium mb-1 tracking-widest">from</span>
                <span className="text-xl font-black bg-gradient-to-r from-amber-500 via-[#D5205D] to-blue-500 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(213,32,93,0.6)]">
                    ALUMNI ReGISS
                </span>
            </div>
        </div>
    );
};
