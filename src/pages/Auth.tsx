import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('profiles').select('role').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (data?.role === 'admin') navigate('/admin');
            else if (data?.role === 'company') navigate('/admin-parceiros');
            else navigate('/feed');
          });
      }
    });

    // Intercepta Redirecionamentos de Confirmação de E-mail ou Recuperação de Senha
    const setupAuthListener = () => {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && window.location.hash.includes('type=signup')) {
          toast.success("E-mail confirmado com sucesso! Seja bem-vindo.");
        }
      });
    };
    setupAuthListener();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events.readonly',
          queryParams: { access_type: 'offline', prompt: 'consent' },
          redirectTo: `${window.location.origin}/feed`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error("Erro ao conectar com Google: " + error.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        // Checando código secreto para Coordenação
        const isCoord = secretCode.trim() === 'REGISS-COORD-2026';

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: isCoord ? 'coordination' : 'user' }
          }
        });

        if (error) throw error;
        toast.success(isCoord ? "Conta de Coordenação criada! Faça login." : "Conta criada com sucesso! Faça login.");
        setIsSignUp(false);
      } else {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
        if (authErr) throw authErr;

        // O ROTEAMENTO INTELIGENTE: Lê o perfil e decide para onde jogar
        const { data: profileData } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();

        if (profileData?.role === 'admin') {
          // Cai direto na Sala de Controle
          navigate('/admin');
        } else if (profileData?.role === 'company') {
          // Cai direto no Painel da Empresa B2B
          navigate('/company');
        } else {
          // Usuários comuns (Alunos) e Coordenadores vão para a rede social
          navigate('/feed');
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#142239] font-sans">
      <div className="w-full max-w-md p-8 bg-[#15335E]/90 border border-white/10 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Alumni <span className="text-[#D5205D]">ReGISS</span></h1>
          <p className="text-slate-300 text-xs font-medium uppercase tracking-widest mt-2">
            Gestão Integrada HC
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="bg-[#142239] border border-white/10 rounded-xl flex items-center px-4 focus-within:border-[#D5205D] transition-colors">
            <Mail className="text-slate-500" size={20} />
            <input type="email" placeholder="E-mail" required value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent border-none w-full p-4 text-white outline-none" />
          </div>
          <div className="bg-[#142239] border border-white/10 rounded-xl flex items-center px-4 focus-within:border-[#D5205D] transition-colors">
            <Lock className="text-slate-500" size={20} />
            <input type="password" placeholder="Senha" required value={password} onChange={e => setPassword(e.target.value)} className="bg-transparent border-none w-full p-4 text-white outline-none" />
          </div>

          {isSignUp && (
            <div className="bg-[#142239] border border-white/10 rounded-xl flex items-center px-4 focus-within:border-[#D5205D] transition-colors group animate-fadeIn mt-4">
              <Lock className="text-slate-500 opacity-50" size={20} />
              <input
                type="text" placeholder="Código Secreto Coordenação (Se houver)"
                value={secretCode} onChange={e => setSecretCode(e.target.value)}
                className="bg-transparent border-none w-full p-4 text-white outline-none placeholder:text-slate-600/50 text-sm"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-[#D5205D] hover:bg-pink-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Acessar Painel')}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 text-sm cursor-pointer hover:text-white transition-colors" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "Já tem conta? Entrar" : "Não tem acesso? Cadastre-se"}
        </p>
      </div>
    </div>
  );
};