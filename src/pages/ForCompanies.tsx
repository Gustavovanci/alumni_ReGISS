import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Building, Zap, Users, ArrowRight, CheckCircle2, Target, MessageSquare, Award, ShieldCheck, Key, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ForCompanies = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'lead' | 'invite'>('lead');

    // Estado do Formulário de Lead
    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        contact_email: '',
        hiring_needs: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Estado do Validador de Convite
    const [inviteCode, setInviteCode] = useState('');
    const [inviteData, setInviteData] = useState<any>(null);
    const [password, setPassword] = useState('');
    const [inviteStep, setInviteStep] = useState<'validate' | 'register' | 'success'>('validate');
    const [isValidating, setIsValidating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.company_name || !formData.contact_email) {
            return toast.error("Preencha a Empresa e o E-mail de contato.");
        }

        setIsSubmitting(true);
        const { error } = await supabase.from('company_leads').insert([
            {
                company_name: formData.company_name,
                contact_email: formData.contact_email,
                contact_phone: formData.contact_name, // Usando o campo phone para o nome do recrutador no DB por enquanto
                job_title: 'Parceria de Curadoria',
                job_description: formData.hiring_needs,
                status: 'pending'
            }
        ]);

        setIsSubmitting(false);

        if (error) {
            console.error(error);
            toast.error("Ocorreu um erro ao enviar sua solicitação.");
        } else {
            setSubmitted(true);
            toast.success("Solicitação recebida com sucesso!");

            // Dispara Notificação para o Master Admin
            try {
                const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
                if (admins && admins.length > 0) {
                    const notifications = admins.map(admin => ({
                        user_id: admin.id,
                        type: 'system',
                        content: `🎯 Novo Lead B2B: ${formData.company_name} solicitou parceria institucional! Acesse o CRM de Empresas para aprovar.`
                    }));
                    await supabase.from('notifications').insert(notifications);
                }
            } catch (err) {
                console.error("Erro ao notificar admin", err);
            }
        }
    };

    // FUNÇÕES DO FLUXO DE CONVITE (Importadas do antigo CompanyRegister)
    const handleValidateCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsValidating(true);
        try {
            const { data, error } = await supabase
                .from('company_invites')
                .select('*')
                .eq('code', inviteCode)
                .eq('status', 'pending')
                .single();

            if (error || !data) throw new Error("Código de Convite inválido ou expirado.");
            setInviteData(data);
            setInviteStep('register');
            toast.success("Código validado! Prossiga com o cadastro.");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsValidating(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsValidating(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: inviteData.contact_email,
                password,
            });

            if (authError) throw authError;

            // Insere o Profile como 'company' usando a transação segura
            const { error: profileError } = await supabase.from('profiles').update({
                role: 'company',
                full_name: inviteData.company_name,
            }).eq('id', authData.user!.id);

            if (profileError) throw profileError;

            // Invalida o código B2B para evitar reuso
            await supabase.from('company_invites').update({
                status: 'used',
                used_by: authData.user!.id
            }).eq('code', inviteCode);

            setInviteStep('success');
            toast.success("Conta parceira criada com sucesso!");

        } catch (error: any) {
            toast.error("Erro ao registrar: " + error.message);
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a111e] text-slate-100 font-sans selection:bg-[#D5205D]/30 overflow-x-hidden relative">

            {/* Efeitos de Luz de Fundo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
            <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#D5205D]/10 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

            {/* HEADER */}
            <nav className="w-full border-b border-white/5 bg-[#0a111e]/80 backdrop-blur-xl fixed top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/apple-touch-icon.png" alt="Logo ReGISS" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-[#D5205D]/20 border border-white/5" />
                        <span className="font-bold text-xl tracking-wide text-white">ReGISS <span className="font-light text-slate-400">Business</span></span>
                    </div>
                    <Link to="/" className="text-sm font-bold text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                        Entrar <ArrowRight size={16} />
                    </Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8 animate-fadeIn">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase">
                        <Target size={14} /> Recrutamento de Elite
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black leading-tight text-white tracking-tight">
                        Chega de <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-600 line-through decoration-red-500">currículos genéricos.</span><br />
                        Contrate por <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#D5205D]">Fit Cultural.</span>
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed font-light">
                        Abandone a triagem exaustiva. Acesse o banco de talentos exclusivo dos ex-alunos e residentes de Gestão em Saúde do HCFMUSP. Profissionais altamente qualificados, filtrados pelas reais necessidades da sua instituição.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button onClick={() => { setActiveTab('lead'); document.getElementById('company-portal')?.scrollIntoView({ behavior: 'smooth' }); }} className="px-8 py-4 bg-white text-[#142239] font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 text-lg shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95">
                            Quero Construir uma Parceria <ArrowRight size={20} />
                        </button>
                        <button onClick={() => { setActiveTab('invite'); document.getElementById('company-portal')?.scrollIntoView({ behavior: 'smooth' }); }} className="px-8 py-4 bg-transparent border border-blue-500/30 text-blue-400 font-bold rounded-xl hover:bg-blue-500/10 transition-all flex items-center justify-center gap-3 text-lg shadow-[0_0_40px_rgba(59,130,246,0.1)] hover:scale-105 active:scale-95">
                            <Key size={20} /> Tenho Código de Convite
                        </button>
                    </div>
                </div>

                {/* IMAGEM ILUSTRATIVA (MOCK DO DASHBOARD B2B) */}
                <div className="relative animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                    <div className="bg-[#15335E]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl relative z-10 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <span className="text-sm font-bold text-white flex items-center gap-2"><Zap className="text-yellow-400" size={16} /> Sugestão do Algoritmo</span>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">98% Fit</span>
                        </div>
                        <div className="flex gap-4 items-center mb-6">
                            <div className="w-16 h-16 bg-[#142239] rounded-full border-2 border-blue-500 flex items-center justify-center text-xl font-bold">JD</div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Candidato Anônimo (R2)</h3>
                                <p className="text-sm text-slate-400">Fisioterapeuta • Especialista em Qualidade</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-6">
                            <span className="text-xs bg-[#142239] border border-white/5 px-3 py-1 rounded-lg text-slate-300">Gestão Hospitalar</span>
                            <span className="text-xs bg-[#142239] border border-white/5 px-3 py-1 rounded-lg text-slate-300">Lean Six Sigma</span>
                        </div>
                        <button className="w-full bg-[#D5205D] text-white py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg">
                            <MessageSquare size={16} /> Solicitar Contato Direto
                        </button>
                    </div>
                    {/* Elementos decorativos atrás do card */}
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#D5205D]/20 rounded-full blur-2xl"></div>
                </div>
            </section>

            {/* FEATURES SECTION (O novo modelo) */}
            <section className="py-24 bg-[#15335E]/30 border-y border-white/5 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Esqueça os "Buracos Negros" de Vagas</h2>
                        <p className="text-slate-400 text-lg">Criamos um modelo orgânico, onde o candidato é valorizado e a empresa ganha velocidade. Uma conexão de mão dupla.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-[#142239] border border-white/5 p-8 rounded-3xl hover:border-blue-500/30 transition-colors">
                            <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6"><Award size={28} /></div>
                            <h3 className="text-xl font-bold mb-3 text-white">Curadoria Humana e Tech</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Você nos diz o que precisa. Nosso algoritmo (e nossa coordenação) cruza os dados com os interesses dos nossos alunos e te entrega uma lista curta, porém perfeita.</p>
                        </div>
                        <div className="bg-[#142239] border border-white/5 p-8 rounded-3xl hover:border-[#D5205D]/30 transition-colors">
                            <div className="w-14 h-14 bg-[#D5205D]/10 text-[#D5205D] rounded-2xl flex items-center justify-center mb-6"><ShieldCheck size={28} /></div>
                            <h3 className="text-xl font-bold mb-3 text-white">Privacidade e Respeito</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Os candidatos são apresentados de forma anônima (apenas skills e formação). Se você se interessar, o aluno recebe um alerta VIP e decide se abre contato.</p>
                        </div>
                        <div className="bg-[#142239] border border-white/5 p-8 rounded-3xl hover:border-green-500/30 transition-colors">
                            <div className="w-14 h-14 bg-green-500/10 text-green-400 rounded-2xl flex items-center justify-center mb-6"><Briefcase size={28} /></div>
                            <h3 className="text-xl font-bold mb-3 text-white">Vagas com Selo Ouro</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Prefere apenas postar a vaga? Sem problemas. Vagas de parceiros ganham destaque no topo do nosso feed e push notifications no celular dos residentes.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PORTAL DO PARCEIRO (Abas de Switch) */}
            <section id="company-portal" className="py-24 relative z-10">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-[#15335E] border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-[#D5205D] to-amber-500"></div>

                        {/* NAV DAS ABAS */}
                        <div className="flex flex-col sm:flex-row gap-2 mb-10 p-1.5 bg-[#142239]/50 rounded-2xl w-full sm:w-fit mx-auto border border-white/5">
                            <button
                                onClick={() => setActiveTab('lead')}
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all w-full sm:w-auto flex items-center justify-center gap-2 ${activeTab === 'lead' ? 'bg-[#D5205D] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Target size={18} /> Novo Contato de Parceria
                            </button>
                            <button
                                onClick={() => setActiveTab('invite')}
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all w-full sm:w-auto flex items-center justify-center gap-2 ${activeTab === 'invite' ? 'bg-[#D5205D] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Key size={18} /> Validar Acesso de Empresa
                            </button>
                        </div>

                        {activeTab === 'lead' && (
                            <div className="animate-fadeIn">
                                {submitted ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center animate-fadeIn">
                                        <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                            <CheckCircle2 size={48} className="text-green-400" />
                                        </div>
                                        <h3 className="text-3xl font-bold mb-4 text-white">Tudo certo!</h3>
                                        <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
                                            Nossa equipe de curadoria recebeu seus dados. Entraremos em contato em breve para apresentar os talentos da rede ReGISS que dão match com a sua empresa.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white text-center">Torne-se um Parceiro Institucional</h2>
                                        <p className="text-slate-400 mb-8 text-center max-w-2xl mx-auto">Preencha os dados abaixo para agendarmos uma reunião. Nossa equipe apresentará como a aliança com a Rede ReGISS vai transformar seu recrutamento.</p>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome da Instituição *</label>
                                                    <div className="flex items-center bg-[#142239] rounded-xl px-4 border border-white/5 focus-within:border-blue-500 transition-colors shadow-inner">
                                                        <Building size={18} className="text-slate-500" />
                                                        <input type="text" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} className="w-full bg-transparent border-none p-4 text-white outline-none placeholder:text-slate-600" placeholder="Ex: Hospital Sírio-Libanês" required />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo *</label>
                                                    <div className="flex items-center bg-[#142239] rounded-xl px-4 border border-white/5 focus-within:border-blue-500 transition-colors shadow-inner">
                                                        <input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} className="w-full bg-transparent border-none p-4 text-white outline-none placeholder:text-slate-600" placeholder="rh@empresa.com.br" required />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Recrutador/Gestor</label>
                                                <div className="flex items-center bg-[#142239] rounded-xl px-4 border border-white/5 focus-within:border-blue-500 transition-colors shadow-inner">
                                                    <input type="text" value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} className="w-full bg-transparent border-none p-4 text-white outline-none placeholder:text-slate-600" placeholder="Com quem vamos falar?" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Como podemos ajudar sua instituição?</label>
                                                <textarea value={formData.hiring_needs} onChange={e => setFormData({ ...formData, hiring_needs: e.target.value })} className="w-full bg-[#142239] border border-white/5 rounded-xl p-4 text-white h-32 resize-none outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 shadow-inner" placeholder="Descreva os desafios do seu RH, áreas de interesse (ex: Qualidade, Financeiro) ou o motivo do contato..."></textarea>
                                            </div>

                                            <button type="submit" disabled={isSubmitting} className="w-full bg-white text-[#142239] hover:bg-slate-200 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 text-lg mt-4 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                                                {isSubmitting ? 'Agendando...' : 'Agendar Reunião com Curadores'} <ArrowRight size={20} />
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'invite' && (
                            <div className="animate-fadeIn max-w-md mx-auto py-8">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Key className="text-blue-400" size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">Já é Parceiro Oficial?</h2>
                                    <p className="text-slate-400 text-sm">Libere o acesso exclusivo da sua empresa à plataforma utilizando a sua chave corporativa ReGISS.</p>
                                </div>

                                {inviteStep === 'validate' && (
                                    <form onSubmit={handleValidateCode} className="space-y-4">
                                        <div className="bg-[#142239] border border-white/10 rounded-xl flex items-center px-4 focus-within:border-blue-500 transition-colors group">
                                            <input type="text" placeholder="Código Mágico Ex: (HC-EMP2026)" required value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} className="bg-transparent border-none w-full p-4 text-white outline-none placeholder:text-slate-600 font-mono tracking-widest text-center" />
                                        </div>
                                        <button type="submit" disabled={isValidating || !inviteCode} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 transition-all">
                                            {isValidating ? <Loader2 className="animate-spin" /> : 'Verificar e Liberar Acesso'}
                                        </button>
                                    </form>
                                )}

                                {inviteStep === 'register' && (
                                    <form onSubmit={handleRegister} className="space-y-4 animate-fadeIn">
                                        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 mb-6">
                                            <Building className="text-blue-400" size={24} />
                                            <div>
                                                <h3 className="text-blue-400 font-bold text-sm">Convite Validado</h3>
                                                <p className="text-blue-200/70 text-xs">Empresa: {inviteData?.company_name}</p>
                                                <p className="text-blue-200/50 text-[10px]">E-mail Vinculado: {inviteData?.contact_email}</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#142239] border border-white/10 rounded-xl flex items-center px-4 focus-within:border-blue-500 transition-colors group">
                                            <Lock className="text-slate-500" size={20} />
                                            <input type="password" placeholder="Crie uma Senha Forte" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="bg-transparent border-none w-full p-4 text-white outline-none placeholder:text-slate-600" />
                                        </div>
                                        <button type="submit" disabled={isValidating} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 transition-all">
                                            {isValidating ? <Loader2 className="animate-spin" /> : 'Ativar Minha Conta Matriz'}
                                        </button>
                                    </form>
                                )}

                                {inviteStep === 'success' && (
                                    <div className="text-center animate-fadeIn py-4">
                                        <CheckCircle2 size={64} className="text-green-400 mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold text-white mb-2">Conta B2B Ativada!</h3>
                                        <p className="text-slate-400 mb-8 text-sm">O painel de Head Hunting do {inviteData?.company_name} já está rodando 100%.</p>
                                        <button onClick={() => navigate('/company')} className="bg-white text-slate-900 font-bold py-3 px-8 rounded-xl hover:bg-slate-200 transition-colors shadow-lg w-full">
                                            Acessar Meu Painel de Vagas
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/5 py-8 text-center text-slate-500 text-xs bg-[#0a111e] relative z-10">
                <p>© {new Date().getFullYear()} Alumni ReGISS HCFMUSP. Portal exclusivo para parceiros corporativos.</p>
            </footer>
        </div>
    );
};