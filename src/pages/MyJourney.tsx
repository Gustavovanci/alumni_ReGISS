import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Briefcase, GraduationCap, Trash2, Camera, Palette, Send, Edit3, Award, MessageCircle, Lock } from 'lucide-react';
import { StarRating } from '../components/StarRating';

export const MyJourney = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Estados do Perfil
  const [fullName, setFullName] = useState(''); // <-- NOVO ESTADO PARA O NOME
  const [bio, setBio] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [themeColor, setThemeColor] = useState('regiss-magenta');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [authWhats, setAuthWhats] = useState(false);

  // Estados de Segurança (Senha)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Estados da Jornada
  const [journeyItems, setJourneyItems] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialItemState = { title: '', organization: '', type: 'job', start_date: '', end_date: '', rating: 0, pros: '', cons: '', benefits: [] as string[] };
  const [newItem, setNewItem] = useState(initialItemState);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/'); return; }
    setUser(user);

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      setFullName(profile.full_name || ''); // Puxa o nome atual
      setBio(profile.bio || '');
      setLinkedin(profile.linkedin_url || '');
      setAvatarUrl(profile.avatar_url || '');
      setThemeColor(profile.theme_color || 'regiss-magenta');
      setInterests(profile.interests || []);
      setWhatsapp(profile.whatsapp || '');
      setAuthWhats(profile.whatsapp_authorized || false);
    }

    const { data: journey } = await supabase.from('career_journey').select('*').eq('user_id', user.id).order('start_date', { ascending: false });
    setJourneyItems(journey || []);
    setLoading(false);
  };

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Selecione uma imagem.');
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
    } catch (error: any) {
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) return alert("O nome não pode ficar vazio.");

    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(), // Salva o nome atualizado
      bio, linkedin_url: linkedin, avatar_url: avatarUrl, theme_color: themeColor, interests, whatsapp, whatsapp_authorized: authWhats
    }).eq('id', user.id);

    if (error) alert('Erro ao salvar o perfil'); else { alert('Perfil atualizado com sucesso!'); navigate('/feed'); }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) return alert('As senhas digitadas não são iguais.');
    if (newPassword.length < 6) return alert('A senha deve ter pelo menos 6 caracteres.');

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      alert('Erro ao atualizar senha: ' + error.message);
    } else {
      alert('Sua senha foi atualizada com segurança!');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsUpdatingPassword(false);
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (tag: string) => {
    setInterests(interests.filter(t => t !== tag));
  };

  const handleEditItem = (item: any) => {
    setNewItem(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleSaveItem = async () => {
    if (!newItem.title || !newItem.organization) return alert("Preencha Título e Instituição/Empresa");

    // Zera os benefícios se não for 'job' (Trabalho)
    const itemToSave = { ...newItem, end_date: newItem.end_date || null, benefits: newItem.type === 'job' ? newItem.benefits : [] };

    if (editingId) {
      await supabase.from('career_journey').update(itemToSave).eq('id', editingId);
    } else {
      await supabase.from('career_journey').insert({ user_id: user.id, ...itemToSave });
    }

    setIsAdding(false); setEditingId(null); setNewItem(initialItemState); fetchData();
  };

  const handleDeleteItem = async (id: string) => { if (confirm('Apagar item da jornada?')) { await supabase.from('career_journey').delete().eq('id', id); fetchData(); } };

  if (loading) return <div className="min-h-screen bg-[#142239] text-white flex items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 font-sans pb-20 p-4 md:p-8">
      <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white">Editar Perfil</h1>
        <button onClick={handleSaveProfile} className="flex items-center gap-2 bg-[#D5205D] hover:bg-pink-600 px-6 py-2 rounded-xl font-bold text-sm shadow-lg text-white transition-all"><Save size={18} /> Salvar Tudo</button>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">

        {/* SEÇÃO 1: FOTO, NOME E TEMA */}
        <section className="bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-24 opacity-30 ${themeColor === 'regiss-petrol' ? 'bg-[#275A80]' : themeColor === 'regiss-wine' ? 'bg-[#B32F50]' : 'bg-[#D5205D]'}`}></div>

          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-32 h-32 bg-[#142239] rounded-full border-4 border-[#142239] shadow-2xl overflow-hidden relative group">
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl text-slate-500 font-bold">?</div>}
              <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white mb-1" />
                <span className="text-[10px] text-white font-bold uppercase">{uploading ? 'Enviando...' : 'Trocar Foto'}</span>
                <input type="file" accept="image/*" onChange={handleUploadAvatar} disabled={uploading} className="hidden" />
              </label>
            </div>
          </div>

          <div className="relative z-10 flex-1 w-full space-y-6">

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full bg-[#142239] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#D5205D] transition-colors"
              />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Palette size={16} /> Cor do Perfil</h2>
              <div className="flex gap-4">
                <button onClick={() => setThemeColor('regiss-magenta')} className={`w-10 h-10 rounded-full bg-[#D5205D] shadow-lg transition-transform ${themeColor === 'regiss-magenta' ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#15335E]' : 'hover:scale-110'}`} title="Magenta ReGISS"></button>
                <button onClick={() => setThemeColor('regiss-petrol')} className={`w-10 h-10 rounded-full bg-[#275A80] shadow-lg transition-transform ${themeColor === 'regiss-petrol' ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#15335E]' : 'hover:scale-110'}`} title="Petróleo ReGISS"></button>
                <button onClick={() => setThemeColor('regiss-wine')} className={`w-10 h-10 rounded-full bg-[#B32F50] shadow-lg transition-transform ${themeColor === 'regiss-wine' ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#15335E]' : 'hover:scale-110'}`} title="Vinho ReGISS"></button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Biografia Curta</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Conte um pouco sobre você e seus objetivos..." className="w-full bg-[#142239] border border-white/10 rounded-xl p-4 text-white resize-none h-24 outline-none focus:border-[#D5205D] transition-colors" />
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: CONTATO E INTERESSES */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><MessageCircle size={20} className="text-[#25D366]" /> WhatsApp e Contato</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Número do WhatsApp</label>
                <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-[#142239] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#D5205D]" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#142239] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <input type="checkbox" checked={authWhats} onChange={e => setAuthWhats(e.target.checked)} className="w-4 h-4 accent-[#25D366] rounded" />
                <span className="text-sm text-slate-300">Exibir botão de WhatsApp no meu perfil</span>
              </label>
            </div>
          </div>

          <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Award size={20} className="text-[#275A80]" /> Interesses & Skills</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input type="text" value={newInterest} onChange={e => setNewInterest(e.target.value)} onKeyDown={e => e.key === 'Enter' && addInterest()} placeholder="Ex: Gestão Ágil" className="flex-1 bg-[#142239] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#275A80]" />
                <button onClick={addInterest} className="bg-[#275A80] text-white px-4 rounded-xl font-bold hover:bg-[#1a405c] transition-colors"><Plus size={20} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map(tag => (
                  <span key={tag} className="text-xs bg-[#142239] border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    {tag} <button onClick={() => removeInterest(tag)} className="text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 3: JORNADA */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Sua Jornada Profissional</h2>
            <button onClick={() => { setIsAdding(true); setEditingId(null); setNewItem(initialItemState); }} className="text-[#D5205D] font-bold text-sm flex items-center gap-1">+ Nova Experiência</button>
          </div>

          {isAdding && (
            <div className="bg-[#15335E] border border-[#D5205D]/50 rounded-2xl p-6 mb-6 animate-fadeIn shadow-lg relative">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                {newItem.type === 'regiss' ? <Award className="text-[#D5205D]" /> : ['graduation', 'postgrad', 'mba'].includes(newItem.type) ? <GraduationCap className="text-[#D5205D]" /> : <Briefcase className="text-[#D5205D]" />}
                {editingId ? 'Editar Experiência' : 'Adicionar Experiência'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input type="text" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="bg-[#142239] border border-white/10 rounded-lg p-3 text-white outline-none" placeholder="Cargo ou Curso" />
                <input type="text" value={newItem.organization} onChange={e => setNewItem({ ...newItem, organization: e.target.value })} className="bg-[#142239] border border-white/10 rounded-lg p-3 text-white outline-none" placeholder="Instituição/Empresa" />
                <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })} className="bg-[#142239] border border-white/10 rounded-lg p-3 text-white outline-none cursor-pointer">
                  <option value="job">Trabalho</option>
                  <option value="graduation">Graduação</option>
                  <option value="postgrad">Pós Graduação</option>
                  <option value="regiss">Residência</option>
                  <option value="mba">MBA</option>
                </select>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="date" value={newItem.start_date} onChange={e => setNewItem({ ...newItem, start_date: e.target.value })} className="bg-[#142239] border border-white/10 rounded-lg p-3 text-white w-full cursor-pointer" style={{ colorScheme: 'dark' }} />
                  <input type="date" value={newItem.end_date} onChange={e => setNewItem({ ...newItem, end_date: e.target.value })} className="bg-[#142239] border border-white/10 rounded-lg p-3 text-white w-full cursor-pointer" style={{ colorScheme: 'dark' }} />
                </div>
              </div>

              {/* GLASSDOOR (Avaliação) */}
              <div className="bg-[#142239]/50 p-4 rounded-xl border border-white/5 mb-4">
                <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">
                  {newItem.type === 'job' ? 'Avaliação da Empresa' : 'Como foi o curso/formação?'}
                </label>
                <div className="flex items-center gap-4 mb-4">
                  <StarRating rating={newItem.rating} setRating={(r) => setNewItem({ ...newItem, rating: r })} />
                  <span className="text-sm text-white font-bold">{newItem.rating > 0 ? `${newItem.rating}/5` : 'Sem nota'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <textarea value={newItem.pros || ''} onChange={e => setNewItem({ ...newItem, pros: e.target.value })} className="w-full bg-[#15335E] border border-green-500/30 rounded-lg p-3 text-white text-xs h-20 resize-none outline-none focus:border-green-500/60" placeholder="👍 Pontos Positivos" />
                  <textarea value={newItem.cons || ''} onChange={e => setNewItem({ ...newItem, cons: e.target.value })} className="w-full bg-[#15335E] border border-red-500/30 rounded-lg p-3 text-white text-xs h-20 resize-none outline-none focus:border-red-500/60" placeholder="👎 Pontos Negativos" />
                </div>

                {/* SÓ MOSTRA BENEFÍCIOS SE FOR TRABALHO */}
                {newItem.type === 'job' && (
                  <>
                    <label className="text-xs font-bold text-slate-400 mb-2 block uppercase mt-4">Benefícios Oferecidos</label>
                    <div className="flex flex-wrap gap-2">
                      {['Home Office', 'VR/VA', 'Plano Saúde', 'Gympass', 'PLR', 'Flexibilidade'].map(ben => (
                        <button key={ben} onClick={() => { const current = newItem.benefits || []; const updated = current.includes(ben) ? current.filter(b => b !== ben) : [...current, ben]; setNewItem({ ...newItem, benefits: updated }); }} className={`text-xs px-3 py-1 rounded-full border transition-all ${newItem.benefits?.includes(ben) ? 'bg-[#D5205D] border-[#D5205D] text-white' : 'border-white/10 text-slate-400 hover:text-white'}`}>{ben}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-slate-400 font-bold text-sm hover:text-white transition-colors py-2 px-4 rounded-lg bg-black/20 hover:bg-black/40">Cancelar</button>
                <button onClick={handleSaveItem} className="bg-white text-[#142239] px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors shadow-lg">Salvar Experiência</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {journeyItems.map(item => {
              const isEducation = ['graduation', 'postgrad', 'mba'].includes(item.type);
              return (
                <div key={item.id} className={`bg-[#15335E] border border-white/5 rounded-xl p-5 flex gap-4 relative group transition-all ${item.type === 'regiss' ? 'border-[#D5205D]/30 shadow-[0_0_15px_rgba(213,32,93,0.15)]' : 'hover:border-white/20'}`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'regiss' ? 'bg-gradient-to-br from-[#D5205D] to-[#B32F50] text-white shadow-lg' : isEducation ? 'bg-[#275A80]/20 text-[#275A80]' : 'bg-slate-700/50 text-slate-400'}`}>
                    {item.type === 'regiss' ? <Award size={20} /> : isEducation ? <GraduationCap size={20} /> : <Briefcase size={20} />}
                  </div>
                  <div className="flex-1 pr-16">
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.organization}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(item.start_date).getFullYear()} - {item.end_date ? new Date(item.end_date).getFullYear() : 'Atual'}</p>

                    {item.rating > 0 && (
                      <div className="flex items-center gap-1 mt-2 bg-black/20 w-fit px-2 py-1 rounded text-xs font-bold text-yellow-500">
                        ★ {item.rating}/5
                      </div>
                    )}
                  </div>

                  {/* Botões de Editar/Apagar que aparecem ao passar o mouse */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEditItem(item)} className="text-slate-400 hover:text-white p-2 bg-[#142239] rounded-lg border border-white/10 transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-red-400 p-2 bg-[#142239] rounded-lg border border-white/10 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })}
            {journeyItems.length === 0 && !isAdding && (
              <div className="text-center py-10 border border-white/5 border-dashed rounded-2xl text-slate-500 text-sm">
                Nenhuma experiência cadastrada ainda.
              </div>
            )}
          </div>
        </section>

        {/* SEÇÃO 4: SEGURANÇA DA CONTA (TROCAR SENHA) */}
        <section className="bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock size={20} className="text-slate-400" /> Segurança da Conta
            </h2>
            <p className="text-xs text-slate-400 mt-1">Atualize sua senha de acesso à plataforma.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="w-full bg-[#142239] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#D5205D]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                className="w-full bg-[#142239] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#D5205D]"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleUpdatePassword}
              disabled={!newPassword || isUpdatingPassword}
              className="bg-[#142239] hover:bg-slate-700 disabled:opacity-50 border border-white/10 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg"
            >
              {isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};