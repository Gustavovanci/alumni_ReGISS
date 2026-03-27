import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Loader2, BellRing, Star, X, Briefcase, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';
import { subscribeToPushNotifications } from '../utils/pushNotifications';

export const MyJourney = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { fetchUserProfile } = useStore();

  const [formData, setFormData] = useState({
    fullName: '', birthDate: '', profession: '', entryYear: '', bio: '', whatsapp: '', avatarUrl: ''
  });

  const [journeyItems, setJourneyItems] = useState<any[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'job',
    title: '',
    organization: '',
    start_date: '',
    end_date: '',
    rating: 0,
    pros: '',
    cons: ''
  });

  const PROFESSIONS = ['Fisioterapeuta', 'Nutricionista', 'Terapeuta Ocupacional', 'Fonoaudiólogo(a)', 'Enfermeiro(a)'];

  const forceCorrectGrammar = (title: string) => {
    if (!title) return '';
    const t = title.toLowerCase();
    if (t.includes('fisioterapeut')) return 'Residência em Fisioterapia';
    if (t.includes('nutricionist')) return 'Residência em Nutrição';
    if (t.includes('terapeuta ocupacional')) return 'Residência em Terapia Ocupacional';
    if (t.includes('fonoaudi')) return 'Residência em Fonoaudiologia';
    if (t.includes('enfermeir')) return 'Residência em Enfermagem';
    return title;
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) setFormData({
      fullName: profile.full_name || '',
      birthDate: profile.birth_date || '',
      profession: profile.profession || '',
      entryYear: profile.entry_year || '',
      bio: profile.bio || '',
      whatsapp: profile.whatsapp || '',
      avatarUrl: profile.avatar_url || ''
    });

    const { data: journey } = await supabase.from('career_journey').select('*').eq('user_id', user.id).order('start_date', { ascending: false });

    const corrected = journey?.map(item => {
      if (item.type === 'regiss') {
        const rightTitle = forceCorrectGrammar(item.title);
        if (rightTitle !== item.title) supabase.from('career_journey').update({ title: rightTitle }).eq('id', item.id).then();
        return { ...item, title: rightTitle };
      }
      return item;
    });

    setJourneyItems(corrected || []);
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').update({
      full_name: formData.fullName,
      birth_date: formData.birthDate,
      profession: formData.profession,
      entry_year: formData.entryYear,
      bio: formData.bio,
      whatsapp: formData.whatsapp
    }).eq('id', user?.id);

    if (error) toast.error('Erro ao salvar');
    else { toast.success('Perfil atualizado!'); fetchUserProfile(true); navigate('/feed'); }
  };

  const handleAddExperience = async () => {
    if (!newItem.title || !newItem.organization || !newItem.start_date) {
      return toast.error('Preencha os campos obrigatórios (Título, Empresa e Início)');
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('career_journey').insert({
        user_id: user?.id,
        type: newItem.type, // Agora manda 'job' ou 'education'
        title: newItem.title,
        organization: newItem.organization,
        start_date: newItem.start_date,
        end_date: newItem.end_date || null,
        rating: newItem.rating,
        pros: newItem.pros,
        cons: newItem.cons
      });

      if (error) throw error;

      toast.success('Experiência adicionada com sucesso!');
      setIsAdding(false);
      setNewItem({ type: 'job', title: '', organization: '', start_date: '', end_date: '', rating: 0, pros: '', cons: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#142239] flex items-center justify-center text-[#D5205D]"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#142239] text-white p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <button onClick={handleSaveProfile} className="bg-[#D5205D] px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:bg-pink-600 active:scale-95 shadow-lg"><Save size={20} /> Salvar</button>
        </div>

        <div className="bg-[#15335E] rounded-3xl p-8 mb-8 space-y-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
              <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-2xl mt-1 outline-none focus:border-[#D5205D] transition-colors" /></div>
            <div><label className="text-xs font-bold text-slate-400 uppercase">Data de Nascimento</label>
              <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-2xl mt-1 outline-none focus:border-[#D5205D] transition-colors [color-scheme:dark]" /></div>
          </div>

          <div><label className="text-xs font-bold text-slate-400 uppercase">Profissão Base</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PROFESSIONS.map(p => <button key={p} onClick={() => setFormData({ ...formData, profession: p })} className={`px-4 py-2 rounded-xl border font-bold text-xs transition-all ${formData.profession === p ? 'bg-[#D5205D] border-[#D5205D] shadow-lg' : 'bg-[#142239] border-white/10 text-slate-400 hover:border-[#D5205D]/50'}`}>{p}</button>)}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Minha Jornada</h2>
            <button onClick={() => setIsAdding(true)} className="bg-[#15335E] hover:bg-[#D5205D] text-white border border-white/10 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg text-sm">
              <Plus size={16} /> Adicionar Experiência
            </button>
          </div>

          {isAdding && (
            <div className="bg-[#15335E] border border-[#D5205D]/50 rounded-3xl p-6 mb-8 shadow-2xl animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-[#D5205D]">Nova Conquista</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white bg-black/20 p-2 rounded-full"><X size={16} /></button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setNewItem({ ...newItem, type: 'job' })} className={`flex-1 py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${newItem.type === 'job' ? 'bg-[#D5205D] border-[#D5205D]' : 'bg-[#142239] border-white/10 text-slate-400'}`}><Briefcase size={14} /> Trabalho</button>
                  <button onClick={() => setNewItem({ ...newItem, type: 'education' })} className={`flex-1 py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${newItem.type === 'education' ? 'bg-[#275A80] border-[#275A80]' : 'bg-[#142239] border-white/10 text-slate-400'}`}><GraduationCap size={14} /> Curso/MBA</button>
                </div>

                <input type="text" placeholder={newItem.type === 'job' ? "Cargo (Ex: Gestor de Qualidade)" : "Nome do Curso (Ex: MBA em Gestão)"} value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-xl outline-none focus:border-[#D5205D]" />
                <input type="text" placeholder={newItem.type === 'job' ? "Empresa / Hospital" : "Instituição de Ensino"} value={newItem.organization} onChange={e => setNewItem({ ...newItem, organization: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-xl outline-none focus:border-[#D5205D]" />

                <div className="flex gap-4">
                  <div className="flex-1"><label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Início</label><input type="date" value={newItem.start_date} onChange={e => setNewItem({ ...newItem, start_date: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-xl mt-1 outline-none [color-scheme:dark]" /></div>
                  <div className="flex-1"><label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Término (Opcional)</label><input type="date" value={newItem.end_date} onChange={e => setNewItem({ ...newItem, end_date: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-xl mt-1 outline-none [color-scheme:dark]" /></div>
                </div>

                {/* SESSÃO GLASSDOOR ANONIMA */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <h4 className="font-bold text-sm text-slate-300 mb-2">Avaliação de Insights (Opcional & Anônima)</h4>
                  <p className="text-xs text-slate-500 mb-4">Ajude outros Alumnis compartilhando sua experiência real.</p>

                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setNewItem({ ...newItem, rating: star })} className="transition-all hover:scale-110">
                        <Star size={28} className={newItem.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-600'} />
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea placeholder="Prós: O que é bom?" value={newItem.pros} onChange={e => setNewItem({ ...newItem, pros: e.target.value })} className="w-full bg-[#142239] border border-emerald-500/20 p-4 rounded-xl outline-none focus:border-emerald-500 text-sm h-24 resize-none placeholder:text-emerald-500/50" />
                    <textarea placeholder="Contras: O que pode melhorar?" value={newItem.cons} onChange={e => setNewItem({ ...newItem, cons: e.target.value })} className="w-full bg-[#142239] border border-red-500/20 p-4 rounded-xl outline-none focus:border-red-500 text-sm h-24 resize-none placeholder:text-red-500/50" />
                  </div>
                </div>

                <button onClick={handleAddExperience} disabled={isSubmitting} className="w-full mt-4 bg-[#D5205D] py-4 rounded-xl font-bold flex justify-center items-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Experiência'}
                </button>
              </div>
            </div>
          )}

          {journeyItems.map(item => (
            <div key={item.id} className="bg-[#15335E] p-6 rounded-2xl mb-4 border border-white/5 flex justify-between items-start shadow-lg group hover:border-[#D5205D]/30 transition-colors">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  {item.title}
                  {item.type === 'regiss' && <span className="text-[10px] bg-[#D5205D]/20 text-[#D5205D] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border border-[#D5205D]/30">MARCO REGISS</span>}
                </h3>
                <p className="text-slate-400 text-sm mt-1">{item.organization}</p>
                {item.rating > 0 && (
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={12} className={item.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-700'} />
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { if (window.confirm('Excluir?')) supabase.from('career_journey').delete().eq('id', item.id).then(() => fetchData()) }} className="text-slate-500 hover:text-red-400 p-2 transition-colors"><Trash2 size={20} /></button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};