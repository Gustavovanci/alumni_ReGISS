import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, Plus, Building, MapPin, Briefcase, Clock, Calendar, Check, Loader2 } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';
import { toast } from 'sonner';

export const Jobs = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState('user');

  const [newJob, setNewJob] = useState({ description: '', link: '', company: '', isPremium: false });

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const now = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();

      // Buscar Vagas (Usa maybeSingle/Join protegido)
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(full_name, entry_year, profession, role)')
        .eq('type', 'vacancy')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar Candidaturas e Role do Usuário Atual
      if (user) {
        const { data: myApps } = await supabase
          .from('job_applications')
          .select('job_id, status')
          .eq('applicant_id', user.id);

        setApplications(myApps || []);

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setCurrentUserRole(profile.role || 'user');
      }

      setJobs(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar vagas:", error);
      toast.error("Erro ao carregar o mural de vagas.");
    } finally {
      setLoading(false);
    }
  };

  // --- MÁGICA DA VAGA EM TEMPO REAL ---
  useEffect(() => {
    const channel = supabase
      .channel('public:vacancies')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        if (payload.new.type === 'vacancy') {
          const now = new Date().getTime();
          const exp = new Date(payload.new.expires_at).getTime();

          if (exp > now) {
            const { data: jobWithProfile } = await supabase
              .from('posts')
              .select('*, profiles(full_name, entry_year, profession, role)')
              .eq('id', payload.new.id)
              .single();

            if (jobWithProfile) {
              setJobs(current => [jobWithProfile, ...current]);
            }
          }
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        setJobs(current => current.filter(job => job.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- FUNÇÃO CORRIGIDA DE POSTAR VAGA ---
  const handlePostJob = async () => {
    if (!newJob.description || !newJob.company) {
      return toast.error("Empresa e Descrição são obrigatórias.");
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão inválida. Faça login novamente.");

      // Formatação segura de Link (Evita string vazia que o banco rejeita)
      let formattedLink = newJob.link ? newJob.link.trim() : null;
      if (formattedLink && !formattedLink.startsWith('http')) {
        formattedLink = `https://${formattedLink}`;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      const contentData = newJob.isPremium
        ? `[PREMIUM_JOB] [${newJob.company}] ${newJob.description}`
        : `[${newJob.company}] ${newJob.description}`;

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: contentData,
        type: 'vacancy',
        link_url: formattedLink,
        expires_at: expiresAt.toISOString()
      });

      if (error) throw error; // O Catch vai capturar e mostrar o motivo no Toast

      toast.success("Vaga publicada com sucesso!");
      setIsCreating(false);
      setNewJob({ description: '', link: '', company: '', isPremium: false });

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Falha ao postar vaga. Verifique sua conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  const handleApply = async (jobId: string) => {
    setApplyingTo(jobId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login para se candidatar.");

      const { data: profile } = await supabase.from('profiles').select('interests').eq('id', user.id).single();

      const matchScore = profile?.interests && profile.interests.length > 0
        ? Math.floor(Math.random() * 40) + 60
        : 50;

      const { error } = await supabase.from('job_applications').insert({
        job_id: jobId,
        applicant_id: user.id,
        match_score: matchScore,
        status: 'pending'
      });

      if (error) {
        if (error.code === '23505') toast.error("Você já se candidatou para essa vaga!");
        else throw error;
      } else {
        toast.success("Candidatura enviada com sucesso!");
        setApplications(prev => [...prev, { job_id: jobId, status: 'pending' }]);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setApplyingTo(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 font-sans p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Mural de <span className="text-[#D5205D]">Vagas</span></h1>
            <p className="text-slate-400 text-sm mt-1">Oportunidades exclusivas para a comunidade</p>
          </div>

          <button onClick={() => setIsCreating(!isCreating)} className="bg-[#D5205D] hover:bg-pink-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg">
            <Plus size={18} /> Divulgar Vaga
          </button>
        </div>

        {/* FORMULÁRIO DE NOVA VAGA */}
        {isCreating && (
          <div className="bg-[#15335E] border border-[#D5205D]/50 rounded-3xl p-6 md:p-8 mb-8 animate-fadeIn shadow-2xl relative">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-xl"><Briefcase className="text-[#D5205D]" /> Nova Oportunidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Empresa (Obrigatório)</label>
                <div className="flex items-center bg-[#142239] rounded-xl mt-1 px-4 border border-white/10 focus-within:border-[#D5205D] transition-colors shadow-inner">
                  <Building size={18} className="text-slate-500" />
                  <input type="text" value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} className="w-full bg-transparent border-none p-3.5 text-white outline-none" placeholder="Ex: Hospital das Clínicas" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Link da Vaga (Opcional - Em branco p/ Nativo)</label>
                <div className="flex items-center bg-[#142239] rounded-xl mt-1 px-4 border border-white/10 focus-within:border-[#D5205D] transition-colors shadow-inner">
                  <ExternalLink size={18} className={newJob.link ? "text-[#D5205D]" : "text-slate-500"} />
                  <input type="text" value={newJob.link} onChange={e => setNewJob({ ...newJob, link: e.target.value })} className="w-full bg-transparent border-none p-3.5 text-white outline-none" placeholder="https://..." />
                </div>
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase">Descrição</label>
              <textarea value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white mt-1 h-24 resize-none outline-none focus:border-[#D5205D] transition-colors shadow-inner" placeholder="Detalhes da vaga..." />
            </div>



            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={14} /> Ficará visível por 15 dias.</p>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setIsCreating(false)} className="flex-1 md:flex-none text-slate-400 px-4 py-3 text-sm font-bold hover:text-white transition-colors bg-[#142239] rounded-xl border border-white/5">Cancelar</button>
                <button onClick={handlePostJob} disabled={isSubmitting} className="flex-1 md:flex-none bg-[#D5205D] hover:bg-pink-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-colors shadow-lg">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LISTA DE VAGAS */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-[#D5205D] animate-spin" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 border border-white/5 border-dashed rounded-3xl bg-[#15335E]/50">
            <Briefcase size={48} className="mx-auto text-slate-600 mb-4 opacity-50" />
            <p className="text-slate-400 font-bold">Nenhuma vaga ativa no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs
              .sort((a, b) => {
                const aPremium = a.content?.includes('[PREMIUM_JOB]');
                const bPremium = b.content?.includes('[PREMIUM_JOB]');
                if (aPremium && !bPremium) return -1;
                if (!aPremium && bPremium) return 1;
                return 0;
              })
              .map(job => {
                // Proteção Máxima: Optional chaining caso o profiles venha null (Evita tela branca)
                const profile = job.profiles || {};
                const status = getRegissStatus(profile.entry_year || new Date().getFullYear(), profile.role);
                const daysLeft = getDaysLeft(job.expires_at);
                const isPremium = job.content?.startsWith('[PREMIUM_JOB]');
                const displayContent = isPremium ? job.content.replace('[PREMIUM_JOB] ', '') : job.content;

                return (
                  <div key={job.id} className={`border rounded-3xl p-6 md:p-8 transition-all group relative overflow-hidden shadow-xl ${isPremium ? 'bg-gradient-to-r from-[#1E3A5F] to-amber-900/20 border-amber-500/50 hover:border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'bg-[#15335E] border-white/5 hover:border-[#D5205D]/30'}`}>

                    {isPremium && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white px-6 py-1.5 rounded-bl-2xl text-[10px] font-bold shadow-lg uppercase tracking-widest flex items-center gap-1 z-10">
                        Vaga Patrocinada
                      </div>
                    )}

                    {!isPremium && (
                      <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-bold border-b border-l z-10 ${daysLeft < 3 ? 'bg-red-500/20 text-red-400 border-red-500/20' : 'bg-green-500/20 text-green-400 border-green-500/20'}`}>
                        Expira em {daysLeft} dias
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start mt-2 gap-6 relative z-10">
                      <div className="flex gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${isPremium ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-[#142239] text-[#D5205D] border-white/5'}`}>
                          <Briefcase size={28} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-xl leading-tight ${isPremium ? 'text-amber-50' : 'text-white'}`}>{displayContent}</h3>
                          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
                            Postado por <span className="text-white font-medium">{profile.full_name || 'Usuário'}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${status.color}`}>{status.label}</span>
                          </p>
                        </div>
                      </div>

                      {/* BOTÃO DE AÇÃO */}
                      <div className="w-full md:w-auto shrink-0">
                        {job.link_url ? (
                          <a href={job.link_url} target="_blank" rel="noopener noreferrer" className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg text-[#142239] ${isPremium ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400' : 'bg-white hover:bg-slate-200'}`}>
                            Redirecionar <ExternalLink size={16} />
                          </a>
                        ) : applications.some(app => app.job_id === job.id) ? (
                          <button disabled className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-green-500/10 text-green-400 border border-green-500/20 cursor-default">
                            <Check size={16} /> Em Análise
                          </button>
                        ) : (
                          <button onClick={() => handleApply(job.id)} disabled={applyingTo === job.id} className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${isPremium ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-amber-500/50' : 'bg-[#D5205D] text-white hover:bg-pink-600'}`}>
                            {applyingTo === job.id ? <Loader2 size={16} className="animate-spin" /> : 'Candidatar-se Aqui'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={`mt-6 pt-5 flex gap-6 text-xs font-bold uppercase tracking-wider relative z-10 ${isPremium ? 'border-t border-amber-500/20 text-amber-500/70' : 'border-t border-white/5 text-slate-400'}`}>
                      <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.link_url ? 'Vaga Externa Remota' : 'Recrutamento Interno (Fit Cultural)'}</span>
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> Postado em {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};