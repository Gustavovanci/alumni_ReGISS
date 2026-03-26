import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Camera, Edit3, Loader2, BellRing } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ title: '', organization: '', start_date: '', end_date: '' });

  const PROFESSIONS = ['Fisioterapeuta', 'Nutricionista', 'Terapeuta Ocupacional', 'Fonoaudiólogo(a)', 'Enfermeiro(a)'];

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

    // Auto-Correção Gramatical Ativa
    const corrected = journey?.map(item => {
      let title = item.title;
      if (title.includes('Fisioterapeuta')) title = 'Residência em Fisioterapia';
      if (title.includes('Nutricionista')) title = 'Residência em Nutrição';
      if (title.includes('Terapeuta Ocupacional')) title = 'Residência em Terapia Ocupacional';

      if (title !== item.title) {
        supabase.from('career_journey').update({ title }).eq('id', item.id).then();
        return { ...item, title };
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

  if (loading) return <div className="min-h-screen bg-[#142239] flex items-center justify-center text-[#D5205D]"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#142239] text-white p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <button onClick={handleSaveProfile} className="bg-[#D5205D] px-6 py-3 rounded-2xl font-bold flex items-center gap-2"><Save size={20} /> Salvar</button>
        </div>

        <div className="bg-[#15335E] rounded-3xl p-8 mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
              <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-2xl mt-1 outline-none focus:border-[#D5205D]" /></div>
            <div><label className="text-xs font-bold text-slate-400 uppercase">Data de Nascimento</label>
              <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-2xl mt-1 outline-none focus:border-[#D5205D] [color-scheme:dark]" /></div>
          </div>

          <div><label className="text-xs font-bold text-slate-400 uppercase">Profissão Base</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PROFESSIONS.map(p => <button key={p} onClick={() => setFormData({ ...formData, profession: p })} className={`px-4 py-2 rounded-xl border font-bold text-xs transition-all ${formData.profession === p ? 'bg-[#D5205D] border-[#D5205D]' : 'bg-[#142239] border-white/10 text-slate-400'}`}>{p}</button>)}
            </div>
          </div>

          <div><label className="text-xs font-bold text-slate-400 uppercase">Ano de Entrada no ReGISS</label>
            <input type="number" value={formData.entryYear} onChange={e => setFormData({ ...formData, entryYear: e.target.value })} className="w-full bg-[#142239] border border-white/10 p-4 rounded-2xl mt-1 outline-none focus:border-[#D5205D]" /></div>
        </div>

        {/* Notificações Push */}
        <div className="bg-[#15335E] rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5">
          <div><h2 className="text-xl font-bold flex items-center gap-2"><BellRing className="text-[#D5205D]" /> Alertas no Celular</h2><p className="text-slate-400 text-sm">Receba alertas de vagas em tempo real.</p></div>
          <button onClick={subscribeToPushNotifications} className="bg-[#142239] border border-[#D5205D] text-[#D5205D] px-8 py-3 rounded-xl font-bold hover:bg-[#D5205D] hover:text-white transition-all">Ativar</button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Minha Jornada</h2>
          {journeyItems.map(item => (
            <div key={item.id} className="bg-[#15335E] p-6 rounded-2xl mb-4 border border-white/5 flex justify-between items-center">
              <div><h3 className="font-bold">{item.title}</h3><p className="text-slate-400 text-sm">{item.organization}</p></div>
              <button onClick={() => { if (window.confirm('Excluir?')) supabase.from('career_journey').delete().eq('id', item.id).then(() => fetchData()) }} className="text-red-400"><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};