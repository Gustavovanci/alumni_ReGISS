import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, MessageSquare, Search, ArrowLeft, Activity, Pin, Hash, ChevronRight, Plus, X, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// DADOS FIXOS DAS COMUNIDADES (Sem números inventados)
// ==========================================
const PREDEFINED_COMMUNITIES = [
    // --- PROFISSÕES BASE ---
    { id: 'prof-fisio', name: 'Fisioterapia', match_key: 'Fisioterapia', type: 'profession', color: 'from-purple-600 to-indigo-600' },
    { id: 'prof-nutri', name: 'Nutrição', match_key: 'Nutrição', type: 'profession', color: 'from-emerald-500 to-teal-600' },
    { id: 'prof-enfermagem', name: 'Enfermagem', match_key: 'Enfermagem', type: 'profession', color: 'from-blue-500 to-cyan-600' },
    { id: 'prof-to', name: 'Terapia Ocupacional', match_key: 'Terapia Ocupacional', type: 'profession', color: 'from-amber-500 to-orange-600' },
    { id: 'prof-fono', name: 'Fonoaudiologia', match_key: 'Fonoaudiologia', type: 'profession', color: 'from-pink-500 to-rose-600' },

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
    const [selectedPost, setSelectedPost] = useState<any | null>(null);

    // Gestão Dinâmica dos Fóruns do Banco de Dados
    const [communityPosts, setCommunityPosts] = useState<any[]>([]);
    const [fetchingPosts, setFetchingPosts] = useState(false);

    // Novo Tópico
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');

    // Comentários do Tópico
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedPost && !selectedPost.isOfficial) {
            fetchComments();
        } else {
            setComments([]);
        }
    }, [selectedPost]);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Pega o perfil autenticado
        const { data: profile } = await supabase.from('profiles').select('id, profession, entry_year, role').eq('id', user.id).single();
        if (profile) setUserProfile({ ...profile, uid: user.id });

        // 2. Puxa TODOS os perfis ativos (para exibir o volume Real)
        const { data: allProfiles } = await supabase.from('profiles').select('profession, entry_year');

        // 3. Cruza os dados
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

    const fetchComments = async () => {
        if (!selectedPost || selectedPost.isOfficial) return;
        setLoadingComments(true);
        const { data, error } = await supabase
            .from('community_comments')
            .select('*, profiles(full_name, role)')
            .eq('post_id', selectedPost.id)
            .order('created_at', { ascending: true });

        if (data) setComments(data);
        if (error) console.error("Erro ao carregar comentários, talvez a tabela não exista:");
        setLoadingComments(false);
    };

    // Abre a Comunidade e Busca todos Fóruns
    const handleOpenCommunity = async (community: any) => {
        setSelectedCommunity(community);
        setSelectedPost(null);
        setFetchingPosts(true);
        setIsCreatingPost(false); // Fecha o form se abrir outra comunidade

        // Consulta Protegida
        const { data: posts, error } = await supabase
            .from('community_posts')
            .select(`*, profiles(full_name, role)`)
            .eq('community_id', community.id)
            .order('created_at', { ascending: false })
            .limit(10); // Aumentado limite para 10 para melhor exploração

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

    const handleCreateComment = async () => {
        if (!newComment.trim() || !selectedPost || selectedPost.isOfficial) return;

        setIsSubmittingComment(true);
        try {
            const { data, error } = await supabase.from('community_comments').insert({
                post_id: selectedPost.id,
                user_id: userProfile.uid,
                content: newComment
            }).select('*, profiles(full_name, role)').single();

            if (error) throw error;

            setComments(prev => [...prev, data]);
            setNewComment('');
            toast.success('Resposta enviada!');
        } catch (error: any) {
            console.error(error);
            toast.error("Erro! O banco precisa da tabela 'community_comments'.");
        } finally {
            setIsSubmittingComment(false);
        }
    };


    // Filtros
    const myCommunities = communitiesWithRealCounts.filter(c =>
        c.match_key === userProfile?.profession || c.match_key === String(userProfile?.entry_year)
    );

    const otherCommunities = communitiesWithRealCounts.filter(c =>
        c.match_key !== userProfile?.profession && c.match_key !== String(userProfile?.entry_year)
    );

    const filterBySearch = (list: any[]) => list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#D5205D] w-12 h-12" /></div>;

    return (
        <div className="max-w-7xl mx-auto p-3 md:p-8 pb-24">

            {!selectedCommunity ? (
                // --- VIEW 1: VITRINE DE COMUNIDADES ---
                <div className="animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8 border-b border-white/5 pb-4 md:pb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                                <Users className="text-[#D5205D]" size={28} /> Comunidades
                            </h1>
                            <p className="text-slate-400 text-xs md:text-sm mt-1">Sua nova casa de discussão, networking e conhecimento segmentado.</p>
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

                    <div className="mb-10 md:mb-12">
                        <div className="flex items-center gap-2 mb-4 md:mb-6">
                            <h2 className="text-lg md:text-xl font-bold text-white">Minhas Comunidades</h2>
                            <span className="bg-[#D5205D]/20 text-[#D5205D] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Automático</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                            {filterBySearch(myCommunities).map(community => (
                                <div
                                    key={community.id}
                                    onClick={() => handleOpenCommunity(community)}
                                    className="bg-[#15335E] border border-white/10 hover:border-[#D5205D]/50 rounded-2xl p-3 md:p-4 cursor-pointer transition-all hover:-translate-y-1 shadow-lg group relative overflow-hidden flex flex-col h-full"
                                >
                                    <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${community.color}`}></div>
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl mb-3 md:mb-4 flex items-center justify-center bg-gradient-to-br ${community.color} shadow-lg shrink-0`}>
                                        {community.type === 'profession' ? <Activity className="text-white w-5 h-5 md:w-6 md:h-6" /> : <Users className="text-white w-5 h-5 md:w-6 md:h-6" />}
                                    </div>
                                    <h3 className="text-white font-bold text-sm md:text-base leading-tight group-hover:text-[#D5205D] transition-colors flex-1">{community.name}</h3>

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
                        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Explorar Diretório</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                            {filterBySearch(otherCommunities).map(community => (
                                <div
                                    key={community.id}
                                    onClick={() => handleOpenCommunity(community)}
                                    className="bg-[#142239] border border-white/5 hover:border-white/20 rounded-2xl p-3 md:p-4 cursor-pointer transition-all hover:-translate-y-1 group flex flex-col h-full"
                                >
                                    <div className="flex items-center gap-3 mb-2 md:mb-3">
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${community.color} opacity-70 group-hover:opacity-100 transition-opacity shrink-0`}>
                                            {community.type === 'profession' ? <Activity className="text-white w-4 h-4 md:w-5 md:h-5" /> : <Users className="text-white w-4 h-4 md:w-5 md:h-5" />}
                                        </div>
                                    </div>
                                    <h3 className="text-slate-300 font-bold text-xs md:text-sm leading-tight group-hover:text-white transition-colors flex-1">{community.name}</h3>

                                    <p className="text-[10px] md:text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Users size={10} /> {community.members} {community.members === 1 ? 'membro' : 'membros'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (

                // --- VIEW 2: DENTRO DA COMUNIDADE (LISTA DE TÓPICOS) ---
                !selectedPost ? (
                    <div className="animate-slideUp">
                        <button
                            onClick={() => setSelectedCommunity(null)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm mb-4 md:mb-6 transition-colors"
                        >
                            <ArrowLeft size={16} /> <span className="hidden sm:inline">Voltar para Comunidades</span><span className="sm:hidden">Voltar</span>
                        </button>

                        <div className="bg-[#15335E] border border-white/10 rounded-2xl md:min-rounded-3xl overflow-hidden shadow-2xl relative mb-6 md:mb-8">
                            {/* Header da Comunidade */}
                            <div className={`p-5 md:p-8 bg-gradient-to-r ${selectedCommunity.color} relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10 flex flex-row gap-4 md:gap-6 items-center">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20 shrink-0">
                                        {selectedCommunity.type === 'profession' ? <Activity className="text-white w-8 h-8 md:w-10 md:h-10" /> : <Users className="text-white w-8 h-8 md:w-10 md:h-10" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-white/20 backdrop-blur-sm text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest border border-white/20">
                                                {selectedCommunity.type === 'profession' ? 'Área de Atuação' : 'Turma'}
                                            </span>
                                        </div>
                                        <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight">{selectedCommunity.name}</h1>
                                        <p className="text-white/80 text-xs md:text-sm mt-1 flex items-center gap-2">
                                            <Users size={14} /> {selectedCommunity.members} {selectedCommunity.members === 1 ? 'membro' : 'membros'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Corpo do Fórum Interativo */}
                            <div className="p-4 md:p-6">
                                <div className="flex justify-between items-center mb-5 md:mb-6">
                                    <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                        <MessageSquare size={16} className="text-[#D5205D]" /> Tópicos
                                    </h3>

                                    <button
                                        onClick={() => setIsCreatingPost(!isCreatingPost)}
                                        className={`px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg flex items-center gap-2 bg-[#D5205D] hover:bg-pink-600 text-white min-w-max`}
                                    >
                                        {isCreatingPost ? <X size={14} /> : <Plus size={14} />}
                                        <span className="hidden sm:inline">
                                            {isCreatingPost ? "Cancelar" : "Iniciar Discussão"}
                                        </span>
                                        <span className="sm:hidden">
                                            {isCreatingPost ? "Cancelar" : "Novo"}
                                        </span>
                                    </button>
                                </div>

                                {/* Caixa de Criação Dinâmica */}
                                {isCreatingPost && (
                                    <div className="bg-[#142239] border border-[#D5205D]/30 rounded-2xl p-4 md:p-5 mb-6 animate-fadeIn">
                                        <h4 className="text-white font-bold text-sm mb-3">Qual pauta você quer puxar?</h4>
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
                                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                                            <button onClick={() => setIsCreatingPost(false)} className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors w-full sm:w-auto">Cancelar</button>
                                            <button
                                                onClick={handleCreateTopic}
                                                disabled={isSubmitting}
                                                className="px-5 py-2 text-sm font-bold bg-[#D5205D] text-white rounded-xl shadow-lg hover:bg-pink-600 transition-colors flex items-center justify-center w-full sm:w-auto"
                                            >
                                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Publicar no Mural"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {/* Tópico Fixo */}
                                    <div
                                        onClick={() => setSelectedPost({
                                            isOfficial: true,
                                            title: `Bem-vindos à comunidade de ${selectedCommunity.name}!`,
                                            content: "Este é o espaço oficial para troca de conhecimentos da sua comunidade. Sinta-se livre para criar novos tópicos e interagir com outros membros! \n\nAqui não existe comentário certo ou errado, mas prezamos o respeito ao próximo.",
                                            profiles: { full_name: "Coordenação ReGISS", role: "admin" }
                                        })}
                                        className="bg-[#142239] border border-[#D5205D]/30 p-3 md:p-4 rounded-2xl flex items-center gap-3 md:gap-4 cursor-pointer hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="w-10 h-10 bg-[#D5205D]/20 text-[#D5205D] rounded-xl flex items-center justify-center shrink-0">
                                            <Pin size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-bold text-sm group-hover:text-[#D5205D] transition-colors truncate">
                                                Bem-vindos à comunidade!
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1 truncate">Por Coordenação ReGISS • Fixado</p>
                                        </div>
                                        <div className="text-right hidden sm:block shrink-0">
                                            <p className="text-white font-bold text-sm">--</p>
                                            <p className="text-[10px] text-slate-500 uppercase">oficial</p>
                                        </div>
                                        <ChevronRight className="text-slate-600 group-hover:text-white transition-colors shrink-0" />
                                    </div>

                                    {/* Discussões Reais */}
                                    {fetchingPosts ? (
                                        <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 text-slate-500 animate-spin" /></div>
                                    ) : (
                                        communityPosts.map((post) => (
                                            <div
                                                key={post.id}
                                                onClick={() => setSelectedPost(post)}
                                                className="bg-[#142239] border border-white/5 p-3 md:p-4 rounded-2xl flex items-start sm:items-center gap-3 md:gap-4 cursor-pointer hover:bg-white/5 transition-colors group flex-col sm:flex-row"
                                            >
                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                                                        <Hash size={18} />
                                                    </div>
                                                    <div className="flex-1 sm:hidden">
                                                        <h4 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors line-clamp-1">{post.title}</h4>
                                                        <p className="text-[10px] text-slate-500 uppercase mt-1">Por {post.profiles?.full_name}</p>
                                                    </div>
                                                    <ChevronRight className="text-slate-600 group-hover:text-white transition-colors shrink-0 sm:hidden" />
                                                </div>

                                                <div className="flex-1 min-w-0 hidden sm:block">
                                                    <h4 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors truncate">{post.title}</h4>
                                                    <p className="text-xs text-slate-400 mt-1 truncate">{post.content}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1 uppercase">Criado por {post.profiles?.full_name}</p>
                                                </div>

                                                <ChevronRight className="text-slate-600 group-hover:text-white transition-colors shrink-0 hidden sm:block" />
                                            </div>
                                        ))
                                    )}

                                    {communityPosts.length === 0 && !fetchingPosts && (
                                        <p className="text-center text-xs text-slate-500 py-6 italic border border-white/5 border-dashed rounded-xl mt-4">Nenhum tópico criado ainda. Sinta-se à vontade para iniciar a primeira discussão!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (

                    // --- VIEW 3: LENDO O TÓPICO / DISCUSSÃO ---
                    <div className="animate-slideUp">
                        <button
                            onClick={() => setSelectedPost(null)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm mb-4 md:mb-6 transition-colors"
                        >
                            <ArrowLeft size={16} /> Voltar
                        </button>

                        <div className="bg-[#15335E] border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative mb-6 md:mb-8">
                            {/* Conteúdo Original do Post */}
                            <div className="p-5 md:p-8 bg-[#142239] border-b border-white/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedPost.isOfficial ? 'bg-[#D5205D]/20 text-[#D5205D]' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {selectedPost.isOfficial ? <Pin size={16} /> : <Hash size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-400 truncate">{selectedPost.isOfficial ? 'Post Oficial' : `Por ${selectedPost.profiles?.full_name}`}</p>
                                    </div>
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-white leading-tight mb-4">{selectedPost.title}</h2>
                                <div className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                                    {selectedPost.content}
                                </div>
                            </div>

                            {/* Área de Comentários Funcional */}
                            <div className="p-4 md:p-8 flex flex-col gap-4">
                                <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-2 uppercase tracking-wider">
                                    <MessageSquare size={14} /> Respostas {!selectedPost.isOfficial && `(${comments.length})`}
                                </h3>

                                {selectedPost.isOfficial ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center border border-white/5 border-dashed rounded-2xl bg-[#142239]/30">
                                        <div className="w-10 h-10 bg-[#15335E] rounded-full flex items-center justify-center mb-3 border border-white/10">
                                            <Pin className="text-slate-600 w-4 h-4" />
                                        </div>
                                        <p className="text-slate-500 text-xs px-4">Este é um tópico fixo do sistema. Interações são feitas nos tópicos da comunidade.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            {loadingComments ? (
                                                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-slate-500 w-6 h-6" /></div>
                                            ) : comments.length > 0 ? (
                                                comments.map(c => (
                                                    <div key={c.id} className="bg-[#142239] p-4 rounded-2xl border border-white/5 animate-fadeIn">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">
                                                                {c.profiles?.full_name?.charAt(0) || <Users size={12} />}
                                                            </div>
                                                            <p className="text-xs text-slate-400 font-bold">{c.profiles?.full_name}</p>
                                                        </div>
                                                        <p className="text-sm text-slate-200 ml-8 whitespace-pre-wrap">{c.content}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 text-center border border-white/5 border-dashed rounded-2xl bg-[#142239]/30">
                                                    <div className="w-10 h-10 bg-[#15335E] rounded-full flex items-center justify-center mb-3 border border-white/10">
                                                        <MessageSquare className="text-slate-600 w-4 h-4" />
                                                    </div>
                                                    <h4 className="text-slate-300 font-bold text-sm mb-1">Seja o primeiro a responder</h4>
                                                    <p className="text-slate-500 text-xs">Ajudar e interagir fortalece a comunidade.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Input de Novo Comentário */}
                                        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 bg-[#142239] p-2 md:p-3 rounded-2xl border border-white/5">
                                            <input
                                                type="text"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Escreva uma resposta..."
                                                className="flex-1 bg-transparent border-none px-3 py-2 text-white text-sm outline-none placeholder:text-slate-500"
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreateComment()}
                                            />
                                            <button
                                                onClick={handleCreateComment}
                                                disabled={isSubmittingComment || !newComment.trim()}
                                                className="bg-[#D5205D] text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
                                            >
                                                {isSubmittingComment ? <Loader2 size={16} className="animate-spin" /> : (
                                                    <><Send size={14} /> Responder</>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};
