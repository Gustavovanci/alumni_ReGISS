import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Trash2, MessageCircle, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const PostCard = ({ post, currentUserId }: { post: any, currentUserId: string }) => {
  const navigate = useNavigate();
  const { userProfile } = useStore();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Otimização de N+1 queries. Baixa likes SOMENTE se passar na tela
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Estados de Comentários
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect(); // Só precisa buscar uma vez
      }
    }, { threshold: 0.1 });

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && post.id && currentUserId) {
      checkLike();
      fetchLikeCount();
      fetchCommentsCount(); // Busca apenas a contagem inicial
    }
  }, [isVisible, post.id, currentUserId]);

  const checkLike = async () => {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUserId)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const fetchLikeCount = async () => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    setLikesCount(count || 0);
  };

  const fetchCommentsCount = async () => {
    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    setCommentsCount(count || 0);
  };

  const loadComments = async () => {
    setIsLoadingComments(true);
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    setComments(data || []);
    setIsLoadingComments(false);
  };

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ post_id: post.id, user_id: currentUserId, content: newComment })
      if (error) throw error;

      // DISPARO DE NOTIFICAÇÃO (Comentário) - Se não for o próprio dono
      if (post.user_id && post.user_id !== currentUserId) {
        const userName = userProfile?.full_name?.split(' ')[0] || 'Alguém';
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          type: 'new_comment',
          title: 'Novo Comentário',
          content: `${userName} comentou no seu post: "${newComment.substring(0, 30)}${newComment.length > 30 ? '...' : ''}"`,
          read: false,
          target_url: `/feed`
        }).then();
      }

      setComments([...comments, data]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao comentar. Verifique se a tabela post_comments existe.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Apagar comentário?')) return;
    try {
      const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
      if (error) throw error;
      setComments(comments.filter(c => c.id !== commentId));
      setCommentsCount(prev => prev - 1);
    } catch (error: any) {
      console.error(error);
      alert('Não foi possível apagar comentário.');
    }
  };

  // UI OTIMISTA: Atualiza a interface instantaneamente sem esperar o DB
  const toggleLike = async () => {
    const previousLikeState = isLiked;
    const previousCount = likesCount;

    // Atualiza a tela AGORA
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      if (previousLikeState) {
        const { error } = await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId });
        if (error) throw error;

        // DISPARO DE NOTIFICAÇÃO (Like) - Se não for o próprio dono
        if (post.user_id && post.user_id !== currentUserId) {
          const userName = userProfile?.full_name?.split(' ')[0] || 'Alguém';
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            type: 'new_like',
            title: 'Nova Curtida',
            content: `${userName} curtiu sua publicação.`,
            read: false,
            target_url: `/feed`
          }).then(); // Fire and forget
        }
      }
    } catch (error) {
      // Se deu erro, reverte as mudanças
      setIsLiked(previousLikeState);
      setLikesCount(previousCount);
      console.error("Erro ao curtir:", error);
    }
  };

  const isVacancy = post.type === 'vacancy';

  return (
    <div ref={cardRef} className={`bg-[#15335E] border-y md:border md:rounded-2xl p-4 md:p-5 shadow-none md:shadow-lg transition-all border-x-0 md:border-x ${isVacancy ? 'border-y-[#D5205D]/30 md:border-[#D5205D]/30' : 'border-y-white/5 md:border-white/5'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-center cursor-pointer group" onClick={() => navigate(`/profile/${post.user_id}`)}>
          <div className="w-10 h-10 bg-[#142239] rounded-full border border-white/10 overflow-hidden shrink-0">
            {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{post.profiles?.full_name?.charAt(0)}</div>}
          </div>
          <div>
            <p className="font-bold text-white text-sm group-hover:text-[#D5205D] transition-colors flex items-center gap-2">
              {post.profiles?.full_name}
              {isVacancy && <span className="bg-[#D5205D]/20 text-[#D5205D] px-2 py-0.5 rounded text-[10px] uppercase font-bold">Vaga</span>}
              {post.profiles?.role === 'coordination' && <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-amber-500/20">Área Técnica</span>}
            </p>
            <p className="text-[10px] text-slate-400">{post.profiles?.role === 'coordination' ? 'Coordenação' : (post.profiles?.profession || 'Alumni')} • {new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        {currentUserId === post.user_id && (
          <button onClick={async () => {
            if (confirm('Apagar post?')) {
              await supabase.from('posts').delete().eq('id', post.id);
              // Como implementamos o Realtime no Feed para DELETE, não precisamos dar reload na página. Ele vai sumir sozinho.
            }
          }} className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
        )}
      </div>

      <p className="text-slate-200 text-sm whitespace-pre-wrap break-words leading-relaxed">
        {post.content.replace(/\[AVISO_COORD_TARGET:[A-Z0-9]+\]\s*/g, '')}
      </p>

      {isVacancy && post.link_url && (
        <div className="mt-4">
          <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#D5205D] hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg">Acessar Oportunidade</a>
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked ? 'text-[#D5205D]' : 'text-slate-400 hover:text-white'}`}>
          <Heart size={16} className={isLiked ? 'fill-current' : ''} /> {likesCount}
        </button>
        <button onClick={handleToggleComments} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${showComments ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
          <MessageCircle size={16} /> {commentsCount} {commentsCount === 1 ? 'Comentário' : 'Comentários'}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-fadeIn">
          {isLoadingComments ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
          ) : (
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
              {comments.map((c) => (
                <div key={c.id} className="bg-[#142239] p-3 rounded-xl border border-white/5 group flex items-start justify-between">
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shrink-0 text-xs font-bold overflow-hidden border border-white/5">
                      {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} className="w-full h-full object-cover" /> : c.profiles?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-0.5">{c.profiles?.full_name}</p>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                  {currentUserId === c.user_id && (
                    <button onClick={() => handleDeleteComment(c.id)} className="text-slate-500 hover:text-red-400 p-1 md:p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded-lg shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-xs text-slate-500 italic">Nenhum comentário ainda. Seja o primeiro!</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 bg-[#142239] p-2 rounded-xl border border-white/5">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 bg-transparent border-none px-3 py-2 text-white text-sm outline-none placeholder:text-slate-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateComment()}
            />
            <button
              onClick={handleCreateComment}
              disabled={isSubmittingComment || !newComment.trim()}
              className="bg-[#D5205D] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0"
            >
              {isSubmittingComment ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> Enviar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};