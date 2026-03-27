import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building, GraduationCap, ThumbsUp, ThumbsDown, Award, Trophy, Medal } from 'lucide-react';
import { StarRating } from '../components/StarRating';

const InsightSkeleton = () => (
  <div className="grid grid-cols-1 gap-6">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 animate-pulse">
        <div className="flex justify-between items-start mb-8">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-6 bg-white/10 rounded w-40"></div>
              <div className="h-4 bg-white/5 rounded w-24"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-24 bg-[#142239] rounded-2xl w-full border border-white/5"></div>
          <div className="h-24 bg-[#142239] rounded-2xl w-full border border-white/5"></div>
        </div>
      </div>
    ))}
  </div>
);

export const Insights = () => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'job' | 'education'>('all');

  useEffect(() => {
    const fetchInsights = async () => {
      const { data } = await supabase
        .from('career_journey')
        .select('organization, type, rating, pros, cons, benefits')
        .gt('rating', 0)
        .limit(500);

      if (!data) {
        setLoading(false);
        return;
      }

      const grouped = data.reduce((acc: any, curr: any) => {
        const name = curr.organization || 'Não informado';

        const isOfficialRegiss = curr.type === 'regiss';
        const resolvedType = isOfficialRegiss ? 'education' : curr.type;

        const groupKey = isOfficialRegiss ? 'OFFICIAL_REGISS_PROGRAM' : `${name}_${resolvedType}`;

        if (!acc[groupKey]) {
          acc[groupKey] = {
            name: isOfficialRegiss ? 'Residência ReGISS (HCFMUSP)' : name,
            type: resolvedType,
            isOfficialRegiss: isOfficialRegiss,
            count: 0,
            totalRating: 0,
            pros: [],
            cons: [],
            benefits: new Set()
          };
        }

        acc[groupKey].count++;
        acc[groupKey].totalRating += curr.rating || 0;

        if (curr.pros && curr.pros.trim() !== '') acc[groupKey].pros.push(curr.pros);
        if (curr.cons && curr.cons.trim() !== '') acc[groupKey].cons.push(curr.cons);
        if (curr.benefits && Array.isArray(curr.benefits)) {
          curr.benefits.forEach((b: string) => acc[groupKey].benefits.add(b));
        }

        return acc;
      }, {});

      const result = Object.values(grouped).map((c: any) => ({
        ...c,
        avgRating: c.count > 0 ? (c.totalRating / c.count).toFixed(1) : '0.0',
        benefits: Array.from(c.benefits)
      })).sort((a: any, b: any) => parseFloat(b.avgRating) - parseFloat(a.avgRating));

      const finalResult = result.sort((a: any, b: any) => {
        if (a.isOfficialRegiss) return -1;
        if (b.isOfficialRegiss) return 1;
        return 0;
      });

      setCompanies(finalResult);
      setLoading(false);
    };

    fetchInsights();
  }, []);

  const filteredCompanies = filter === 'all'
    ? companies
    : companies.filter(c => c.type === filter);

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 font-sans p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Insights de <span className="text-[#D5205D]">Mercado</span></h1>
            <p className="text-slate-400 text-sm mt-1">Avaliações reais da comunidade ReGISS</p>
          </div>

          <div className="flex bg-[#15335E] p-1 rounded-2xl border border-white/5 shadow-lg">
            {[
              { id: 'all', label: 'Tudo' },
              { id: 'job', label: 'Empresas' },
              { id: 'education', label: 'Ensino' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase whitespace-nowrap ${filter === f.id
                  ? 'bg-[#D5205D] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <InsightSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-20 bg-[#15335E]/50 border border-dashed border-white/10 rounded-3xl">
                <p className="text-slate-400 font-bold">Nenhuma avaliação encontrada.</p>
              </div>
            ) : (
              filteredCompanies.map((comp, i) => {

                const isRegissCard = comp.isOfficialRegiss;

                // LÓGICA DO PÓDIO OLÍMPICO (Ignorando o ReGISS na contagem)
                const hasOfficialInFilter = filteredCompanies.some(c => c.isOfficialRegiss);
                const actualRank = hasOfficialInFilter ? i : i + 1;

                let badgeConfig = null;
                if (!isRegissCard) {
                  if (actualRank === 1) {
                    badgeConfig = { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: '1º Lugar' };
                  } else if (actualRank === 2) {
                    badgeConfig = { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-400/20', label: '2º Lugar' };
                  } else if (actualRank === 3) {
                    badgeConfig = { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-500/20', label: '3º Lugar' };
                  }
                }

                return (
                  <div
                    key={comp.name}
                    className={`border rounded-[2rem] p-6 md:p-8 transition-all relative overflow-hidden group
                      ${isRegissCard
                        ? 'bg-gradient-to-br from-[#15335E] to-[#B32F50]/20 border-[#D5205D]/50 shadow-[0_10px_30px_rgba(213,32,93,0.15)] hover:border-[#D5205D] mb-4'
                        : 'bg-[#15335E] border-white/5 shadow-xl hover:border-white/20'}`}
                  >

                    {isRegissCard && (
                      <div className="absolute top-8 left-0 w-1.5 h-16 bg-[#D5205D] rounded-r-full shadow-[0_0_15px_rgba(213,32,93,1)]"></div>
                    )}

                    {/* RENDERIZAÇÃO DA MEDALHA/TROFÉU */}
                    {badgeConfig && (
                      <div className={`absolute top-0 right-0 ${badgeConfig.bg} ${badgeConfig.color} text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1.5 shadow-sm`}>
                        <badgeConfig.icon size={14} className={badgeConfig.color} />
                        {badgeConfig.label}
                      </div>
                    )}

                    {isRegissCard && (
                      <div className="absolute top-0 right-0 bg-[#D5205D] text-white text-[10px] font-black px-5 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                        <Award size={14} className="text-white" />
                        Programa Oficial
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 pl-4 md:pl-0">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner
                          ${isRegissCard ? 'bg-[#142239] border-[#D5205D]/30' : 'bg-[#142239] border-white/5'}`}>
                          {isRegissCard ? (
                            <Award size={30} className="text-[#D5205D]" />
                          ) : comp.type === 'job' ? (
                            <Building size={28} className="text-slate-400" />
                          ) : (
                            <GraduationCap size={28} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h3 className={`text-2xl font-bold ${isRegissCard ? 'text-white' : 'text-white'}`}>{comp.name}</h3>

                          {comp.benefits && comp.benefits.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {comp.benefits.map((b: string, idx: number) => (
                                <span key={idx} className="text-xs bg-[#142239] text-blue-400 font-bold px-3 py-1 rounded-lg border border-blue-500/20">
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-left md:text-right w-full md:w-auto">
                        <div className="flex items-center gap-3 bg-[#142239] px-6 py-4 rounded-2xl border border-white/5 shadow-inner">
                          <span className="text-4xl font-bold text-white">{comp.avgRating}</span>
                          <StarRating rating={parseFloat(comp.avgRating)} readonly size={26} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 mt-3 block uppercase tracking-widest text-center md:text-right">
                          Baseado em {comp.count} {comp.count === 1 ? 'Avaliação' : 'Avaliações'}
                        </span>
                      </div>
                    </div>

                    {(comp.pros.length > 0 || comp.cons.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#142239]/60 rounded-2xl p-6 md:p-8 border border-white/5">
                        <div>
                          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <ThumbsUp size={16} /> O que a rede adorou
                          </div>
                          <ul className="space-y-3">
                            {comp.pros.slice(0, 3).map((p: string, idx: number) => (
                              <li key={idx} className="text-sm text-slate-300 italic relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-emerald-500/50 before:rounded-full">"{p}"</li>
                            ))}
                            {comp.pros.length === 0 && <li className="text-sm text-slate-500 italic">Nenhum pró registrado.</li>}
                          </ul>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <ThumbsDown size={16} /> Pontos de atenção
                          </div>
                          <ul className="space-y-3">
                            {comp.cons.slice(0, 3).map((c: string, idx: number) => (
                              <li key={idx} className="text-sm text-slate-300 italic relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-red-500/50 before:rounded-full">"{c}"</li>
                            ))}
                            {comp.cons.length === 0 && <li className="text-sm text-slate-500 italic">Nenhum contra registrado.</li>}
                          </ul>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};