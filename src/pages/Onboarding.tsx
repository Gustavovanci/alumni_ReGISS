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

  const PROFESSIONS = ['Fisioterapeuta', 'Nutricionista', 'Terapeuta Ocupacional', 'Fonoaudiólogo(a)', 'Enfermeiro(a)'];

  const years = Array.from({ length: new Date().getFullYear() - 2017 }, (_, i) => new Date().getFullYear() - i);

  const [formData, setFormData] = useState({
    fullName: '',
    profession: '',
    entryYear: '',
    birthDate: '',
    interests: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');

  // Lógica de Tradução Gramatical
  const getResidencyArea = (prof: string) => {
    const map: any = {
      'Fisioterapeuta': 'Fisioterapia',
      'Nutricionista': 'Nutrição',
      'Terapeuta Ocupacional': 'Terapia Ocupacional',
      'Fonoaudiólogo(a)': 'Fonoaudiologia',
      'Enfermeiro(a)': 'Enfermagem'
    };
    return map[prof] || 'Gestão Integrada';
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");

      const entryYearInt = parseInt(formData.entryYear);
      const residencyTitle = `Residência em ${getResidencyArea(formData.profession)}`;

      // 1. Atualiza Perfil
      const { error: pErr } = await supabase.from('profiles').update({
        full_name: formData.fullName,
        profession: formData.profession,
        entry_year: entryYearInt,
        birth_date: formData.birthDate,
        interests: formData.interests,
      }).eq('id', user.id);
      if (pErr) throw pErr;

      // 2. Cria o Marco ReGISS (Com o nome certo!)
      await supabase.from('career_journey').insert({
        user_id: user.id,
        title: residencyTitle,
        organization: 'HCFMUSP - ReGISS',
        type: 'regiss',
        start_date: `${entryYearInt}-03-01`,
        end_date: `${entryYearInt + 2}-02-28`,
      });

      await fetchUserProfile(true);
      toast.success('Perfil configurado!');
      navigate('/feed');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#142239] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#15335E] rounded-3xl p-8 shadow-2xl">
        {step === 0 ? (
          <div className="text-center py-10">
            <Award size={60} className="mx-auto mb-6 text-[#D5205D]" />
            <h1 className="text-3xl font-bold mb-4">Alumni ReGISS</h1>
            <p className="text-slate-400 mb-8">Bem-vindo! Vamos ajustar seu perfil profissional.</p>
            <button onClick={() => setStep(1)} className="bg-[#D5205D] px-10 py-4 rounded-2xl font-bold text-lg">Começar</button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-[#D5205D]' : 'bg-slate-700'}`} />)}
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Identificação</h2>
                <input type="text" placeholder="Nome Completo" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-2xl outline-none focus:border-[#D5205D]" />
                <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-2xl outline-none focus:border-[#D5205D] [color-scheme:dark]" />
                <div className="flex justify-end mt-6">
                  <button onClick={() => setStep(2)} disabled={!formData.fullName || !formData.birthDate} className="bg-[#D5205D] px-8 py-3 rounded-xl font-bold flex items-center gap-2">Próximo <ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Sua Profissão Base</h2>
                <div className="flex flex-wrap gap-2">
                  {PROFESSIONS.map(p => (
                    <button key={p} onClick={() => setFormData({ ...formData, profession: p })} className={`px-4 py-3 rounded-xl border font-bold transition-all ${formData.profession === p ? 'bg-[#D5205D] border-[#D5205D]' : 'border-white/10 bg-[#142239] text-slate-400'}`}>{p}</button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">Ano de Entrada no HCFMUSP</label>
                  <select value={formData.entryYear} onChange={e => setFormData({ ...formData, entryYear: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-2xl mt-2">
                    <option value="">Selecione o ano</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(1)} className="text-slate-400 font-bold">Voltar</button>
                  <button onClick={() => setStep(3)} disabled={!formData.profession || !formData.entryYear} className="bg-[#D5205D] px-8 py-3 rounded-xl font-bold flex items-center gap-2">Próximo <ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Interesses</h2>
                <div className="flex gap-2">
                  <input type="text" placeholder="Ex: Gestão Lean" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setFormData({ ...formData, interests: [...formData.interests, tagInput] }), setTagInput(''))} className="flex-1 bg-[#142239] border border-white/10 p-4 rounded-2xl" />
                  <button onClick={() => { setFormData({ ...formData, interests: [...formData.interests, tagInput] }); setTagInput('') }} className="bg-[#D5205D] px-4 rounded-xl"><Plus /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map(t => <span key={t} className="bg-[#D5205D]/20 text-[#D5205D] px-3 py-1 rounded-lg text-sm flex items-center gap-2 border border-[#D5205D]/30">{t} <X size={14} className="cursor-pointer" onClick={() => setFormData({ ...formData, interests: formData.interests.filter(i => i !== t) })} /></span>)}
                </div>
                <button onClick={handleFinish} disabled={loading} className="w-full bg-[#D5205D] py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 mt-6">
                  {loading ? <Loader2 className="animate-spin" /> : <><Check /> Concluir</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};