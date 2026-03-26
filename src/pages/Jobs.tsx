import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, Plus, Building, Briefcase, Clock, Calendar, Loader2 } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';
import { sendPushNotification } from '../utils/pushNotifications'; // Importação do Push

export const Jobs = () => {
  const { allProfiles, fetchAllProfiles } = useStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newJob, setNewJob] = useState({
    company: '',
    description: '',
    link: '',
  });

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
      console.error(error);
      toast.error('Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchAllProfiles();
  }, []);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.company || !newJob.description) {
      return toast.error('Empresa e descrição são obrigatórias');
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: newJob.description,
        type: 'vacancy',
        link_url: newJob.link || null,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      // === INÍCIO DO GATILHO DE NOTIFICAÇÃO PUSH ===
      // Pegamos o nome da empresa para usar no título
      const pushTitle = `🚀 Nova Vaga: ${newJob.company}`;

      // Criamos um resumo de até 60 caracteres para não estourar a tela do celular
      let pushBody = newJob.description.split('\n')[0]; // Pega a primeira linha da descrição
      if (pushBody.length > 60) {
        pushBody = pushBody.substring(0, 60) + '...';
      }

      // Dispara o alerta para todos os aparelhos inscritos (Background)
      sendPushNotification(pushTitle, pushBody, '/jobs');
      // === FIM DO GATILHO ===

      toast.success('Vaga publicada com sucesso!');
      setIsCreating(false);
      setNewJob({ company: '', description: '', link: '' });
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao publicar vaga');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mural de <span className="text-[#D5205D]">Vagas</span></h1>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-[#D5205D] hover:bg-pink-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 text-white transition-all"
          >
            {isCreating ? 'Cancelar' : <><Plus size={20} /> Divulgar Vaga</>}
          </button>
        </div>

        {/* Formulário de Nova Vaga */}
        {isCreating && (
          <div className="bg-[#15335E] border border-[#D5205D]/30 rounded-3xl p-8 mb-10 shadow-2xl animate-in fade-in slide-in-from-top-4">
            <form onSubmit={handlePostJob} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empresa / Instituição</label>
                <input
                  type="text"
                  value={newJob.company}
                  onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                  className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D] transition-colors mt-2"
                  placeholder="Ex: Hospital Sírio-Libanês"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição da Vaga</label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 h-40 text-white outline-none focus:border-[#D5205D] transition-colors mt-2"
                  placeholder="Descreva o cargo, requisitos e como se candidatar..."
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Link para Inscrição (opcional)</label>
                <input
                  type="url"
                  value={newJob.link}
                  onChange={(e) => setNewJob({ ...newJob, link: e.target.value })}
                  className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D] transition-colors mt-2"
                  placeholder="https://gupy.io/..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#D5205D] hover:bg-pink-600 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 shadow-lg"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : 'Publicar Vaga e Notificar Rede'}
              </button>
            </form>
          </div>
        )}

        {/* Lista de Vagas */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#D5205D]" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-[#15335E] border border-dashed border-white/10 rounded-3xl">
            <p className="text-slate-400">Nenhuma vaga ativa no momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => {
              const profile = job.profiles || {};
              const status = getRegissStatus(profile.entry_year, profile.role);

              return (
                <div key={job.id} className="bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 hover:border-[#D5205D]/30 transition-all shadow-xl">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-16 h-16 bg-[#142239] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-white/5">
                      <Building size={32} className="text-slate-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-2xl text-white mb-2">{job.content.split('\n')[0]}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className={`px-3 py-1 rounded-full border ${status.color} ${status.border}`}>
                          {status.label}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <Briefcase size={12} /> Publicado por {profile.full_name}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock size={12} /> Expira em 15 dias
                        </span>
                      </div>

                      <p className="text-slate-300 mt-6 leading-relaxed whitespace-pre-wrap break-words">
                        {job.content}
                      </p>

                      {job.link_url && (
                        <a
                          href={job.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-6 bg-[#142239] border border-[#D5205D]/50 text-[#D5205D] hover:bg-[#D5205D] hover:text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
                        >
                          Ver vaga completa <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
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