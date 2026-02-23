import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Briefcase, TrendingUp, ShieldCheck, ArrowRight, Activity, Users } from 'lucide-react';

export const LandingAlumni = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0B1320] text-slate-200 font-sans selection:bg-[#D5205D]/30 overflow-x-hidden relative">
            {/* Background Orbs */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#D5205D]/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <nav className="w-full absolute top-0 left-0 p-6 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#D5205D] to-[#9B1743] rounded-xl flex items-center justify-center shadow-lg shadow-[#D5205D]/20">
                            <Activity className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Alumni <span className="text-[#D5205D]">HC</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/para-empresas')} className="hidden sm:block text-slate-400 font-medium hover:text-white transition-colors text-sm">
                            Sou Empresa
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[#15335E] hover:bg-[#1C4177] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all border border-blue-500/20 shadow-[0_0_15px_rgba(21,51,94,0.5)] flex items-center gap-2"
                        >
                            Entrar
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 pt-32 pb-20 px-6 min-h-screen flex flex-col justify-center">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#15335E]/50 border border-blue-500/20 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Rede Exclusiva</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                            O ecossistema <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D5205D] to-[#FF4B82]">
                                definitivo
                            </span> para sua carreira médica.
                        </h1>

                        <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                            Conecte-se com residentes, acesse vagas hiper-segmentadas de ponta a ponta e impulsione sua trajetória com o capital social mais valioso do Clínicas.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-gradient-to-r from-[#D5205D] to-[#9B1743] hover:from-[#E22E6A] hover:to-[#A71C4B] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(213,32,93,0.3)] hover:shadow-[0_0_40px_rgba(213,32,93,0.5)] hover:-translate-y-1 w-full sm:w-auto text-center"
                            >
                                Acessar Comunidade
                            </button>
                            <button
                                onClick={() => navigate('/para-empresas')}
                                className="bg-[#142239] hover:bg-[#1A2C49] text-white border border-white/10 px-8 py-4 rounded-xl font-bold text-lg transition-all w-full sm:w-auto text-center"
                            >
                                Portal Corporativo
                            </button>
                        </div>
                    </div>

                    {/* Hero Visuals / Mockup abstrato */}
                    <div className="relative w-full h-[500px] flex items-center justify-center">
                        {/* Círculo Central Escuro */}
                        <div className="absolute w-[400px] h-[400px] bg-[#142239]/80 rounded-full border border-white/5 backdrop-blur-xl shadow-2xl flex items-center justify-center">
                            <Activity className="w-32 h-32 text-[#D5205D]/20 animate-pulse" />
                        </div>

                        {/* Orbiting Elements */}
                        <div className="absolute w-full h-full animate-[spin_40s_linear_infinite]">
                            <div className="absolute top-[10%] left-[20%] w-16 h-16 bg-[#15335E] rounded-2xl border border-blue-500/30 shadow-lg flex items-center justify-center -rotate-[40deg]">
                                <Briefcase className="text-blue-400 w-8 h-8" />
                            </div>
                            <div className="absolute bottom-[20%] right-[10%] w-20 h-20 bg-gradient-to-br from-[#D5205D]/20 to-transparent rounded-full border border-[#D5205D]/40 backdrop-blur-md flex items-center justify-center -rotate-[20deg]">
                                <Users className="text-[#D5205D] w-10 h-10" />
                            </div>
                            <div className="absolute top-[30%] right-[15%] w-14 h-14 bg-emerald-500/10 rounded-xl border border-emerald-500/30 backdrop-blur-md flex items-center justify-center rotate-[15deg]">
                                <TrendingUp className="text-emerald-400 w-7 h-7" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Seção de Features */}
            <section className="relative z-10 py-24 bg-[#142239] border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Mude o rumo do seu networking</h2>
                        <p className="text-slate-400">Projetado por médicos, para a excelência em saúde.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[#0B1320] p-8 rounded-3xl border border-white/5 shadow-xl hover:border-[#D5205D]/50 transition-colors group">
                            <div className="w-14 h-14 bg-[#15335E] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Network className="text-blue-400 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Feed Institucional</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                Discussões de alto nível, avisos diretos da coordenação e troca de vivências entre residentes R1, R2 e Alumnis graduados.
                            </p>
                        </div>

                        <div className="bg-[#0B1320] p-8 rounded-3xl border border-white/5 shadow-xl hover:border-[#D5205D]/50 transition-colors group">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Briefcase className="text-emerald-400 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Talent MatchMaker</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                Acesse o Mural de Vagas Reais e Patrocinadas de hospitais parceiros em um sistema anti-vácuo que garante retorno nas suas candidaturas.
                            </p>
                        </div>

                        <div className="bg-[#0B1320] p-8 rounded-3xl border border-white/5 shadow-xl hover:border-[#D5205D]/50 transition-colors group">
                            <div className="w-14 h-14 bg-[#D5205D]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="text-[#D5205D] w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Rede Blindada</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                Autenticação rigorosa e moderação em tempo real. Avalie de forma anônima hospitais e clínicas através do nosso motor "Glassdoor da Saúde".
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-[#0B1320] border-t border-white/5 text-center text-slate-500 text-sm">
                <p>© {new Date().getFullYear()} Alumni HC ReGISS. Feito em parceria tecnológica para o futuro da saúde.</p>
            </footer>
        </div>
    );
};
