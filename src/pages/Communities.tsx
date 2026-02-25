import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, MessageSquare, Search, ArrowLeft, Hash, Pin, ChevronRight, Activity } from 'lucide-react';

// ==========================================
// DADOS FIXOS (HARDCODED) DAS COMUNIDADES
// ==========================================
const PREDEFINED_COMMUNITIES = [
    // --- PROFISSÕES BASE ---
    { id: 'prof-fisio', name: 'Gestão em Fisioterapia', match_key: 'Fisioterapia', type: 'profession', members: 142, color: 'from-purple-600 to-indigo-600' },
    { id: 'prof-nutri', name: 'Gestão em Nutrição', match_key: 'Nutrição', type: 'profession', members: 98, color: 'from-emerald-500 to-teal-600' },
    { id: 'prof-enfermagem', name: 'Gestão em Enfermagem', match_key: 'Enfermagem', type: 'profession', members: 215, color: 'from-blue-500 to-cyan-600' },
    { id: 'prof-to', name: 'Gestão em Terapia Ocupacional', match_key: 'Terapia Ocupacional', type: 'profession', members: 64, color: 'from-amber-500 to-orange-600' },
    { id: 'prof-fono', name: 'Gestão em Fonoaudiologia', match_key: 'Fonoaudiologia', type: 'profession', members: 77, color: 'from-pink-500 to-rose-600' },

    // --- TURMAS (ANOS DE ENTRADA) ---
    { id: 'turma-1', name: 'Turma 1 (2019)', match_key: '2019', type: 'class', members: 32, color: 'from-slate-600 to-slate-800' },
    { id: 'turma-2', name: 'Turma 2 (2020)', match_key: '2020', type: 'class', members: 35, color: 'from-slate-600 to-slate-800' },
    { id: 'turma-3', name: 'Turma 3 (2021)', match_key: '2021', type: 'class', members: 34, color: 'from-slate-600 to-slate-800' },
    { id: 'turma-4', name: 'Turma 4 (2022)', match_key: '2022', type: 'class', members: 38, color: 'from-slate-600 to-slate-800' },
    { id: 'turma-5', name: 'Turma 5 (2023)', match_key: '2023', type: 'class', members: 40, color: 'from-slate-600 to-slate-800' },
    { id: 'turma-6', name: 'Turma 6 (2024)', match_key: '2024', type: 'class', members: 42, color: 'from-slate-600 to-slate-800' },
    { id: 'turma-7', name: 'Turma 7 (2025)', match_key: '2025', type: 'class', members: 45, color: 'from-slate-600 to-slate-800' },
    { id: 'turma-8', name: 'Turma 8 (2026)', match_key: '2026', type: 'class', members: 48, color: 'from-slate-600 to-slate-800' },
];

