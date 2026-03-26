import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit3, Briefcase, Calendar, X, Globe, Lock, Loader2, Building, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';

export const GlobalFAB = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { userRole, currentUser, userProfile, allProfiles } = useStore();

    // Estados dos modais
    const [activeModal, setActiveModal] = useState<'post' | 'event' | 'job' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Formulários
    const [postContent, setPostContent] = useState('');
    const [newEvent, setNewEvent] = useState({
        title: '',
        start_time: '',
        end_time: '',
        is_public: false,
    });
    const [newJob, setNewJob] = useState({
        company: '',
        link: '',
        description: '',
    });

    // Fechar menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fechar com ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setActiveModal(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Criar Post
    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postContent.trim() || !currentUser) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('posts').insert({
                user_id: currentUser.id,
                content: postContent,
                type: 'general',
            });

            if (error) throw error;

            toast.success('Post publicado com sucesso!');
            setActiveModal(null);
            setPostContent('');
        } catch (err: any) {
            toast.error(err.message || 'Erro ao publicar post');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Criar Evento
    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.start_time || !newEvent.end_time || !currentUser) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('events').insert({
                user_id: currentUser.id,
                ...newEvent,
            });

            if (error) throw error;

            toast.success('Evento criado com sucesso!');
            setActiveModal(null);
            setNewEvent({ title: '', start_time: '', end_time: '', is_public: false });
        } catch (err: any) {
            toast.error(err.message || 'Erro ao criar evento');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Criar Vaga
    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newJob.company || !newJob.description || !currentUser) return;

        setIsSubmitting(true);
        try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 15);

            const { error } = await supabase.from('posts').insert({
                user_id: currentUser.id,
                content: newJob.description,
                type: 'vacancy',
                link_url: newJob.link || null,
                expires_at: expiresAt.toISOString(),
            });

            if (error) throw error;

            toast.success('Vaga publicada com sucesso!');
            setActiveModal(null);
            setNewJob({ company: '', link: '', description: '' });
        } catch (err: any) {
            toast.error(err.message || 'Erro ao publicar vaga');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (userRole === 'coordination' || userRole === 'admin') return null;

    return (
        <>
            {/* FAB Principal */}
            <div ref={menuRef} className="fixed bottom-6 right-6 z-[90] flex flex-col items-end">
                {/* Menu de ações */}
                <div
                    className={`flex flex-col gap-3 mb-4 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <span className="bg-[#15335E] text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl border border-white/10">
                            Novo Post
                        </span>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setActiveModal('post');
                            }}
                            className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                        >
                            <Edit3 size={24} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="bg-[#15335E] text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl border border-white/10">
                            Novo Evento
                        </span>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setActiveModal('event');
                            }}
                            className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                        >
                            <Calendar size={24} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="bg-[#15335E] text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl border border-white/10">
                            Divulgar Vaga
                        </span>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setActiveModal('job');
                            }}
                            className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                        >
                            <Briefcase size={24} />
                        </button>
                    </div>
                </div>

                {/* Botão FAB */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-2xl bg-[#D5205D] text-white flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen ? 'rotate-45' : 'hover:scale-110'
                        }`}
                >
                    <Plus size={28} />
                </button>
            </div>

            {/* MODAIS */}
            {activeModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#15335E] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#142239]">
                            <h3 className="font-bold text-white text-lg">
                                {activeModal === 'post' && 'Novo Post'}
                                {activeModal === 'event' && 'Novo Evento'}
                                {activeModal === 'job' && 'Divulgar Vaga'}
                            </h3>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="text-slate-400 hover:text-white p-2"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Modal Post */}
                            {activeModal === 'post' && (
                                <form onSubmit={handleCreatePost} className="space-y-4">
                                    <textarea
                                        value={postContent}
                                        onChange={(e) => setPostContent(e.target.value)}
                                        placeholder="O que você quer compartilhar com a rede?"
                                        className="w-full h-40 bg-[#142239] border border-white/10 rounded-2xl p-4 text-white resize-none outline-none focus:border-[#D5205D]"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Publicar'}
                                    </button>
                                </form>
                            )}

                            {/* Modal Evento */}
                            {activeModal === 'event' && (
                                <form onSubmit={handleCreateEvent} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Título do evento"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                        className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D]"
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Início</label>
                                            <input
                                                type="datetime-local"
                                                value={newEvent.start_time}
                                                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                                                className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D]"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Fim</label>
                                            <input
                                                type="datetime-local"
                                                value={newEvent.end_time}
                                                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                                                className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D]"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Evento'}
                                    </button>
                                </form>
                            )}

                            {/* Modal Vaga */}
                            {activeModal === 'job' && (
                                <form onSubmit={handleCreateJob} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Nome da Empresa"
                                        value={newJob.company}
                                        onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                                        className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D]"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Link da vaga (opcional)"
                                        value={newJob.link}
                                        onChange={(e) => setNewJob({ ...newJob, link: e.target.value })}
                                        className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D]"
                                    />
                                    <textarea
                                        placeholder="Descrição da vaga"
                                        value={newJob.description}
                                        onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                                        className="w-full h-32 bg-[#142239] border border-white/10 rounded-2xl p-4 text-white resize-none outline-none focus:border-[#D5205D]"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-amber-600 hover:bg-amber-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Publicar Vaga'}
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