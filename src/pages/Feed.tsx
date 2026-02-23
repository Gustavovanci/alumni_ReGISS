import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Briefcase, GraduationCap, User, Bell, Star, Send, Sparkles, Shield, Megaphone, X } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';
import { PostCard } from '../components/PostCard';
import { MiniCalendar } from '../components/MiniCalendar';
import { NotificationMenu } from '../components/NotificationMenu';

interface Profile {
  id: string; full_name: string; profession: string; job_title: string; entry_year: number; birth_date: string; interests: string[]; avatar_url?: string; theme_color?: string; role?: string;
}

// SKELETON DE CARREGAMENTO PARA O FEED
const FeedSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-[#15335E] border border-white/5 rounded-3xl p-8 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-white/5 rounded w-2/3 mb-6"></div>
      <div className="flex gap-3"><div className="h-10 bg-white/10 rounded-xl w-32"></div></div>
    </div>
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-[#15335E] border border-white/5 rounded-2xl p-5 animate-pulse">
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-white/5 rounded w-1/5"></div>
          </div>
        </div>
        <div className="h-16 bg-white/5 rounded w-full"></div>
      </div>
    ))}
  </div>
);

export const Feed = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [statusTag, setStatusTag] = useState({ label: '', color: 'bg-gray-500', border: '', glow: '', defaultRole: '' });

  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [systemUpdates, setSystemUpdates] = useState<any[]>([]);
  const [dismissedUpdates, setDismissedUpdates] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissed_updates');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }
      setCurrentUserId(user.id);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!profileData?.profession) { navigate('/onboarding'); return; }

      setProfile(profileData);
      setIsAdmin(profileData.role === 'admin');

      const currentStatus = getRegissStatus(profileData.entry_year, profileData.role);
      setStatusTag(currentStatus);

      const [
        { data: updatesData },
        { count },
        { data: matches }
      ] = await Promise.all([
        supabase.from('system_updates').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
        (profileData.interests && profileData.interests.length > 0)
          ? supabase.from('profiles').select('id, full_name, profession, interests, avatar_url, entry_year, role').neq('id', user.id).overlaps('interests', profileData.interests).limit(3)
          : Promise.resolve({ data: [] })
      ]);

      const { data: correctPostsData } = await supabase.from('posts').select(`*, profiles(full_name, profession, entry_year, job_title, avatar_url, role)`).eq('type', 'general').order('created_at', { ascending: false });
      setPosts(correctPostsData || []);

      const savedDismissed = JSON.parse(localStorage.getItem('dismissed_updates') || '[]');
      const userJoinedAt = new Date(profileData.created_at).getTime();

      const visibleUpdates = (updatesData || []).filter(u => {
        if (savedDismissed.includes(u.id)) return false;

        // Se o usuário entrou no sistema DEPOIS que o aviso foi criado, ele não vê.
        const updateCreatedAt = new Date(u.created_at).getTime();
        if (userJoinedAt > updateCreatedAt) return false;

        if (profileData.role === 'admin' || profileData.role === 'coordinator') return true;
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

    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => {
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        if (payload.new.type === 'general') {
          const { data: newPostWithProfile } = await supabase
            .from('posts')
            .select(`*, profiles(full_name, profession, entry_year, job_title, avatar_url, role)`)
            .eq('id', payload.new.id)
            .single();

          if (newPostWithProfile) {
            setPosts(currentPosts => [newPostWithProfile, ...currentPosts]);
          }
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        // Remove da tela instantaneamente se alguém deletar um post
        setPosts(currentPosts => currentPosts.filter(post => post.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    const { error } = await supabase.from('posts').insert({ user_id: profile?.id, content: newPostContent, type: 'general' });
    if (!error) {
      setNewPostContent('');
      // Não precisa de fetchData(), o Realtime vai injetar o post!
    }
  };

  const handleDismissUpdate = (id: string) => {
    const newDismissed = [...dismissedUpdates, id];
    setDismissedUpdates(newDismissed);
    localStorage.setItem('dismissed_updates', JSON.stringify(newDismissed));
    setSystemUpdates(systemUpdates.filter(u => u.id !== id));
  };

  const userTheme = profile?.theme_color || 'regiss-magenta';
  const themeBgClass = userTheme === 'regiss-petrol' ? 'bg-[#275A80]' : userTheme === 'regiss-wine' ? 'bg-[#B32F50]' : 'bg-[#D5205D]';
  const themeFromClass = userTheme === 'regiss-petrol' ? 'from-[#275A80]' : userTheme === 'regiss-wine' ? 'from-[#B32F50]' : 'from-[#D5205D]';

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 font-sans p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Alumni <span className="text-[#D5205D]">ReGISS</span></h1>
            <p className="text-slate-400 text-sm mt-1">Sua rede de gestão e conexão em saúde</p>
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

          {/* COLUNA ESQUERDA (PERFIL) */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6 hidden md:block">
            {loading ? (
              <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 h-64 animate-pulse"></div>
            ) : (
              <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden sticky top-8 group">
                <div className={`absolute top-0 left-0 w-full h-28 opacity-30 ${themeBgClass}`}></div>
                <div className="flex flex-col items-center relative z-10 -mt-2">
                  <div className="relative">
                    <div className={`w-24 h-24 bg-[#142239] rounded-full p-1 border-4 ${statusTag.border} shadow-2xl mb-3 overflow-hidden`}>
                      {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 uppercase">{profile?.full_name?.charAt(0)}</div>}
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-white text-center">{profile?.full_name}</h2>
                  <div className="mt-2"><span className={`${statusTag.color} ${statusTag.glow} text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10`}>{statusTag.label}</span></div>
                  <div className="w-full mt-6 space-y-3 pt-6 border-t border-white/5 text-sm text-slate-300">
                    <p className="flex items-center gap-2"><Briefcase size={14} className="text-[#D5205D]" /> <span className="font-medium text-white">{statusTag.defaultRole || profile?.job_title}</span></p>
                    {profile?.role !== 'coordinator' && profile?.role !== 'admin' && (
                      <p className="flex items-center gap-2"><GraduationCap size={14} className="text-[#275A80]" /> Turma {profile?.entry_year}</p>
                    )}
                  </div>
                  <div className="w-full mt-6 space-y-3">
                    <button onClick={() => navigate('/network')} className="w-full py-3 bg-[#142239] border border-white/10 hover:border-[#D5205D]/50 rounded-xl text-sm font-bold transition-all text-slate-300 hover:text-white shadow-lg">Minha Rede</button>
                    <button onClick={() => navigate('/my-journey')} className="w-full py-3 bg-[#142239] border border-white/10 hover:border-[#275A80]/50 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 text-slate-300 hover:text-white shadow-lg"><User size={14} /> Editar Perfil</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA CENTRAL (FEED PRINCIPAL) */}
          <div className="md:col-span-8 lg:col-span-6 space-y-6">

            {loading ? (
              <FeedSkeleton />
            ) : (
              <>
                {/* BOAS VINDAS */}
                <div className={`bg-gradient-to-r ${themeFromClass} to-[#142239] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-xl`}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2"><Star className="text-white w-4 h-4 fill-current" /><span className="text-white/80 text-xs font-bold uppercase tracking-widest">Networking Vivo</span></div>
                    <h2 className="text-2xl font-bold text-white mb-3">Olá, {profile?.full_name?.split(' ')[0]}.</h2>
                    <p className="text-white/70 max-w-xl mb-6 text-sm leading-relaxed">Este é o seu hub do ReGISS. Conecte-se com a rede ou busque novas oportunidades baseadas em seus interesses.</p>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => navigate('/network')} className="px-6 py-3 bg-white text-[#142239] rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 hover:bg-slate-200"><User size={16} /> Explorar Rede</button>
                      <button onClick={() => navigate('/jobs')} className="px-6 py-3 bg-black/20 hover:bg-black/30 text-white border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2"><Briefcase size={16} /> Mural de Vagas</button>
                    </div>
                  </div>
                </div>

                {/* SESSÃO DE ATUALIZAÇÕES DO SISTEMA (BANNERS) */}
                {systemUpdates.length > 0 && systemUpdates.map(update => (
                  <div key={update.id} className="bg-gradient-to-r from-[#275A80] to-[#142239] border border-[#275A80]/50 rounded-3xl p-6 md:p-8 relative shadow-xl animate-fadeIn">
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

                {/* LISTA DE POSTS */}
                <div className="space-y-6">
                  {/* O INPUT DE CRIAR POST COM AUTO-RESIZE */}
                  <div className="bg-[#15335E] border border-white/5 rounded-3xl p-5 shadow-xl mb-8">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#142239] flex-shrink-0 flex items-center justify-center font-bold text-slate-400 border border-white/5 overflow-hidden shadow-inner">{profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Me" /> : profile?.full_name?.charAt(0)}</div>
                      <textarea
                        value={newPostContent}
                        onChange={e => {
                          setNewPostContent(e.target.value);
                          e.target.style.height = 'inherit';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        placeholder={`Compartilhe conhecimento, dúvidas ou conquistas...`}
                        className="w-full bg-[#142239] border border-white/5 rounded-2xl p-4 text-white resize-none outline-none focus:border-[#D5205D] transition-colors placeholder:text-slate-500 text-sm shadow-inner min-h-[60px] overflow-hidden"
                      />
                    </div>
                    <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
                      <button onClick={handleCreatePost} disabled={!newPostContent.trim()} className="bg-[#D5205D] hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-[#D5205D] text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg">Publicar <Send size={16} /></button>
                    </div>
                  </div>
                  {posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)}
                </div>
              </>
            )}
          </div>

          {/* COLUNA DIREITA (CALENDÁRIO E MATCHES) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            {!loading && <MiniCalendar />}

            {/* Oculta sugestões de amizade se for coordenação ou admin */}
            {!loading && profile?.role !== 'coordination' && !isAdmin && (
              <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 shadow-xl sticky top-[340px]">
                <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-white flex items-center gap-2"><Sparkles size={18} className="text-[#D5205D]" /> Sugestões para Você</h3></div>
                <div className="space-y-4">
                  {suggestedMatches.length === 0 ? (
                    <div className="text-center py-6 bg-[#142239] rounded-2xl border border-white/5"><p className="text-xs text-slate-500 italic px-4">Complete seus interesses no perfil para receber sugestões.</p><button onClick={() => navigate('/my-journey')} className="text-xs text-[#D5205D] font-bold mt-3 hover:underline">+ Adicionar Interesses</button></div>
                  ) : (
                    suggestedMatches.map(match => {
                      const matchStatus = getRegissStatus(match.entry_year, match.role);
                      return (
                        <div key={match.id} className="flex gap-4 items-center group cursor-pointer bg-[#142239] p-3 rounded-2xl border border-white/5 hover:border-white/20 transition-all shadow-sm" onClick={() => navigate(`/profile/${match.id}`)}>
                          <div className={`w-12 h-12 rounded-full border-2 ${matchStatus.border} overflow-hidden shrink-0 shadow-inner`}>{match.avatar_url ? <img src={match.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-sm font-bold">{match.full_name.charAt(0)}</div>}</div>
                          <div className="min-w-0 flex-1"><p className="text-sm font-bold text-white truncate group-hover:text-[#D5205D] transition-colors">{match.full_name}</p><p className="text-[10px] text-slate-400 truncate mt-0.5">{match.profession}</p></div>
                          <button className="p-2 bg-[#15335E] hover:bg-[#D5205D] text-slate-400 hover:text-white rounded-xl transition-all shadow-md"><User size={14} /></button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};