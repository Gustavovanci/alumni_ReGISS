import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
   Shield, Users, Briefcase, Building, Search, Trash2, Key, Activity,
   Lock, Megaphone, Plus, Link as LinkIcon, AlertTriangle, Target,
   Server, BarChart3, Globe, Database, FileText, ImageIcon,
   FileSearch, UserPlus, Award, Edit3, Save, Loader2, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';

export const Admin = () => {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'companies' | 'content' | 'milestones' | 'system' | 'recruitment'>('dashboard');
   const [loading, setLoading] = useState(true);

   // STATS & INSIGHTS DE NEGÓCIO
   const [stats, setStats] = useState({ totalUsers: 0, onlineUsers: 0, totalPosts: 0, totalJobs: 0, totalCompanies: 0, pendingLeads: 0 });
   const [systemHealth, setSystemHealth] = useState({ status: 'Operacional', latency: '24ms', uptime: '99.9%' });

   const [usersList, setUsersList] = useState<any[]>([]);
   const [leadsList, setLeadsList] = useState<any[]>([]);
   const [postsList, setPostsList] = useState<any[]>([]);
   const [updatesList, setUpdatesList] = useState<any[]>([]);
   const [regissList, setRegissList] = useState<any[]>([]);

   const [searchTerm, setSearchTerm] = useState('');
   const [savingId, setSavingId] = useState<string | null>(null);

   // --- ESTADOS DO RECRUTAMENTO ---
   const [jobsList, setJobsList] = useState<any[]>([]);
   const [selectedJob, setSelectedJob] = useState<any | null>(null);
   const [suggestedTalents, setSuggestedTalents] = useState<any[]>([]);
   const [isCalculatingMatch, setIsCalculatingMatch] = useState(false);

   const [newUpdate, setNewUpdate] = useState({ title: '', content: '', link_url: '', image_url: '' });
   const [isCreatingUpdate, setIsCreatingUpdate] = useState(false);

   useEffect(() => { checkAdminAccess(); }, []);

   useEffect(() => {
      let presenceChannel: any;
      if (activeTab === 'dashboard') {
         fetchStats();
         presenceChannel = supabase.channel('global_presence');
         presenceChannel.on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            const onlineCount = Object.keys(state).length;
            setStats(prev => ({ ...prev, onlineUsers: onlineCount > 0 ? onlineCount : 1 }));
         }).subscribe();
      }
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'companies') fetchLeads();
      if (activeTab === 'content') fetchPosts();
      if (activeTab === 'milestones') fetchRegissItems();
      if (activeTab === 'system') fetchUpdates();
      if (activeTab === 'recruitment') fetchB2BJobs();

      return () => { if (presenceChannel) supabase.removeChannel(presenceChannel); };
   }, [activeTab]);

   const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') {
         toast.error("Acesso Negado. Área restrita.");
         navigate('/feed');
      } else {
         setLoading(false);
      }
   };

   // ==========================================
   // REQUISIÇÕES SUPABASE (CRUD COMPLETO)
   // ==========================================
   const fetchStats = async () => {
      const [u, p, j, c, l] = await Promise.all([
         supabase.from('profiles').select('*', { count: 'exact', head: true }),
         supabase.from('posts').select('*', { count: 'exact', head: true }),
         supabase.from('posts').select('*', { count: 'exact', head: true }).eq('type', 'vacancy'),
         supabase.from('company_leads').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
         supabase.from('company_leads').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setStats(prev => ({
         ...prev,
         totalUsers: u.count || 0,
         totalPosts: p.count || 0,
         totalJobs: j.count || 0,
         totalCompanies: c.count || 0,
         pendingLeads: l.count || 0
      }));
   };

   const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsersList(data || []);
   };

   const fetchLeads = async () => {
      const { data } = await supabase.from('company_leads').select('*').order('created_at', { ascending: false });
      setLeadsList(data || []);
   };

   const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(100);
      setPostsList(data || []);
   };

   const fetchUpdates = async () => {
      const { data } = await supabase.from('system_updates').select('*').order('created_at', { ascending: false });
      setUpdatesList(data || []);
   };

   const fetchRegissItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('career_journey')
         .select(`id, title, organization, profiles (full_name)`)
         .eq('type', 'regiss')
         .order('created_at', { ascending: false });

      if (error) toast.error("Erro ao carregar marcos");
      else setRegissList(data || []);
      setLoading(false);
   };

   const handleUpdateRegissTitle = async (id: string, newTitle: string) => {
      setSavingId(id);
      const { error } = await supabase.from('career_journey').update({ title: newTitle }).eq('id', id);
      if (error) toast.error("Erro ao salvar");
      else {
         toast.success("Marco atualizado!");
         setRegissList(prev => prev.map(item => item.id === id ? { ...item, title: newTitle } : item));
      }
      setSavingId(null);
   };

   const handleDeleteUser = async (id: string) => {
      if (!confirm("Atenção: Isso apagará o usuário e todos os seus dados. Continuar?")) return;
      await supabase.from('profiles').delete().eq('id', id);
      fetchUsers();
      toast.success("Usuário removido.");
   };

   const handleApproveCompany = async (lead: any) => {
      const inviteCode = 'B2B-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from('company_invites').insert({ code: inviteCode, company_name: lead.company_name });
      if (!error) {
         await supabase.from('company_leads').update({ status: 'approved' }).eq('id', lead.id);
         prompt(`Aprovada! Código B2B:`, inviteCode);
         fetchLeads();
      }
   };

   const handleDeleteCompany = async (id: string) => {
      if (!confirm("Deletar registro?")) return;
      await supabase.from('company_leads').delete().eq('id', id);
      fetchLeads();
   };

   const handleArchiveLead = async (id: string) => {
      if (!confirm("Arquivar esta solicitação?")) return;
      await supabase.from('company_leads').update({ status: 'archived' }).eq('id', id);
      fetchLeads();
   };

   const handleDeletePost = async (id: string) => {
      if (!confirm("Apagar post permanentemente?")) return;
      await supabase.from('posts').delete().eq('id', id);
      fetchPosts();
   };

   const handleCreateUpdate = async () => {
      if (!newUpdate.title || !newUpdate.content) return toast.error("Título e Texto são obrigatórios.");
      const { error } = await supabase.from('system_updates').insert([newUpdate]);
      if (!error) {
         setNewUpdate({ title: '', content: '', link_url: '', image_url: '' });
         setIsCreatingUpdate(false);
         fetchUpdates();
         toast.success("Alerta publicado!");
      }
   };

   const handleDeleteUpdate = async (id: string) => {
      if (!confirm("Apagar comunicado?")) return;
      await supabase.from('system_updates').delete().eq('id', id);
      fetchUpdates();
   };

   const fetchB2BJobs = async () => {
      const { data } = await supabase.from('posts').select('*').eq('type', 'vacancy').like('content', '%[PREMIUM_JOB]%').order('created_at', { ascending: false });
      setJobsList(data || []);
      setSelectedJob(null);
   };

   const handleRunMatchmaking = async (job: any) => {
      setSelectedJob(job);
      setIsCalculatingMatch(true);
      try {
         const { data: profiles } = await supabase.from('profiles').select('*').not('role', 'in', '("admin", "coordinator")');
         if (!profiles) throw new Error("Erro ao carregar alunos.");
         const requiredTags = job.job_tags || [];
         const ranked = profiles.map(profile => {
            const userTags = (profile.interests || []).map((t: string) => t.toLowerCase());
            let score = 0;
            requiredTags.forEach((tag: string) => { if (userTags.includes(tag.toLowerCase())) score += 1; });
            const percentage = requiredTags.length > 0 ? Math.round((score / requiredTags.length) * 100) : 0;
            return { ...profile, match_score: percentage };
         });
         ranked.sort((a, b) => b.match_score - a.match_score);
         setSuggestedTalents(ranked);
      } catch (error) {
         toast.error("Erro no Matchmaking");
      } finally {
         setIsCalculatingMatch(false);
      }
   };

   const handleSendDirectInvite = async (candidateId: string, companyName: string, jobTitle: string) => {
      if (!confirm(`Enviar convite Push para este aluno?`)) return;
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('notifications').insert({
         user_id: candidateId,
         actor_id: user?.id,
         type: 'system',
         content: `🏆 Curadoria VIP: O RH da ${companyName} quer falar com você sobre a vaga de ${jobTitle}.`
      });
      toast.success("Convite enviado!");
   };

   if (loading && activeTab === 'dashboard') return <div className="min-h-screen bg-[#0B1320] flex items-center justify-center text-white"><Activity className="animate-pulse text-[#D5205D] w-12 h-12" /></div>;

   return (
      <div className="w-full min-h-screen bg-[#0B1320] text-slate-100 font-sans flex flex-col md:flex-row">

         {/* SIDEBAR */}
         <div className="w-full md:w-64 bg-[#142239] border-r border-white/5 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-10">
               <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20"><Shield size={20} className="text-white" /></div>
               <div><h1 className="text-lg font-bold text-white">Master Control</h1><p className="text-[10px] text-red-400 font-mono uppercase tracking-widest flex items-center gap-1"><Lock size={10} /> Nível Deus</p></div>
            </div>

            <nav className="space-y-2 flex-1">
               {[
                  { id: 'dashboard', label: 'Overview & Negócios', icon: BarChart3 },
                  { id: 'users', label: 'Base de Alunos', icon: Users },
                  { id: 'companies', label: 'B2B & Parceiros', icon: Building },
                  { id: 'content', label: 'Moderação (Feed)', icon: Database },
                  { id: 'milestones', label: 'Marcos ReGISS', icon: Award },
                  { id: 'system', label: 'Sistema & Alertas', icon: Server },
                  { id: 'recruitment', label: 'Match/Recrutamento', icon: Target },
               ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-[#D5205D] text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                     <tab.icon size={18} /> {tab.label}
                  </button>
               ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5">
               <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} className="w-full text-slate-500 hover:text-red-400 flex items-center gap-2 text-sm font-bold transition-colors"><Lock size={14} /> Sair com Segurança</button>
            </div>
         </div>

         {/* ÁREA DE CONTEÚDO */}
         <div className="flex-1 p-6 md:p-10 overflow-y-auto h-screen custom-scrollbar">

            {activeTab === 'dashboard' && (
               <div className="space-y-8 animate-fadeIn">
                  <div>
                     <h2 className="text-2xl font-bold text-white">Visão Geral da Operação</h2>
                     <p className="text-slate-400 text-sm">Monitoramento do ecossistema ReGISS.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-[#142239] border border-green-500/30 p-5 rounded-2xl flex items-center gap-4">
                        <Activity className="text-green-500" /><div><p className="text-xs text-slate-400 uppercase font-bold">Status</p><p className="text-xl font-bold text-green-400">{systemHealth.status}</p></div>
                     </div>
                     <div className="bg-[#142239] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                        <Server className="text-blue-500" /><div><p className="text-xs text-slate-400 uppercase font-bold">Latência</p><p className="text-xl font-bold text-white">{systemHealth.latency}</p></div>
                     </div>
                     <div className="bg-[#142239] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                        <Globe className="text-purple-500" /><div><p className="text-xs text-slate-400 uppercase font-bold">Online</p><p className="text-xl font-bold text-white">{stats.onlineUsers}</p></div>
                     </div>
                  </div>

                  {/* PORTAIS DE AUDITORIA */}
                  <div className="bg-gradient-to-r from-[#142239] to-[#0B1320] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D5205D]"></div>
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Target size={18} className="text-[#D5205D]" /> Portais de Auditoria</h3>
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onClick={() => navigate('/feed')} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl flex flex-col items-center gap-3 transition-all"><Users size={24} /><span className="text-xs font-bold">Espiar Feed</span></button>
                        <button onClick={() => window.open('/para-empresas', '_blank')} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl flex flex-col items-center gap-3 transition-all"><Globe size={24} className="text-blue-400" /><span className="text-xs font-bold">Landing B2B</span></button>
                        <button onClick={() => navigate('/company')} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl flex flex-col items-center gap-3 transition-all"><Building size={24} className="text-emerald-400" /><span className="text-xs font-bold">Painel Empresa</span></button>
                        <button onClick={() => navigate('/coordination')} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl flex flex-col items-center gap-3 transition-all"><Shield size={24} className="text-amber-400" /><span className="text-xs font-bold">Visão Coord.</span></button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     <div className="bg-[#142239] p-6 rounded-2xl border border-white/5 shadow-lg">
                        <p className="text-slate-400 text-xs uppercase font-bold">Base Alunos</p><p className="text-4xl font-bold text-white mt-2">{stats.totalUsers}</p>
                     </div>
                     <div className="bg-[#142239] p-6 rounded-2xl border border-white/5 shadow-lg relative">
                        {stats.pendingLeads > 0 && <span className="absolute top-4 right-4 flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>}
                        <p className="text-slate-400 text-xs uppercase font-bold">Leads Pendentes</p><p className="text-4xl font-bold text-amber-400 mt-2">{stats.pendingLeads}</p>
                     </div>
                     <div className="bg-[#142239] p-6 rounded-2xl border border-white/5 shadow-lg">
                        <p className="text-slate-400 text-xs uppercase font-bold">Empresas B2B</p><p className="text-4xl font-bold text-emerald-400 mt-2">{stats.totalCompanies}</p>
                     </div>
                     <div className="bg-[#142239] p-6 rounded-2xl border border-white/5 shadow-lg">
                        <p className="text-slate-400 text-xs uppercase font-bold">Vagas Premium</p><p className="text-4xl font-bold text-blue-400 mt-2">{stats.totalJobs}</p>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'users' && (
               <div className="animate-fadeIn space-y-6">
                  <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Gestão de Usuários</h2></div>
                  <div className="bg-[#142239] border border-white/10 rounded-2xl overflow-hidden">
                     <div className="p-4 border-b border-white/10 flex">
                        <div className="flex-1 bg-[#0B1320] flex items-center px-4 rounded-xl border border-white/10"><Search size={18} className="text-slate-500" /><input type="text" placeholder="Buscar usuário..." className="bg-transparent border-none p-3 text-white w-full outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                     </div>
                     <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#0B1320] text-xs uppercase font-bold text-slate-500"><tr><th className="p-4">Nome</th><th className="p-4">Cargo</th><th className="p-4">Permissão</th><th className="p-4 text-right">Ações</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                           {usersList.filter(u => (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                              <tr key={user.id} className="hover:bg-white/5">
                                 <td className="p-4 font-bold text-white">{user.full_name}</td>
                                 <td className="p-4">{user.profession || 'Pendente'}</td>
                                 <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{user.role}</span></td>
                                 <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 transition"><Trash2 size={14} /></button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === 'companies' && (
               <div className="animate-fadeIn space-y-6">
                  <h2 className="text-2xl font-bold text-white">Controle de Parceiros (B2B)</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {leadsList.map(lead => (
                        <div key={lead.id} className="bg-[#142239] border border-white/10 p-6 rounded-2xl relative shadow-xl">
                           <div className="flex justify-between items-start mb-4">
                              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20"><Building size={24} /></div>
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${lead.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : lead.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{lead.status}</span>
                           </div>
                           <h3 className="text-lg font-bold text-white">{lead.company_name}</h3>
                           <p className="text-sm text-slate-400 mb-4">{lead.contact_email}</p>
                           <div className="flex gap-2">
                              {lead.status === 'pending' && <button onClick={() => handleApproveCompany(lead)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition">Aprovar & Code</button>}
                              <button onClick={() => handleArchiveLead(lead.id)} className="px-3 bg-white/5 text-slate-400 hover:bg-white/10 rounded-lg transition"><FileText size={16} /></button>
                              <button onClick={() => handleDeleteCompany(lead.id)} className="px-3 bg-red-500/10 text-red-400 hover:bg-red-500 rounded-lg transition"><Trash2 size={16} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'milestones' && (
               <div className="animate-fadeIn space-y-6">
                  <div><h2 className="text-2xl font-bold text-white">Gestão de Marcos ReGISS</h2><p className="text-slate-400 text-sm">Correção profissional dos marcos automáticos dos alunos.</p></div>
                  <div className="bg-[#142239] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                     <div className="p-6 border-b border-white/10 bg-[#0B1320]/50 space-y-4">
                        <div className="relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Pesquisar aluno ou erro (ex: Fisioterapeuta)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0B1320] border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-[#D5205D] text-white transition-all" /></div>
                        <div className="flex flex-wrap gap-2">
                           <button onClick={() => setSearchTerm('Fisioterapeuta')} className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-500/20">ERROS: FISIOTERAPEUTA</button>
                           <button onClick={() => setSearchTerm('Nutricionista')} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-amber-500/20">ERROS: NUTRICIONISTA</button>
                           <button onClick={() => setSearchTerm('')} className="bg-slate-700/50 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black">LIMPAR</button>
                        </div>
                     </div>
                     <table className="w-full text-left">
                        <thead className="bg-[#0B1320] text-slate-500 text-[10px] uppercase font-black border-b border-white/5">
                           <tr><th className="p-6">Aluno</th><th className="p-6">Título do Marco (Editável)</th><th className="p-6 text-center">Salvar</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {regissList.filter(i => {
                              const title = (i.title || '').toLowerCase();
                              const name = (i.profiles?.full_name || '').toLowerCase();
                              const search = (searchTerm || '').toLowerCase();
                              return title.includes(search) || name.includes(search);
                           }).map((item) => (
                              <tr key={item.id} className="hover:bg-white/[0.02] group transition-colors">
                                 <td className="p-6"><p className="font-bold text-white text-sm">{item.profiles?.full_name || 'Desconhecido'}</p><p className="text-[10px] text-slate-500 uppercase tracking-tighter">HCFMUSP - ReGISS</p></td>
                                 <td className="p-6"><div className="flex items-center gap-3"><input type="text" defaultValue={item.title} id={`input-${item.id}`} className="flex-1 bg-[#0B1320] border border-white/5 p-3 rounded-xl outline-none focus:border-[#D5205D] text-sm text-slate-300 transition-all" /><Edit3 size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" /></div></td>
                                 <td className="p-6 text-center">{savingId === item.id ? <Loader2 className="animate-spin text-[#D5205D] mx-auto" size={20} /> : <button onClick={() => { const input = document.getElementById(`input-${item.id}`) as HTMLInputElement; handleUpdateRegissTitle(item.id, input?.value || item.title); }} className="bg-white/5 text-slate-400 hover:bg-[#D5205D] hover:text-white p-3 rounded-xl transition-all shadow-md active:scale-90"><Save size={18} /></button>}</td>
                              </tr>
                           ))
                           }
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === 'content' && (
               <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-4 bg-[#142239] border border-red-500/30 p-5 rounded-2xl shadow-lg"><Shield className="text-red-500" /><h2 className="text-xl font-bold text-white">Central de Moderação (Algoritmo de Ódio)</h2></div>
                  <div className="space-y-4">
                     {postsList.filter(p => /porra|caralho|merda|puta|foda|arrombado|cacete/i.test(p.content || '')).map(post => (
                        <div key={post.id} className="bg-[#142239] border border-red-500/20 p-5 rounded-2xl flex justify-between items-center gap-6 shadow-xl relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                           <div className="flex-1 pl-3"><p className="text-[10px] text-red-400 font-black uppercase mb-1">Autor: {post.profiles?.full_name}</p><p className="text-white text-sm bg-black/20 p-4 rounded-xl italic">"{post.content}"</p></div>
                           <button onClick={() => handleDeletePost(post.id)} className="bg-red-600 p-4 rounded-xl text-white shadow-lg active:scale-95 transition-all"><Trash2 size={20} /></button>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'system' && (
               <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Alertas Globais</h2><button onClick={() => setIsCreatingUpdate(!isCreatingUpdate)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg"><Plus size={16} /> NOVO AVISO</button></div>
                  {isCreatingUpdate && (
                     <div className="bg-[#142239] border border-blue-500/50 rounded-2xl p-8 mb-8 shadow-2xl animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 gap-4 mb-4">
                           <input type="text" value={newUpdate.title} onChange={e => setNewUpdate({ ...newUpdate, title: e.target.value })} className="w-full bg-[#0B1320] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500" placeholder="Título (Ex: Manutenção)" />
                           <textarea value={newUpdate.content} onChange={e => setNewUpdate({ ...newUpdate, content: e.target.value })} className="w-full bg-[#0B1320] border border-white/10 rounded-xl p-4 text-white h-24 outline-none focus:border-blue-500" placeholder="Mensagem..." />
                        </div>
                        <div className="flex justify-end gap-3"><button onClick={() => setIsCreatingUpdate(false)} className="text-slate-400 font-bold px-4">CANCELAR</button><button onClick={handleCreateUpdate} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs">PUBLICAR</button></div>
                     </div>
                  )}
                  <div className="space-y-4">
                     {updatesList.map(update => (
                        <div key={update.id} className="bg-[#142239] border border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                           <div className="flex gap-4 items-center"><Megaphone size={18} className="text-blue-400" /><div><h3 className="text-white font-bold">{update.title}</h3><p className="text-xs text-slate-500">{new Date(update.created_at).toLocaleDateString()}</p></div></div>
                           <button onClick={() => handleDeleteUpdate(update.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'recruitment' && (
               <div className="space-y-6 animate-fadeIn">
                  {!selectedJob ? (
                     <>
                        <div className="mb-8"><h2 className="text-2xl font-bold">Laboratório de Matchmaking B2B</h2><p className="text-slate-400 text-sm">Cruzamento de interesses dos alunos contra requisitos das vagas.</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {jobsList.map(job => (
                              <div key={job.id} className="bg-[#142239] border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-[#D5205D]/50 transition-all shadow-2xl flex flex-col h-[280px]">
                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D5205D]"></div>
                                 <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center mb-4"><Briefcase size={20} className="text-[#D5205D]" /></div>
                                 <h3 className="text-white font-bold mb-4 line-clamp-3 flex-1">{job.content.replace('[PREMIUM_JOB]', '')}</h3>
                                 <button onClick={() => handleRunMatchmaking(job)} className="w-full py-4 bg-[#0B1320] text-white rounded-xl text-xs font-black flex justify-center items-center gap-2 border border-white/5 group-hover:bg-[#D5205D] transition-all"><Target size={18} /> RODAR ALGORITMO</button>
                              </div>
                           ))}
                        </div>
                     </>
                  ) : (
                     <div className="bg-[#142239] p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <button onClick={() => setSelectedJob(null)} className="text-slate-400 mb-6 flex items-center gap-2 font-bold text-xs uppercase tracking-widest">← Voltar</button>
                        <h3 className="text-2xl font-bold mb-8">Talentos Sugeridos</h3>
                        <div className="space-y-3">
                           {suggestedTalents.map(talent => (
                              <div key={talent.id} className="bg-[#0B1320] p-6 rounded-2xl flex items-center justify-between border border-white/5 hover:border-[#D5205D]/30 transition-all">
                                 <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center font-black text-xl border border-white/10 overflow-hidden">{talent.avatar_url ? <img src={talent.avatar_url} className="w-full h-full object-cover" /> : talent.full_name[0]}</div>
                                    <div>
                                       <div className="flex items-center gap-3"><p className="text-white font-bold text-lg">{talent.full_name}</p><span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${talent.match_score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{talent.match_score}% MATCH</span></div>
                                       <p className="text-xs text-slate-500">{talent.profession} • {talent.current_company || 'Rede Alumni'}</p>
                                    </div>
                                 </div>
                                 <button onClick={() => handleSendDirectInvite(talent.id, 'Hospital Parceiro', 'Gestão Profissional')} className="bg-[#142239] border border-white/10 text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-[#D5205D] transition-all">DISPARAR PUSH</button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            )}

         </div>
      </div>
   );
};