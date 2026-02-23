import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building, Plus, Users, Target, Check, XCircle, Activity, ExternalLink, Trash2, Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const CompanyDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [jobsList, setJobsList] = useState<any[]>([]);
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [applicationsList, setApplicationsList] = useState<any[]>([]);

    const [isCreatingJob, setIsCreatingJob] = useState(false);
    const [newJob, setNewJob] = useState({ title: '', description: '', link: '', tags: '' });

    useEffect(() => {
        fetchMyJobs();
    }, []);

    const fetchMyJobs = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('posts')
            .select('*')
            .eq('type', 'vacancy')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        setJobsList(data || []);
        setLoading(false);
    };

    const handleCreateJob = async () => {
        if (!newJob.title || !newJob.description) {
            return toast.error("Preencha título e descrição.");
        }

        const { data: { user } } = await supabase.auth.getUser();

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // Vaga dura 30 dias

        // Formatar as tags inseridas pela empresa
        const formattedTags = newJob.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);

        const contentString = `[PREMIUM_JOB] [Sua Empresa] ${newJob.title} \n\n ${newJob.description}`;

        const { error } = await supabase.from('posts').insert({
            user_id: user?.id,
            content: contentString,
            type: 'vacancy',
            link_url: newJob.link ? (newJob.link.startsWith('http') ? newJob.link : `https://${newJob.link}`) : null,
            expires_at: expiresAt.toISOString(),
            job_tags: formattedTags
        });

        if (error) {
            console.error(error);
            toast.error("Erro ao publicar vaga.");
        } else {
            toast.success("Vaga publicada com sucesso!");
            setIsCreatingJob(false);
            setNewJob({ title: '', description: '', link: '', tags: '' });
            fetchMyJobs();
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (!confirm("Tem certeza que deseja apagar esta vaga? (Isso também apagará as candidaturas atreladas a ela)")) return;
        await supabase.from('posts').delete().eq('id', id);
        toast.success("Vaga apagada.");
        fetchMyJobs();
    };

    const handleViewJobApplications = async (job: any) => {
        setSelectedJob(job);
        const { data } = await supabase
            .from('job_applications')
            .select('*, profiles(full_name, profession, avatar_url, entry_year)')
            .eq('job_id', job.id)
            .order('match_score', { ascending: false });

        setApplicationsList(data || []);
    };

    const handleRejectApplication = async (appId: string, applicantId: string) => {
        const reason = prompt("FIM DO VÁCUO: Motivo da recusa para feedback ao candidato (Ex: Experiência incompatível com o momento):");
        if (!reason) return toast.error("Feedback é obrigatório para manter a transparência.");

        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('job_applications').update({ status: 'rejected', feedback: reason }).eq('id', appId);

        const jobTitle = selectedJob?.content?.split('] ')[2]?.split('\n')[0] || 'Vaga';

        // Notifica o candidato
        await supabase.from('notifications').insert({
            user_id: applicantId,
            actor_id: user?.id,
            type: 'system',
            content: `Sua candidatura para "${jobTitle}" foi avaliada. Feedback do RH: ${reason}`
        });

        setApplicationsList(prev => prev.map(app => app.id === appId ? { ...app, status: 'rejected', feedback: reason } : app));
        toast.success("Candidato dispensado e feedback enviado!");
    };

    const handleApproveApplication = async (appId: string, applicantId: string) => {
        const message = prompt("Mensagem para o candidato (Ex: Adoramos seu perfil! Segue o link da entrevista: ...):");
        if (!message) return;

        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('job_applications').update({ status: 'approved', feedback: 'Avançou no Processo' }).eq('id', appId);

        const jobTitle = selectedJob?.content?.split('] ')[2]?.split('\n')[0] || 'Vaga';

        await supabase.from('notifications').insert({
            user_id: applicantId,
            actor_id: user?.id,
            type: 'system',
            content: `Avanço de Fase! A empresa quer falar com você sobre a "${jobTitle}". Mensagem do RH: ${message}`
        });

        setApplicationsList(prev => prev.map(app => app.id === appId ? { ...app, status: 'approved' } : app));
        toast.success("Candidato aprovado e notificado!");
    };

    if (loading) return <div className="min-h-screen bg-[#142239] flex items-center justify-center text-white"><Loader2 className="w-10 h-10 text-[#D5205D] animate-spin" /></div>;

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 text-slate-100 pb-20">
            <div className="flex items-center gap-4 mb-8 bg-[#15335E] p-6 rounded-3xl border border-white/5 shadow-2xl">
                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
                    <Building size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Portal B2B Parceiros</h1>
                    <p className="text-slate-400 font-medium">Gerencie suas vagas, encontre talentos aderentes e impulsione sua equipe.</p>
                </div>
            </div>

            {!selectedJob ? (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Target className="text-blue-500" /> Suas Vagas Ativas</h2>
                        <button onClick={() => setIsCreatingJob(!isCreatingJob)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20">
                            <Plus size={18} /> Nova Vaga
                        </button>
                    </div>

                    {isCreatingJob && (
                        <div className="bg-[#15335E] border border-blue-500/30 rounded-3xl p-6 mb-8 shadow-xl animate-fadeIn">
                            <h3 className="text-lg font-bold text-white mb-4">Postar Nova Vaga</h3>
                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <input type="text" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors" placeholder="Título da Vaga (Ex: Enfermeiro Obstetra Sênior)" />

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Descrição</label>
                                    <textarea value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white h-32 resize-none outline-none focus:border-blue-500 transition-colors" placeholder="Descreva as responsabilidades, requisitos e benefícios da vaga..."></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Interesses / Tags para Match</label>
                                        <input type="text" value={newJob.tags} onChange={e => setNewJob({ ...newJob, tags: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500 text-sm transition-colors" placeholder="Ex: Gestão, Plantão, Pediatria (Separados por vírgula)" />
                                        <p className="text-[10px] text-blue-400 ml-1">O Algoritmo cruzará essas tags com o perfil dos alunos.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Link Externo (Opcional)</label>
                                        <div className="flex items-center bg-[#142239] border border-white/10 rounded-xl px-4 focus-within:border-blue-500 transition-colors">
                                            <ExternalLink size={18} className="text-slate-500" />
                                            <input type="text" value={newJob.link} onChange={e => setNewJob({ ...newJob, link: e.target.value })} className="w-full bg-transparent p-4 text-white outline-none text-sm" placeholder="Deixe em branco para receber currículos aqui" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                                <button onClick={() => setIsCreatingJob(false)} className="text-slate-400 px-6 py-2.5 font-bold hover:text-white transition-colors">Cancelar</button>
                                <button onClick={handleCreateJob} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all">Publicar Agora</button>
                            </div>
                        </div>
                    )}

                    {jobsList.length === 0 && !isCreatingJob ? (
                        <div className="text-center py-20 border border-white/5 border-dashed rounded-3xl bg-[#15335E]">
                            <Target size={48} className="text-slate-600 mx-auto mb-4 opacity-50" />
                            <p className="text-slate-400 font-bold mb-2">Sua empresa ainda não publicou vagas.</p>
                            <p className="text-slate-500 text-sm">Clique em "Nova Vaga" para começar a captar talentos no HC Alumni.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobsList.map(job => {
                                const cleanTitle = job.content?.replace(/\[PREMIUM_JOB\] \[(.*?)\]/g, '').trim().split('\n')[0];

                                return (
                                    <div key={job.id} className="bg-[#15335E] hover:bg-[#1E3A5F] border border-white/10 hover:border-blue-500/50 p-6 rounded-3xl cursor-pointer transition-all shadow-xl group flex flex-col relative overflow-hidden">
                                        <div className="absolute top-4 right-4 z-10">
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }} className="text-slate-500 hover:text-red-400 bg-[#142239] p-2 rounded-lg transition-colors border border-white/5 hover:border-red-500/30">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div onClick={() => handleViewJobApplications(job)} className="flex flex-col h-full">
                                            <div className="w-12 h-12 bg-[#142239] rounded-xl flex items-center justify-center mb-4 border border-white/5 text-blue-500 group-hover:scale-110 transition-transform"><Briefcase size={20} /></div>
                                            <h3 className="text-white font-bold text-lg mb-2 leading-tight pr-8">{cleanTitle}</h3>

                                            <div className="mb-6 mt-2">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1"><Activity size={12} /> Match Tags:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {job.job_tags ? job.job_tags.map((t: string, i: number) => (
                                                        <span key={i} className="text-[10px] bg-[#142239] px-2 py-1 rounded text-slate-300 border border-white/5">{t}</span>
                                                    )) : <span className="text-[10px] text-slate-600 italic">Curadoria manual (Sem tags)</span>}
                                                </div>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                                                <span className="text-xs text-slate-400 flex items-center gap-2"><Users size={14} className="text-blue-400" /> Ver Candidaturas</span>
                                                <span className="text-blue-500 group-hover:translate-x-1 transition-transform">→</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-[#15335E] border border-white/10 rounded-3xl p-6 shadow-2xl relative animate-fadeIn">
                    <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2 font-bold transition-colors">← Voltar para Minhas Vagas</button>

                    <div className="border-b border-white/5 pb-6 mb-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{selectedJob.content?.replace(/\[PREMIUM_JOB\] \[(.*?)\]/g, '').trim().split('\n')[0]}</h3>
                        <p className="text-slate-400 text-sm">Abaixo estão os profissionais que se interessaram pela sua vaga, ordenados pelo nosso motor de aderência (Fit Cultural).</p>
                    </div>

                    {applicationsList.length === 0 ? (
                        <div className="text-center py-20 bg-[#142239] border border-white/5 border-dashed rounded-3xl">
                            <Users size={48} className="text-slate-600 mx-auto mb-4 opacity-50" />
                            <p className="text-slate-400 font-bold text-lg">Ainda não há candidatos.</p>
                            <p className="text-slate-500 text-sm">Divulgue sua vaga para alcançar mais residentes e alumni.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applicationsList.map((app, idx) => (
                                <div key={app.id} className="bg-[#142239] border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-inner relative overflow-hidden group hover:border-blue-500/20 transition-all">
                                    {/* Match Indicators */}
                                    {app.match_score >= 80 && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-green-400 to-emerald-600"></div>}
                                    {app.match_score > 0 && app.match_score < 80 && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>}
                                    {app.match_score === 0 && <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-700"></div>}

                                    <div className="flex items-center gap-5 flex-1 pl-2">
                                        <div className="w-16 h-16 rounded-full border-2 border-[#15335E] overflow-hidden shrink-0 shadow-lg">
                                            {app.profiles?.avatar_url ? <img src={app.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-xl">{app.profiles?.full_name?.charAt(0)}</div>}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-white font-bold text-lg">{app.profiles?.full_name}</h4>
                                                <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${app.match_score >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : app.match_score > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                                                    {app.match_score}% Fit
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400">{app.profiles?.profession} • Turma {app.profiles?.entry_year}</p>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto mt-4 md:mt-0">
                                        {app.status === 'pending' ? (
                                            <div className="flex gap-3 w-full">
                                                <button onClick={() => handleRejectApplication(app.id, app.applicant_id)} className="flex-1 md:flex-none border border-red-500/30 text-red-400 hover:bg-red-500/10 px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"><XCircle size={16} /> Dispensar</button>
                                                <button onClick={() => handleApproveApplication(app.id, app.applicant_id)} className="flex-[2] md:flex-none bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"><Check size={16} /> Chamar p/ Entrevista</button>
                                            </div>
                                        ) : (
                                            <div className={`px-6 py-3 rounded-xl border text-xs font-bold w-full text-center tracking-wide ${app.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800/50 text-slate-400 border-white/5'}`}>
                                                {app.status === 'approved' ? 'Aprovado para Entrevista ✓' : 'Dispensado (Feedback Enviado)'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
