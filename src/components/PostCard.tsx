import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Trash2, MessageCircle, Send, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

type Post = {
  id: string;
  user_id: string;
  content: string;
  type: 'general' | 'vacancy';
  created_at: string;
  link_url?: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
    profession?: string;
    role?: string;
  };
};

export const PostCard = ({ post, currentUserId }: { post: Post; currentUserId: string }) => {
  const navigate = useNavigate();
  const { userProfile } = useStore();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Lazy loading com IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          checkLike();
          fetchLikeCount();
          fetchCommentsCount();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [post.id]);

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

  const toggleLike = async () => {
    const wasLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      if (wasLiked) {
        await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId });
      }
    } catch (error) {
      // Reverte se der erro
      setIsLiked(wasLiked);
      setLikesCount(previousCount);
      console.error('Erro ao curtir:', error);
    }
  };

  const loadComments = async () => {
    if (comments.length > 0) return;
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
    if (!showComments) loadComments();
    setShowComments(!showComments);
  };

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: newComment,
        })
        .select('*, profiles(full_name, avatar_url)')
        .single();

      if (error) throw error;

      setComments((prev) => [...prev, data]);
      setCommentsCount((prev) => prev + 1);
      setNewComment('');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao comentar');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Tem certeza que deseja apagar este post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) toast.error('Erro ao apagar post');
  };

  const isVacancy = post.type === 'vacancy';

  return (
    <div ref={cardRef} className={`bg-[#15335E] border border-white/5 rounded-3xl p-5 mb-6 shadow-xl transition-all ${isVacancy ? 'border-[#D5205D]/30' : ''}`}>
      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/profile/${post.user_id}`)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-[#142239]">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                {post.profiles?.full_name?.[0] || '?'}
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-white">{post.profiles?.full_name}</p>
            <p className="text-xs text-slate-400">
              {post.profiles?.profession || 'Alumni'} • {new Date(post.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {currentUserId === post.user_id && (
          <button
            onClick={handleDeletePost}
            className="text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Conteúdo */}
      <p className="text-slate-200 whitespace-pre-wrap text-[15px] leading-relaxed mb-5">
        {post.content}
      </p>

      {/* Link de vaga */}
      {isVacancy && post.link_url && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[#D5205D] hover:text-pink-600 font-bold text-sm mb-5"
        >
          Ver vaga completa <ExternalLink size={16} />
        </a>
      )}

      {/* Ações */}
      <div className="flex items-center gap-6 border-t border-white/10 pt-4">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${isLiked ? 'text-[#D5205D]' : 'text-slate-400 hover:text-white'
            }`}
        >
          <Heart size={20} className={isLiked ? 'fill-current' : ''} />
          {likesCount}
        </button>

        <button
          onClick={handleToggleComments}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${showComments ? 'text-blue-400' : 'text-slate-400 hover:text-white'
            }`}
        >
          <MessageCircle size={20} />
          {commentsCount}
        </button>
      </div>

      {/* Seção de Comentários */}
      {showComments && (
        <div className="mt-6 pt-4 border-t border-white/10">
          {isLoadingComments ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-slate-400" size={20} />
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-4 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#142239] overflow-hidden flex-shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <img src={comment.profiles.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                        {comment.profiles?.full_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-300">{comment.profiles?.full_name}</p>
                    <p className="text-sm text-slate-200">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input de novo comentário */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 bg-[#142239] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#D5205D]"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateComment()}
            />
            <button
              onClick={handleCreateComment}
              disabled={isSubmittingComment || !newComment.trim()}
              className="bg-[#D5205D] text-white px-5 rounded-2xl font-bold disabled:opacity-50"
            >
              {isSubmittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};