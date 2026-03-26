import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Briefcase, GraduationCap, Trash2, Camera, Edit3, Award, Loader2, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';
import { subscribeToPushNotifications } from '../utils/pushNotifications';

export const MyJourney = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { fetchUserProfile } = useStore();

  // Estados do Perfil
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [themeColor, setThemeColor] = useState('regiss-magenta');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Jornada
  const [journeyItems, setJourneyItems] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialItemState = {
    title: '',
    organization: '',
    type: 'job',
    start_date: '',
    end_date: '',
    rating: 0,
    pros: '',
    cons: '',
    benefits: [] as string[],
  };
  const [newItem, setNewItem] = useState(initialItemState);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setLinkedin(profile.linkedin_url || '');
      setAvatarUrl(profile.avatar_url || '');
      setThemeColor(profile.theme_color || 'regiss-magenta');
      setInterests(profile.interests || []);
      setWhatsapp(profile.whatsapp || '');
    }

    const { data: journey } = await supabase
      .from('career_journey')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    setJourneyItems(journey || []);
    setLoading(false);
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error } = await supabase.storage.from('avatars').upload(filePath, file);
    if (error) {
      toast.error('Erro ao fazer upload');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(publicUrl);
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) return toast.error("O nome é obrigatório");

    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      bio,
      linkedin_url: linkedin,
      avatar_url: avatarUrl,
      theme_color: themeColor,
      interests,
      whatsapp,
      whatsapp_authorized: !!whatsapp,
    }).eq('id', (await supabase.auth.getUser()).data.user?.id);

    if (error) toast.error('Erro ao salvar perfil');
    else {
      await fetchUserProfile(true);
      toast.success('Perfil atualizado!');
      navigate('/feed');
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) return toast.error('As senhas não coincidem');
    if (newPassword.length < 6) return toast.error('A senha deve ter no mínimo 6 caracteres');

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success('Senha atualizada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsUpdatingPassword(false);
  };

  const handleSaveItem = async () => {
    if (!newItem.title || !newItem.organization) return toast.error("Título e Organização são obrigatórios");

    const { error } = editingId
      ? await supabase.from('career_journey').update(newItem).eq('id', editingId)
      : await supabase.from('career_journey').insert({ ...newItem, user_id: (await supabase.auth.getUser()).data.user?.id });

    if (error) toast.error('Erro ao salvar');
    else {
      toast.success('Experiência salva!');
      setIsAdding(false);
      setEditingId(null);
      setNewItem(initialItemState);
      fetchData();
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Apagar esta experiência?')) return;
    await supabase.from('career_journey').delete().eq('id', id);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#142239] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#D5205D] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Meu Perfil & Jornada</h1>
          <button onClick={handleSaveProfile} className="flex items-center gap-2 bg-[#D5205D] px-6 py-3 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-all">
            <Save size={20} /> Salvar Tudo
          </button>
        </div>

        {/* Seção Perfil */}
        <div className="bg-[#15335E] rounded-3xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-[#142239]">
                {avatarUrl ? (
                  <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center text-5xl font-bold text-slate-400">
                    {fullName[0] || '?'}
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 bg-[#D5205D] text-white p-2 rounded-2xl cursor-pointer">
                {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                <input type="file" accept="image/*" onChange={handleUploadAvatar} className="hidden" disabled={uploading} />
              </label>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <label className="text-xs uppercase font-bold text-slate-400">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 text-white mt-1 outline-none focus:border-[#D5205D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400">Tema do Perfil</label>
                  <div className="flex gap-3 mt-2">
                    {['regiss-magenta', 'regiss-petrol', 'regiss-wine'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setThemeColor(color)}
                        className={`w-10 h-10 rounded-2xl border-2 ${themeColor === color ? 'border-white' : 'border-transparent'} ${color === 'regiss-magenta' ? 'bg-[#D5205D]' : color === 'regiss-petrol' ? 'bg-[#275A80]' : 'bg-[#B32F50]'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-slate-400">Biografia</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 h-28 mt-1 text-white outline-none focus:border-[#D5205D]"
                  placeholder="Fale um pouco sobre você..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Jornada */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Minha Jornada</h2>
            <button
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                setNewItem(initialItemState);
              }}
              className="flex items-center gap-2 bg-[#D5205D] text-white px-5 py-2 rounded-2xl font-bold"
            >
              <Plus size={20} /> Nova Experiência
            </button>
          </div>

          {isAdding && (
            <div className="bg-[#15335E] rounded-3xl p-8 mb-8 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-slate-400">Título do Cargo/Experiência</label>
                <input type="text" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-1" placeholder="Ex: Gestor de Qualidade" />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-slate-400">Instituição/Empresa</label>
                <input type="text" value={newItem.organization} onChange={e => setNewItem({ ...newItem, organization: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-1" placeholder="Ex: Hospital Sírio-Libanês" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400">Data de Início</label>
                  <input type="date" value={newItem.start_date} onChange={e => setNewItem({ ...newItem, start_date: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-1 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400">Data de Término</label>
                  <input type="date" value={newItem.end_date} onChange={e => setNewItem({ ...newItem, end_date: e.target.value })} className="w-full bg-[#142239] border border-white/10 rounded-2xl p-4 mt-1 [color-scheme:dark]" />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setIsAdding(false)} className="px-6 py-3 font-bold text-slate-400">Cancelar</button>
                <button onClick={handleSaveItem} className="px-6 py-3 font-bold text-white bg-[#D5205D] rounded-xl">Salvar</button>
              </div>
            </div>
          )}

          {journeyItems.map((item) => (
            <div key={item.id} className="bg-[#15335E] rounded-3xl p-6 mb-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.organization}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setNewItem(item); setEditingId(item.id); setIsAdding(true); }} className="text-blue-400">
                  <Edit3 size={20} />
                </button>
                <button onClick={() => handleDeleteItem(item.id)} className="text-red-400">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Notificações Push */}
        <div className="bg-[#15335E] rounded-3xl p-8 mb-8">
          <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <BellRing className="text-[#D5205D]" /> Alertas no Celular
              </h2>
              <p className="text-slate-400 text-sm">
                Receba notificações em tempo real sobre vagas e atualizações, mesmo com o app fechado.
              </p>
            </div>
            <button
              onClick={subscribeToPushNotifications}
              className="shrink-0 bg-[#142239] border border-[#D5205D] text-[#D5205D] hover:bg-[#D5205D] hover:text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
            >
              Ativar Alertas
            </button>
          </div>
        </div>

        {/* Senha */}
        <div className="bg-[#15335E] rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6">Alterar Senha</h2>
          <div className="grid grid-cols-2 gap-6">
            <input
              type="password"
              placeholder="Nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D]"
            />
            <input
              type="password"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#142239] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#D5205D]"
            />
          </div>
          <button onClick={handleUpdatePassword} disabled={isUpdatingPassword} className="mt-6 w-full bg-white text-[#142239] hover:bg-slate-200 transition-colors py-4 rounded-2xl font-bold flex justify-center items-center">
            {isUpdatingPassword ? <Loader2 className="animate-spin" size={20} /> : 'Atualizar Senha'}
          </button>
        </div>
      </div>
    </div>
  );
};