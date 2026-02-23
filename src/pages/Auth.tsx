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
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Alumni <span className="text-[#D5205D]">ReGISS</span></h1>
          <p className="text-slate-300 text-xs font-medium uppercase tracking-widest mt-2">
            Gestão Integrada HC
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 mb-6 shadow-lg"
        >
          {/* SVG Inline resolvendo o problema de CORS */}
          <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.5181H37.4434C36.9055 31.4188 35.177 33.9201 32.6461 35.6493V41.4261H40.4281C44.9788 37.108 47.532 31.3255 47.532 24.5528Z" fill="#4285F4" />
            <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.4888 41.4261L32.7068 35.6493C30.4997 37.2046 27.7253 38.033 24.48 38.033C18.1026 38.033 12.6934 33.7228 10.7416 27.946H2.66296V34.0205C6.91724 42.4578 15.1118 48.0016 24.48 48.0016Z" fill="#34A853" />
            <path d="M10.7416 27.946C10.2227 26.3908 9.93043 24.733 9.93043 23.0483C9.93043 21.3637 10.2227 19.7059 10.7416 18.1507V12.0762H2.66296C0.969188 15.4057 0 19.1245 0 23.0483C0 26.9722 0.969188 30.6909 2.66296 34.0205L10.7416 27.946Z" fill="#FBBC05" />
            <path d="M24.48 8.06421C28.0267 8.06421 31.1895 9.25586 33.708 11.5833L40.636 4.6553C36.3927 0.72083 30.9529 0 24.48 0C15.1118 0 6.91724 5.54382 2.66296 13.9811L10.7416 20.0556C12.6934 14.2788 18.1026 8.06421 24.48 8.06421Z" fill="#EA4335" />
          </svg>
          Entrar com Google
        </button>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase tracking-widest">ou via email</span>
          <div className="flex-grow border-t border-white/10"></div>
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