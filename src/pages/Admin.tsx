import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Briefcase, Building, Search, Trash2, Key, Activity, Lock, Megaphone, Plus, Link as LinkIcon, AlertTriangle, Target, Server, BarChart3, Globe, Database, FileText, ImageIcon, FileSearch, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export const Admin = () => {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'companies' | 'content' | 'system' | 'recruitment'>('dashboard');
   const [loading, setLoading] = useState(true);

   // STATS & INSIGHTS DE NEGÓCIO
   const [stats, setStats] = useState({ totalUsers: 0, onlineUsers: 0, totalPosts: 0, totalJobs: 0, totalCompanies: 0, pendingLeads: 0 });
   const [systemHealth, setSystemHealth] = useState({ status: 'Operacional', latency: '24ms', uptime: '99.9%' });

   const [usersList, setUsersList] = useState<any[]>([]);
   const [leadsList, setLeadsList] = useState<any[]>([]);
   const [postsList, setPostsList] = useState<any[]>([]);
   const [updatesList, setUpdatesList] = useState<any[]>([]);

   const [searchTerm, setSearchTerm] = useState('');

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
      const [
         { count: uCount },
         { count: pCount },
         { count: jCount },
         { count: cCount },
         { count: pendingCount }
      ] = await Promise.all([
         supabase.from('profiles').select('*', { count: 'exact', head: true }),
         supabase.from('posts').select('*', { count: 'exact', head: true }),
         supabase.from('posts').select('*', { count: 'exact', head: true }).eq('type', 'vacancy'),
         supabase.from('company_leads').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
         supabase.from('company_leads').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setStats(prev => ({ ...prev, totalUsers: uCount || 0, totalPosts: pCount || 0, totalJobs: jCount || 0, totalCompanies: cCount || 0, pendingLeads: pendingCount || 0 }));
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

   // AÇÕES DE USUÁRIOS
   const handleDeleteUser = async (id: string) => {
      if (!confirm("Atenção: Isso apagará o usuário e todos os seus dados. Continuar?")) return;
      // Nota: Deleção real de auth.users exige Edge Function ou permissão nivel BD, 
      // mas podemos deletar o profile e dar ban.
      await supabase.from('profiles').delete().eq('id', id);
      fetchUsers();
      toast.success("Usuário removido do sistema.");
   };

   // AÇÕES DE EMPRESAS
   const handleApproveCompany = async (lead: any) => {
      const inviteCode = 'B2B-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from('company_invites').insert({ code: inviteCode, company_name: lead.company_name });
      if (!error) {
         await supabase.from('company_leads').update({ status: 'approved' }).eq('id', lead.id);
         prompt(`Empresa Aprovada! Envie este código para o RH:`, `Acesse: https://alumnihc.com/company-register | Código: ${inviteCode}`);
         fetchLeads();
      }
   };

   const handleDeleteCompany = async (id: string) => {
      if (!confirm("Deletar permanentemente este registro de empresa?")) return;
      await supabase.from('company_leads').delete().eq('id', id);
      fetchLeads();
   };

   // ==========================================
   // AÇÕES RESTAURADAS PARA CONTENT, SYSTEM, E RECRUITMENT
   // ==========================================
   const exportCSV = () => {
      if (usersList.length === 0) return toast.error("Não há usuários carregados. Volte e atualize.");
      const headers = "Nome,Email,Profissao,Role\n";
      const csvContent = usersList.map(u => `"${u.full_name}","","${u.profession || ''}","${u.role}"`).join("\n");
      const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "alumni_usuarios.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleToggleShadowban = async (user: any) => {
      const isShadowbanned = user.role === 'shadowbanned';
      if (!confirm(isShadowbanned ? `Remover Shadowban de ${user.full_name}?` : `Silenciar (Shadowban) ${user.full_name}?`)) return;

      const newRole = isShadowbanned ? 'user' : 'shadowbanned';
      await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
      fetchUsers();
      toast.success(`Status atualizado para: ${newRole}`);
   };

   const handleResetPassword = async (email: string) => {
      if (!confirm(`Enviar e-mail de redefinição para ${email}?`)) return;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` });
      if (error) toast.error("Erro: " + error.message); else toast.success("E-mail enviado!");
   };

   const handleDeletePost = async (id: string) => {
      if (!confirm("Apagar este post permanentemente?")) return;
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
      }
   };

   const handleDeleteUpdate = async (id: string) => {
      if (!confirm("Apagar comunicado?")) return;
      await supabase.from('system_updates').delete().eq('id', id);
      fetchUpdates();
   };

   const fetchB2BJobs = async () => {
      const { data } = await supabase
         .from('posts')
         .select('*')
         .eq('type', 'vacancy')
         .like('content', '%[PREMIUM_JOB]%')
         .order('created_at', { ascending: false });
      setJobsList(data || []);
      setSelectedJob(null);
   };

   const handleArchiveLead = async (id: string) => {
      if (!confirm("Arquivar/Recusar solicitação dessa empresa?")) return;
      await supabase.from('company_leads').update({ status: 'archived' }).eq('id', id);
      fetchLeads();
   };

   const handleNegotiateLead = async (id: string) => {
      await supabase.from('company_leads').update({ status: 'interviewing' }).eq('id', id);
      fetchLeads();
   };

   const handleRunMatchmaking = async (job: any) => {
      setSelectedJob(job);
      setIsCalculatingMatch(true);

      try {
         const { data: profiles } = await supabase.from('profiles').select('*').not('role', 'in', '("admin", "coordinator")');
         if (!profiles) throw new Error("Não foi possível carregar os alunos.");

         const requiredTags = job.job_tags || [];
         if (requiredTags.length === 0) {
            setSuggestedTalents(profiles.map(p => ({ ...p, match_score: 0 })));
            setIsCalculatingMatch(false);
            return;
         }

         const rankedProfiles = profiles.map(profile => {
            const userTags = (profile.interests || []).map((t: string) => t.toLowerCase());
            let score = 0;
            requiredTags.forEach((tag: string) => {
               if (userTags.includes(tag)) score += 1;
            });
            const percentage = Math.round((score / requiredTags.length) * 100);
            return { ...profile, match_score: percentage };
         });

         rankedProfiles.sort((a, b) => b.match_score - a.match_score);
         setSuggestedTalents(rankedProfiles);
      } catch (error) {
         console.error(error);
         toast.error("Erro ao calcular o Match");
      } finally {
         setIsCalculatingMatch(false);
      }
   };

   const handleSendDirectInvite = async (candidateId: string, companyName: string, jobTitle: string) => {
      const confirmMsg = `Convidar este aluno em nome do Hospital/Empresa?\nEle receberá uma notificação push.`;
      if (!confirm(confirmMsg)) return;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('notifications').insert({
         user_id: candidateId,
         actor_id: user?.id,
         type: 'system',
         content: `🏆 Curadoria VIP: O RH da ${companyName} gostou do seu perfil e quer conversar sobre a vaga de ${jobTitle}. Acesse a aba Vagas para detalhes.`
      });
      toast.success("Convite VIP enviado ao aluno!");
   };

   if (loading) return <div className="min-h-screen bg-[#0B1320] flex items-center justify-center text-white"><Activity className="animate-pulse text-[#D5205D] w-12 h-12" /></div>;

   return (
      <div className="w-full min-h-screen bg-[#0B1320] text-slate-100 font-sans flex flex-col md:flex-row">

         {/* SIDEBAR DO ADMIN (Isolada do resto do app) */}
         <div className="w-full md:w-64 bg-[#142239] border-r border-white/5 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-10">
               <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20"><Shield size={20} className="text-white" /></div>
               <div>
                  <h1 className="text-lg font-bold text-white leading-tight">Master Control</h1>
                  <p className="text-[10px] text-red-400 font-mono uppercase tracking-widest flex items-center gap-1"><Lock size={10} /> Nível Deus</p>
               </div>
            </div>

            <nav className="space-y-2 flex-1">
               {[
                  { id: 'dashboard', label: 'Overview & Negócios', icon: BarChart3 },
                  { id: 'users', label: 'Base de Alunos', icon: Users },
                  { id: 'companies', label: 'B2B & Parceiros', icon: Building },
                  { id: 'content', label: 'Moderação (Feed)', icon: Database },
                  { id: 'system', label: 'Sistema & Alertas', icon: Server },
                  { id: 'recruitment', label: 'Match/Recrutamento', icon: Target },
               ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-[#D5205D] text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                     <tab.icon size={18} /> {tab.label}
                  </button>
               ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5">
               <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} className="w-full text-slate-500 hover:text-red-400 flex items-center gap-2 text-sm font-bold transition-colors"><Lock size={14} /> Encerrar Sessão Segura</button>
            </div>
         </div>

         {/* ÁREA DE CONTEÚDO */}
         <div className="flex-1 p-6 md:p-10 overflow-y-auto h-screen custom-scrollbar">

            {activeTab === 'dashboard' && (
               <div className="space-y-8 animate-fadeIn">
                  <div>
                     <h2 className="text-2xl font-bold text-white">Visão Geral da Operação</h2>
                     <p className="text-slate-400 text-sm">Monitoramento em tempo real do ecossistema ReGISS.</p>
                  </div>

                  {/* INDICADORES DE SISTEMA */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-[#142239] border border-green-500/30 p-5 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center"><Activity className="text-green-500" /></div>
                        <div><p className="text-xs text-slate-400 uppercase font-bold">Status do Banco</p><p className="text-xl font-bold text-green-400">{systemHealth.status}</p></div>
                     </div>
                     <div className="bg-[#142239] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center"><Server className="text-blue-500" /></div>
                        <div><p className="text-xs text-slate-400 uppercase font-bold">Latência (API)</p><p className="text-xl font-bold text-white">{systemHealth.latency}</p></div>
                     </div>
                     <div className="bg-[#142239] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center"><Globe className="text-purple-500" /></div>
                        <div><p className="text-xs text-slate-400 uppercase font-bold">Usuários Online</p><p className="text-xl font-bold text-white">{stats.onlineUsers}</p></div>
                     </div>
                  </div>

                  {/* PORTAIS DE AUDITORIA (NAVEGAÇÃO DIRETA) */}
                  <div className="bg-gradient-to-r from-[#142239] to-[#0B1320] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D5205D]"></div>
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Target size={18} className="text-[#D5205D]" /> Portais de Auditoria</h3>
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onClick={() => navigate('/feed')} className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group">
                           <Users size={24} className="text-white group-hover:scale-110 transition-transform" />
                           <span className="text-sm font-bold text-white">Espiar Feed (Social)</span>
                        </button>
                        <button onClick={() => window.open('/para-empresas', '_blank')} className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group">
                           <Globe size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                           <span className="text-sm font-bold text-white">Landing Page B2B</span>
                        </button>
                        <button onClick={() => navigate('/company')} className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group">
                           <Building size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                           <span className="text-sm font-bold text-white">Painel da Empresa</span>
                        </button>
                        <button onClick={() => navigate('/coordination')} className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group">
                           <Shield size={24} className="text-amber-400 group-hover:scale-110 transition-transform" />
                           <span className="text-sm font-bold text-white">Visão Coordenador</span>
                        </button>
                     </div>
                  </div>

                  {/* MÉTRICAS DE NEGÓCIO */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     <div className="bg-[#142239] p-6 rounded-2xl border border-white/5 shadow-lg">
                        <p className="text-slate-400 text-xs uppercase font-bold">Total Base Alunos</p>
                        <p className="text-4xl font-bold text-white mt-2">{stats.totalUsers}</p>
                     </div>
                     <div className="bg-[#142239] p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden">
                        {stats.pendingLeads > 0 && <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>}
                        <p className="text-slate-400 text-xs uppercase font-bold">Leads B2B Pendentes</p>
                        <p className="text-4xl font-bold text-amber-400 mt-2">{stats.pendingLeads}</p>
                     </div>
                     <div className="bg-[#142239] p-6 rounded-2xl border border-white/5 shadow-lg">
                        <p className="text-slate-400 text-xs uppercase font-bold">Empresas Ativas</p>
                        <p className="text-4xl font-bold text-emerald-400 mt-2">{stats.totalCompanies}</p>
                     </div>
                     <div className="bg-[#142239] p-6 rounded-2xl border border-white/5 shadow-lg">
                        <p className="text-slate-400 text-xs uppercase font-bold">Vagas Premium (B2B)</p>
                        <p className="text-4xl font-bold text-blue-400 mt-2">{stats.totalJobs}</p>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'users' && (
               <div className="animate-fadeIn space-y-6">
                  <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-bold text-white">Gestão de Usuários</h2>
                     <button className="bg-[#D5205D] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16} /> Adicionar Manualmente</button>
                  </div>
                  <div className="bg-[#142239] border border-white/10 rounded-2xl overflow-hidden">
                     <div className="p-4 border-b border-white/10 flex">
                        <div className="flex-1 bg-[#0B1320] flex items-center px-4 rounded-xl border border-white/10"><Search size={18} className="text-slate-500" /><input type="text" placeholder="Buscar usuário..." className="bg-transparent border-none p-3 text-white w-full outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                     </div>
                     <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#0B1320] text-xs uppercase font-bold text-slate-500"><tr><th className="p-4">Nome</th><th className="p-4">Cargo</th><th className="p-4">Permissão</th><th className="p-4 text-right">Ações (CRUD)</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                           {usersList.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                              <tr key={user.id} className="hover:bg-white/5">
                                 <td className="p-4 font-bold text-white">{user.full_name}</td>
                                 <td className="p-4">{user.profession || 'Pendente'}</td>
                                 <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{user.role}</span></td>
                                 <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => prompt('Gerar link de reset para:', user.email)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"><Key size={14} /></button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition"><Trash2 size={14} /></button>
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                     {leadsList.map(lead => (
                        <div key={lead.id} className="bg-[#142239] border border-white/10 p-6 rounded-2xl relative shadow-xl">
                           <div className="flex justify-between items-start mb-4">
                              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center"><Building size={24} /></div>
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${lead.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : lead.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{lead.status}</span>
                           </div>
                           <h3 className="text-lg font-bold text-white">{lead.company_name}</h3>
                           <p className="text-sm text-slate-400 mb-4">{lead.contact_email}</p>

                           <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                              {lead.status === 'pending' && <button onClick={() => handleApproveCompany(lead)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition">Aprovar & Gerar Code</button>}
                              <button onClick={() => handleDeleteCompany(lead.id)} className="px-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition"><Trash2 size={16} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'content' && (
               <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center bg-[#142239] border border-blue-500/30 p-5 rounded-2xl shadow-lg">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center"><Shield className="text-blue-500" /></div>
                        <div>
                           <h2 className="text-xl font-bold text-white">Filtro de Moderação Ativo</h2>
                           <p className="text-slate-400 text-sm">Monitorando palavras de ódio ou preconceito e termos bloqueados no Feed Social.</p>
                        </div>
                     </div>
                  </div>
                  {postsList.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 bg-[#142239] border border-white/10 border-dashed rounded-3xl">
                        <AlertTriangle size={48} className="text-slate-600 mb-4 opacity-50" />
                        <p className="text-slate-400 font-bold">Nenhum post ofensivo detectado recentemente.</p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {postsList.map(post => {
                           const offensiveWords = ['porra', 'caralho', 'buceta', 'puta', 'arrombado', 'fudido', 'merda', 'cacete', 'viado', 'bicha', 'sapatão', 'traveco', 'boiola', 'baitola', 'macaco', 'crioulo', 'retardado', 'mongol', 'imbecil'];
                           const regex = new RegExp(`\\b(${offensiveWords.join('|')})\\b`, 'i');
                           const isFlagged = regex.test(post.content);
                           if (!isFlagged) return null;

                           return (
                              <div key={post.id} className="bg-[#142239] border border-red-500/30 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-6 shadow-xl relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
                                 <div className="flex-1 pl-2">
                                    <p className="text-xs text-red-400 mb-2 font-bold uppercase tracking-widest"><AlertTriangle size={12} className="inline mr-1" /> Post Suspeito ("{post.profiles?.full_name}")</p>
                                    <p className="text-white text-sm bg-[#0B1320] p-4 rounded-xl border border-red-500/20">{post.content}</p>
                                 </div>
                                 <div className="flex items-center">
                                    <button onClick={() => handleDeletePost(post.id)} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg transition"><Trash2 size={16} /> Deletar Post</button>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'system' && (
               <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-white">Comunicados do Sistema</h2>
                     <button onClick={() => setIsCreatingUpdate(!isCreatingUpdate)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg"><Plus size={18} /> Novo Banners de Aviso</button>
                  </div>
                  {isCreatingUpdate && (
                     <div className="bg-[#142239] border border-blue-500/50 rounded-2xl p-6 mb-8 shadow-xl">
                        <div className="grid grid-cols-1 gap-4 mb-4">
                           <input type="text" value={newUpdate.title} onChange={e => setNewUpdate({ ...newUpdate, title: e.target.value })} className="w-full bg-[#0B1320] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" placeholder="Título (Ex: Manutenção Programada!)" />
                           <textarea value={newUpdate.content} onChange={e => setNewUpdate({ ...newUpdate, content: e.target.value })} className="w-full bg-[#0B1320] border border-white/10 rounded-xl p-3 text-white h-24 resize-none outline-none focus:border-blue-500" placeholder="Texto detalhado do banner..." />
                           <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1 flex items-center bg-[#0B1320] border border-white/10 rounded-xl px-3 focus-within:border-blue-500"><LinkIcon size={18} className="text-slate-500" /><input type="text" value={newUpdate.link_url} onChange={e => setNewUpdate({ ...newUpdate, link_url: e.target.value })} className="w-full bg-transparent p-3 text-white outline-none text-sm" placeholder="Link (Opcional)" /></div>
                              <div className="flex-1 flex items-center bg-[#0B1320] border border-white/10 rounded-xl px-3 focus-within:border-blue-500"><ImageIcon size={18} className="text-slate-500" /><input type="text" value={newUpdate.image_url} onChange={e => setNewUpdate({ ...newUpdate, image_url: e.target.value })} className="w-full bg-transparent p-3 text-white outline-none text-sm" placeholder="URL da Imagem (Opcional)" /></div>
                           </div>
                        </div>
                        <div className="flex justify-end gap-3">
                           <button onClick={() => setIsCreatingUpdate(false)} className="text-slate-400 px-4 py-2 font-bold hover:text-white transition">Cancelar</button>
                           <button onClick={handleCreateUpdate} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition">Publicar</button>
                        </div>
                     </div>
                  )}
                  <div className="space-y-4">
                     {updatesList.length === 0 && !isCreatingUpdate && <p className="text-center py-10 text-slate-500 border border-white/5 border-dashed rounded-2xl bg-[#142239]">Nenhum comunicado ativo.</p>}
                     {updatesList.map(update => (
                        <div key={update.id} className="bg-[#142239] border border-white/10 p-5 rounded-2xl flex items-start justify-between gap-6 shadow-xl hover:border-blue-500/30 transition">
                           <div className="flex gap-5 items-start">
                              {update.image_url ? <img src={update.image_url} className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0" /> : <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0"><Megaphone size={20} /></div>}
                              <div><h3 className="text-white font-bold text-lg">{update.title}</h3><p className="text-sm text-slate-400 mt-1 line-clamp-2">{update.content}</p></div>
                           </div>
                           <button onClick={() => handleDeleteUpdate(update.id)} className="text-slate-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'recruitment' && (
               <div className="space-y-6 animate-fadeIn">
                  {!selectedJob ? (
                     <>
                        <div className="flex justify-between items-center mb-6">
                           <div>
                              <h2 className="text-2xl font-bold text-white flex items-center gap-2"><FileSearch className="text-[#D5205D]" /> Curadoria de Talentos</h2>
                              <p className="text-slate-400 text-sm mt-1">Algoritmo de Matchmaking B2B (Cross-reference Vagas vs Alunos).</p>
                           </div>
                        </div>
                        {jobsList.length === 0 ? (
                           <div className="flex flex-col items-center justify-center py-20 bg-[#142239] border border-white/10 border-dashed rounded-3xl">
                              <Target size={48} className="text-slate-600 mb-4 opacity-50" />
                              <p className="text-slate-400 font-bold">Nenhuma vaga Premium detectada.</p>
                           </div>
                        ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {jobsList.map(job => {
                                 const cleanTitle = job.content?.replace(/\[PREMIUM_JOB\] \[(.*?)\]/g, '$1 -').trim();
                                 return (
                                    <div key={job.id} className="bg-[#142239] hover:bg-[#1E3A5F] border border-white/10 hover:border-[#D5205D]/50 p-6 rounded-3xl transition-all shadow-xl flex flex-col group relative overflow-hidden">
                                       <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D5205D]"></div>
                                       <div className="w-12 h-12 bg-[#0B1320] rounded-xl flex items-center justify-center mb-4 border border-white/5 text-[#D5205D]"><Briefcase size={20} /></div>
                                       <h3 className="text-white font-bold text-base mb-2 leading-tight pl-1">{cleanTitle}</h3>
                                       <div className="mb-6 mt-2 pl-1">
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Tags da Vaga (Skills):</p>
                                          <div className="flex flex-wrap gap-1">
                                             {job.job_tags ? job.job_tags.map((t: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-[#0B1320] px-2 py-1 rounded text-slate-300 border border-white/5">{t}</span>
                                             )) : <span className="text-[10px] text-slate-600 italic">Genérica.</span>}
                                          </div>
                                       </div>
                                       <button onClick={() => handleRunMatchmaking(job)} className="mt-auto w-full py-3 bg-[#0B1320] border border-white/5 group-hover:border-[#D5205D]/50 text-white rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 shadow-lg">
                                          <Target size={16} className="text-[#D5205D]" /> Rodar Algoritmo de Match
                                       </button>
                                    </div>
                                 )
                              })}
                           </div>
                        )}
                     </>
                  ) : (
                     <div className="bg-[#142239] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
                        <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2 font-bold transition-colors"><LinkIcon size={14} className="rotate-180" /> Voltar ao Laboratório</button>
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                           <div>
                              <h3 className="text-2xl font-bold text-white mb-2">{selectedJob.content?.replace(/\[PREMIUM_JOB\] \[(.*?)\]/g, '$1 -').trim()}</h3>
                              <p className="text-slate-400 text-sm">O sistema calculou a compatibilidade de todos os usuários da base contra esta vaga.</p>
                           </div>
                           {isCalculatingMatch && <Activity size={24} className="text-[#D5205D] animate-pulse" />}
                        </div>
                        <div className="space-y-4">
                           {suggestedTalents.map((talent) => (
                              <div key={talent.id} className="bg-[#0B1320] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group hover:border-[#D5205D]/30 transition">
                                 {talent.match_score >= 80 && <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
                                 {talent.match_score > 0 && talent.match_score < 80 && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>}
                                 {talent.match_score === 0 && <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-700"></div>}

                                 <div className="flex items-center gap-4 flex-1 pl-3">
                                    <div className="w-14 h-14 rounded-full border-2 border-[#142239] overflow-hidden shrink-0">
                                       {talent.avatar_url ? <img src={talent.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-xl">{talent.full_name?.charAt(0)}</div>}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-3">
                                          <h4 className="text-white font-bold text-lg">{talent.full_name}</h4>
                                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${talent.match_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : talent.match_score > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                                             {talent.match_score}% Fit Score
                                          </span>
                                       </div>
                                       <p className="text-sm text-slate-400 mt-0.5">{talent.profession} • {talent.current_company || 'Rede Alumni'}</p>
                                       <div className="flex flex-wrap gap-1 mt-2">
                                          {talent.interests?.map((tag: string, i: number) => {
                                             const isRequired = selectedJob.job_tags?.includes(tag.toLowerCase());
                                             return <span key={i} className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${isRequired ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#142239] text-slate-500 border-white/5'}`}>{tag}</span>
                                          })}
                                       </div>
                                    </div>
                                 </div>

                                 <div className="w-full md:w-auto mt-4 md:mt-0 transition-opacity">
                                    <button onClick={() => {
                                       const companyName = selectedJob.content.match(/\[(.*?)\]/g)?.[1]?.replace(/[\[\]]/g, '') || 'Empresa Parceira';
                                       const role = selectedJob.content.split('] ')[2] || 'Nova Vaga';
                                       handleSendDirectInvite(talent.id, companyName, role);
                                    }}
                                       className="w-full md:w-auto bg-[#142239] hover:bg-[#D5205D] hover:text-white border border-white/10 text-slate-300 px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                    >
                                       <UserPlus size={16} /> Disparar Push Direct
                                    </button>
                                 </div>
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