import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, GraduationCap, Building2, Megaphone, Search, Filter, Award, Loader2, Briefcase, Send, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getRegissStatus } from '../utils/regissLogic';

export const Coordination = () => {
    const [activeTab, setActiveTab] = useState<'students' | 'announcements' | 'jobs'>('students');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ r1: 0, r2: 0, alumni: 0 });

    const [students, setStudents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'R1' | 'R2' | 'Alumni'>('all');

    const [announcementText, setAnnouncementText] = useState('');
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementLink, setAnnouncementLink] = useState('');
    const [targetAudience, setTargetAudience] = useState<'all' | 'r1' | 'r2' | 'residents'>('all');
    const [isPosting, setIsPosting] = useState(false);

    const [jobTitle, setJobTitle] = useState('');
    const [jobLink, setJobLink] = useState('');
    const [jobCompany, setJobCompany] = useState('');
    const [isPostingJob, setIsPostingJob] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: profiles, error } = await supabase.from('profiles').select('*');
            if (error) throw error;

            const validProfiles = profiles?.filter(p => p.role !== 'admin' && p.role !== 'coordinator') || [];

            let r1Count = 0;
            let r2Count = 0;
            let alumniCount = 0;

            const classified = validProfiles.map(p => {
                const status = getRegissStatus(p.entry_year, p.role);
                if (status.label === 'R1') r1Count++;
                else if (status.label === 'R2') r2Count++;
                else if (status.label.includes('Alumni')) alumniCount++;
                return { ...p, statusData: status };
            });

            setStats({ r1: r1Count, r2: r2Count, alumni: alumniCount });
            setStudents(classified);

        } catch (err: any) {
            toast.error("Erro ao carregar dados: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePostAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementTitle.trim() || !announcementText.trim()) return toast.error("Título e Mensagem são obrigatórios.");
        setIsPosting(true);

        try {
            const { error } = await supabase.from('system_updates').insert({
                title: announcementTitle,
                content: announcementText,
                target_audience: targetAudience,
                link_url: announcementLink,
                is_active: true
            });
            if (error) throw error;

            toast.success("Aviso publicado com sucesso!");
            setAnnouncementTitle(''); setAnnouncementText(''); setAnnouncementLink('');
        } catch (err: any) {
            toast.error("Falha ao publicar aviso.");
        } finally {
            setIsPosting(false);
        }
    };

    const handlePostJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jobTitle.trim() || !jobLink.trim() || !jobCompany.trim()) return toast.error("Preencha todos os campos obrigatórios.");
        setIsPostingJob(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            let formattedLink = jobLink;
            if (!formattedLink.startsWith('http') && !formattedLink.startsWith('mailto')) formattedLink = `https://${formattedLink}`;

            const { error } = await supabase.from('posts').insert({
                user_id: user?.id,
                content: `🏛️ [VAGA OFICIAL] [${jobCompany}] ${jobTitle}`,
                link_url: formattedLink,
                type: 'vacancy',
                expires_at: expiresAt.toISOString()
            });

            if (error) throw error;

            toast.success("Vaga Institucional publicada no Mural!");
            setJobTitle(''); setJobLink(''); setJobCompany('');
            setActiveTab('students');
        } catch (err: any) {
            toast.error("Falha ao publicar vaga.");
        } finally {
            setIsPostingJob(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.profession && s.profession.toLowerCase().includes(searchTerm.toLowerCase()));

        const isAlumni = s.statusData.label.includes('Alumni');
        const matchesType = filterType === 'all' ? true : filterType === 'Alumni' ? isAlumni : s.statusData.label === filterType;
        return matchesSearch && matchesType;
    }).sort((a, b) => b.entry_year - a.entry_year);

    if (loading) return <div className="min-h-screen bg-[#142239] flex items-center justify-center"><Loader2 className="animate-spin text-[#9D4EDD] w-12 h-12" /></div>;

    return (
        <div className="min-h-screen bg-[#142239] text-slate-100 font-sans p-4 md:p-8 pb-24 relative">
            <div className="max-w-7xl mx-auto relative z-10">

                {/* HEADER PADRONIZADO */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            Gestão <span className="text-[#9D4EDD]">Acadêmica</span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-1 flex items-center gap-2"><Award size={14} className="text-[#9D4EDD]" /> Painel exclusivo da Coordenação ReGISS</p>
                    </div>

                    <div className="flex bg-[#15335E] p-1 rounded-xl border border-white/5 shadow-lg overflow-x-auto max-w-full custom-scrollbar">
                        <button onClick={() => setActiveTab('students')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase flex items-center gap-2 whitespace-nowrap ${activeTab === 'students' ? 'bg-[#9D4EDD] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Users size={16} /> Alunos</button>
                        <button onClick={() => setActiveTab('announcements')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase flex items-center gap-2 whitespace-nowrap ${activeTab === 'announcements' ? 'bg-[#9D4EDD] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Megaphone size={16} /> Avisos</button>
                        <button onClick={() => setActiveTab('jobs')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase flex items-center gap-2 whitespace-nowrap ${activeTab === 'jobs' ? 'bg-[#9D4EDD] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Briefcase size={16} /> Vagas</button>
                    </div>
                </div>

                {/* ESTATÍSTICAS RÁPIDAS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#15335E] border border-white/5 p-6 rounded-3xl flex items-center gap-5 shadow-xl">
                        <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0"><Users size={24} /></div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Residentes R1</p>
                            <p className="text-3xl font-black text-white">{stats.r1}</p>
                        </div>
                    </div>
                    <div className="bg-[#15335E] border border-white/5 p-6 rounded-3xl flex items-center gap-5 shadow-xl">
                        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0"><Users size={24} /></div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Residentes R2</p>
                            <p className="text-3xl font-black text-white">{stats.r2}</p>
                        </div>
                    </div>
                    <div className="bg-[#15335E] border border-white/5 p-6 rounded-3xl flex items-center gap-5 shadow-xl">
                        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0"><GraduationCap size={24} /></div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Base de Alumni</p>
                            <p className="text-3xl font-black text-white">{stats.alumni}</p>
                        </div>
                    </div>
                </div>

                {/* TAB: LISTA DE ALUNOS */}
                {activeTab === 'students' && (
                    <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl animate-fadeIn">
                        <div className="flex flex-col md:flex-row gap-4 mb-8">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input type="text" placeholder="Buscar aluno por nome ou formação..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-[#9D4EDD] transition-colors shadow-inner" />
                            </div>

                            {/* SELECT REFINADO E ESTILIZADO */}
                            <div className="flex items-center gap-2 bg-[#142239] px-4 py-2 rounded-2xl border border-white/10 shadow-inner shrink-0 relative focus-within:border-[#9D4EDD] transition-colors">
                                <Filter size={18} className="text-slate-500" />
                                <select
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value as any)}
                                    style={{ colorScheme: 'dark' }}
                                    className="bg-transparent text-white outline-none pr-2 cursor-pointer text-sm font-bold h-full appearance-none w-full min-w-[180px]"
                                >
                                    <option value="all" className="bg-[#15335E] text-white">Todos (R1, R2, Alumni)</option>
                                    <option value="R1" className="bg-[#15335E] text-white">Apenas R1</option>
                                    <option value="R2" className="bg-[#15335E] text-white">Apenas R2</option>
                                    <option value="Alumni" className="bg-[#15335E] text-white">Apenas Alumni</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStudents.length === 0 ? (
                                <p className="text-slate-500 col-span-full text-center py-10">Nenhum aluno encontrado.</p>
                            ) : (
                                filteredStudents.map(student => (
                                    <div key={student.id} className="bg-[#142239] border border-white/5 p-6 rounded-2xl flex flex-col hover:border-[#9D4EDD]/30 transition-all shadow-lg group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-14 h-14 rounded-full bg-[#15335E] overflow-hidden shrink-0 border-2 ${student.statusData.border} flex items-center justify-center font-bold text-xl text-white`}>
                                                {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover" /> : student.full_name?.charAt(0)}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${student.statusData.color} ${student.statusData.border}`}>
                                                {student.statusData.label}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-white text-lg truncate group-hover:text-[#9D4EDD] transition-colors">{student.full_name}</h3>
                                        <p className="text-sm text-slate-400 truncate mb-4">{student.profession || 'Área não informada'}</p>

                                        <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                                            <p className="text-xs text-slate-500 flex items-center gap-2"><Briefcase size={12} /> {student.job_title || 'Cargo não informado'}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-2"><GraduationCap size={12} /> Turma {student.entry_year}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: AVISOS OFICIAIS */}
                {activeTab === 'announcements' && (
                    <div className="max-w-3xl mx-auto bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl animate-fadeIn">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3"><Megaphone className="text-[#9D4EDD]" /> Disparar Comunicado Oficial</h2>
                            <p className="text-slate-400">Este aviso aparecerá fixado no topo do Feed dos residentes selecionados.</p>
                        </div>

                        <form onSubmit={handlePostAnnouncement} className="space-y-6">
                            <div className="bg-[#142239] p-5 rounded-2xl border border-white/5 shadow-inner">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Público Alvo (4 Opções)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`flex items-center justify-center py-3 px-4 rounded-xl cursor-pointer transition-all border ${targetAudience === 'r1' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#15335E] border-white/5 text-slate-400 hover:bg-white/5'}`}>
                                        <input type="radio" name="target" value="r1" checked={targetAudience === 'r1'} onChange={e => setTargetAudience(e.target.value as any)} className="hidden" />
                                        <span className="font-bold text-sm">Apenas R1</span>
                                    </label>
                                    <label className={`flex items-center justify-center py-3 px-4 rounded-xl cursor-pointer transition-all border ${targetAudience === 'r2' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-[#15335E] border-white/5 text-slate-400 hover:bg-white/5'}`}>
                                        <input type="radio" name="target" value="r2" checked={targetAudience === 'r2'} onChange={e => setTargetAudience(e.target.value as any)} className="hidden" />
                                        <span className="font-bold text-sm">Apenas R2</span>
                                    </label>
                                    <label className={`flex items-center justify-center py-3 px-4 rounded-xl cursor-pointer transition-all border ${targetAudience === 'residents' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-[#15335E] border-white/5 text-slate-400 hover:bg-white/5'}`}>
                                        <input type="radio" name="target" value="residents" checked={targetAudience === 'residents'} onChange={e => setTargetAudience(e.target.value as any)} className="hidden" />
                                        <span className="font-bold text-sm text-center">R1 e R2 (Residência)</span>
                                    </label>
                                    <label className={`flex items-center justify-center py-3 px-4 rounded-xl cursor-pointer transition-all border ${targetAudience === 'all' ? 'bg-[#9D4EDD]/20 border-[#9D4EDD] text-[#9D4EDD]' : 'bg-[#15335E] border-white/5 text-slate-400 hover:bg-white/5'}`}>
                                        <input type="radio" name="target" value="all" checked={targetAudience === 'all'} onChange={e => setTargetAudience(e.target.value as any)} className="hidden" />
                                        <span className="font-bold text-sm text-center">Todos (R1, R2 e Alumni)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Título do Aviso *</label>
                                <input type="text" required value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#9D4EDD] shadow-inner" placeholder="Ex: Prazo para entrega de TCC" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mensagem *</label>
                                <textarea required value={announcementText} onChange={e => setAnnouncementText(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white h-32 resize-none outline-none focus:border-[#9D4EDD] shadow-inner" placeholder="Detalhes do comunicado..."></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Link Relacionado (Opcional)</label>
                                <input type="text" value={announcementLink} onChange={e => setAnnouncementLink(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#9D4EDD] shadow-inner" placeholder="https://..." />
                            </div>

                            <button type="submit" disabled={isPosting} className="w-full bg-[#9D4EDD] hover:bg-purple-600 text-white font-black py-4 rounded-xl mt-4 shadow-[0_0_20px_rgba(157,78,221,0.4)] transition-all disabled:opacity-50 text-lg flex items-center justify-center gap-2">
                                {isPosting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Publicar no Feed</>}
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB: PUBLICAR VAGAS */}
                {activeTab === 'jobs' && (
                    <div className="max-w-3xl mx-auto bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl animate-fadeIn">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3"><Building2 className="text-[#9D4EDD]" /> Enviar Vaga Oficial</h2>
                            <p className="text-slate-400">Esta oportunidade aparecerá na aba de Vagas (Jobs) com o selo institucional da Coordenação.</p>
                        </div>

                        <form onSubmit={handlePostJob} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Instituição / Empresa *</label>
                                    <input type="text" required value={jobCompany} onChange={e => setJobCompany(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#9D4EDD] shadow-inner" placeholder="Ex: FFM, HCFMUSP, ICESP..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Cargo da Vaga *</label>
                                    <input type="text" required value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#9D4EDD] shadow-inner" placeholder="Ex: Analista de Processos Sênior" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Link de Inscrição / E-mail *</label>
                                <input type="text" required value={jobLink} onChange={e => setJobLink(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#9D4EDD] shadow-inner" placeholder="Link Gupy, LinkedIn ou e-mail de contato" />
                            </div>

                            <button type="submit" disabled={isPostingJob} className="w-full bg-[#9D4EDD] hover:bg-purple-600 text-white font-black py-4 rounded-xl mt-8 shadow-[0_0_20px_rgba(157,78,221,0.4)] transition-all disabled:opacity-50 text-lg flex items-center justify-center gap-2">
                                {isPostingJob ? <Loader2 className="animate-spin" size={20} /> : <><PlusCircle size={20} /> Distribuir Vaga na Rede</>}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};