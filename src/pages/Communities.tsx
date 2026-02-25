import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, MessageSquare, Search, ArrowLeft, Activity, Pin, Hash, ChevronRight, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// DADOS FIXOS DAS COMUNIDADES (Sem números inventados)
// ==========================================
const PREDEFINED_COMMUNITIES = [
    // --- PROFISSÕES BASE ---
    { id: 'prof-fisio', name: 'Gestão em Fisioterapia', match_key: 'Fisioterapia', type: 'profession', color: 'from-purple-600 to-indigo-600' },
    { id: 'prof-nutri', name: 'Gestão em Nutrição', match_key: 'Nutrição', type: 'profession', color: 'from-emerald-500 to-teal-600' },
    { id: 'prof-enfermagem', name: 'Gestão em Enfermagem', match_key: 'Enfermagem', type: 'profession', color: 'from-blue-500 to-cyan-600' },
    { id: 'prof-to', name: 'Gestão em Terapia Ocupacional', match_key: 'Terapia Ocupacional', type: 'profession', color: 'from-amber-500 to-orange-600' },
    { id: 'prof-fono', name: 'Gestão em Fonoaudiologia', match_key: 'Fonoaudiologia', type: 'profession', color: 'from-pink-500 to-rose-600' },

    // --- TURMAS (ANOS DE ENTRADA) ---
    { id: 'turma-1', name: 'Turma 1 (2019)', match_key: '2019', type: 'class', color: 'from-slate-600 to-slate-800' },
    { id: 'turma-2', name: 'Turma 2 (2020)', match_key: '2020', type: 'class', color: 'from-slate-600 to-slate-800' },
    { id: 'turma-3', name: 'Turma 3 (2021)', match_key: '2021', type: 'class', color: 'from-slate-600 to-slate-800' },
    { id: 'turma-4', name: 'Turma 4 (2022)', match_key: '2022', type: 'class', color: 'from-slate-600 to-slate-800' },
    { id: 'turma-5', name: 'Turma 5 (2023)', match_key: '2023', type: 'class', color: 'from-slate-600 to-slate-800' },
    { id: 'turma-6', name: 'Turma 6 (2024)', match_key: '2024', type: 'class', color: 'from-slate-600 to-slate-800' },
    { id: 'turma-7', name: 'Turma 7 (2025)', match_key: '2025', type: 'class', color: 'from-slate-600 to-slate-800' },
    { id: 'turma-8', name: 'Turma 8 (2026)', match_key: '2026', type: 'class', color: 'from-slate-600 to-slate-800' },
];

