import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, Plus, Building, Briefcase, Clock, Calendar, Loader2, Link as LinkIcon } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';

export const Jobs = () => {
  const { userProfile, allProfiles, fetchAllProfiles } = useStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newJob, setNewJob] = useState({ description: '', link: '', company: '' });

  const fetchJobs = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(full_name, entry_year, role, avatar_url)')
        .eq('type', 'vacancy')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar vagas:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchAllProfiles();
  }, []);

  const handlePostJob = async () => {
    if (!newJob.description || !newJob.company) {
      return toast.error("Por favor, preencha a Empresa e a Descrição.");
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      // Inserção no Banco
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        title: `${newJob.company} — Oportunidade`,
        content: newJob.description,
        type: 'vacancy',
        link_url: newJob.link || null,
        expires_at: expiresAt.toISOString()
      });

      if (postError) throw postError;

      toast.success("Vaga publicada com sucesso!");
      setIsCreating(false);
      setNewJob({ company: '', description: '', link: '' });
      fetchJobs(); // Atualiza a lista automaticamente

    } catch (error: any) {
      console.error("Erro detalhado do post:", error);
      toast.error(error.message || "Erro ao conectar com o banco de dados.");
    } finally {
      // O SEGREDO: Isso garante que o botão saia do modo "carregando"
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 p-4 md:p-8 pb-24 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Mural de <span className="text-[#D5205D]">Vagas</span></h1>
            <p className="text-slate-400 text-sm mt-1">Oportunidades curadas para a rede ReGISS</p>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-[#D5205D] hover:bg-pink-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
          >
            {isCreating ? 'Cancelar' : <><Plus size={20} /> Divulgar</>}
          </button>
        </div>

        {/* FORMULÁRIO DE PREENCHIMENTO */}
        {isCreating && (
          <div className="bg-[#15335E] border border-[#D5205D]/30 rounded-[32px] p-6 md:p-10 mb-10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              <Briefcase className="text-[#D5205D]" /> Nova Vaga
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Empresa</label>
                <div className="flex items-center bg-[#142239] rounded-2xl px-4 border border-white/5 focus-within:border-[#D5205D] transition-all">
                  <Building size={18} className="text-slate-500" />
                  <input
                    type="text"
                    value={newJob.company}
                    onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                    className="w-full bg-transparent border-none py-4 px-3 text-white outline-none placeholder:text-slate-600"
                    placeholder="Ex: HCFMUSP, InCor..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Link de Inscrição</label>
                <div className="flex items-center bg-[#142239] rounded-2xl px-4 border border-white/5 focus-within:border-[#D5205D] transition-all">
                  <LinkIcon size={18} className="text-slate-500" />
                  <input
                    type="text"
                    value={newJob.link}
                    onChange={e => setNewJob({ ...newJob, link: e.target.value })}
                    className="w-full bg-transparent border-none py-4 px-3 text-white outline-none placeholder:text-slate-600"
                    placeholder="Link externo ou e-mail"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Descrição e Requisitos</label>
              <textarea
                value={newJob.description}
                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                className="w-full bg-[#142239] border border-white/5 rounded-2xl p-5 text-white h-40 resize-none outline-none focus:border-[#D5205D] transition-all placeholder:text-slate-600"
                placeholder="Descreva a vaga, requisitos, salário (se houver) e como se candidatar..."
              />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#142239] px-4 py-2 rounded-full">
                <Clock size={14} /> Válido por 15 dias após postagem
              </div>
              <button
                onClick={handlePostJob}
                disabled={isSubmitting}
                className="w-full md:w-auto bg-[#D5205D] hover:bg-pink-600 disabled:opacity-50 text-white px-16 py-4 rounded-2xl font-bold text-base flex justify-center items-center gap-3 transition-all shadow-xl shadow-pink-900/20 active:scale-95"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Confirmar e Publicar'}
              </button>
            </div>
          </div>
        )}

        {/* FEED DE VAGAS */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#D5205D]" size={40} />
              <p className="text-slate-500 font-medium">Sincronizando mural...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-[#15335E]/50 border border-white/5 rounded-[32px] p-16 text-center">
              <Briefcase size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-400">Nenhuma vaga ativa no momento.</p>
            </div>
          ) : jobs.map(job => {
            const profile = job.profiles || {};
            const status = getRegissStatus(profile.entry_year, profile.role);
            return (
              <div key={job.id} className="bg-[#15335E] border border-white/5 rounded-[32px] p-6 md:p-8 hover:border-[#D5205D]/40 transition-all group shadow-xl">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Ícone Lateral */}
                  <div className="w-16 h-16 rounded-2xl bg-[#142239] flex items-center justify-center shrink-0 border border-white/5 text-[#D5205D] group-hover:scale-110 transition-transform">
                    <Building size={32} />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-2xl text-white group-hover:text-[#D5205D] transition-colors">
                          {job.title.split('—')[0]}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg uppercase font-black tracking-tighter ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{profile.full_name}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {job.content}
                    </p>

                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar size={14} /> Publicado em {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Ação */}
                  <div className="shrink-0 flex items-end md:items-start">
                    {job.link_url ? (
                      <a
                        href={job.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-6 py-3.5 bg-white text-[#142239] rounded-2xl font-black text-xs hover:bg-slate-200 transition-all shadow-lg active:scale-95 uppercase"
                      >
                        Ver Detalhes <ExternalLink size={14} />
                      </a>
                    ) : (
                      <button className="px-8 py-3.5 bg-[#D5205D]/10 text-[#D5205D] rounded-2xl font-black text-xs hover:bg-[#D5205D] hover:text-white transition-all uppercase">
                        Candidatar-se
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};