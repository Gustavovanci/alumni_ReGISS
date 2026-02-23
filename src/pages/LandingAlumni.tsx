import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Network, Briefcase, TrendingUp, ShieldCheck, Users, Target, Activity, Share2, Calculator } from 'lucide-react';

/* ─── Core Pulsing Text ─── */
const WORDS = [
    { label: 'ReGISS', sub: 'Residência' },
    { label: 'Alumni', sub: 'Rede' },
];

const CoreText = () => {
    const [idx, setIdx] = React.useState(0);
    const [visible, setVisible] = React.useState(true);

    React.useEffect(() => {
        const SHOW = 3000, FADE = 600;
        const tick = () => {
            setVisible(false);
            setTimeout(() => {
                setIdx(p => (p + 1) % WORDS.length);
                setVisible(true);
            }, FADE + 50);
        };
        const id = setInterval(tick, SHOW + FADE);
        return () => clearInterval(id);
    }, []);

    const word = WORDS[idx];
    return (
        /* The core circle — sized to be clearly visible inside the orbital ring */
        <div style={{
            position: 'absolute',
            width: '38%', height: '38%',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 35% 25%, #1a2f50 0%, #0b1320 75%)',
            border: '1px solid rgba(213,32,93,0.22)',
            boxShadow: `
        0 0 0 1px rgba(255,255,255,0.05),
        0 0 32px rgba(213,32,93,0.18),
        0 0 80px rgba(213,32,93,0.07),
        inset 0 1px 0 rgba(255,255,255,0.08)
      `,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            animation: 'breatheCore 3.6s ease-in-out infinite',
            zIndex: 10,
        }}>
            {/* glass sheen */}
            <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'linear-gradient(140deg,rgba(255,255,255,0.06) 0%,transparent 55%)',
                pointerEvents: 'none',
            }} />

            {/* animated content */}
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 0, position: 'relative', zIndex: 1,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(5px) scale(0.93)',
                filter: visible ? 'blur(0px)' : 'blur(4px)',
                transition: visible
                    ? 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1), filter 0.5s ease'
                    : 'opacity 0.35s ease, transform 0.35s ease, filter 0.35s ease',
            }}>
                {/* micro label */}
                <span style={{
                    fontSize: 'clamp(6px,1vw,9px)', fontWeight: 700,
                    letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.28)', marginBottom: '0.35em',
                    userSelect: 'none',
                }}>{word.sub}</span>

                {/* separator line */}
                <div style={{
                    width: 'clamp(18px,3vw,32px)', height: 1,
                    background: 'linear-gradient(90deg,transparent,rgba(213,32,93,0.7),transparent)',
                    marginBottom: '0.45em',
                }} />

                {/* main word */}
                <span style={{
                    fontSize: 'clamp(14px,2.8vw,24px)', fontWeight: 900,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: 'linear-gradient(135deg,#FF7BA0 0%,#D5205D 45%,#8C1138 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 12px rgba(213,32,93,0.6))',
                    userSelect: 'none', lineHeight: 1,
                }}>{word.label}</span>

                {/* separator line */}
                <div style={{
                    width: 'clamp(18px,3vw,32px)', height: 1,
                    background: 'linear-gradient(90deg,transparent,rgba(213,32,93,0.7),transparent)',
                    marginTop: '0.45em', marginBottom: '0.4em',
                }} />

                {/* pill dots */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {WORDS.map((_, i) => (
                        <div key={i} style={{
                            width: i === idx ? 'clamp(10px,1.4vw,14px)' : 'clamp(3px,0.5vw,4px)',
                            height: 'clamp(2px,0.4vw,3px)',
                            borderRadius: 99,
                            background: i === idx ? '#D5205D' : 'rgba(255,255,255,0.18)',
                            boxShadow: i === idx ? '0 0 8px rgba(213,32,93,0.8)' : 'none',
                            transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
                        }} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export const LandingAlumni = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                if (data?.role === 'admin') navigate('/admin');
                else if (data?.role === 'company') navigate('/admin-parceiros');
                else navigate('/feed');
            }
        };
        checkUser();
    }, [navigate]);

    const icons = [
        { icon: TrendingUp, color: '#34d399', glowColor: '#10b981', orbitRadius: 170, angle: 310, duration: 38 },
        { icon: Network, color: '#f472b6', glowColor: '#ec4899', orbitRadius: 170, angle: 40, duration: 38, size: 56, iconSize: 26 },
        { icon: Share2, color: '#22d3ee', glowColor: '#06b6d4', orbitRadius: 170, angle: 190, duration: 38, size: 56, iconSize: 26 },
        { icon: Calculator, color: '#60a5fa', glowColor: '#3b82f6', orbitRadius: 170, angle: 130, duration: 38 },
        { icon: Target, color: '#fbbf24', glowColor: '#f59e0b', orbitRadius: 170, angle: 255, duration: 38 },
        { icon: Activity, color: '#c084fc', glowColor: '#a855f7', orbitRadius: 170, angle: 80, duration: 38, size: 44, iconSize: 20 },
    ];

    return (
        <div className="min-h-screen bg-[#0B1320] text-slate-200 font-sans selection:bg-[#D5205D]/30 overflow-hidden relative">

            {/* Background Orbs */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#D5205D]/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            <style>{`
              @keyframes spinArm {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
              }
              @keyframes counterSpin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(-360deg); }
              }
              @keyframes orbitTrail {
                from { transform: translate(-50%,-50%) rotate(0deg); }
                to   { transform: translate(-50%,-50%) rotate(360deg); }
              }
              @keyframes breatheCore {
                0%,100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 0 32px rgba(213,32,93,0.18), 0 0 80px rgba(213,32,93,0.07), inset 0 1px 0 rgba(255,255,255,0.08); }
                50%     { box-shadow: 0 0 0 1px rgba(255,255,255,0.07), 0 0 55px rgba(213,32,93,0.30), 0 0 110px rgba(213,32,93,0.13), inset 0 1px 0 rgba(255,255,255,0.12); }
              }
            `}</style>

            {/* Header */}
            <nav className="w-full absolute top-0 left-0 p-6 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/apple-touch-icon.png"
                            alt="Logo ReGISS"
                            className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-[#D5205D]/20 border border-white/5"
                        />
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Alumni <span className="text-[#D5205D]">ReGISS</span>
                        </span>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 pt-32 pb-20 px-6 min-h-screen flex flex-col justify-center">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

                    {/* Coluna de Texto */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#15335E]/50 border border-blue-500/20 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-[#D5205D] animate-pulse"></span>
                            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">A Elite da Gestão em Saúde</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight">
                            O hub de conexão para <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D5205D] to-[#FF4B82]">
                                líderes e futuros líderes
                            </span><br className="hidden sm:block" /> em gestão hospitalar.
                        </h1>

                        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            A plataforma exclusiva para residentes e Alumnis do ReGISS. Integre-se ao maior capital intelectual do Clínicas, interaja e acesse oportunidades corporativas reais.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-gradient-to-r from-[#D5205D] to-[#9B1743] hover:from-[#E22E6A] hover:to-[#A71C4B] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(213,32,93,0.3)] hover:shadow-[0_0_40px_rgba(213,32,93,0.5)] hover:-translate-y-1 w-full sm:w-auto text-center"
                            >
                                Acessar Rede Alumni
                            </button>
                            <button
                                onClick={() => navigate('/para-empresas')}
                                className="bg-[#15335E] hover:bg-[#1C4177] border border-blue-500/20 shadow-[0_0_15px_rgba(21,51,94,0.5)] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all w-full sm:w-auto text-center"
                            >
                                Portal de Parceiros
                            </button>
                        </div>
                    </div>

                    {/* ─── ORBITAL VISUAL ─── */}
                    <div className="relative w-full h-[500px] hidden lg:flex items-center justify-center">

                        {/* Ambient outer glow */}
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(213,32,93,0.07) 0%, transparent 68%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Outer decorative dashed ring */}
                        <div style={{
                            position: 'absolute',
                            width: '90%', height: '90%',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)',
                            borderRadius: '50%',
                            border: '1px dashed rgba(255,255,255,0.06)',
                            pointerEvents: 'none',
                        }} />

                        {/* Orbit track ring */}
                        <div style={{
                            position: 'absolute',
                            width: '76%', height: '76%',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)',
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.07)',
                            pointerEvents: 'none',
                        }} />

                        {/* Spinning conic arc on track */}
                        <div style={{
                            position: 'absolute',
                            width: '76%', height: '76%',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)',
                            borderRadius: '50%',
                            background: 'conic-gradient(from 0deg, rgba(213,32,93,0.4) 0deg, rgba(213,32,93,0.05) 70deg, transparent 120deg)',
                            maskImage: 'radial-gradient(circle, transparent 45%, black 46%, black 54%, transparent 55%)',
                            WebkitMaskImage: 'radial-gradient(circle, transparent 45%, black 46%, black 54%, transparent 55%)',
                            animation: 'orbitTrail 38s linear infinite',
                            pointerEvents: 'none',
                        }} />

                        {/* Inner ring */}
                        <div style={{
                            position: 'absolute',
                            width: '50%', height: '50%',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)',
                            borderRadius: '50%',
                            border: '1px solid rgba(213,32,93,0.08)',
                            pointerEvents: 'none',
                        }} />

                        {/* ── Core circle with pulsing text ── */}
                        <CoreText />

                        {/* ── Orbiting icons using math positioning ── */}
                        {icons.map((item, i) => {
                            const iconW = item.size || 48;
                            const iconSz = item.iconSize || 22;
                            // orbit radius as % of container (half of 76% track → 38%)
                            // We use CSS animation on a wrapper that spins,
                            // and place the icon at the top (negative margin),
                            // then counter-rotate the icon card to keep it upright.
                            const delay = -(38 * (item.angle / 360));
                            return (
                                <div key={i} style={{
                                    position: 'absolute',
                                    top: '50%', left: '50%',
                                    width: 0, height: 0,
                                    animation: `spinArm 38s linear infinite`,
                                    animationDelay: `${delay}s`,
                                }}>
                                    {/* arm: place icon at orbit radius from center */}
                                    <div style={{
                                        position: 'absolute',
                                        top: `calc(-38% - ${iconW / 2}px)`,
                                        left: `-${iconW / 2}px`,
                                        width: iconW, height: iconW,
                                        animation: `counterSpin 38s linear infinite`,
                                        animationDelay: `${delay}s`,
                                    }}>
                                        <div style={{
                                            width: '100%', height: '100%',
                                            borderRadius: 14,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative',
                                            background: 'linear-gradient(135deg,rgba(11,19,32,0.97) 0%,rgba(20,34,57,0.93) 100%)',
                                            border: `1px solid ${item.color}38`,
                                            boxShadow: `0 0 20px ${item.glowColor}22, 0 0 40px ${item.glowColor}0a, inset 0 1px 0 rgba(255,255,255,0.08)`,
                                            backdropFilter: 'blur(16px)',
                                        }}>
                                            <div style={{
                                                position: 'absolute', inset: 0, borderRadius: 14,
                                                background: `radial-gradient(circle at 28% 28%, ${item.color}1a, transparent 62%)`,
                                            }} />
                                            <item.icon size={iconSz} strokeWidth={1.5} style={{
                                                color: item.color,
                                                filter: `drop-shadow(0 0 7px ${item.glowColor}cc)`,
                                                position: 'relative', zIndex: 1,
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Seção de Features */}
            <section className="relative z-10 py-24 bg-[#142239] border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Capital social que gera resultados</h2>
                        <p className="text-slate-400">Projetado para potencializar o impacto de quem gere o ecossistema da saúde.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[#0B1320] p-8 rounded-3xl border border-white/5 shadow-xl hover:border-[#D5205D]/50 transition-colors group">
                            <div className="w-14 h-14 bg-[#15335E] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users className="text-blue-400 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Conexão Geracional</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                Um fórum contínuo entre residentes atuais e graduados. Troque vivências sobre finanças, qualidade, operações e inovação.
                            </p>
                        </div>

                        <div className="bg-[#0B1320] p-8 rounded-3xl border border-white/5 shadow-xl hover:border-[#D5205D]/50 transition-colors group">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Briefcase className="text-emerald-400 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Curadoria de Carreira</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                Explore caminhos de desenvolvimento através do networking ativo com líderes e instituições do ecossistema de saúde.
                            </p>
                        </div>

                        <div className="bg-[#0B1320] p-8 rounded-3xl border border-white/5 shadow-xl hover:border-[#D5205D]/50 transition-colors group">
                            <div className="w-14 h-14 bg-[#D5205D]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="text-[#D5205D] w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Comunicação Oficial</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                Acesso direto aos comunicados, eventos corporativos e masterclasses. Informação estratégica centralizada em um único ambiente.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-[#0B1320] border-t border-white/5 text-center text-slate-500 text-sm">
                <p>© {new Date().getFullYear()} Alumni HC ReGISS. Construindo o futuro da gestão em saúde.</p>
            </footer>
        </div>
    );
};