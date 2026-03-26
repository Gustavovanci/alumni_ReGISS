import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, Plus, Building, Briefcase, Clock, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';

export const Jobs = () => {
  const { userProfile, allProfiles, fetchAllProfiles } = useStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newJob, setNewJob] = useState({ description: '', link: '', company: '' });

  useEffect(() => {
    fetchJobs();
    fetchAllProfiles(); // Importante para ter a lista de quem notificar
  }, []);

  const fetchJobs = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(full_name)')
      .eq('type', 'vacancy')
      .gt('expires_at', now)
      .order('created_at', { ascending: false });
    setJobs(data || []);
  };

  const handlePostJob = async () => {
    if (!newJob.description || !newJob.company) return toast.error("Preencha os campos.");
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      // 1. Criar a Vaga na tabela Posts
      const { data: jobPost, error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        title: `${newJob.company} — Nova Vaga`,
        content: newJob.description,
        type: 'vacancy',
        link_url: newJob.link || null,
        expires_at: expiresAt.toISOString()
      }).select().single();

      if (postError) throw postError;

      // 2. Notificar TODOS os usuários (exceto quem postou)
      if (allProfiles.length > 0) {
        const notifications = allProfiles
          .filter(p => p.id !== user.id)
          .map(profile => ({
            user_id: profile.id,
            actor_id: user.id,
            type: 'vacancy',
            title: 'Nova Vaga Disponível!',
            content: `${newJob.company} publicou uma nova oportunidade no mural.`,
            read: false
          }));

        // Inserção em lote (batch) para performance
        await supabase.from('notifications').insert(notifications);
      }

      toast.success("Vaga publicada e rede notificada!");
      setIsCreating(false);
      setNewJob({ company: '', description: '', link: '' });
      fetchJobs();

    } catch (error: any) {
      toast.error("Erro ao publicar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#142239] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between mb-8">
          <h1 className="text-2xl font-bold">Mural de <span className="text-[#D5205D]">Vagas</span></h1>
          <button onClick={() => setIsCreating(!isCreating)} className="bg-[#D5205D] px-6 py-2 rounded-xl font-bold">
            {isCreating ? 'Cancelar' : 'Divulgar Vaga'}
          </button>
        </div>

        {isCreating && (
          <div className="bg-[#15335E] p-6 rounded-3xl mb-8 border border-[#D5205D]/30">
            <input
              placeholder="Empresa"
              className="w-full bg-[#142239] p-4 rounded-xl mb-4 outline-none border border-white/10"
              value={newJob.company}
              onChange={e => setNewJob({ ...newJob, company: e.target.value })}
            />
            <textarea
              placeholder="Descrição da vaga..."
              className="w-full bg-[#142239] p-4 rounded-xl mb-4 h-32 outline-none border border-white/10"
              value={newJob.description}
              onChange={e => setNewJob({ ...newJob, description: e.target.value })}
            />
            <button
              onClick={handlePostJob}
              disabled={isSubmitting}
              className="w-full bg-[#D5205D] py-4 rounded-xl font-bold flex justify-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Publicar e Notificar Todos'}
            </button>
          </div>
        )}

        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-[#15335E] p-6 rounded-3xl border border-white/5">
              <h3 className="text-xl font-bold text-[#D5205D]">{job.title}</h3>
              <p className="text-slate-300 mt-2">{job.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};