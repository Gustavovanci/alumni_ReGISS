import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Briefcase, Calendar } from 'lucide-react';

import { supabase } from '../lib/supabase';

export const GlobalFAB = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);
    const [role, setRole] = useState('user');

    // Fetch Role
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setRole(data?.user?.user_metadata?.role || 'user'));
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
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const actions = [
        {
            label: 'Novo Post',
            icon: <Edit3 size={20} />,
            color: 'bg-blue-500',
            onClick: () => { setIsOpen(false); navigate('/feed'); }
        },
        {
            label: 'Novo Evento',
            icon: <Calendar size={20} />,
            color: 'bg-green-500',
            onClick: () => { setIsOpen(false); navigate('/events'); }
        },
        {
            label: 'Divulgar Vaga',
            icon: <Briefcase size={20} />,
            color: 'bg-amber-500',
            onClick: () => { setIsOpen(false); navigate('/jobs'); }
        }
    ];

    // Esconder o FAB se o Usuário for a COORDENAÇÃO
    if (role === 'coordination') return null;

    return (
        <div ref={menuRef} className="fixed bottom-24 md:bottom-24 right-4 md:right-6 z-[90] flex flex-col items-end">
            {/* Itens do Menu (Aparecem de baixo para cima) */}
            <div className={`flex flex-col gap-3 mb-4 transition-all duration-300 origin-bottom ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'}`}>
                {actions.reverse().map((action, index) => (
                    <div key={index} className="flex items-center gap-3 justify-end animate-fadeInRight" style={{ animationDelay: `${index * 50}ms` }}>
                        <span className="bg-[#15335E] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg border border-white/10 whitespace-nowrap">
                            {action.label}
                        </span>
                        <button
                            onClick={action.onClick}
                            className={`w-12 h-12 rounded-full ${action.color} text-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:scale-110 transition-transform`}
                        >
                            {action.icon}
                        </button>
                    </div>
                ))}
            </div>

            {/* Botão Principal (+) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full bg-gradient-to-tr from-[#D5205D] to-[#B32F50] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(213,32,93,0.5)] transition-all duration-300 z-10 ${isOpen ? 'rotate-45 bg-gradient-to-tr from-slate-600 to-slate-800 shadow-none' : 'hover:scale-105 hover:shadow-[0_6px_25px_rgba(213,32,93,0.6)]'}`}
            >
                <Plus size={28} className="transition-transform" />
            </button>

            {/* Fundo escuro atrás quando aberto (Opcional, estilo mobile) */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] -z-10 md:hidden transition-opacity" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
};