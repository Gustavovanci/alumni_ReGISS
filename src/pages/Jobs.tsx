import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, Plus, Building, MapPin, Briefcase, Clock, Calendar, Check, Loader2 } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';

export const Jobs = () => {
  const { userProfile, allProfiles, fetchAllProfiles } = useStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  const [newJob, setNewJob] = useState({ description: '', link: '', company: '', isPremium: false });

  const fetchJobs = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(full_name, entry_year, role)')
        .eq('type', 'vacancy')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: myApps } = await supabase
          .from('job_applications')
          .select('job_id')
          .eq('applicant_id', user.id);
        setApplications(myApps || []);
      }
    } catch (error) {
      console.error("Erro ao buscar vagas:", error);
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
      return toast.error("Empresa e Descrição são obrigatórias.");
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      // 1. Inserção da Vaga
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        title: `${newJob.company} — Oportunidade`,
        content: newJob.description,
        type: 'vacancy',
        link_url: newJob.link || null,
        expires_at: expiresAt.toISOString()
      });

      if (postError) throw postError;

      toast.success("Vaga publicada!");
      setIsCreating(false);
      setNewJob({ company: '', description: '', link: '', isPremium: false });
      fetchJobs();

      // 2. Notificações em Background (Não trava a UI)
      if (allProfiles.length > 0) {
        const batch = allProfiles
          .filter(p => p.id !== user.id)
          .slice(0, 50) // Limite de 50 para performance
          .map(t => ({
            user_id: t.id,
            actor_id: user.id,
            type: 'vacancy',
            title: 'Nova Vaga',
            content: `${userProfile?.full_name?.split(' ')[0]} postou uma vaga em ${newJob.company}`,
            read: false
          }));

        supabase.from('notifications').insert(batch).then();
      }

    } catch (error: any) {
      toast.error(error.message || "Erro ao publicar.");
    } finally {
      setIsSubmitting(false); // GARANTE que o botão pare de carregar
    }
  };

  return (
    <div className="min-h-screen bg-[#142239] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mural de <span className="text-[#D5205D]">Vagas</span></h1>
          <button onClick={() => setIsCreating(!isCreating)} className="bg-[#D5205D] px-6 py-2 rounded-xl font-bold flex items-center gap-2">
            <Plus size={18} /> {isCreating ? 'Fechar' : 'Divulgar'}
          </button>
        </div>

        {isCreating && (
          <div className="bg-[#15335E] p-6 rounded-3xl mb-8 border border-white/10">
            <input
              placeholder="Nome da Empresa"
              className="w-full bg-[#142239] p-4 rounded-xl mb-4 border border-white/10 outline-none focus:border-[#D5205D]"
              value={newJob.company}
              onChange={e => setNewJob({ ...newJob, company: e.target.value })}
            />
            <textarea
              placeholder="Descrição e requisitos..."
              className="w-full bg-[#142239] p-4 rounded-xl mb-4 border border-white/10 h-32 outline-none focus:border-[#D5205D]"
              value={newJob.description}
              onChange={e => setNewJob({ ...newJob, description: e.target.value })}
            />
            <button
              onClick={handlePostJob}
              disabled={isSubmitting}
              className="w-full bg-[#D5205D] py-4 rounded-xl font-bold flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar Publicação'}
            </button>
          </div>
        )}

        {loading ? <p>Carregando...</p> : (
          <div className="space-y-4">
            {jobs.map(job => {
              const status = getRegissStatus(job.profiles?.entry_year, job.profiles?.role);
              return (
                <div key={job.id} className="bg-[#15335E] p-6 rounded-3xl border border-white/5">
                  <div className="flex justify-between">
                    <h3 className="text-xl font-bold">{job.title}</h3>
                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${status.color}`}>{status.label}</span>
                  </div>
                  <p className="text-slate-400 mt-3 text-sm">{job.content}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-slate-500">{new Date(job.created_at).toLocaleDateString()}</span>
                    {job.link_url && (
                      <a href={job.link_url} target="_blank" className="text-[#D5205D] flex items-center gap-1 font-bold text-sm">
                        Ver Detalhes <ExternalLink size={14} />
                      </a>
                    )}
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