import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Search, Briefcase, MapPin, User, Loader2 } from 'lucide-react';
import { getRegissStatus } from '../utils/regissLogic';

interface Profile {
  id: string;
  full_name: string;
  profession: string;
  job_title: string;
  entry_year: number | null;
  interests: string[];
  role?: string;
}

export const Network = () => {
  const navigate = useNavigate();
  const { userProfile, fetchUserProfile, allProfiles, fetchAllProfiles } = useStore();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'TODOS' | 'R1' | 'R2' | 'R+'>('TODOS');

  useEffect(() => {
    const loadCache = async () => {
      await fetchUserProfile();
      await fetchAllProfiles();
      setLoading(false);
    };
    loadCache();
  }, [fetchUserProfile, fetchAllProfiles]);

  // Lógica de Filtragem (Busca + Abas)
  const networkProfiles = allProfiles.filter((p: any) => p.id !== userProfile?.uid);

  const filteredProfiles = networkProfiles.filter((profile: any) => {
    const status = profile.role === 'coordination'
      ? { label: 'ÁREA TÉCNICA', color: 'bg-amber-500/20 text-amber-500', defaultRole: 'Coordenação' }
      : getRegissStatus(profile.entry_year || new Date().getFullYear());

    // 1. Filtro de Texto (Nome, Profissão ou Interesses)
    const matchesSearch = profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.interests?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Filtro de Aba (R1, R2...)
    const matchesFilter = filter === 'TODOS'
      ? true
      : filter === 'R+'
        ? status.label.includes('R+')
        : status.label === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 font-sans p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">

        {/* HEADER PADRONIZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Rede <span className="text-[#D5205D]">ReGISS</span></h1>
            <p className="text-slate-400 text-sm mt-1">Conecte-se com alunos e ex-alunos da instituição ({filteredProfiles.length} conexões)</p>
          </div>

          <div className="flex bg-[#15335E] p-1.5 rounded-2xl border border-white/5 shadow-lg overflow-x-auto w-full md:w-auto snap-x snap-mandatory hide-scrollbar gap-1">
            {['TODOS', 'R1', 'R2', 'R+'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase whitespace-nowrap snap-center flex-shrink-0 ${filter === f ? 'bg-[#D5205D] text-white shadow-[0_0_15px_rgba(213,32,93,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {f === 'R+' ? 'Alumni (R+)' : f}
              </button>
            ))}
          </div>
        </div>

        {/* BARRA DE BUSCA (Apenas Desktop) */}
        <div className="relative mb-8 hidden md:block">
          <Search className="absolute left-4 top-4 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Busque por nome, cargo ou interesse..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#15335E] border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#D5205D] focus:shadow-[0_0_20px_rgba(213,32,93,0.15)] transition-all text-white placeholder:text-slate-500 shadow-lg text-sm"
          />
        </div>

        {/* GRID DE RESULTADOS */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-[#D5205D] animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map(profile => {
              const status = profile.role === 'coordination'
                ? { label: 'ÁREA TÉCNICA', color: 'bg-amber-500/20 text-amber-500', defaultRole: 'Coordenação', border: 'border-amber-500/30' }
                : getRegissStatus(profile.entry_year || new Date().getFullYear());

              const borderStyle = status.label === 'ÁREA TÉCNICA' ? 'border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : status.label.includes('R+')
                  ? 'border-yellow-500/30 hover:border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.05)]'
                  : status.label === 'R2' ? 'border-blue-500/30 hover:border-blue-500/60' : 'border-[#D5205D]/30 hover:border-[#D5205D]/60';

              return (
                <div key={profile.id} className={`bg-[#15335E] rounded-3xl p-6 border ${borderStyle} transition-all group relative overflow-hidden`}>

                  <div className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${status.color}`}>
                    {status.label}
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-[#142239] border-2 border-white/10 flex items-center justify-center text-xl font-bold text-slate-400 shrink-0 uppercase overflow-hidden">
                      {profile.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg leading-tight group-hover:text-[#D5205D] transition-colors truncate">
                        {profile.full_name}
                      </h3>
                      <p className={`font-medium text-sm mt-1 ${profile.role === 'coordination' ? 'text-amber-500' : 'text-blue-400'}`}>
                        {profile.profession}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Briefcase size={14} className="text-slate-500 shrink-0" />
                      <span className="truncate">{profile.job_title || status.defaultRole || 'Cargo não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin size={14} className="text-slate-500 shrink-0" />
                      <span>HCFMUSP</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6 h-14 overflow-hidden content-start">
                    {profile.interests?.slice(0, 3).map((tag: string, i: number) => (
                      <span key={i} className="text-xs bg-[#142239] text-slate-400 px-2 py-1 rounded border border-white/5">{tag}</span>
                    ))}
                    {profile.interests?.length > 3 && (
                      <span className="text-xs text-slate-500 py-1 font-bold">+{profile.interests.length - 3}</span>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/profile/${profile.id}`)}
                    className="w-full py-3 bg-[#142239] hover:bg-[#D5205D] hover:border-[#D5205D] text-white rounded-xl font-bold text-sm transition-colors border border-white/10 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <User size={16} /> Ver Perfil Completo
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredProfiles.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-[#15335E]/50">
            <p className="text-slate-400 text-lg">Nenhum membro encontrado com esse filtro.</p>
            <button onClick={() => { setFilter('TODOS'); setSearchTerm('') }} className="text-[#D5205D] mt-2 hover:underline font-bold">
              Limpar filtros
            </button>
          </div>
        )}

      </div>
    </div>
  );
};