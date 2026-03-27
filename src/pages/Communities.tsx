import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Users, MessageSquare, Search, ArrowLeft, Activity, ChevronRight, Plus, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PREDEFINED_COMMUNITIES = [
    // PROFISSÕES
    { id: 'prof-fisio', name: 'Fisioterapia', match_key: 'Fisioterapeuta', type: 'profession', color: 'from-purple-600 to-indigo-600' },
    { id: 'prof-nutri', name: 'Nutrição', match_key: 'Nutricionista', type: 'profession', color: 'from-emerald-500 to-teal-600' },
    { id: 'prof-enfermagem', name: 'Enfermagem', match_key: 'Enfermeiro(a)', type: 'profession', color: 'from-blue-500 to-cyan-600' },
    { id: 'prof-to', name: 'Terapia Ocupacional', match_key: 'Terapeuta Ocupacional', type: 'profession', color: 'from-amber-500 to-orange-600' },
    { id: 'prof-fono', name: 'Fonoaudiologia', match_key: 'Fonoaudiólogo(a)', type: 'profession', color: 'from-pink-500 to-rose-600' },

    // TURMAS
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
    const [communitiesWithRealCounts, setCommunitiesWithRealCounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);

    const [communityPosts, setCommunityPosts] = useState<any[]>([]);
    const [fetchingPosts, setFetchingPosts] = useState(false);

    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');

    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const { userProfile, fetchUserProfile, allProfiles, fetchAllProfiles } = useStore();

    useEffect(() => {
        const initData = async () => {
            await fetchUserProfile();
            await fetchAllProfiles();
            setLoading(false);
        };
        initData();
    }, [fetchUserProfile, fetchAllProfiles]);

    useEffect(() => {
        if (!selectedCommunity) return;
        const channel = supabase.channel(`community_${selectedCommunity.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts', filter: `community_id=eq.${selectedCommunity.id}` }, async (payload) => {
                const { data } = await supabase.from('community_posts').select('*, profiles(full_name, role)').eq('id', payload.new.id).single();
                if (data) setCommunityPosts(prev => [data, ...prev]);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_posts', filter: `community_id=eq.${selectedCommunity.id}` }, (payload) => {
                setCommunityPosts(prev => prev.filter(p => p.id !== payload.old.id));
                if (selectedPost?.id === payload.old.id) setSelectedPost(null);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedCommunity, selectedPost]);

    useEffect(() => {
        if (!selectedPost || selectedPost.isOfficial) return;
        const channel = supabase.channel(`post_${selectedPost.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_comments', filter: `post_id=eq.${selectedPost.id}` }, async (payload) => {
                const { data } = await supabase.from('community_comments').select('*, profiles(full_name, role)').eq('id', payload.new.id).single();
                if (data) setComments(prev => [...prev, data]);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_comments', filter: `post_id=eq.${selectedPost.id}` }, (payload) => {
                setComments(prev => prev.filter(c => c.id !== payload.old.id));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedPost]);

    useEffect(() => {
        if (!loading && allProfiles.length > 0) {
            const calculated = PREDEFINED_COMMUNITIES.map(community => {
                let realCount = 0;
                if (community.type === 'profession') {
                    // Conta quantos perfis tem essa exata profissão
                    realCount = allProfiles.filter((p: any) => p.profession === community.match_key).length;
                } else if (community.type === 'class') {
                    // Conta quantos perfis entraram nesse exato ano
                    realCount = allProfiles.filter((p: any) => String(p.entry_year) === community.match_key).length;
                }
                return { ...community, members: realCount };
            });
            setCommunitiesWithRealCounts(calculated);
        }
    }, [loading, allProfiles]);

    useEffect(() => {
        if (selectedPost && !selectedPost.isOfficial) {
            fetchComments();
        } else {
            setComments([]);
        }
    }, [selectedPost]);

    const fetchComments = async () => {
        if (!selectedPost || selectedPost.isOfficial) return;
        setLoadingComments(true);
        const { data } = await supabase.from('community_comments').select('*, profiles(full_name, role)').eq('post_id', selectedPost.id).order('created_at', { ascending: true });
        setComments(data || []);
        setLoadingComments(false);
    };

    const handleOpenCommunity = async (community: any) => {
        setSelectedCommunity(community);
        setSelectedPost(null);
        setFetchingPosts(true);
        const { data: posts } = await supabase.from('community_posts').select('*, profiles(full_name, role)').eq('community_id', community.id).order('created_at', { ascending: false }).limit(20);
        setCommunityPosts(posts || []);
        setFetchingPosts(false);
    };

    const handleCreateTopic = async () => {
        if (!newPostTitle.trim() || !newPostContent.trim()) return toast.error("Preencha título e descrição!");
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.from('community_posts').insert({
                community_id: selectedCommunity.id,
                user_id: userProfile.uid,
                title: newPostTitle,
                content: newPostContent
            }).select('*, profiles(full_name, role)').single();

            if (error) throw error;

            toast.success("Tópico criado!");
            setIsCreatingPost(false);
            setNewPostTitle('');
            setNewPostContent('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateComment = async () => {
        if (!newComment.trim() || !selectedPost || selectedPost.isOfficial) return;
        setIsSubmittingComment(true);
        try {
            const { error } = await supabase.from('community_comments').insert({
                post_id: selectedPost.id,
                user_id: userProfile.uid,
                content: newComment
            });
            if (error) throw error;
            setNewComment('');
            toast.success('Comentário enviado!');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteTopic = async (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        if (!confirm('Apagar tópico?')) return;
        await supabase.from('community_posts').delete().eq('id', postId);
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Apagar comentário?')) return;
        await supabase.from('community_comments').delete().eq('id', commentId);
    };

    // A MÁGICA ACONTECE AQUI: A pessoa pertence à comunidade se a profissão OU o ano baterem
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
                <div className="animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <Users className="text-[#D5205D]" size={32} /> Comunidades
                            </h1>
                            <p className="text-slate-400">Conecte-se com colegas da sua profissão e da sua turma.</p>
                        </div>
                        <div className="bg-[#142239] border border-white/10 rounded-2xl flex items-center px-4 w-full md:w-80 focus-within:border-[#D5205D] transition-colors">
                            <Search size={18} className="text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar comunidade..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none w-full p-4 text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* MINHAS COMUNIDADES (Profissão + Turma) */}
                    <div className="mb-12">
                        <h2 className="text-xl font-bold text-white mb-4">Minhas Comunidades</h2>
                        {myCommunities.length === 0 ? (
                            <p className="text-slate-400 italic text-sm">Você ainda não preencheu sua Profissão ou Ano de Entrada no perfil.</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filterBySearch(myCommunities).map(community => (
                                    <div
                                        key={community.id}
                                        onClick={() => handleOpenCommunity(community)}
                                        className="bg-[#15335E] border border-white/10 hover:border-[#D5205D] rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1 shadow-lg"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${community.color} flex items-center justify-center mb-4 shadow-inner`}>
                                            {community.type === 'profession' ? <Activity size={28} className="text-white" /> : <Users size={28} className="text-white" />}
                                        </div>
                                        <h3 className="font-bold text-white text-lg leading-tight mb-1">{community.name}</h3>
                                        <p className="text-slate-400 text-xs font-medium">{community.members} Membros Reais</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* EXPLORAR OUTRAS */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">Explorar outras áreas</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filterBySearch(otherCommunities).map(community => (
                                <div
                                    key={community.id}
                                    onClick={() => handleOpenCommunity(community)}
                                    className="bg-[#142239] border border-white/5 hover:border-white/20 rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1"
                                >
                                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${community.color} flex items-center justify-center mb-3 opacity-60`}>
                                        {community.type === 'profession' ? <Activity size={20} className="text-white" /> : <Users size={20} className="text-white" />}
                                    </div>
                                    <h3 className="font-bold text-slate-300 text-sm">{community.name}</h3>
                                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{community.members} Membros</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : !selectedPost ? (
                /* DENTRO DA COMUNIDADE */
                <div className="animate-fadeIn">
                    <button onClick={() => setSelectedCommunity(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={18} /> Voltar para Comunidades
                    </button>

                    <div className={`bg-gradient-to-r ${selectedCommunity.color} rounded-3xl p-8 text-white shadow-xl`}>
                        <h1 className="text-4xl font-bold mb-2">{selectedCommunity.name}</h1>
                        <p className="text-white/80 font-medium flex items-center gap-2"><Users size={16} /> {selectedCommunity.members} Profissionais ReGISS</p>
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl flex items-center gap-2 text-white">
                                <MessageSquare size={24} className="text-[#D5205D]" /> Mural de Tópicos
                            </h3>
                            <button onClick={() => setIsCreatingPost(!isCreatingPost)} className="bg-[#D5205D] hover:bg-pink-600 text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-colors shadow-lg active:scale-95">
                                {isCreatingPost ? <X size={18} /> : <Plus size={18} />} Novo Tópico
                            </button>
                        </div>

                        {isCreatingPost && (
                            <div className="bg-[#15335E] border border-white/10 p-6 rounded-3xl mb-8 shadow-2xl animate-in slide-in-from-top-4">
                                <input
                                    type="text"
                                    placeholder="Qual o assunto? (Ex: Dúvida sobre carga horária)"
                                    value={newPostTitle}
                                    onChange={e => setNewPostTitle(e.target.value)}
                                    className="w-full bg-[#142239] border border-white/5 rounded-2xl p-4 mb-4 text-white outline-none focus:border-[#D5205D] transition-colors"
                                />
                                <textarea
                                    placeholder="Escreva os detalhes aqui..."
                                    value={newPostContent}
                                    onChange={e => setNewPostContent(e.target.value)}
                                    className="w-full bg-[#142239] border border-white/5 rounded-2xl p-4 h-32 text-white outline-none focus:border-[#D5205D] transition-colors resize-none"
                                />
                                <button onClick={handleCreateTopic} disabled={isSubmitting} className="mt-4 w-full bg-[#D5205D] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-pink-600 transition-colors shadow-lg">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Publicar Tópico'}
                                </button>
                            </div>
                        )}

                        {fetchingPosts ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#D5205D]" size={32} /></div>
                        ) : communityPosts.length === 0 ? (
                            <div className="text-center py-16 bg-[#142239] border border-white/5 border-dashed rounded-3xl">
                                <MessageSquare size={48} className="mx-auto text-slate-600 mb-4 opacity-50" />
                                <p className="text-slate-400 font-medium">Nenhum tópico criado ainda. Seja o primeiro a puxar assunto!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {communityPosts.map(post => (
                                    <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-[#142239] border border-white/5 p-6 rounded-3xl cursor-pointer hover:border-[#D5205D]/50 hover:bg-[#15335E] transition-all flex justify-between items-center group shadow-md">
                                        <div className="flex-1 pr-4">
                                            <h4 className="font-bold text-white text-lg group-hover:text-[#D5205D] transition-colors line-clamp-1">{post.title}</h4>
                                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1"><img src={`https://api.dicebear.com/7.x/initials/svg?seed=${post.profiles?.full_name}&backgroundColor=142239`} className="w-4 h-4 rounded-full" alt="avatar" /> Por {post.profiles?.full_name}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {post.user_id === userProfile?.uid && (
                                                <button onClick={(e) => handleDeleteTopic(e, post.id)} className="p-2 text-slate-500 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                            )}
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#D5205D] transition-colors"><ChevronRight className="text-slate-400 group-hover:text-white" size={20} /></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* DENTRO DO TÓPICO (LENDO E COMENTANDO) */
                <div className="animate-fadeIn max-w-4xl mx-auto">
                    <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={18} /> Voltar aos tópicos
                    </button>

                    <div className="bg-[#15335E] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D5205D]"></div>
                        <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{selectedPost.title}</h2>
                        <p className="text-xs text-slate-400 mb-8 uppercase font-bold tracking-wider">Publicado por {selectedPost.profiles?.full_name}</p>
                        <div className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">{selectedPost.content}</div>
                    </div>

                    <div className="mt-12">
                        <h3 className="font-bold text-xl mb-6 text-white flex items-center gap-2"><MessageSquare size={20} className="text-[#D5205D]" /> Discussão ({comments.length})</h3>

                        <div className="space-y-4 mb-8">
                            {loadingComments ? <div className="flex justify-center"><Loader2 className="animate-spin text-[#D5205D]" /></div> :
                                comments.length === 0 ? <p className="text-slate-500 italic text-sm">Ninguém respondeu ainda.</p> :
                                    comments.map(c => (
                                        <div key={c.id} className="bg-[#142239] border border-white/5 p-6 rounded-3xl relative group">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-bold text-white text-sm flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#15335E] border border-white/10 flex items-center justify-center text-[10px] text-white">{c.profiles?.full_name[0]}</div>
                                                    {c.profiles?.full_name}
                                                </p>
                                                {c.user_id === userProfile?.uid && (
                                                    <button onClick={() => handleDeleteComment(c.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                            <p className="text-slate-300 ml-8 text-[15px]">{c.content}</p>
                                        </div>
                                    ))}
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 bg-[#15335E] p-4 rounded-3xl border border-white/10 focus-within:border-[#D5205D] transition-colors shadow-lg">
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateComment()}
                                placeholder="Escreva sua resposta..."
                                className="flex-1 bg-transparent px-2 py-2 text-white outline-none"
                            />
                            <button onClick={handleCreateComment} disabled={isSubmittingComment || !newComment.trim()} className="bg-[#D5205D] hover:bg-pink-600 disabled:opacity-50 px-8 py-3 rounded-2xl text-white font-bold transition-all shadow-md active:scale-95 flex items-center gap-2">
                                {isSubmittingComment ? <Loader2 className="animate-spin" size={18} /> : 'Responder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};