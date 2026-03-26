import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building, GraduationCap, ThumbsUp, ThumbsDown } from 'lucide-react';
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
        const name = curr.organization;
        if (!acc[name]) {
          acc[name] = {
            name,
            type: curr.type,
            count: 0,
            totalRating: 0,
            pros: [],
            cons: [],
            benefits: new Set()
          };
        }
        acc[name].count++;
        acc[name].totalRating += curr.rating || 0;
        if (curr.pros) acc[name].pros.push(curr.pros);
        if (curr.cons) acc[name].cons.push(curr.cons);
        if (curr.benefits) curr.benefits.forEach((b: string) => acc[name].benefits.add(b));
        return acc;
      }, {});

      const result = Object.values(grouped).map((c: any) => ({
        ...c,
        avgRating: c.count > 0 ? (c.totalRating / c.count).toFixed(1) : '0.0',
        benefits: Array.from(c.benefits)
      })).sort((a: any, b: any) => parseFloat(b.avgRating) - parseFloat(a.avgRating));

      setCompanies(result);
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
              filteredCompanies.map((comp, i) => (
                <div
                  key={comp.name}
                  className="bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl hover:border-white/20 transition-all relative overflow-hidden"
                >
                  {i < 3 && (
                    <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-4 py-1.5 rounded-bl-3xl">
                      #{i + 1} Melhor Avaliada
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#142239] rounded-2xl flex items-center justify-center border border-white/5">
                        {comp.type === 'job' ? (
                          <Building size={28} className="text-slate-400" />
                        ) : (
                          <GraduationCap size={28} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{comp.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {comp.benefits.map((b: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-[#142239] text-blue-400 font-bold px-3 py-1 rounded-lg border border-white/5"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <div className="flex items-center gap-3 bg-[#142239] px-5 py-3 rounded-2xl border border-white/5">
                        <span className="text-4xl font-bold text-white">{comp.avgRating}</span>
                        <StarRating rating={parseFloat(comp.avgRating)} readonly size={26} />
                      </div>
                      <span className="text-xs text-slate-500 mt-2 block">
                        {comp.count} avaliações na rede
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#142239]/60 rounded-2xl p-6 border border-white/5">
                    <div>
                      <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase mb-3">
                        <ThumbsUp size={14} /> Prós
                      </div>
                      <ul className="space-y-2">
                        {comp.pros.slice(0, 3).map((p: string, idx: number) => (
                          <li key={idx} className="text-sm text-slate-300 italic">"{p}"</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase mb-3">
                        <ThumbsDown size={14} /> Contras
                      </div>
                      <ul className="space-y-2">
                        {comp.cons.slice(0, 3).map((c: string, idx: number) => (
                          <li key={idx} className="text-sm text-slate-300 italic">"{c}"</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};