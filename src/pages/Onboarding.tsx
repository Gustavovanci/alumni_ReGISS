import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Plus, Award, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { getRegissStatus } from '../utils/regissLogic';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

export const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { fetchUserProfile } = useStore();

  const [userRole, setUserRole] = useState<'user' | 'coordinator'>('user');

  const PROFESSIONS = ['Fisioterapeuta', 'Nutricionista', 'Terapeuta Ocupacional', 'Fonoaudiólogo(a)', 'Enfermeiro(a)'];
  const years = Array.from({ length: new Date().getFullYear() - 2017 }, (_, i) => new Date().getFullYear() - i);

  const [formData, setFormData] = useState({
    fullName: '',
    profession: '',
    entryYear: '',
    birthDate: '',
    jobTitle: '',
    company: '',
    jobStartDate: '',
    interests: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [isCustomProfession, setIsCustomProfession] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (isMounted) navigate('/');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (isMounted) {
          if (profile?.full_name && step === 0) {
            if (profile.role === 'admin') navigate('/admin');
            else if (profile.role === 'coordinator') navigate('/coordination');
            else navigate('/feed');
          }
          if (profile?.role === 'coordinator') setUserRole('coordinator');
        }
      } catch (err) {
        console.error("Erro no Onboarding:", err);
      }
    };
    checkProfile();
    return () => { isMounted = false; };
  }, [navigate, step]);

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

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: formData.fullName.trim(),
        profession: formData.profession,
        entry_year: entryYearInt,
        birth_date: formData.birthDate,
        job_title: finalJobTitle,
        current_company: finalCompany,
        interests: formData.interests,
        updated_at: new Date().toISOString()
      });

      if (profileError) throw profileError;

      // Criação PADRONIZADA do Marco: Apenas "R1 ReGISS"
      if (userRole === 'user' && entryYearInt) {
        await supabase.from('career_journey').insert({
          user_id: user.id,
          title: 'R1 ReGISS',
          organization: 'HCFMUSP - ReGISS',
          type: 'regiss',
          start_date: `${entryYearInt}-03-01`,
          end_date: entryYearInt ? `${entryYearInt + 2}-02-28` : null,
          rating: 0,
        });
      }

      if (formData.jobTitle && formData.company && formData.jobStartDate && (!isResident || userRole === 'coordinator')) {
        await supabase.from('career_journey').insert({
          user_id: user.id,
          title: formData.jobTitle,
          organization: formData.company,
          type: 'job',
          start_date: formData.jobStartDate,
          end_date: null,
          rating: 0,
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

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">

        {step === 0 && (
          <div className="bg-[#15335E] rounded-3xl p-10 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-[#D5205D] to-[#275A80] rounded-3xl flex items-center justify-center shadow-lg shadow-pink-900/20">
              <Award size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Bem-vindo ao Alumni ReGISS</h1>
            <p className="text-slate-400 mb-10 text-lg">Vamos configurar seu perfil para uma experiência completa na nossa rede.</p>
            <button onClick={() => setStep(1)} className="bg-[#D5205D] hover:bg-pink-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl active:scale-95">
              Começar Configuração
            </button>
          </div>
        )}

        {step > 0 && (
          <div className="bg-[#15335E] rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="flex gap-2 mb-10">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-[#D5205D] shadow-[0_0_10px_rgba(213,32,93,0.5)]' : 'bg-[#142239]'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="text-3xl font-bold mb-8 text-white">Identificação Básica</h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                    <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D] transition-all" placeholder="Ex: João da Silva" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Data de Nascimento</label>
                    <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D] transition-all [color-scheme:dark]" />
                  </div>
                </div>
                <div className="flex justify-end mt-10">
                  <button onClick={() => setStep(2)} disabled={!formData.fullName || !formData.birthDate} className="bg-[#D5205D] disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95">Continuar <ChevronRight /></button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="text-3xl font-bold mb-8 text-white">Sua Trajetória</h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Sua Profissão Base</label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {PROFESSIONS.map(prof => (
                        <button key={prof} onClick={() => { setFormData({ ...formData, profession: prof }); setIsCustomProfession(false); }} className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${formData.profession === prof && !isCustomProfession ? 'bg-[#D5205D] border-[#D5205D] text-white shadow-lg' : 'bg-[#142239] border-white/10 text-slate-400 hover:border-[#D5205D]/50'}`}>{prof}</button>
                      ))}
                      <button onClick={() => { setFormData({ ...formData, profession: '' }); setIsCustomProfession(true); }} className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${isCustomProfession ? 'bg-[#D5205D] border-[#D5205D] text-white shadow-lg' : 'bg-[#142239] border-white/10 text-slate-400'}`}>Outra...</button>
                    </div>
                    {isCustomProfession && (
                      <input type="text" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-4 text-white outline-none focus:border-[#D5205D] transition-all" placeholder="Digite sua profissão (Ex: Biomédico(a))" />
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Ano de Ingresso na ReGISS</label>
                    <select value={formData.entryYear} onChange={e => setFormData({ ...formData, entryYear: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D] transition-all cursor-pointer">
                      <option value="">Selecione o ano</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  {!isResident && formData.entryYear && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-in fade-in">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Cargo Atual</label>
                        <input type="text" value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D]" placeholder="Ex: Gestor de Qualidade" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Empresa</label>
                        <input type="text" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D]" placeholder="Onde você trabalha hoje?" />
                      </div>
                      {formData.company && (
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Início no Cargo Atual</label>
                          <input type="date" value={formData.jobStartDate} onChange={e => setFormData({ ...formData, jobStartDate: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-2 text-white outline-none focus:border-[#D5205D] [color-scheme:dark]" />
                        </div>
                      )}
                    </div>
                  )}
                  {isResident && formData.entryYear && (
                    <div className="bg-[#142239] p-4 rounded-2xl border border-white/5 text-sm text-slate-400 mt-4 animate-in fade-in">
                      O sistema configurará seu cargo atual automaticamente como Residente no HCFMUSP.
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-10">
                  <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white px-6 py-4 font-bold transition-colors">Voltar</button>
                  <button onClick={() => setStep(3)} disabled={!formData.profession || !formData.entryYear} className="bg-[#D5205D] disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95">Continuar <ChevronRight /></button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="text-3xl font-bold mb-2 text-white">Seus Interesses</h2>
                <p className="text-slate-400 mb-8">Adicione tags sobre o que você pesquisa, estuda ou tem interesse (Isso ajuda a receber vagas!).</p>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setFormData(prev => ({ ...prev, interests: [...prev.interests, tagInput] })); setTagInput(''); } }} className="flex-1 bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D] transition-all" placeholder="Ex: Gestão Lean, Power BI..." />
                    <button onClick={() => { setFormData(prev => ({ ...prev, interests: [...prev.interests, tagInput] })); setTagInput(''); }} className="bg-[#142239] hover:bg-[#D5205D] border border-white/10 text-white px-6 rounded-2xl font-bold transition-all shadow-lg active:scale-95"><Plus size={24} /></button>
                  </div>
                  {formData.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-[#142239] rounded-2xl border border-white/5 min-h-[80px]">
                      {formData.interests.map((tag, index) => (
                        <span key={index} className="bg-[#D5205D]/20 text-[#D5205D] px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2 border border-[#D5205D]/30">
                          {tag} <button onClick={() => setFormData(prev => ({ ...prev, interests: prev.interests.filter(t => t !== tag) }))} className="hover:text-white transition-colors"><X size={14} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-10 pt-6 border-t border-white/5">
                  <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white px-4 py-4 font-bold transition-colors">Voltar</button>
                  <button onClick={handleFinish} disabled={loading || formData.interests.length === 0} className="flex-1 ml-4 bg-[#D5205D] disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95">
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