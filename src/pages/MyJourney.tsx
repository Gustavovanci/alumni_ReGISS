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
  const [uploading, setUploading] = useState(false);
  const { fetchUserProfile } = useStore();

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [profession, setProfession] = useState('');
  const [entryYear, setEntryYear] = useState('');
  const [bio, setBio] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [themeColor, setThemeColor] = useState('regiss-magenta');
  const [interests, setInterests] = useState<string[]>([]);
  const [whatsapp, setWhatsapp] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [journeyItems, setJourneyItems] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialItemState = {
    title: '', organization: '', type: 'job', start_date: '', end_date: '', rating: 0, pros: '', cons: '', benefits: [] as string[],
  };
  const [newItem, setNewItem] = useState(initialItemState);

  const PROFESSIONS = ['Fisioterapeuta', 'Nutricionista', 'Terapeuta Ocupacional', 'Fonoaudiólogo(a)', 'Enfermeiro(a)'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setFullName(profile.full_name || '');
        setBirthDate(profile.birth_date || '');
        setProfession(profile.profession || '');
        setEntryYear(profile.entry_year || '');
        setBio(profile.bio || '');
        setLinkedin(profile.linkedin_url || '');
        setAvatarUrl(profile.avatar_url || '');
        setThemeColor(profile.theme_color || 'regiss-magenta');
        setInterests(profile.interests || []);
        setWhatsapp(profile.whatsapp || '');
      }

      const { data: journey } = await supabase.from('career_journey').select('*').eq('user_id', user.id).order('start_date', { ascending: false });

      // Corretor Automático de Gramática no Banco de Dados
      const correctedJourney = journey?.map(item => {
        let newTitle = item.title;
        if (newTitle === 'Residência em Fisioterapeuta') newTitle = 'Residência em Fisioterapia';
        if (newTitle === 'Residência em Nutricionista') newTitle = 'Residência em Nutrição';
        if (newTitle === 'Residência em Terapeuta Ocupacional') newTitle = 'Residência em Terapia Ocupacional';
        if (newTitle === 'Residência em Fonoaudiólogo(a)' || newTitle === 'Residência em Fonoaudiólogo') newTitle = 'Residência em Fonoaudiologia';
        if (newTitle === 'Residência em Enfermeiro(a)' || newTitle === 'Residência em Enfermeiro' || newTitle === 'Residência em Enfermeira') newTitle = 'Residência em Enfermagem';

        if (newTitle !== item.title) {
          // Atualiza o banco de dados silenciosamente com o português correto
          supabase.from('career_journey').update({ title: newTitle }).eq('id', item.id).then();
          return { ...item, title: newTitle };
        }
        return item;
      });

      setJourneyItems(correctedJourney || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('avatars').upload(filePath, file);
    if (error) { toast.error('Erro ao fazer upload'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(publicUrl);
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) return toast.error("O nome é obrigatório");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      birth_date: birthDate || null,
      profession: profession,
      entry_year: entryYear,
      bio,
      linkedin_url: linkedin,
      avatar_url: avatarUrl,
      theme_color: themeColor,
      interests,
      whatsapp,
      whatsapp_authorized: !!whatsapp,
    }).eq('id', user.id);

    if (error) toast.error('Erro ao salvar perfil');
    else { await fetchUserProfile(true); toast.success('Perfil atualizado com sucesso!'); navigate('/feed'); }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) return toast.error('As senhas não coincidem');
    if (newPassword.length < 6) return toast.error('Mínimo 6 caracteres');
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success('Senha atualizada!'); setNewPassword(''); setConfirmPassword(''); }
    setIsUpdatingPassword(false);
  };

  const handleSaveItem = async () => {
    if (!newItem.title || !newItem.organization) return toast.error("Título e Organização são obrigatórios");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = editingId
      ? await supabase.from('career_journey').update(newItem).eq('id', editingId)
      : await supabase.from('career_journey').insert({ ...newItem, user_id: user.id });

    if (error) toast.error('Erro ao salvar');
    else { toast.success('Experiência salva!'); setIsAdding(false); setEditingId(null); setNewItem(initialItemState); fetchData(); }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Apagar esta experiência?')) return;
    await supabase.from('career_journey').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="min-h-screen bg-[#142239] flex items-center justify-center"><Loader2 className="w-12 h-12 text-[#D5205D] animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Meu Perfil & Jornada</h1>
          <button onClick={handleSaveProfile} className="flex items-center gap-2 bg-[#D5205D] px-6 py-3 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-all">
            <Save size={20} /> Salvar
          </button>
        </div>

        {/* Perfil */}
        <div className="bg-[#15335E] rounded-3xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-[#142239]">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : <div className="w-full h-full bg-slate-700 flex items-center justify-center text-5xl font-bold text-slate-400">{fullName[0] || '?'}</div>}
              </div>
              <label className="absolute bottom-2 right-2 bg-[#D5205D] text-white p-2 rounded-2xl cursor-pointer">
                {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                <input type="file" accept="image/*" onChange={handleUploadAvatar} className="hidden" disabled={uploading} />
              </label>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400">Nome Completo</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white mt-1 outline-none focus:border-[#D5205D]" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400">Data de Nascimento</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white mt-1 outline-none focus:border-[#D5205D] [color-scheme:dark]" />
                </div>
              </div>

              <div className="mt-6">
                <label className="text-xs uppercase font-bold text-slate-400">Profissão</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PROFESSIONS.map(prof => (
                    <button
                      key={prof}
                      type="button"
                      onClick={() => setProfession(prof)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${profession === prof ? 'bg-[#D5205D] border-[#D5205D] text-white' : 'bg-[#142239] border-white/10 text-slate-400 hover:border-[#D5205D]/50'}`}
                    >
                      {prof}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400">Ano de Formação</label>
                  <input type="number" placeholder="Ex: 2024" value={entryYear} onChange={(e) => setEntryYear(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white mt-1 outline-none focus:border-[#D5205D]" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400">Tema do Perfil</label>
                  <div className="flex gap-3 mt-2 h-full items-center">
                    {['regiss-magenta', 'regiss-petrol', 'regiss-wine'].map((color) => (
                      <button key={color} onClick={() => setThemeColor(color)} className={`w-10 h-10 rounded-2xl border-2 ${themeColor === color ? 'border-white' : 'border-transparent'} ${color === 'regiss-magenta' ? 'bg-[#D5205D]' : color === 'regiss-petrol' ? 'bg-[#275A80]' : 'bg-[#B32F50]'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-xs uppercase font-bold text-slate-400">Biografia</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 h-28 mt-1 text-white outline-none focus:border-[#D5205D]" placeholder="Fale um pouco sobre você..." />
              </div>
            </div>
          </div>
        </div>

        {/* Jornada */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Minha Jornada</h2>
            <button onClick={() => { setIsAdding(true); setEditingId(null); setNewItem(initialItemState); }} className="flex items-center gap-2 bg-[#D5205D] text-white px-5 py-2 rounded-2xl font-bold"><Plus size={20} /> Nova Experiência</button>
          </div>

          {isAdding && (
            <div className="bg-[#15335E] rounded-3xl p-8 mb-8 space-y-4 border border-[#D5205D]/30">
              <div><label className="text-xs uppercase font-bold text-slate-400">Título</label><input type="text" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-1" /></div>
              <div><label className="text-xs uppercase font-bold text-slate-400">Instituição</label><input type="text" value={newItem.organization} onChange={e => setNewItem({ ...newItem, organization: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-1" /></div>
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setIsAdding(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-white">Cancelar</button>
                <button onClick={handleSaveItem} className="px-6 py-3 font-bold text-white bg-[#D5205D] rounded-xl hover:bg-pink-600 transition-colors">Salvar</button>
              </div>
            </div>
          )}

          {journeyItems.map((item) => (
            <div key={item.id} className="bg-[#15335E] rounded-3xl p-6 mb-4 flex justify-between items-center border border-white/5">
              <div><h3 className="font-bold text-lg">{item.title}</h3><p className="text-slate-400 text-sm">{item.organization}</p></div>
              <div className="flex gap-3"><button onClick={() => { setNewItem(item); setEditingId(item.id); setIsAdding(true); }} className="text-blue-400 hover:scale-110 transition-transform"><Edit3 size={20} /></button><button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:scale-110 transition-transform"><Trash2 size={20} /></button></div>
            </div>
          ))}
        </div>

        {/* Notificações Push */}
        <div className="bg-[#15335E] rounded-3xl p-8 mb-8 border border-white/5 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <BellRing size={24} className="text-[#D5205D]" /> Alertas no Celular
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                Ative as notificações para receber novas vagas em tempo real, mesmo com o navegador fechado.
              </p>
            </div>
            <button onClick={subscribeToPushNotifications} className="w-full md:w-auto shrink-0 bg-[#142239] border border-[#D5205D] text-[#D5205D] hover:bg-[#D5205D] hover:text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg active:scale-95">
              Ativar Alertas
            </button>
          </div>
        </div>

        {/* Senha */}
        <div className="bg-[#15335E] rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6">Alterar Senha de Acesso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="password" placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D]" />
            <input type="password" placeholder="Confirmar senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D]" />
          </div>
          <button onClick={handleUpdatePassword} disabled={isUpdatingPassword} className="mt-6 w-full bg-white text-[#142239] hover:bg-slate-200 transition-colors py-4 rounded-2xl font-bold flex justify-center items-center">
            {isUpdatingPassword ? <Loader2 className="animate-spin" size={20} /> : 'Atualizar Senha Segura'}
          </button>
        </div>
      </div>
    </div>
  );
};