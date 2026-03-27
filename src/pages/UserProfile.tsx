import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Send, Loader2, ArrowLeft } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';
import { GamifiedJourney } from '../components/GamifiedJourney';
import { toast } from 'sonner';

export const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [journey, setJourney] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 O TRADUTOR DE BLINDAGEM VISUAL
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

  useEffect(() => {
    if (!id) return;
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, journeyRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('career_journey').select('*').eq('user_id', id).order('start_date', { ascending: false })
      ]);

      if (profileRes.error) throw profileRes.error;
      if (journeyRes.error) throw journeyRes.error;

      setProfile(profileRes.data);

      // FILTRO VISUAL UNIVERSAL ANTES DE RENDERIZAR A JORNADA
      const visualJourney = (journeyRes.data || []).map(item => {
        if (item.type === 'regiss') {
          return { ...item, title: forceCorrectGrammar(item.title) };
        }
        return item;
      });

      setJourney(visualJourney);

    } catch (error: any) {
      toast.error('Erro ao carregar perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (profile?.whatsapp) {
      const cleanNumber = profile.whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanNumber}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#142239] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#D5205D] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#142239] flex items-center justify-center text-white">
        Usuário não encontrado.
      </div>
    );
  }

  const isCoordinator = profile.role === 'coordination' || profile.role === 'coordinator';
  const status = getRegissStatus(profile.entry_year, profile.role);

  const themeColor = profile.theme_color || 'regiss-magenta';
  const themeBg = themeColor === 'regiss-petrol' ? 'bg-[#275A80]' : themeColor === 'regiss-wine' ? 'bg-[#B32F50]' : 'bg-[#D5205D]';

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-medium transition-colors">
          <ArrowLeft size={20} /> Voltar
        </button>

        <div className="bg-[#15335E] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-40 ${themeBg} opacity-30`}></div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-36 h-36 rounded-3xl overflow-hidden border-4 border-[#142239] shadow-2xl flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.full_name} />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-6xl font-bold text-slate-400">
                  {profile.full_name?.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-white">{profile.full_name}</h1>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                <span className={`text-xs font-bold px-4 py-2 rounded-2xl border ${status.color} ${status.border}`}>
                  {status.label}
                </span>
                {!isCoordinator && profile.profession && (
                  <span className="text-xs font-bold px-4 py-2 rounded-2xl bg-slate-800 border border-white/10">
                    {profile.profession}
                  </span>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-6 mt-8 text-slate-300">
                <div className="flex items-center gap-3">
                  <Briefcase size={20} className="text-[#D5205D]" />
                  <span>{profile.job_title || (isCoordinator ? 'Coordenação' : 'Cargo não informado')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={20} />
                  <span>{profile.current_company || (isCoordinator ? 'HCFMUSP' : 'Não informado')}</span>
                </div>
              </div>

              {profile.whatsapp && (
                <button onClick={openWhatsApp} className="mt-8 inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-3xl font-bold transition-all shadow-lg active:scale-95">
                  <Send size={22} /> Conversar no WhatsApp
                </button>
              )}
            </div>
          </div>

          {profile.bio && (
            <div className="mt-10 bg-[#142239]/70 border border-white/10 rounded-3xl p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Sobre</h3>
              <p className="text-slate-300 leading-relaxed italic">"{profile.bio}"</p>
            </div>
          )}

          {!isCoordinator && profile.interests && profile.interests.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {profile.interests.map((tag: string, i: number) => (
                <span key={i} className="text-xs bg-white/5 text-slate-300 px-4 py-2 rounded-2xl border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {!isCoordinator && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Jornada Profissional</h2>
            <GamifiedJourney items={journey} entryYear={profile.entry_year} profession={profile.profession} />
          </div>
        )}
      </div>
    </div>
  );
};