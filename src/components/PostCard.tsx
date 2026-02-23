import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PostCard = ({ post, currentUserId }: { post: any, currentUserId: string }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (post.id && currentUserId) {
      checkLike();
      fetchLikeCount();
    }
  }, [post.id, currentUserId]);

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
    <div className={`bg-[#15335E] border rounded-2xl p-5 shadow-lg transition-all ${isVacancy ? 'border-[#D5205D]/30' : 'border-white/5'}`}>
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

      <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
        {post.content.replace(/\[AVISO_COORD_TARGET:[A-Z0-9]+\]\s*/g, '')}
      </p>

      {isVacancy && post.link_url && (
        <div className="mt-4">
          <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#D5205D] hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg">Acessar Oportunidade</a>
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked ? 'text-[#D5205D]' : 'text-slate-400 hover:text-white'}`}>
          <Heart size={16} className={isLiked ? 'fill-current' : ''} /> {likesCount}
        </button>
      </div>
    </div>
  );
};