export const Communities = () => {
    const [userProfile, setUserProfile] = useState<any>(null);
    const [communitiesWithRealCounts, setCommunitiesWithRealCounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);

    // Gestão Dinâmica dos Fóruns do Banco de Dados
    const [communityPosts, setCommunityPosts] = useState<any[]>([]);
    const [fetchingPosts, setFetchingPosts] = useState(false);

    // Novo Tópico
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Pega o perfil autenticado
        const { data: profile } = await supabase.from('profiles').select('id, profession, entry_year, role').eq('id', user.id).single();
        if (profile) setUserProfile({ ...profile, uid: user.id });

        // 2. Puxa TODOS os perfis ativos (para exibir o volume Real e Vibrante das Tribos)
        const { data: allProfiles } = await supabase.from('profiles').select('profession, entry_year');

        // 3. Cruza os dados nativos para a Matemática de Orkut
        const calculatedCommunities = PREDEFINED_COMMUNITIES.map(community => {
            let realCount = 0;
            if (allProfiles) {
                if (community.type === 'profession') {
                    realCount = allProfiles.filter(p => p.profession === community.match_key).length;
                } else if (community.type === 'class') {
                    realCount = allProfiles.filter(p => String(p.entry_year) === community.match_key).length;
                }
            }
            return { ...community, members: realCount };
        });

        setCommunitiesWithRealCounts(calculatedCommunities);
        setLoading(false);
    };

    // Abre a Comunidade e Busca todos Fóruns
    const handleOpenCommunity = async (community: any) => {
        setSelectedCommunity(community);
        setFetchingPosts(true);
        setIsCreatingPost(false); // Fecha o form se abrir outra comunidade

        // Consulta Protegida limitando em 2 Foruns Máximos por regra de negócio inicial
        const { data: posts, error } = await supabase
            .from('community_posts')
            .select(`*, profiles(full_name, role)`)
            .eq('community_id', community.id)
            .order('created_at', { ascending: false })
            .limit(2);

        if (!error && posts) {
            setCommunityPosts(posts);
        } else {
            console.error("Não encontrou tabela de posts ou deu erro", error);
        }
        setFetchingPosts(false);
    };

    const handleCreateTopic = async () => {
        if (!newPostTitle.trim() || !newPostContent.trim()) {
            return toast.error("Preencha o título e a descrição!");
        }

        if (communityPosts.length >= 2) {
            return toast.error("O limite de 2 fóruns foi atingido por regras de sistema!");
        }

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.from('community_posts').insert({
                community_id: selectedCommunity.id,
                user_id: userProfile.uid,
                title: newPostTitle,
                content: newPostContent
            }).select(`*, profiles(full_name, role)`).single();

            if (error) throw error;

            toast.success("Tópico criado com sucesso no fórum!");
            setIsCreatingPost(false);
            setNewPostTitle('');
            setNewPostContent('');
            setCommunityPosts(prev => [data, ...prev]);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Você precisa aplicar o Script SQL da tabela primeiro no banco de dados.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // Filtros e Roteamentos Visuais
    const myCommunities = communitiesWithRealCounts.filter(c =>
        c.match_key === userProfile?.profession || c.match_key === String(userProfile?.entry_year)
    );

    const otherCommunities = communitiesWithRealCounts.filter(c =>
        c.match_key !== userProfile?.profession && c.match_key !== String(userProfile?.entry_year)
    );

    const filterBySearch = (list: any[]) => list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#D5205D] w-12 h-12" /></div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24">

            {!selectedCommunity ? (
                // --- VIEW 1: VITRINE DE COMUNIDADES ---
                <div className="animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <Users className="text-[#D5205D]" size={32} /> Comunidades
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">Sua nova casa de discussão, networking e conhecimento segmentado.</p>
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

                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-bold text-white">Minhas Comunidades</h2>
                            <span className="bg-[#D5205D]/20 text-[#D5205D] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Automático</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filterBySearch(myCommunities).map(community => (
                                <div
                                    key={community.id}
                                    onClick={() => handleOpenCommunity(community)}
                                    className="bg-[#15335E] border border-white/10 hover:border-[#D5205D]/50 rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-1 shadow-lg group relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${community.color}`}></div>
                                    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br ${community.color} shadow-lg`}>
                                        {community.type === 'profession' ? <Activity className="text-white w-6 h-6" /> : <Users className="text-white w-6 h-6" />}
                                    </div>
                                    <h3 className="text-white font-bold text-sm leading-tight group-hover:text-[#D5205D] transition-colors">{community.name}</h3>

                                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                        <Users size={12} /> {community.members} {community.members === 1 ? 'membro' : 'membros'}
                                    </p>
                                </div>
                            ))}
                            {myCommunities.length === 0 && (
                                <p className="text-slate-500 text-sm col-span-full bg-[#142239] p-4 rounded-xl border border-white/5 border-dashed">Complete seu perfil com Profissão e Ano de Entrada para entrar nas comunidades automaticamente.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white mb-6">Explorar Diretório</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filterBySearch(otherCommunities).map(community => (
                                <div
                                    key={community.id}
                                    onClick={() => handleOpenCommunity(community)}
                                    className="bg-[#142239] border border-white/5 hover:border-white/20 rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-1 group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${community.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                                            {community.type === 'profession' ? <Activity className="text-white w-5 h-5" /> : <Users className="text-white w-5 h-5" />}
                                        </div>
                                    </div>
                                    <h3 className="text-slate-300 font-bold text-xs leading-tight group-hover:text-white transition-colors">{community.name}</h3>

                                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                        <Users size={10} /> {community.members} {community.members === 1 ? 'membro' : 'membros'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (

                // --- VIEW 2: DENTRO DA COMUNIDADE (FÓRUM) ---
                <div className="animate-slideUp">
                    <button
                        onClick={() => setSelectedCommunity(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm mb-6 transition-colors"
                    >
                        <ArrowLeft size={16} /> Voltar para Comunidades
                    </button>

                    <div className="bg-[#15335E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative mb-8">
                        {/* Header Glorioso da Comunidade */}
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
                                        <Users size={16} /> {selectedCommunity.members} {selectedCommunity.members === 1 ? 'membro da rede' : 'membros na rede'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Corpo do Fórum Interativo */}
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <MessageSquare size={18} className="text-[#D5205D]" /> Tópicos
                                </h3>

                                {/* Bloqueador visual de Limite da Regra de Negócio (Max 2 Forúns) */}
                                <button
                                    disabled={communityPosts.length >= 2}
                                    onClick={() => setIsCreatingPost(!isCreatingPost)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${communityPosts.length >= 2
                                            ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                            : 'bg-[#D5205D] hover:bg-pink-600 text-white'
                                        }`}
                                    title={communityPosts.length >= 2 ? "Atingido limite máximo de fóruns iniciados" : "Criar novo tópico"}
                                >
                                    {isCreatingPost ? <X size={14} /> : <Plus size={14} />}
                                    {isCreatingPost ? "Cancelar" : (communityPosts.length >= 2 ? "Limite Atingido" : "Iniciar Discussão")}
                                </button>
                            </div>

                            {/* Caixa de Criação Dinâmica */}
                            {isCreatingPost && (
                                <div className="bg-[#142239] border border-[#D5205D]/30 rounded-2xl p-5 mb-6 animate-fadeIn">
                                    <h4 className="text-white font-bold text-sm mb-4">Qual pauta você quer puxar?</h4>
                                    <input
                                        type="text"
                                        placeholder="Título do Tópico..."
                                        className="w-full bg-[#15335E] border border-white/10 rounded-xl px-4 py-3 mb-3 text-white text-sm outline-none focus:border-[#D5205D] transition-colors"
                                        value={newPostTitle}
                                        onChange={(e) => setNewPostTitle(e.target.value)}
                                        maxLength={80}
                                    />
                                    <textarea
                                        placeholder="Escreva a descrição do fórum..."
                                        className="w-full bg-[#15335E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#D5205D] transition-colors resize-none h-24 mb-3"
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => setIsCreatingPost(false)} className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
                                        <button
                                            onClick={handleCreateTopic}
                                            disabled={isSubmitting}
                                            className="px-5 py-2 text-sm font-bold bg-[#D5205D] text-white rounded-xl shadow-lg hover:bg-pink-600 transition-colors flex items-center"
                                        >
                                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Publicar no Mural"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">

                                {/* O tópico perpétuo de boas vindas imposto pelo Sistema */}
                                <div className="bg-[#142239] border border-[#D5205D]/30 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group">
                                    <div className="w-10 h-10 bg-[#D5205D]/20 text-[#D5205D] rounded-xl flex items-center justify-center shrink-0">
                                        <Pin size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-sm group-hover:text-[#D5205D] transition-colors">
                                            Bem-vindos à comunidade de {selectedCommunity.name}!
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-1">Por Coordenação ReGISS • Fixado</p>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-white font-bold text-sm">--</p>
                                        <p className="text-[10px] text-slate-500 uppercase">oficial</p>
                                    </div>
                                    <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
                                </div>

                                {/* Rendereiza as discussões reais que estão na Cloud do Banco de Dados */}
                                {fetchingPosts ? (
                                    <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 text-slate-500 animate-spin" /></div>
                                ) : (
                                    communityPosts.map((post) => (
                                        <div key={post.id} className="bg-[#142239] border border-white/5 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group">
                                            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                                                <Hash size={18} />
                                            </div>
                                            <div className="flex-1 pr-4">
                                                <h4 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors line-clamp-1">{post.title}</h4>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{post.content}</p>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase">Criado por {post.profiles?.full_name}</p>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <p className="text-white font-bold text-sm">0</p>
                                                <p className="text-[10px] text-slate-500 uppercase">respostas</p>
                                            </div>
                                            <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
                                        </div>
                                    ))
                                )}

                                {communityPosts.length === 0 && !fetchingPosts && (
                                    <p className="text-center text-xs text-slate-500 py-4 italic">Sem outros debates por enquanto. Limite de {2 - communityPosts.length} fóruns livres restantes.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
