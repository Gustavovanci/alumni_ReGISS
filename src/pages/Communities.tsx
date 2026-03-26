import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Users, MessageSquare, Search, ArrowLeft, Activity, Pin, Hash, ChevronRight, Plus, X, Loader2, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PREDEFINED_COMMUNITIES = [
    { id: 'prof-fisio', name: 'Fisioterapia', match_key: 'Fisioterapia', type: 'profession', color: 'from-purple-600 to-indigo-600' },
    { id: 'prof-nutri', name: 'Nutrição', match_key: 'Nutrição', type: 'profession', color: 'from-emerald-500 to-teal-600' },
    { id: 'prof-enfermagem', name: 'Enfermagem', match_key: 'Enfermagem', type: 'profession', color: 'from-blue-500 to-cyan-600' },
    { id: 'prof-to', name: 'Terapia Ocupacional', match_key: 'Terapia Ocupacional', type: 'profession', color: 'from-amber-500 to-orange-600' },
    { id: 'prof-fono', name: 'Fonoaudiologia', match_key: 'Fonoaudiologia', type: 'profession', color: 'from-pink-500 to-rose-600' },

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

    // Realtime para tópicos
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

        return () => supabase.removeChannel(channel);
    }, [selectedCommunity]);

    // Realtime para comentários
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

        return () => supabase.removeChannel(channel);
    }, [selectedPost]);

    useEffect(() => {
        if (!loading && allProfiles.length > 0) {
            const calculated = PREDEFINED_COMMUNITIES.map(community => {
                let realCount = 0;
                if (community.type === 'profession') {
                    realCount = allProfiles.filter((p: any) => p.profession === community.match_key).length;
                } else if (community.type === 'class') {
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
        const { data } = await supabase
            .from('community_comments')
            .select('*, profiles(full_name, role)')
            .eq('post_id', selectedPost.id)
            .order('created_at', { ascending: true });
        setComments(data || []);
        setLoadingComments(false);
    };

    const handleOpenCommunity = async (community: any) => {
        setSelectedCommunity(community);
        setSelectedPost(null);
        setFetchingPosts(true);

        const { data: posts } = await supabase
            .from('community_posts')
            .select('*, profiles(full_name, role)')
            .eq('community_id', community.id)
            .order('created_at', { ascending: false })
            .limit(10);

        setCommunityPosts(posts || []);
        setFetchingPosts(false);
    };

    const handleCreateTopic = async () => {
        if (!newPostTitle.trim() || !newPostContent.trim()) {
            return toast.error("Preencha título e descrição!");
        }

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
            setCommunityPosts(prev => [data, ...prev]);
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
            const { data, error } = await supabase.from('community_comments').insert({
                post_id: selectedPost.id,
                user_id: userProfile.uid,
                content: newComment
            }).select('*, profiles(full_name, role)').single();

            if (error) throw error;

            setComments(prev => [...prev, data]);
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
        setCommunityPosts(prev => prev.filter(p => p.id !== postId));
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Apagar comentário?')) return;
        await supabase.from('community_comments').delete().eq('id', commentId);
        setComments(prev => prev.filter(c => c.id !== commentId));
    };

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
                            <p className="text-slate-400">Conecte-se com colegas da sua profissão e turma.</p>
                        </div>
                        <div className="bg-[#142239] border border-white/10 rounded-2xl flex items-center px-4 w-full md:w-80 focus-within:border-[#D5205D]">
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

                    {/* Minhas Comunidades */}
                    <div className="mb-12">
                        <h2 className="text-xl font-bold text-white mb-4">Minhas Comunidades</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filterBySearch(myCommunities).map(community => (
                                <div
                                    key={community.id}
                                    onClick={() => handleOpenCommunity(community)}
                                    className="bg-[#15335E] border border-white/10 hover:border-[#D5205D] rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1"
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${community.color} flex items-center justify-center mb-4`}>
                                        {community.type === 'profession' ? <Activity size={28} className="text-white" /> : <Users size={28} className="text-white" />}
                                    </div>
                                    <h3 className="font-bold text-white text-lg">{community.name}</h3>
                                    <p className="text-slate-400 text-sm mt-1">{community.members} membros</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Explorar */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">Explorar Comunidades</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filterBySearch(otherCommunities).map(community => (
                                <div
                                    key={community.id}
                                    onClick={() => handleOpenCommunity(community)}
                                    className="bg-[#142239] border border-white/10 hover:border-white/30 rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1"
                                >
                                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${community.color} flex items-center justify-center mb-4 opacity-80`}>
                                        {community.type === 'profession' ? <Activity size={24} className="text-white" /> : <Users size={24} className="text-white" />}
                                    </div>
                                    <h3 className="font-bold text-slate-300">{community.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1">{community.members} membros</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : !selectedPost ? (
                /* Dentro da Comunidade */
                <div className="animate-fadeIn">
                    <button onClick={() => setSelectedCommunity(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                        <ArrowLeft size={18} /> Voltar
                    </button>

                    <div className={`bg-gradient-to-r ${selectedCommunity.color} rounded-3xl p-8 text-white`}>
                        <h1 className="text-4xl font-bold">{selectedCommunity.name}</h1>
                        <p className="text-white/80">{selectedCommunity.members} membros</p>
                    </div>

                    {/* Tópicos */}
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <MessageSquare size={20} /> Tópicos
                            </h3>
                            <button onClick={() => setIsCreatingPost(!isCreatingPost)} className="bg-[#D5205D] text-white px-5 py-2 rounded-2xl font-bold flex items-center gap-2">
                                {isCreatingPost ? <X size={18} /> : <Plus size={18} />} Novo Tópico
                            </button>
                        </div>

                        {isCreatingPost && (
                            <div className="bg-[#142239] p-6 rounded-3xl mb-6">
                                <input
                                    type="text"
                                    placeholder="Título do tópico"
                                    value={newPostTitle}
                                    onChange={e => setNewPostTitle(e.target.value)}
                                    className="w-full bg-[#15335E] border border-white/10 rounded-2xl p-4 mb-4 text-white outline-none"
                                />
                                <textarea
                                    placeholder="Descrição..."
                                    value={newPostContent}
                                    onChange={e => setNewPostContent(e.target.value)}
                                    className="w-full bg-[#15335E] border border-white/10 rounded-2xl p-4 h-32 text-white outline-none"
                                />
                                <button onClick={handleCreateTopic} className="mt-4 w-full bg-[#D5205D] py-3 rounded-2xl font-bold">Publicar Tópico</button>
                            </div>
                        )}

                        {/* Lista de tópicos */}
                        {communityPosts.map(post => (
                            <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-[#142239] border border-white/5 p-5 rounded-3xl mb-4 cursor-pointer hover:border-[#D5205D]/30 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold">{post.title}</h4>
                                    <p className="text-xs text-slate-400">por {post.profiles?.full_name}</p>
                                </div>
                                <ChevronRight />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Dentro do Tópico */
                <div className="animate-fadeIn">
                    <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                        <ArrowLeft size={18} /> Voltar
                    </button>

                    <div className="bg-[#15335E] rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-white">{selectedPost.title}</h2>
                        <p className="text-slate-300 mt-6 whitespace-pre-wrap">{selectedPost.content}</p>
                    </div>

                    {/* Comentários */}
                    <div className="mt-8">
                        <h3 className="font-bold text-lg mb-4">Comentários</h3>
                        {comments.map(c => (
                            <div key={c.id} className="bg-[#142239] p-5 rounded-3xl mb-4">
                                <p className="font-bold text-sm">{c.profiles?.full_name}</p>
                                <p className="text-slate-300">{c.content}</p>
                            </div>
                        ))}

                        <div className="flex gap-3 mt-6">
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Escreva um comentário..."
                                className="flex-1 bg-[#142239] border border-white/10 rounded-3xl px-5 py-4 outline-none"
                            />
                            <button onClick={handleCreateComment} className="bg-[#D5205D] px-8 rounded-3xl text-white font-bold">Enviar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};