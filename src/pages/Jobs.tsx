import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, Plus, Calendar, Loader2 } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';

// Componente de Carregamento (Skeleton)
const JobSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-[#15335E] rounded-3xl p-6 md:p-8 border border-white/5 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-48 mb-3"></div>
        <div className="h-4 bg-white/5 rounded w-32"></div>
        <div className="h-24 bg-white/5 rounded-xl w-full mt-4"></div>
      </div>
    ))}
  </div>
);

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
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(full_name, entry_year, profession, role)')
        .eq('type', 'vacancy')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (user) {
        const { data: myApps } = await supabase
          .from('job_applications')
          .select('job_id, status')
          .eq('applicant_id', user.id);
        setApplications(myApps || []);
      }
      setJobs(data || []);
    } catch (error) {
      toast.error("Erro ao carregar o mural de vagas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Realtime Subscription
    const channel = supabase.channel('vacancies-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchJobs())
      .subscribe();

    fetchAllProfiles();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePostJob = async () => {
    if (!newJob.description || !newJob.company) return toast.error("Preencha os campos obrigatórios.");
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: `${newJob.company} - Oportunidade`,
        content: newJob.description,
        type: 'vacancy',
        link_url: newJob.link || null,
        expires_at: expiresAt.toISOString()
      });

      if (error) throw error;
      toast.success("Vaga publicada!");
      setIsCreating(false);
      setNewJob({ company: '', description: '', link: '', isPremium: false });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mural de <span className="text-[#D5205D]">Vagas</span></h1>
          <button onClick={() => setIsCreating(!isCreating)} className="bg-[#D5205D] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
            <Plus size={18} /> Divulgar
          </button>
        </div>

        {isCreating && (
          <div className="bg-[#15335E] p-6 rounded-3xl mb-8 border border-[#D5205D]/30">
            <input
              placeholder="Empresa"
              className="w-full bg-[#142239] p-3 rounded-xl mb-4 border border-white/10"
              value={newJob.company}
              onChange={e => setNewJob({ ...newJob, company: e.target.value })}
            />
            <textarea
              placeholder="Descrição da vaga..."
              className="w-full bg-[#142239] p-3 rounded-xl mb-4 border border-white/10 h-32"
              value={newJob.description}
              onChange={e => setNewJob({ ...newJob, description: e.target.value })}
            />
            <button
              onClick={handlePostJob}
              disabled={isSubmitting}
              className="w-full bg-[#D5205D] py-3 rounded-xl font-bold flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Publicar Agora'}
            </button>
          </div>
        )}

        {loading ? <JobSkeleton /> : (
          <div className="space-y-4">
            {jobs.map(job => {
              const status = getRegissStatus(job.profiles?.entry_year, job.profiles?.role);
              return (
                <div key={job.id} className="bg-[#15335E] border border-white/5 p-6 rounded-3xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">{job.title}</h3>
                      <p className="text-slate-400 text-sm mt-2">{job.content}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={14} /> {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    {job.link_url ? (
                      <a href={job.link_url} target="_blank" className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        Ver Vaga <ExternalLink size={14} />
                      </a>
                    ) : (
                      <button className="bg-[#D5205D] text-white px-4 py-2 rounded-lg text-sm font-bold">Candidatar-se</button>
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