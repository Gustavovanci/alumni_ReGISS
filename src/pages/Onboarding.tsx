import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Plus, Award, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { getRegissStatus } from '../utils/regissLogic';
import { StarRating } from '../components/StarRating';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

export const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { fetchUserProfile } = useStore();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2018 }, (_, i) => currentYear - i);

  const [userRole, setUserRole] = useState<'user' | 'coordinator'>('user');

  const [formData, setFormData] = useState({
    fullName: '',
    profession: '',
    entryYear: '',
    birthDate: '',
    jobTitle: '',
    company: '',
    interests: [] as string[],
    jobStartDate: '',
    jobRating: 0,
    jobPros: '',
    jobCons: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [isCustomProfession, setIsCustomProfession] = useState(false);

  const PROFESSIONS = [
    'Fisioterapeuta',
    'Nutricionista',
    'Terapeuta Ocupacional',
    'Fonoaudiólogo(a)',
    'Enfermeiro(a)'
  ];

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (profile?.full_name) {
        if (profile.role === 'admin') navigate('/admin');
        else if (profile.role === 'coordinator') navigate('/coordination');
        else navigate('/feed');
      }

      if (profile?.role === 'coordinator') setUserRole('coordinator');
    };
    checkProfile();
  }, [navigate]);

  const simulableYear = formData.entryYear ? parseInt(formData.entryYear) : null;
  const simulatedStatus = getRegissStatus(simulableYear, userRole);
  const isResident = simulatedStatus?.label === 'R1' || simulatedStatus?.label === 'R2';

  // Lógica inteligente para corrigir o português do Marco da Residência
  const getResidencyTitle = (profession: string) => {
    const map: Record<string, string> = {
      'Fisioterapeuta': 'Fisioterapia',
      'Nutricionista': 'Nutrição',
      'Terapeuta Ocupacional': 'Terapia Ocupacional',
      'Fonoaudiólogo(a)': 'Fonoaudiologia',
      'Enfermeiro(a)': 'Enfermagem',
    };

    const area = map[profession];
    if (area) return `Residência em ${area}`;

    // Fallback caso a pessoa digite uma profissão customizada
    return `Residência em Gestão Integrada de Serviços de Saúde`;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão inválida.");

      const entryYearInt = parseInt(formData.entryYear);
      const finalJobTitle = (userRole === 'user' && isResident) ? simulatedStatus?.defaultRole : formData.jobTitle;
      const finalCompany = (userRole === 'user' && isResident) ? 'HCFMUSP' : formData.company;

      // Atualiza o perfil no banco de dados (birthDate já vai no formato YYYY-MM-DD)
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: formData.fullName.trim(),
        profession: formData.profession,
        entry_year: entryYearInt,
        birth_date: formData.birthDate,
        job_title: finalJobTitle,
        current_company: finalCompany,
        interests: formData.interests,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);

      if (profileError) throw profileError;

      // Adiciona marco ReGISS automaticamente com a gramática correta
      if (userRole === 'user' && entryYearInt) {
        await supabase.from('career_journey').insert({
          user_id: user.id,
          title: getResidencyTitle(formData.profession),
          organization: 'HCFMUSP - ReGISS',
          type: 'regiss',
          start_date: `${entryYearInt}-03-01`,
          end_date: entryYearInt ? `${entryYearInt + 2}-02-28` : null,
          rating: 0,
        });
      }

      // Adiciona emprego atual (se preenchido e não for residente)
      if (formData.jobTitle && formData.company && formData.jobStartDate && (!isResident || userRole === 'coordinator')) {
        await supabase.from('career_journey').insert({
          user_id: user.id,
          title: formData.jobTitle,
          organization: formData.company,
          type: 'job',
          start_date: formData.jobStartDate,
          end_date: null,
          rating: formData.jobRating || 0,
          pros: formData.jobPros || null,
          cons: formData.jobCons || null,
        });
      }

      await fetchUserProfile(true);

      toast.success('Perfil configurado com sucesso!');
      if (userRole === 'coordinator') navigate('/coordination');
      else navigate('/feed');

    } catch (error: any) {
      toast.error(error.message || 'Erro ao finalizar onboarding');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.interests.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, interests: [...prev.interests, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, interests: prev.interests.filter(tag => tag !== tagToRemove) }));
  };

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">

        {/* TELA DE BOAS VINDAS */}
        {step === 0 && (
          <div className="bg-[#15335E] rounded-3xl p-10 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-[#D5205D] to-[#275A80] rounded-3xl flex items-center justify-center shadow-lg shadow-pink-900/20">
              <Award size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Bem-vindo ao Alumni ReGISS</h1>
            <p className="text-slate-400 mb-10 text-lg">Vamos configurar seu perfil para uma experiência completa na nossa rede.</p>
            <button
              onClick={() => setStep(1)}
              className="bg-[#D5205D] hover:bg-pink-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl active:scale-95"
            >
              Começar Configuração
            </button>
          </div>
        )}

        {/* PASSOS DO FORMULÁRIO */}
        {step > 0 && (
          <div className="bg-[#15335E] rounded-3xl p-8 md:p-12 shadow-2xl">

            {/* Barra de Progresso */}
            <div className="flex gap-2 mb-10">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-[#D5205D] shadow-[0_0_10px_rgba(213,32,93,0.5)]' : 'bg-[#142239]'}`}
                />
              ))}
            </div>

            {/* STEP 1 - IDENTIFICAÇÃO BÁSICA */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="text-3xl font-bold mb-8 text-white">Identificação Básica</h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D] transition-all placeholder:text-slate-600"
                      placeholder="Ex: João da Silva"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Data de Nascimento</label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D] transition-all [color-scheme:dark]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Ano de Ingresso na ReGISS</label>
                      <select
                        value={formData.entryYear}
                        onChange={e => setFormData({ ...formData, entryYear: e.target.value })}
                        className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D] transition-all cursor-pointer"
                      >
                        <option value="">Selecione o ano</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-10">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!formData.fullName || !formData.birthDate || !formData.entryYear}
                    className="bg-[#D5205D] hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-[#D5205D] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    Continuar <ChevronRight />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 - FORMAÇÃO E ATUAÇÃO */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="text-3xl font-bold mb-8 text-white">Formação e Atuação</h2>
                <div className="space-y-6">

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Sua Profissão Base</label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {PROFESSIONS.map(prof => (
                        <button
                          key={prof}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, profession: prof });
                            setIsCustomProfession(false);
                          }}
                          className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${formData.profession === prof && !isCustomProfession
                              ? 'bg-[#D5205D] border-[#D5205D] text-white shadow-lg'
                              : 'bg-[#142239] border-white/10 text-slate-400 hover:border-[#D5205D]/50'
                            }`}
                        >
                          {prof}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, profession: '' });
                          setIsCustomProfession(true);
                        }}
                        className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${isCustomProfession
                            ? 'bg-[#D5205D] border-[#D5205D] text-white shadow-lg'
                            : 'bg-[#142239] border-white/10 text-slate-400 hover:border-[#D5205D]/50'
                          }`}
                      >
                        Outra...
                      </button>
                    </div>

                    {isCustomProfession && (
                      <input
                        type="text"
                        value={formData.profession}
                        onChange={e => setFormData({ ...formData, profession: e.target.value })}
                        className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-4 text-white outline-none focus:border-[#D5205D] transition-all placeholder:text-slate-600 animate-in fade-in"
                        placeholder="Digite sua profissão (Ex: Psicólogo(a), Farmacêutico(a)...)"
                      />
                    )}
                  </div>

                  {!isResident && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Cargo Atual</label>
                          <input
                            type="text"
                            value={formData.jobTitle}
                            onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                            className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D] transition-all placeholder:text-slate-600"
                            placeholder="Ex: Gestor de Qualidade"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Empresa / Instituição</label>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D] transition-all placeholder:text-slate-600"
                            placeholder="Onde você trabalha hoje?"
                          />
                        </div>
                      </div>

                      {formData.company && (
                        <div className="animate-in fade-in">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Data de Início no Cargo</label>
                          <input
                            type="date"
                            value={formData.jobStartDate}
                            onChange={e => setFormData({ ...formData, jobStartDate: e.target.value })}
                            className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D] transition-all [color-scheme:dark]"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {isResident && (
                    <div className="bg-[#142239] p-4 rounded-2xl border border-white/5 text-sm text-slate-400 mt-4">
                      Como você informou que entrou em {formData.entryYear}, o sistema configurará seu cargo automaticamente como Residente no HCFMUSP.
                    </div>
                  )}

                </div>

                <div className="flex justify-between mt-10">
                  <button
                    onClick={() => setStep(1)}
                    className="text-slate-400 hover:text-white px-6 py-4 font-bold transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!formData.profession}
                    className="bg-[#D5205D] hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-[#D5205D] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    Continuar <ChevronRight />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 - INTERESSES E FINALIZAÇÃO */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="text-3xl font-bold mb-2 text-white">Seus Interesses</h2>
                <p className="text-slate-400 mb-8">Adicione tags sobre o que você pesquisa, estuda ou tem interesse profissional. Isso ajuda no networking!</p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTag()}
                      className="flex-1 bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D] transition-all placeholder:text-slate-600"
                      placeholder="Ex: Gestão Lean, Saúde Digital, Qualidade..."
                    />
                    <button
                      onClick={addTag}
                      className="bg-[#142239] hover:bg-[#D5205D] border border-white/10 hover:border-[#D5205D] text-white px-6 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
                    >
                      <Plus size={24} />
                    </button>
                  </div>

                  {/* Lista de Tags Adicionadas */}
                  {formData.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-[#142239] rounded-2xl border border-white/5 min-h-[80px]">
                      {formData.interests.map((tag, index) => (
                        <span key={index} className="bg-[#D5205D]/20 text-[#D5205D] px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2 border border-[#D5205D]/30">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-10 pt-6 border-t border-white/5">
                  <button
                    onClick={() => setStep(2)}
                    className="text-slate-400 hover:text-white px-4 py-4 font-bold transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={loading || formData.interests.length === 0}
                    className="flex-1 ml-4 bg-[#D5205D] hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-[#D5205D] text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <><Check size={24} /> Finalizar Cadastro</>}
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