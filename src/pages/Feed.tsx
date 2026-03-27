import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Briefcase, GraduationCap, User, Bell, Star, Send, Sparkles, Shield, Megaphone, X, Loader2 } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';
import { PostCard } from '../components/PostCard';
import { MiniCalendar } from '../components/MiniCalendar';
import { NotificationMenu } from '../components/NotificationMenu';
import { toast } from 'sonner';

const FeedSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-[#15335E] border border-white/5 rounded-3xl p-8 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-white/5 rounded w-2/3 mb-6"></div>
      <div className="flex gap-3"><div className="h-10 bg-white/10 rounded-xl w-32"></div></div>
    </div>
  </div>
);

export const Feed = () => {
  const navigate = useNavigate();
  const { userProfile, feedPosts, setFeedPosts, fetchUserProfile, fetchInitialFeed } = useStore();
  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [statusTag, setStatusTag] = useState({ label: '', color: 'bg-gray-500', border: '', glow: '', defaultRole: '' });

  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [systemUpdates, setSystemUpdates] = useState<any[]>([]);
  const [dismissedUpdates, setDismissedUpdates] = useState<string[]>([]);

  // ESTADOS DO POPUP DE AVALIAÇÃO ALUMNI
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingReviewId, setPendingReviewId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 0, pros: '', cons: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }
      setCurrentUserId(user.id);

      await fetchUserProfile(true);
      await fetchInitialFeed();

      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (!freshProfile || !freshProfile.full_name || !freshProfile.profession) {
        navigate('/onboarding');
        return;
      }

      setIsAdmin(freshProfile.role === 'admin');

      const currentStatus = getRegissStatus(freshProfile.entry_year, freshProfile.role);
      setStatusTag(currentStatus);

      // =========================================================================
      // 🔥 LÓGICA DO POPUP COM CORREÇÃO DE MATEMÁTICA E RASTREAMENTO DE ERRO
      // =========================================================================
      const currentYear = new Date().getFullYear();
      const userEntryYear = Number(freshProfile.entry_year); // Força a ser número!
      const isAlumniByYear = userEntryYear && (currentYear - userEntryYear >= 2);
      const isStaff = freshProfile.role === 'admin' || freshProfile.role === 'coordinator';

      if (isAlumniByYear && !isStaff) {
        const { data: regissMarcos } = await supabase
          .from('career_journey')
          .select('id, rating, pros, title')
          .eq('user_id', user.id)
          .eq('type', 'regiss');

        let marcoToReview = null;

        if (!regissMarcos || regissMarcos.length === 0) {
          // O usuário é antigo e não tinha a linha! Criamos com as datas perfeitamente calculadas.
          const { data: newMarco, error: insertError } = await supabase.from('career_journey').insert({
            user_id: user.id,
            title: 'R1 ReGISS',
            organization: 'HCFMUSP - ReGISS',
            type: 'regiss',
            start_date: `${userEntryYear}-03-01`,
            end_date: `${userEntryYear + 2}-02-28`, // 2024 + 2 = 2026 (Sem virar 20242)
            rating: 0
          }).select().single();

          if (insertError) {
            console.error("Erro fatal ao criar o marco retrospectivo:", insertError);
          } else {
            marcoToReview = newMarco;
          }
        } else {
          marcoToReview = regissMarcos[0];
        }

        if (marcoToReview && (!marcoToReview.rating || marcoToReview.rating === 0)) {
          setPendingReviewId(marcoToReview.id);
          setShowReviewModal(true);
        }
      }
      // =========================================================================

      const [
        { data: updatesData },
        { count },
        { data: matches }
      ] = await Promise.all([
        supabase.from('system_updates').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
        (freshProfile.interests && freshProfile.interests.length > 0)
          ? supabase.from('profiles').select('id, full_name, profession, interests, avatar_url, entry_year, role').neq('id', user.id).overlaps('interests', freshProfile.interests).limit(3)
          : Promise.resolve({ data: [] })
      ]);

      const savedDismissed = user.user_metadata?.dismissed_updates || JSON.parse(localStorage.getItem('dismissed_updates') || '[]');
      setDismissedUpdates(savedDismissed);
      const userJoinedAt = new Date(freshProfile.created_at).getTime();

      const visibleUpdates = (updatesData || []).filter(u => {
        if (savedDismissed.includes(u.id)) return false;
        if (userJoinedAt > new Date(u.created_at).getTime()) return false;
        if (freshProfile.role === 'admin' || freshProfile.role === 'coordinator') return true;
        if (u.target_audience === 'all') return true;
        const isR1 = currentStatus.label === 'R1';
        const isR2 = currentStatus.label === 'R2';
        if (u.target_audience === 'residents' && (isR1 || isR2)) return true;
        if (u.target_audience === 'r1' && isR1) return true;
        if (u.target_audience === 'r2' && isR2) return true;
        return false;
      });

      setSystemUpdates(visibleUpdates);
      setHasNotifications(count !== null && count > 0);
      setSuggestedMatches(matches || []);

    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const channel = supabase.channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        if (payload.new.type === 'general') {
          const { data: newPostWithProfile } = await supabase.from('posts').select(`*, profiles(full_name, profession, entry_year, job_title, avatar_url, role)`).eq('id', payload.new.id).single();
          if (newPostWithProfile) setFeedPosts([newPostWithProfile, ...useStore.getState().feedPosts]);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        setFeedPosts(useStore.getState().feedPosts.filter((post: any) => post.id !== payload.old.id));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    const { error } = await supabase.from('posts').insert({ user_id: userProfile?.id, content: newPostContent, type: 'general' });
    if (!error) setNewPostContent('');
  };

  const handleDismissUpdate = async (id: string) => {
    const newDismissed = [...dismissedUpdates, id];
    setDismissedUpdates(newDismissed);
    localStorage.setItem('dismissed_updates', JSON.stringify(newDismissed));
    setSystemUpdates(systemUpdates.filter(u => u.id !== id));
    try { await supabase.auth.updateUser({ data: { dismissed_updates: newDismissed } }); } catch (err) { }
  };

  const submitResidencyReview = async () => {
    if (reviewData.rating === 0) return toast.error('Selecione uma nota de 1 a 5 estrelas!');
    if (!reviewData.pros || !reviewData.cons) return toast.error('Por favor, preencha os prós e contras para ajudar os futuros residentes.');

    setIsSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('career_journey')
        .update({
          rating: reviewData.rating,
          pros: reviewData.pros,
          cons: reviewData.cons
        })
        .eq('id', pendingReviewId);

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso! Obrigado por contribuir.');
      setShowReviewModal(false);
    } catch (err: any) {
      toast.error('Erro ao enviar avaliação: ' + err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const userTheme = userProfile?.theme_color || 'regiss-magenta';
  const themeBgClass = userTheme === 'regiss-petrol' ? 'bg-[#275A80]' : userTheme === 'regiss-wine' ? 'bg-[#B32F50]' : 'bg-[#D5205D]';
  const themeFromClass = userTheme === 'regiss-petrol' ? 'from-[#275A80]' : userTheme === 'regiss-wine' ? 'from-[#B32F50]' : 'from-[#D5205D]';

  const RenderMatches = () => {
    if (userProfile?.role === 'coordination' || isAdmin) return null;
    return (
      <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 shadow-xl sticky top-[340px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-white flex items-center gap-2"><Sparkles size={18} className="text-[#D5205D]" /> Sugestões para Você</h3>
        </div>
        <div className="space-y-4">
          {suggestedMatches.length === 0 ? (
            <div className="text-center py-6 bg-[#142239] rounded-2xl border border-white/5">
              <p className="text-xs text-slate-500 italic px-4">Complete seus interesses no perfil para receber sugestões.</p>
            </div>
          ) : (
            suggestedMatches.map(match => {
              const matchStatus = getRegissStatus(match.entry_year, match.role);
              return (
                <div key={match.id} className="flex gap-4 items-center group cursor-pointer bg-[#142239] p-3 rounded-2xl border border-white/5 hover:border-white/20 transition-all shadow-sm" onClick={() => navigate(`/profile/${match.id}`)}>
                  <div className={`w-12 h-12 rounded-full border-2 ${matchStatus.border} overflow-hidden shrink-0 shadow-inner`}>
                    {match.avatar_url ? <img src={match.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-sm font-bold uppercase">{match.full_name.charAt(0)}</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate group-hover:text-[#D5205D] transition-colors">{match.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{match.profession}</p>
                  </div>
                  <button className="p-2 bg-[#15335E] hover:bg-[#D5205D] text-slate-400 hover:text-white rounded-xl transition-all shadow-md"><User size={14} /></button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 font-sans p-0 md:p-8 pb-24 relative">

      {/* OVERLAY E MODAL GLASSDOOR (Bloqueia a tela pro Alumni avaliar) */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#15335E] border border-[#D5205D]/30 w-full max-w-xl rounded-[2rem] p-8 shadow-[0_0_50px_rgba(213,32,93,0.2)] animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#D5205D] to-[#B32F50] rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
                <GraduationCap size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Parabéns pela Jornada!</h2>
              <p className="text-slate-400 text-sm mt-2">Como você já é Alumni ReGISS, queremos ouvir sobre sua experiência no HCFMUSP. Esta avaliação será anônima e ajudará muito a moldar a comunidade.</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setReviewData({ ...reviewData, rating: star })} className="transition-all hover:scale-110 active:scale-95">
                    <Star size={40} className={reviewData.rating >= star ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'text-slate-600'} />
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-1">Prós: O que foi excelente?</label>
                  <textarea value={reviewData.pros} onChange={e => setReviewData({ ...reviewData, pros: e.target.value })} placeholder="Ex: Ótimos preceptores, muita vivência prática..." className="w-full bg-[#142239] border border-emerald-500/30 p-4 rounded-2xl outline-none focus:border-emerald-500 text-sm h-24 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2 block mb-1">Contras: O que poderia melhorar?</label>
                  <textarea value={reviewData.cons} onChange={e => setReviewData({ ...reviewData, cons: e.target.value })} placeholder="Ex: Carga horária exaustiva em alguns meses..." className="w-full bg-[#142239] border border-red-500/30 p-4 rounded-2xl outline-none focus:border-red-500 text-sm h-24 resize-none" />
                </div>
              </div>

              <button onClick={submitResidencyReview} disabled={isSubmittingReview} className="w-full bg-[#D5205D] hover:bg-pink-600 disabled:opacity-50 py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-xl active:scale-95">
                {isSubmittingReview ? <Loader2 className="animate-spin" size={24} /> : 'Enviar Avaliação Anônima'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center gap-4 mb-4 md:mb-8 border-b border-white/5 p-5 md:p-0 pb-5 md:pb-6 bg-[#15335E]/80 md:bg-transparent backdrop-blur-xl sticky top-0 z-50">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-white">Alumni <span className="text-[#D5205D]">ReGISS</span></h1>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Sua rede de gestão e conexão</p>
          </div>
          <div className="flex items-center gap-4 relative">
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg flex items-center gap-2 font-bold text-xs" title="Acessar Painel Administrativo">
                <Shield size={16} /> Painel Admin
              </button>
            )}
            <div className="relative">
              <button onClick={() => { setShowNotifications(!showNotifications); setHasNotifications(false); }} className={`relative p-3 rounded-xl transition-all shadow-lg flex items-center justify-center ${showNotifications ? 'bg-white text-[#142239]' : 'bg-[#15335E] text-slate-400 hover:text-white'}`}>
                <Bell size={20} />
                {hasNotifications && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#D5205D] rounded-full border-2 border-[#15335E]"></span>}
              </button>
              {showNotifications && <NotificationMenu onClose={() => setShowNotifications(false)} />}
            </div>
          </div>
        </div>

        <main className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 lg:col-span-3 space-y-6 hidden md:block">
            {loading ? <FeedSkeleton /> : (
              <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden sticky top-8 group">
                <div className={`absolute top-0 left-0 w-full h-28 opacity-30 ${themeBgClass}`}></div>
                <div className="flex flex-col items-center relative z-10 -mt-2">
                  <div className={`w-24 h-24 bg-[#142239] rounded-full p-1 border-4 ${statusTag.border} shadow-2xl mb-3 overflow-hidden`}>
                    {userProfile?.avatar_url ? <img src={userProfile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-700 flex items-center justify-center text-3xl font-bold uppercase">{userProfile?.full_name?.charAt(0)}</div>}
                  </div>
                  <h2 className="text-lg font-bold text-white text-center">{userProfile?.full_name}</h2>
                  <div className="mt-2"><span className={`${statusTag.color} ${statusTag.glow} text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10`}>{statusTag.label}</span></div>
                  <div className="w-full mt-6 space-y-3 pt-6 border-t border-white/5 text-sm text-slate-300">
                    <p className="flex items-center gap-2"><Briefcase size={14} className="text-[#D5205D]" /> <span className="font-medium text-white">{statusTag.defaultRole || userProfile?.job_title}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-8 lg:col-span-6 space-y-6">
            {loading ? <FeedSkeleton /> : (
              <>
                <div className={`bg-gradient-to-r ${themeFromClass} to-[#142239] border-y md:border border-white/10 rounded-none md:rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl`}>
                  <div className="flex items-center gap-2 mb-1"><Sparkles className="text-white/80 w-4 h-4" /><span className="text-white/70 text-xs font-bold uppercase tracking-widest">Bem-vindo(a) de volta</span></div>
                  <h2 className="text-2xl font-bold text-white">Olá, {userProfile?.full_name?.split(' ')[0] || 'Alumni'}.</h2>
                </div>

                {systemUpdates.length > 0 && systemUpdates.map(update => (
                  <div key={update.id} className="bg-gradient-to-r from-[#275A80] to-[#142239] border-y md:border md:border-[#275A80]/50 rounded-none md:rounded-3xl p-6 md:p-8 relative shadow-xl animate-fadeIn">
                    <button onClick={() => handleDismissUpdate(update.id)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-all" title="Fechar aviso">
                      <X size={16} />
                    </button>
                    <div className="flex gap-6 flex-col sm:flex-row items-start sm:items-center">
                      {update.image_url ? (
                        <img src={update.image_url} alt="Aviso" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                          <Megaphone size={28} className="text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-xl">{update.title}</h3>
                        <p className="text-sm text-slate-300 mt-2 leading-relaxed">{update.content}</p>
                        {update.link_url && (
                          <a href={update.link_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 px-6 py-2.5 bg-white text-[#142239] hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors shadow-lg">
                            Acessar Conteúdo
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-[#15335E] border-y md:border border-white/5 rounded-none md:rounded-3xl p-5 shadow-xl mb-4 md:mb-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#142239] flex items-center justify-center font-bold text-slate-400 overflow-hidden">{userProfile?.avatar_url ? <img src={userProfile.avatar_url} className="w-full h-full object-cover" /> : userProfile?.full_name?.charAt(0)}</div>
                    <textarea value={newPostContent} onChange={e => { setNewPostContent(e.target.value); e.target.style.height = 'inherit'; e.target.style.height = `${e.target.scrollHeight}px`; }} placeholder={`Compartilhe conhecimento...`} className="w-full bg-[#142239] border border-white/5 rounded-2xl p-4 text-white resize-none outline-none focus:border-[#D5205D] min-h-[60px] overflow-hidden" />
                  </div>
                  <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
                    <button onClick={handleCreatePost} disabled={!newPostContent.trim()} className="bg-[#D5205D] hover:bg-pink-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">Publicar <Send size={16} /></button>
                  </div>
                </div>

                {!loading && <div className="block lg:hidden mb-6 px-4 md:px-0"><RenderMatches /></div>}
                {feedPosts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)}
              </>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-3 space-y-6">
            {!loading && <MiniCalendar />}
            {!loading && <RenderMatches />}
          </div>
        </main>
      </div>
    </div>
  );
};