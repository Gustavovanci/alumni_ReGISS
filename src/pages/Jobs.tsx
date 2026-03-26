import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, Plus, Building, Briefcase, Clock, Calendar, Loader2, Link as LinkIcon } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';

export const Jobs = () => {
  const { allProfiles, fetchAllProfiles } = useStore();
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
      if (!user) throw new Error("Sessão expirada.");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      // 1. Inserir a Vaga
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        title: `${newJob.company} — Oportunidade`,
        content: newJob.description,
        type: 'vacancy',
        link_url: newJob.link || null, // Aqui salvamos o link
        expires_at: expiresAt.toISOString()
      });

      if (postError) throw postError;

      // 2. Notificar a rede
      if (allProfiles.length > 0) {
        const notifications = allProfiles
          .filter(p => p.id !== user.id)
          .map(profile => ({
            user_id: profile.id,
            actor_id: user.id,
            type: 'vacancy',
            title: 'Nova Vaga no Mural!',
            content: `${newJob.company} postou uma oportunidade. Confira!`,
            read: false
          }));
        await supabase.from('notifications').insert(notifications);
      }

      toast.success("Vaga publicada e rede notificada!");
      setIsCreating(false);
      setNewJob({ company: '', description: '', link: '' });
      fetchJobs();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Mural de <span className="text-[#D5205D]">Vagas</span></h1>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-[#D5205D] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
          >
            {isCreating ? 'Cancelar' : <><Plus size={20} /> Divulgar</>}
          </button>
        </div>

        {/* FORMULÁRIO */}
        {isCreating && (
          <div className="bg-[#15335E] border border-[#D5205D]/30 rounded-[32px] p-6 md:p-10 mb-10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empresa</label>
                <div className="flex items-center bg-[#142239] rounded-2xl px-4 border border-white/5 focus-within:border-[#D5205D]">
                  <Building size={18} className="text-slate-500" />
                  <input
                    type="text"
                    value={newJob.company}
                    onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                    className="w-full bg-transparent border-none py-4 px-3 text-white outline-none"
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Link / E-mail</label>
                <div className="flex items-center bg-[#142239] rounded-2xl px-4 border border-white/5 focus-within:border-[#D5205D]">
                  <LinkIcon size={18} className="text-slate-500" />
                  <input
                    type="text"
                    value={newJob.link}
                    onChange={e => setNewJob({ ...newJob, link: e.target.value })}
                    className="w-full bg-transparent border-none py-4 px-3 text-white outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <textarea
              value={newJob.description}
              onChange={e => setNewJob({ ...newJob, description: e.target.value })}
              className="w-full bg-[#142239] border border-white/5 rounded-2xl p-5 text-white h-40 mb-6 outline-none focus:border-[#D5205D]"
              placeholder="Descrição da vaga..."
            />

            <button
              onClick={handlePostJob}
              disabled={isSubmitting}
              className="w-full bg-[#D5205D] py-4 rounded-2xl font-bold flex justify-center items-center gap-3"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Confirmar e Notificar Todos'}
            </button>
          </div>
        )}

        {/* LISTA DE VAGAS */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#D5205D]" size={40} /></div>
          ) : jobs.map(job => {
            const profile = job.profiles || {};
            const status = getRegissStatus(profile.entry_year, profile.role);
            return (
              <div key={job.id} className="bg-[#15335E] border border-white/5 rounded-[32px] p-6 md:p-8 hover:border-[#D5205D]/40 transition-all shadow-xl">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#142239] flex items-center justify-center shrink-0 border border-white/5 text-[#D5205D]">
                    <Building size={32} />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-2xl text-white">{job.title.split('—')[0]}</h3>
                    <div className="flex items-center gap-3 mt-1 mb-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg uppercase font-black ${status.color}`}>{status.label}</span>
                      <span className="text-xs text-slate-500">{profile.full_name}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-4">{job.content}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar size={14} /> Publicado em {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* BOTÃO DE LINK CORRIGIDO */}
                  <div className="shrink-0 flex items-center">
                    {job.link_url && (
                      <a
                        href={job.link_url.startsWith('http') ? job.link_url : `https://${job.link_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 bg-white text-[#142239] rounded-xl font-bold text-sm hover:bg-slate-200 transition-all shadow-lg"
                      >
                        Ver Vaga <ExternalLink size={16} />
                      </a>
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