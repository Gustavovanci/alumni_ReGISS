import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, Plus, Building, Briefcase, Clock, Calendar, Check, Loader2, MapPin } from 'lucide-react';
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
        .select('*, profiles(full_name, entry_year, profession, role)')
        .eq('type', 'vacancy')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: myApps } = await supabase.from('job_applications').select('job_id').eq('applicant_id', user.id);
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
      if (!user) throw new Error("Sessão inválida.");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: `${newJob.company} — ${newJob.description.slice(0, 50)}...`,
        content: newJob.description,
        type: 'vacancy',
        link_url: newJob.link || null,
        expires_at: expiresAt.toISOString()
      });

      if (error) throw error;

      toast.success("Vaga divulgada com sucesso!");
      setIsCreating(false);
      setNewJob({ company: '', description: '', link: '', isPremium: false });
      fetchJobs();

    } catch (error: any) {
      toast.error(error.message || "Falha ao publicar.");
    } finally {
      setIsSubmitting(false); // Destrava o botão aconteça o que acontecer
    }
  };

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Mural de <span className="text-[#D5205D]">Vagas</span></h1>
            <p className="text-slate-400 text-sm mt-1">Oportunidades exclusivas para a comunidade</p>
          </div>
          <button onClick={() => setIsCreating(!isCreating)} className="bg-[#D5205D] hover:bg-pink-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg">
            <Plus size={18} /> {isCreating ? 'Cancelar' : 'Divulgar Vaga'}
          </button>
        </div>

        {/* FORMULÁRIO COM O DESIGN QUE VOCÊ GOSTA */}
        {isCreating && (
          <div className="bg-[#15335E] border border-[#D5205D]/50 rounded-3xl p-6 md:p-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-xl">
              <Briefcase className="text-[#D5205D]" /> Nova Oportunidade
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Empresa</label>
                <div className="flex items-center bg-[#142239] rounded-xl mt-1 px-4 border border-white/10 focus-within:border-[#D5205D] transition-colors">
                  <Building size={18} className="text-slate-500" />
                  <input
                    type="text"
                    value={newJob.company}
                    onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                    className="w-full bg-transparent border-none p-3.5 text-white outline-none"
                    placeholder="Ex: Hospital das Clínicas"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Link da Vaga (Opcional)</label>
                <div className="flex items-center bg-[#142239] rounded-xl mt-1 px-4 border border-white/10 focus-within:border-[#D5205D] transition-colors">
                  <ExternalLink size={18} className="text-slate-500" />
                  <input
                    type="text"
                    value={newJob.link}
                    onChange={e => setNewJob({ ...newJob, link: e.target.value })}
                    className="w-full bg-transparent border-none p-3.5 text-white outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase">Descrição Completa</label>
              <textarea
                value={newJob.description}
                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white mt-1 h-32 resize-none outline-none focus:border-[#D5205D] transition-colors"
                placeholder="Detalhes da vaga, requisitos e como se candidatar..."
              />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={14} /> Ficará visível por 15 dias no mural.</p>
              <button
                onClick={handlePostJob}
                disabled={isSubmitting}
                className="w-full md:w-auto bg-[#D5205D] hover:bg-pink-600 disabled:opacity-50 text-white px-12 py-3.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Publicação'}
              </button>
            </div>
          </div>
        )}

        {/* LISTA DE VAGAS COM O DESIGN PREMIUM */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-[#D5205D]" /></div>
          ) : jobs.map(job => {
            const profile = job.profiles || {};
            const status = getRegissStatus(profile.entry_year, profile.role);
            return (
              <div key={job.id} className="bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 hover:border-[#D5205D]/30 transition-all group relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-bl-2xl border-l border-b border-white/5">
                  Vaga Ativa
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#142239] flex items-center justify-center shrink-0 border border-white/5 text-[#D5205D]">
                    <Building size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-white">{job.title.split('—')[0]}</h3>
                    <p className="mt-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{job.content}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${status.color}`}>{status.label}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={14} /> {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {job.link_url ? (
                      <a href={job.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-white text-[#142239] rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                        Ver Vaga <ExternalLink size={16} />
                      </a>
                    ) : (
                      <button className="px-6 py-3 bg-[#D5205D] text-white rounded-xl font-bold text-sm hover:bg-pink-600 transition-all">
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