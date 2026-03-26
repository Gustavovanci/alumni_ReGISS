import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Building2, Megaphone, Search, Filter, Award, Loader2, Briefcase, Send, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getRegissStatus } from '../utils/regissLogic';

export const Coordination = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'students' | 'announcements' | 'jobs'>('students');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ r1: 0, r2: 0, alumni: 0 });

    const [students, setStudents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'R1' | 'R2' | 'Alumni'>('all');

    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementText, setAnnouncementText] = useState('');
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
            setAnnouncementTitle('');
            setAnnouncementText('');
            setAnnouncementLink('');
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
            setJobTitle('');
            setJobLink('');
            setJobCompany('');
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#142239] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#9D4EDD] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#142239] text-slate-100 font-sans p-4 md:p-8 pb-24 relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            Gestão <span className="text-[#9D4EDD]">Acadêmica</span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                            <Award size={14} className="text-[#9D4EDD]" /> Painel exclusivo da Coordenação ReGISS
                        </p>
                    </div>

                    <div className="flex bg-[#15335E] p-1 rounded-xl border border-white/5 shadow-lg overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase flex items-center gap-2 whitespace-nowrap ${activeTab === 'students' ? 'bg-[#9D4EDD] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Users size={16} /> Alunos
                        </button>
                        <button
                            onClick={() => setActiveTab('announcements')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase flex items-center gap-2 whitespace-nowrap ${activeTab === 'announcements' ? 'bg-[#9D4EDD] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Megaphone size={16} /> Avisos
                        </button>
                        <button
                            onClick={() => setActiveTab('jobs')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase flex items-center gap-2 whitespace-nowrap ${activeTab === 'jobs' ? 'bg-[#9D4EDD] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Briefcase size={16} /> Vagas
                        </button>
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#15335E] border border-white/5 p-6 rounded-3xl flex items-center gap-5 shadow-xl">
                        <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Residentes R1</p>
                            <p className="text-3xl font-black text-white">{stats.r1}</p>
                        </div>
                    </div>
                    <div className="bg-[#15335E] border border-white/5 p-6 rounded-3xl flex items-center gap-5 shadow-xl">
                        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Residentes R2</p>
                            <p className="text-3xl font-black text-white">{stats.r2}</p>
                        </div>
                    </div>
                    <div className="bg-[#15335E] border border-white/5 p-6 rounded-3xl flex items-center gap-5 shadow-xl">
                        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Base de Alumni</p>
                            <p className="text-3xl font-black text-white">{stats.alumni}</p>
                        </div>
                    </div>
                </div>

                {/* Tab: Alunos */}
                {activeTab === 'students' && (
                    <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
                        <div className="flex flex-col md:flex-row gap-4 mb-8">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar aluno por nome ou formação..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-[#142239] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-[#9D4EDD]"
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-[#142239] px-4 py-2 rounded-2xl border border-white/10">
                                <Filter size={18} className="text-slate-500" />
                                <select
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value as any)}
                                    className="bg-transparent text-white outline-none pr-2 cursor-pointer text-sm font-bold"
                                >
                                    <option value="all">Todos</option>
                                    <option value="R1">Apenas R1</option>
                                    <option value="R2">Apenas R2</option>
                                    <option value="Alumni">Apenas Alumni</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStudents.map(student => (
                                <div key={student.id} className="bg-[#142239] border border-white/5 p-6 rounded-3xl flex flex-col hover:border-[#9D4EDD]/30 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-full bg-[#15335E] overflow-hidden border-2 border-[#142239] flex items-center justify-center text-3xl font-bold text-white">
                                            {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover" /> : student.full_name?.charAt(0)}
                                        </div>
                                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${student.statusData.color} ${student.statusData.border}`}>
                                            {student.statusData.label}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-white text-lg">{student.full_name}</h3>
                                    <p className="text-sm text-slate-400">{student.profession || 'Área não informada'}</p>

                                    <div className="mt-auto pt-6 border-t border-white/5 space-y-2 text-xs">
                                        <p className="flex items-center gap-2"><Briefcase size={14} /> {student.job_title || 'Cargo não informado'}</p>
                                        <p className="flex items-center gap-2"><GraduationCap size={14} /> Turma {student.entry_year}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab: Avisos */}
                {activeTab === 'announcements' && (
                    <div className="max-w-3xl mx-auto bg-[#15335E] border border-white/5 rounded-3xl p-8 shadow-xl">
                        <form onSubmit={handlePostAnnouncement} className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                {['r1', 'r2', 'residents', 'all'].map(target => (
                                    <label
                                        key={target}
                                        className={`flex justify-center py-4 px-6 rounded-2xl border cursor-pointer transition-all ${targetAudience === target ? 'bg-[#9D4EDD] text-white border-[#9D4EDD]' : 'bg-[#142239] border-white/10 hover:bg-white/5'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="target"
                                            value={target}
                                            checked={targetAudience === target}
                                            onChange={e => setTargetAudience(e.target.value as any)}
                                            className="hidden"
                                        />
                                        <span className="font-bold text-sm">
                                            {target === 'all' ? 'Todos' : target === 'residents' ? 'R1 e R2' : target.toUpperCase()}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <input
                                type="text"
                                placeholder="Título do Aviso"
                                value={announcementTitle}
                                onChange={e => setAnnouncementTitle(e.target.value)}
                                className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#9D4EDD]"
                                required
                            />

                            <textarea
                                placeholder="Mensagem do aviso..."
                                value={announcementText}
                                onChange={e => setAnnouncementText(e.target.value)}
                                className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 h-40 text-white outline-none focus:border-[#9D4EDD]"
                                required
                            />

                            <button
                                type="submit"
                                disabled={isPosting}
                                className="w-full bg-[#9D4EDD] hover:bg-purple-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                            >
                                {isPosting ? <Loader2 className="animate-spin" size={20} /> : 'Publicar Aviso'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tab: Vagas */}
                {activeTab === 'jobs' && (
                    <div className="max-w-3xl mx-auto bg-[#15335E] border border-white/5 rounded-3xl p-8 shadow-xl">
                        <form onSubmit={handlePostJob} className="space-y-6">
                            <input
                                type="text"
                                placeholder="Empresa / Instituição"
                                value={jobCompany}
                                onChange={e => setJobCompany(e.target.value)}
                                className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#9D4EDD]"
                                required
                            />

                            <input
                                type="text"
                                placeholder="Cargo da Vaga"
                                value={jobTitle}
                                onChange={e => setJobTitle(e.target.value)}
                                className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#9D4EDD]"
                                required
                            />

                            <input
                                type="text"
                                placeholder="Link ou E-mail de Inscrição"
                                value={jobLink}
                                onChange={e => setJobLink(e.target.value)}
                                className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#9D4EDD]"
                                required
                            />

                            <button
                                type="submit"
                                disabled={isPostingJob}
                                className="w-full bg-[#9D4EDD] hover:bg-purple-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                            >
                                {isPostingJob ? <Loader2 className="animate-spin" size={20} /> : 'Publicar Vaga Oficial'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};