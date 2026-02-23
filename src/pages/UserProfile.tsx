import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';
import { Briefcase, MapPin, Send } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';
import { GamifiedJourney } from '../components/GamifiedJourney';

export const UserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [journey, setJourney] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;

      // Busca Perfil e Jornada em Paralelo para maior velocidade
      const [
        { data: profileData },
        { data: journeyData }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('career_journey').select('*').eq('user_id', id).order('start_date', { ascending: false })
      ]);

      setProfile(profileData);
      setJourney(journeyData || []);
      setLoading(false);
    };

    fetchUserProfile();
  }, [id]);

  const openWhatsApp = () => {
    if (profile?.whatsapp) {
      window.open(`https://wa.me/55${profile.whatsapp.replace(/\D/g, '')}`, '_blank');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#142239] text-white flex items-center justify-center">Carregando perfil...</div>;
  if (!profile) return <div className="min-h-screen bg-[#142239] text-white flex items-center justify-center">Usuário não encontrado.</div>;

  const isCoordinator = profile.role === 'coordination';

  const status = isCoordinator
    ? { label: 'ÁREA TÉCNICA', color: 'bg-amber-500/20 text-amber-500', defaultRole: 'Coordenação Administrativa' }
    : getRegissStatus(profile.entry_year);

  // Tema do Usuário
  const userTheme = profile.theme_color || 'regiss-magenta';
  const themeBgColor = userTheme === 'regiss-petrol' ? 'bg-[#275A80]' : userTheme === 'regiss-wine' ? 'bg-[#B32F50]' : 'bg-[#D5205D]';
  const themeTextColor = userTheme === 'regiss-petrol' ? 'text-[#275A80]' : userTheme === 'regiss-wine' ? 'text-[#B32F50]' : 'text-[#D5205D]';
  const themeBorderColor = userTheme === 'regiss-petrol' ? 'border-[#275A80]' : userTheme === 'regiss-wine' ? 'border-[#B32F50]' : 'border-[#D5205D]';

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:py-8 pb-24">

      {/* CARTÃO PRINCIPAL */}
      <div className="bg-[#15335E] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl mb-8">

        {/* Capa */}
        <div className={`absolute top-0 left-0 w-full h-32 opacity-40 ${themeBgColor}`}></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 mt-4">

          {/* Foto de Perfil */}
          <div className="w-32 h-32 bg-[#142239] rounded-full p-1 border-4 border-[#142239] shadow-2xl shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center text-4xl font-bold text-slate-400 uppercase">
                {profile.full_name.charAt(0)}
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{profile.full_name}</h1>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-white/10 ${status.color}`}>
                {status.label}
              </span>

              {/* Profissão só aparece para alunos */}
              {!isCoordinator && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-slate-300">
                  {profile.profession}
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 text-slate-300 text-sm">
              {/* Cargo */}
              <span className="flex items-center justify-center md:justify-start gap-2 font-medium">
                <Briefcase size={16} className={isCoordinator ? "text-amber-500" : themeTextColor} />
                {profile.job_title || (isCoordinator ? profile.profession : status.defaultRole)}
              </span>

              {/* Localização Dinâmica: Empresa Atual ou HC */}
              <span className="flex items-center justify-center md:justify-start gap-2">
                <MapPin size={16} /> {profile.current_company || ((status as any).isResident || isCoordinator ? 'HCFMUSP' : 'Não informado')}
              </span>
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 mt-8 pt-8 border-t border-white/5">
          {profile.whatsapp_authorized && profile.whatsapp && (
            <button
              onClick={openWhatsApp}
              className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Send size={20} /> WhatsApp
            </button>
          )}
        </div>

        {/* BIO */}
        {profile.bio && (
          <div className="mt-8 relative z-10 bg-[#142239]/50 p-4 rounded-2xl border border-white/5">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Sobre</h3>
            <p className="text-slate-300 leading-relaxed italic text-sm">"{profile.bio}"</p>
          </div>
        )}

        {/* INTERESSES (TAGS) - Oculto para Coordenadores */}
        {!isCoordinator && profile.interests && profile.interests.length > 0 && (
          <div className="mt-6 relative z-10 flex flex-wrap gap-2">
            {profile.interests.map((tag: string, i: number) => (
              <span key={i} className="text-xs bg-white/5 text-slate-300 px-3 py-1.5 rounded-full border border-white/5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* JORNADA GAMIFICADA - Oculto para Coordenadores */}
      {!isCoordinator && (
        <>
          <h2 className={`text-xl font-bold text-white mb-6 pl-4 border-l-4 ${themeBorderColor}`}>Jornada Profissional</h2>
          <GamifiedJourney items={journey} entryYear={profile.entry_year} profession={profile.profession} />
        </>
      )}

    </div>
  );
};