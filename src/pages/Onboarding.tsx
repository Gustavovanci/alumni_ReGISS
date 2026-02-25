import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Plus, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { getRegissStatus } from '../utils/regissLogic';
import { StarRating } from '../components/StarRating';

export const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: (currentYear + 1) - 2019 + 1 }, (_, i) => 2019 + i).reverse();

  const [userRole, setUserRole] = useState<'user' | 'coordinator'>('user');

  const [formData, setFormData] = useState({
    fullName: '', profession: '', entryYear: '', birthDate: '', jobTitle: '', company: '', interests: [] as string[],
    jobStartDate: '', jobRating: 0, jobPros: '', jobCons: ''
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return navigate('/');

      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single();

      if (profile?.full_name) {
        if (profile.role === 'admin') return navigate('/admin');
        if (profile.role === 'coordinator') return navigate('/coordination');
        return navigate('/feed');
      }

      if (profile?.role === 'coordinator') {
        setUserRole('coordinator');
      }
    });
  }, [navigate]);

  const simulableYear = formData.entryYear ? parseInt(formData.entryYear) : null;
  const simulatedStatus = getRegissStatus(simulableYear, userRole);
  const isResident = simulatedStatus?.label === 'R1' || simulatedStatus?.label === 'R2';

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão inválida.");

      const entryYearInt = parseInt(formData.entryYear);
      const finalJobTitle = (userRole === 'user' && isResident) ? simulatedStatus?.defaultRole : formData.jobTitle;
      const finalCompany = (userRole === 'user' && isResident) ? 'HCFMUSP' : formData.company;

      const { error: profileError } = await supabase.from('profiles').update({
        full_name: formData.fullName,
        profession: formData.profession,
        entry_year: userRole === 'coordinator' ? null : entryYearInt,
        birth_date: formData.birthDate,
        job_title: finalJobTitle,
        current_company: finalCompany,
        interests: formData.interests,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);

      if (profileError) throw profileError;

      if (userRole === 'user' && entryYearInt) {
        const startDate = `${entryYearInt}-03-01`;
        let endDate = null;
        if (!isResident) endDate = `${entryYearInt + 2}-02-28`;

        await supabase.from('career_journey').insert({
          user_id: user.id,
          title: `Residência em Gestão Integrada de Serviços de Saúde (ReGISS)`,
          organization: 'HCFMUSP',
          type: 'regiss',
          start_date: startDate,
          end_date: endDate,
          rating: 0,
          recommendation: false
        });
      }

      // NOVO: SALVAR O EMPREGO ATUAL DO ALUMNI (Glassdoor)
      if (formData.jobTitle && formData.company && formData.jobStartDate && (!isResident || userRole === 'coordinator')) {
        await supabase.from('career_journey').insert({
          user_id: user.id,
          title: formData.jobTitle,
          organization: formData.company,
          type: 'job',
          start_date: formData.jobStartDate,
          end_date: null, // Cargo Atual
          rating: formData.jobRating || 0,
          pros: formData.jobPros || null,
          cons: formData.jobCons || null,
          recommendation: false
        });
      }

      if (userRole === 'coordinator') {
        navigate('/coordination');
      } else {
        navigate('/feed');
      }
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (!formData.interests.includes(tag)) setFormData(prev => ({ ...prev, interests: [...prev.interests, tag] }));
    setTagInput('');
  };

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-[#D5205D]/30 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">
        {step === 0 && (
          <div className="bg-[#15335E]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 animate-fadeIn shadow-2xl text-center">
            <div className={`flex justify-center mb-8`}><div className={`w-20 h-20 ${userRole === 'coordinator' ? 'bg-[#9D4EDD]' : 'bg-gradient-to-tr from-[#D5205D] to-[#B32F50]'} rounded-2xl flex items-center justify-center shadow-lg`}><Award className="text-white w-10 h-10" /></div></div>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white leading-tight">Bem-vindo ao <br /><span className={userRole === 'coordinator' ? 'text-[#9D4EDD]' : 'text-[#D5205D]'}>{userRole === 'coordinator' ? 'Painel da Coordenação' : 'ReGISS Alumni'}</span>.</h1>
            <div className="text-slate-300 text-sm md:text-base leading-relaxed mb-10 space-y-4 text-left max-w-xl mx-auto bg-[#142239]/50 p-6 rounded-2xl border border-white/5">

              {userRole === 'coordinator' ? (
                <>
                  <p>Você acessou o ambiente de <strong>Área Técnica da Residência.</strong></p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    <li>Gerencie o banco de dados de Residentes (R1 e R2) e Alumni.</li>
                    <li>Dispare comunicados oficiais em destaque no feed dos alunos.</li>
                    <li>Publique oportunidades institucionais no Mural de Vagas.</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>O ReGISS Alumni é o seu <strong>hub contínuo de desenvolvimento, networking e inteligência de mercado</strong>.</p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    <li>Conecte-se com colegas de diferentes turmas.</li>
                    <li><strong>Poste vagas para sua rede</strong> e colabore com o nosso Mural.</li>
                    <li>Consulte os <strong>Insights de Mercado</strong> para saber avaliações de hospitais.</li>
                  </ul>
                </>
              )}
            </div>
            <button onClick={() => setStep(1)} className={`px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 mx-auto text-white hover:scale-105 active:scale-95 ${userRole === 'coordinator' ? 'bg-[#9D4EDD] hover:bg-purple-600' : 'bg-[#D5205D] hover:bg-pink-600'}`}>Configurar meu Perfil <ChevronRight /></button>
          </div>
        )}

        {step > 0 && (
          <div className="bg-[#15335E]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 animate-fadeIn shadow-2xl">
            <div className="flex items-center gap-2 mb-10">{[1, 2, 3].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? (userRole === 'coordinator' ? 'bg-[#9D4EDD]' : 'bg-[#D5205D]') : 'bg-[#142239]'}`} />)}</div>

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Identificação</h2>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-colors shadow-inner" placeholder="Como você deseja ser chamado?" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                    <input type="date" style={{ colorScheme: 'dark' }} value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 shadow-inner" />
                  </div>

                  {userRole === 'user' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Ano de Ingresso (R1)</label>
                      <select value={formData.entryYear} onChange={e => setFormData({ ...formData, entryYear: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 cursor-pointer shadow-inner">
                        <option value="" disabled>Selecione a turma...</option>
                        {years.map(year => <option key={year} value={year}>{year}</option>)}
                      </select>
                    </div>
                  )}
                  {userRole === 'coordinator' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#9D4EDD] uppercase tracking-widest ml-1">Instituição de Base</label>
                      <input type="text" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full bg-[#142239] border border-[#9D4EDD]/30 rounded-2xl p-4 text-white outline-none focus:border-[#9D4EDD] placeholder:text-slate-600 shadow-inner" placeholder="Ex: HCFMUSP" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-8">
                  <button onClick={() => setStep(2)} disabled={!formData.fullName || !formData.birthDate || (userRole === 'user' && !formData.entryYear)} className={`px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 text-white shadow-lg ${userRole === 'coordinator' ? 'bg-[#9D4EDD] hover:bg-purple-600' : 'bg-[#D5205D] hover:bg-pink-600'}`}>Continuar <ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Formação & Atuação</h2>
                  <p className="text-sm text-slate-400 mt-1">Conte mais sobre seu perfil profissional.</p>
                </div>

                {userRole === 'user' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Fisioterapia', 'Enfermagem', 'Terapia Ocupacional', 'Nutrição', 'Fonoaudiologia'].map(prof => (
                      <button key={prof} onClick={() => setFormData({ ...formData, profession: prof })} className={`p-4 rounded-2xl border text-left font-bold transition-all relative shadow-sm ${formData.profession === prof ? 'bg-[#D5205D] border-[#D5205D] text-white' : 'bg-[#142239] border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}>
                        {prof}
                        {formData.profession === prof && <Check className="absolute right-4 top-4" size={18} />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#9D4EDD] uppercase tracking-widest ml-1">Formação Base Livre</label>
                      <input type="text" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} className="w-full bg-[#142239] border border-[#9D4EDD]/30 rounded-2xl p-4 text-white outline-none focus:border-[#9D4EDD] placeholder:text-slate-600 shadow-inner" placeholder="Ex: Médico, Administrador..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#9D4EDD] uppercase tracking-widest ml-1">Cargo na Coordenação</label>
                      <input type="text" value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full bg-[#142239] border border-[#9D4EDD]/30 rounded-2xl p-4 text-white outline-none focus:border-[#9D4EDD] placeholder:text-slate-600 shadow-inner" placeholder="Ex: Coordenador Pedagógico..." />
                    </div>
                  </div>
                )}

                {userRole === 'user' && !isResident && formData.entryYear && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Cargo Atual</label>
                      <input type="text" value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D] placeholder:text-slate-600 shadow-inner" placeholder="Ex: Analista de Qualidade" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Empresa Atual</label>
                      <input type="text" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D] placeholder:text-slate-600 shadow-inner" placeholder="Ex: Hospital Sírio-Libanês" />
                    </div>
                  </div>
                )}

                {/* MODULO GLASSDOOR (Apenas para Cargo Atual de Alumnis e Coordenadores) */}
                {((userRole === 'user' && !isResident && formData.company && formData.jobTitle) || (userRole === 'coordinator' && formData.company && formData.jobTitle)) && (
                  <div className="pt-6 border-t border-white/5 animate-fadeIn space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Sua Avaliação Anônima</h3>
                      <p className="text-xs text-slate-400 mt-1">Quando você iniciou nesta empresa? Ajude a comunidade avaliando seu ambiente de trabalho (As opiniões escritas e notas não vinculam seu nome no perfil).</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Início nesse cargo</label>
                        <input type="date" style={{ colorScheme: 'dark' }} value={formData.jobStartDate} onChange={e => setFormData({ ...formData, jobStartDate: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-3.5 text-white outline-none focus:border-blue-500 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-2">Avaliação da Empresa</label>
                        <div className="pt-1"><StarRating rating={formData.jobRating} setRating={(r) => setFormData({ ...formData, jobRating: r })} /></div>
                      </div>
                    </div>

                    {formData.jobRating > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                        <textarea value={formData.jobPros} onChange={e => setFormData({ ...formData, jobPros: e.target.value })} className="w-full bg-[#15335E] border border-green-500/30 rounded-xl p-3 text-white text-xs h-20 resize-none outline-none focus:border-green-500/60 shadow-inner" placeholder="👍 Pontos Positivos" />
                        <textarea value={formData.jobCons} onChange={e => setFormData({ ...formData, jobCons: e.target.value })} className="w-full bg-[#15335E] border border-red-500/30 rounded-xl p-3 text-white text-xs h-20 resize-none outline-none focus:border-red-500/60 shadow-inner" placeholder="👎 Pontos Negativos" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-8 border-t border-white/5 mt-8">
                  <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white px-4 font-bold">Voltar</button>
                  <button onClick={() => setStep(3)} disabled={!formData.profession || (userRole === 'coordinator' && !formData.jobTitle)} className={`px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 text-white shadow-lg ${userRole === 'coordinator' ? 'bg-[#9D4EDD] hover:bg-purple-600' : 'bg-[#D5205D] hover:bg-pink-600'}`}>Continuar <ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Interesses Profissionais</h2>
                  <p className="text-sm text-slate-400 mt-1">Isso ajuda a personalizar sua experiência na rede.</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {['Gestão', 'Tecnologia', 'Pesquisa', 'Liderança', 'Inovação', 'Qualidade', 'Financeiro', 'Docência'].map(sug => (
                    <button key={sug} onClick={() => addTag(sug)} className="text-xs bg-[#142239] border border-white/10 px-4 py-2 rounded-full text-slate-300 hover:text-white hover:border-[#D5205D] transition-colors shadow-sm">+ {sug}</button>
                  ))}
                </div>
                <div className="relative group">
                  <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag(tagInput)} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D] placeholder:text-slate-600 shadow-inner" placeholder="Digite uma competência e dê Enter..." />
                  <Plus className="absolute right-4 top-4 text-slate-500" />
                </div>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-[#142239]/50 rounded-2xl border border-white/5">
                  {formData.interests.length === 0 && <span className="text-xs text-slate-500 italic">Nenhum interesse adicionado.</span>}
                  {formData.interests.map((tag, i) => (
                    <span key={i} className={`text-white px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 shadow-sm ${userRole === 'coordinator' ? 'bg-[#9D4EDD]/20 border-[#9D4EDD]/30' : 'bg-[#D5205D]/20 border-[#D5205D]/30'}`}>
                      {tag} <button onClick={() => setFormData(prev => ({ ...prev, interests: prev.interests.filter(t => t !== tag) }))} className="hover:text-red-400 transition-colors">×</button>
                    </span>
                  ))}
                </div>

                <div className="flex justify-between pt-8 border-t border-white/5 mt-8">
                  <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white px-4 font-bold">Voltar</button>
                  <button onClick={handleFinish} disabled={loading} className={`w-full max-w-[220px] text-white font-black py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-all disabled:opacity-70 ${userRole === 'coordinator' ? 'bg-[#9D4EDD] hover:bg-purple-600' : 'bg-[#D5205D] hover:bg-pink-600'}`}>
                    {loading ? 'Processando...' : 'Finalizar Cadastro'} <Check size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};