export const Communities = () => {
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('profession, entry_year').eq('id', user.id).single();
            setUserProfile(data);
        }
        setLoading(false);
    };

    // LÓGICA DE AUTO-JOIN: Separa as comunidades que o usuário pertence das demais
    const myCommunities = PREDEFINED_COMMUNITIES.filter(c =>
        c.match_key === userProfile?.profession || c.match_key === String(userProfile?.entry_year)
    );

    const otherCommunities = PREDEFINED_COMMUNITIES.filter(c =>
        c.match_key !== userProfile?.profession && c.match_key !== String(userProfile?.entry_year)
    );

    const filterBySearch = (list: any[]) => list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="flex justify-center py-20"><Activity className="animate-spin text-[#D5205D]" /></div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24">

            {/* TELA 1: GRADE DE COMUNIDADES (Estilo Orkut) */}
            {!selectedCommunity ? (
                <div className="animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <Users className="text-[#D5205D]" size={32} /> Comunidades
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">Fóruns de discussão, networking e conhecimento segmentado.</p>
                        </div>
                        <div className="bg-[#142239] border border-white/10 rounded-xl flex items-center px-4 w-full md:w-72 focus-within:border-[#D5205D] transition-colors shadow-inner">
                            <Search className="text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar comunidade..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none w-full p-3 text-white outline-none text-sm placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    {/* SESSÃO: MINHAS COMUNIDADES (Auto-Join) */}
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-bold text-white">Minhas Comunidades</h2>
                            <span className="bg-[#D5205D]/20 text-[#D5205D] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Automático</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filterBySearch(myCommunities).map(community => (
                                <div
                                    key={community.id}
                                    onClick={() => setSelectedCommunity(community)}
                                    className="bg-[#15335E] border border-white/10 hover:border-[#D5205D]/50 rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-1 shadow-lg group relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${community.color}`}></div>
                                    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br ${community.color} shadow-lg`}>
                                        {community.type === 'profession' ? <Activity className="text-white w-6 h-6" /> : <Users className="text-white w-6 h-6" />}
                                    </div>
                                    <h3 className="text-white font-bold text-sm leading-tight group-hover:text-[#D5205D] transition-colors">{community.name}</h3>
                                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Users size={12} /> {community.members} membros</p>
                                </div>
                            ))}
                            {myCommunities.length === 0 && (
                                <p className="text-slate-500 text-sm col-span-full bg-[#142239] p-4 rounded-xl border border-white/5 border-dashed">Complete seu perfil com Profissão e Ano de Entrada para entrar nas comunidades automaticamente.</p>
                            )}
                        </div>
                    </div>

                    {/* SESSÃO: EXPLORAR OUTRAS */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6">Explorar Diretório</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filterBySearch(otherCommunities).map(community => (
                                <div
                                    key={community.id}
                                    onClick={() => setSelectedCommunity(community)}
                                    className="bg-[#142239] border border-white/5 hover:border-white/20 rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-1 group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${community.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                                            {community.type === 'profession' ? <Activity className="text-white w-5 h-5" /> : <Users className="text-white w-5 h-5" />}
                                        </div>
                                    </div>
                                    <h3 className="text-slate-300 font-bold text-xs leading-tight group-hover:text-white transition-colors">{community.name}</h3>
                                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><Users size={10} /> {community.members}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (

                /* TELA 2: DENTRO DA COMUNIDADE (O Fórum) */
                <div className="animate-slideUp">
                    <button
                        onClick={() => setSelectedCommunity(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm mb-6 transition-colors"
                    >
                        <ArrowLeft size={16} /> Voltar para Comunidades
                    </button>

                    <div className="bg-[#15335E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                        {/* Header da Comunidade */}
                        <div className={`p-8 bg-gradient-to-r ${selectedCommunity.color} relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20 shrink-0">
                                    {selectedCommunity.type === 'profession' ? <Activity className="text-white w-10 h-10" /> : <Users className="text-white w-10 h-10" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest border border-white/20">
                                            {selectedCommunity.type === 'profession' ? 'Área de Atuação' : 'Turma'}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-extrabold text-white tracking-tight">{selectedCommunity.name}</h1>
                                    <p className="text-white/80 text-sm mt-2 flex items-center gap-2">
                                        <Users size={16} /> {selectedCommunity.members} membros no fórum
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Corpo do Fórum (Tópicos Mockados) */}
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><MessageSquare size={18} className="text-[#D5205D]" /> Tópicos Recentes</h3>
                                <button className="bg-[#D5205D] hover:bg-pink-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-lg">
                                    + Novo Tópico
                                </button>
                            </div>

                            <div className="space-y-3">
                                {/* Tópico Fixado Exemplo */}
                                <div className="bg-[#142239] border border-[#D5205D]/30 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group">
                                    <div className="w-10 h-10 bg-[#D5205D]/20 text-[#D5205D] rounded-xl flex items-center justify-center shrink-0">
                                        <Pin size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-sm group-hover:text-[#D5205D] transition-colors">Bem-vindos à comunidade de {selectedCommunity.name}!</h4>
                                        <p className="text-xs text-slate-400 mt-1">Por Coordenação ReGISS • Fixado</p>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-white font-bold text-sm">12</p>
                                        <p className="text-[10px] text-slate-500 uppercase">respostas</p>
                                    </div>
                                    <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
                                </div>

                                {/* Tópico Comum Exemplo 1 */}
                                <div className="bg-[#142239] border border-white/5 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group">
                                    <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                                        <Hash size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors">Discussão de Casos Clínicos e Operacionais (Semestre 1)</h4>
                                        <p className="text-xs text-slate-400 mt-1">Por Alumni • Atualizado há 2h</p>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-white font-bold text-sm">45</p>
                                        <p className="text-[10px] text-slate-500 uppercase">respostas</p>
                                    </div>
                                    <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
                                </div>

                                {/* Tópico Comum Exemplo 2 */}
                                <div className="bg-[#142239] border border-white/5 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group">
                                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                                        <Hash size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-sm group-hover:text-emerald-400 transition-colors">Ferramentas de Gestão (Scrum, Kanban) aplicadas no dia a dia</h4>
                                        <p className="text-xs text-slate-400 mt-1">Por Residente R2 • Atualizado ontem</p>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-white font-bold text-sm">8</p>
                                        <p className="text-[10px] text-slate-500 uppercase">respostas</p>
                                    </div>
                                    <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
