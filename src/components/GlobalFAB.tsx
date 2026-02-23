import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit3, Briefcase, Calendar, X, Globe, Lock, Loader2, Building, ExternalLink, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const GlobalFAB = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [role, setRole] = useState('user');
    const [userId, setUserId] = useState<string | null>(null);

    // Modal States
    const [activeModal, setActiveModal] = useState<'post' | 'event' | 'job' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [postContent, setPostContent] = useState('');
    const [newEvent, setNewEvent] = useState({ title: '', start_time: '', end_time: '', is_public: false });
    const [newJob, setNewJob] = useState({ company: '', link: '', description: '', isPremium: false });

    // Fetch Role & ID
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data?.user?.id || null);
            if (data?.user) {
                supabase.from('profiles').select('role').eq('id', data.user.id).single()
                    .then(({ data: profile }) => setRole(profile?.role || 'user'));
            }
        });
    }, []);

    // Fechar ao clicar fora ou apertar Esc (UX refinada)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setActiveModal(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postContent.trim() || !userId) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('posts').insert({ user_id: userId, content: postContent, type: 'general' });
            if (error) throw error;
            toast.success("Post publicado com sucesso!");
            setActiveModal(null);
            setPostContent('');
        } catch (error: any) {
            toast.error("Erro ao publicar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.start_time || !newEvent.end_time || !userId) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('events').insert([{ user_id: userId, ...newEvent }]);
            if (error) throw error;
            toast.success("Evento salvo na agenda!");
            setActiveModal(null);
            setNewEvent({ title: '', start_time: '', end_time: '', is_public: false });
        } catch (error: any) {
            toast.error("Erro ao criar evento: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newJob.company || !newJob.description || !userId) return;
        setIsSubmitting(true);
        try {
            let formattedLink = newJob.link ? newJob.link.trim() : null;
            if (formattedLink && !formattedLink.startsWith('http')) formattedLink = `https://${formattedLink}`;

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 15);

            const contentData = newJob.isPremium
                ? `[PREMIUM_JOB] [${newJob.company}] ${newJob.description}`
                : `[${newJob.company}] ${newJob.description}`;

            const { error } = await supabase.from('posts').insert({
                user_id: userId,
                content: contentData,
                type: 'vacancy',
                link_url: formattedLink,
                expires_at: expiresAt.toISOString()
            });

            if (error) throw error;
            toast.success("Vaga publicada com sucesso!");
            setActiveModal(null);
            setNewJob({ description: '', link: '', company: '', isPremium: false });
        } catch (error: any) {
            toast.error("Erro ao divulgar vaga: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const actions = [
        { label: 'Novo Post', icon: <Edit3 size={20} />, color: 'bg-blue-500', onClick: () => { setIsOpen(false); setActiveModal('post'); } },
        { label: 'Novo Evento', icon: <Calendar size={20} />, color: 'bg-green-500', onClick: () => { setIsOpen(false); setActiveModal('event'); } },
        { label: 'Divulgar Vaga', icon: <Briefcase size={20} />, color: 'bg-amber-500', onClick: () => { setIsOpen(false); setActiveModal('job'); } }
    ];

    if (role === 'coordination') return null;

    return (
        <>
            <div ref={menuRef} className="fixed bottom-24 md:bottom-24 right-4 md:right-6 z-[90] flex flex-col items-end">
                <div className={`flex flex-col gap-3 mb-4 transition-all duration-300 origin-bottom ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'}`}>
                    {actions.reverse().map((action, index) => (
                        <div key={index} className="flex items-center gap-3 justify-end animate-fadeInRight" style={{ animationDelay: `${index * 50}ms` }}>
                            <span className="bg-[#15335E] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg border border-white/10 whitespace-nowrap">
                                {action.label}
                            </span>
                            <button onClick={action.onClick} className={`w-12 h-12 rounded-full ${action.color} text-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:scale-110 transition-transform`}>
                                {action.icon}
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full bg-gradient-to-tr from-[#D5205D] to-[#B32F50] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(213,32,93,0.5)] transition-all duration-300 z-10 ${isOpen ? 'rotate-45 bg-gradient-to-tr from-slate-600 to-slate-800 shadow-none' : 'hover:scale-105 hover:shadow-[0_6px_25px_rgba(213,32,93,0.6)]'}`}
                >
                    <Plus size={28} className="transition-transform" />
                </button>

                {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] -z-10 md:hidden transition-opacity" onClick={() => setIsOpen(false)} />}
            </div>

            {/* MODAIS FLUTUANTES RÁPIDOS */}
            {activeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#15335E] w-full max-w-sm md:max-w-md rounded-[32px] border border-white/10 shadow-2xl overflow-hidden animate-fadeIn scale-100 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-[#142239]">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                {activeModal === 'post' && <><Edit3 className="text-blue-500" /> Publicar no Feed</>}
                                {activeModal === 'event' && <><Calendar className="text-green-500" /> Agendar Evento</>}
                                {activeModal === 'job' && <><Briefcase className="text-amber-500" /> Divulgar Vaga</>}
                            </h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"><X size={18} /></button>
                        </div>

                        <div className="p-5 overflow-y-auto">
                            {/* FORM POST */}
                            {activeModal === 'post' && (
                                <form onSubmit={handleCreatePost} className="space-y-4">
                                    <textarea value={postContent} onChange={e => setPostContent(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white resize-none h-32 outline-none focus:border-[#D5205D] shadow-inner" placeholder="O que você deseja compartilhar com a rede?" required />
                                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Publicar'}
                                    </button>
                                </form>
                            )}

                            {/* FORM EVENTO */}
                            {activeModal === 'event' && (
                                <form onSubmit={handleCreateEvent} className="space-y-4">
                                    <input type="text" placeholder="Adicionar título" className="w-full bg-[#142239] border border-white/10 rounded-2xl p-3.5 text-sm text-white outline-none focus:border-[#D5205D] shadow-inner" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required />
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1 bg-[#142239] border border-white/10 rounded-2xl p-2.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Início</label>
                                            <input type="datetime-local" className="w-full bg-transparent text-xs text-white outline-none" style={{ colorScheme: 'dark' }} value={newEvent.start_time} onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })} required />
                                        </div>
                                        <div className="flex-1 bg-[#142239] border border-white/10 rounded-2xl p-2.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fim</label>
                                            <input type="datetime-local" className="w-full bg-transparent text-xs text-white outline-none" style={{ colorScheme: 'dark' }} value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setNewEvent({ ...newEvent, is_public: false })} className={`flex-1 py-2.5 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${!newEvent.is_public ? 'bg-white text-[#142239] border-white' : 'text-slate-400 border-white/10 bg-transparent'}`}><Lock size={12} /> Privado</button>
                                        <button type="button" onClick={() => setNewEvent({ ...newEvent, is_public: true })} className={`flex-1 py-2.5 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${newEvent.is_public ? 'bg-[#D5205D] text-white border-[#D5205D]' : 'text-slate-400 border-white/10 bg-transparent'}`}><Globe size={12} /> Público</button>
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-2xl mt-2 shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Salvar Evento'}
                                    </button>
                                </form>
                            )}

                            {/* FORM VAGA */}
                            {activeModal === 'job' && (
                                <form onSubmit={handleCreateJob} className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center bg-[#142239] rounded-2xl px-4 border border-white/10 focus-within:border-[#D5205D] transition-colors shadow-inner">
                                            <Building size={18} className="text-slate-500" />
                                            <input type="text" value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} className="w-full bg-transparent border-none p-3.5 text-sm text-white outline-none" placeholder="Nome da Empresa (Obrigatório)" required />
                                        </div>
                                        <div className="flex items-center bg-[#142239] rounded-2xl px-4 border border-white/10 focus-within:border-[#D5205D] transition-colors shadow-inner">
                                            <ExternalLink size={18} className={newJob.link ? "text-[#D5205D]" : "text-slate-500"} />
                                            <input type="url" value={newJob.link} onChange={e => setNewJob({ ...newJob, link: e.target.value })} className="w-full bg-transparent border-none p-3.5 text-sm text-white outline-none" placeholder="Link da Vaga https:// (Opcional)" />
                                        </div>
                                        <textarea value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-sm text-white resize-none h-24 outline-none focus:border-[#D5205D] shadow-inner" placeholder="Descrição resumida e requisitos..." required />
                                    </div>

                                    {(role === 'admin' || role === 'company') && (
                                        <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-3 rounded-2xl border border-amber-500/30 flex items-start gap-3 cursor-pointer" onClick={() => setNewJob({ ...newJob, isPremium: !newJob.isPremium })}>
                                            <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-all ${newJob.isPremium ? 'bg-amber-500 border-amber-500' : 'bg-[#142239] border-white/20'}`}>
                                                {newJob.isPremium && <Check size={14} className="text-white" />}
                                            </div>
                                            <div>
                                                <h4 className="text-amber-400 font-bold text-xs tracking-wide">Vaga Destaque (Premium)</h4>
                                                <p className="text-amber-500/70 text-[10px] mt-0.5">Recurso corporativo para visualização prioritária.</p>
                                            </div>
                                        </div>
                                    )}

                                    <button type="submit" disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Divulgar Oportunidade'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};