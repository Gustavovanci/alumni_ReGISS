import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building, GraduationCap, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { StarRating } from '../components/StarRating';

export const Insights = () => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'job' | 'education'>('all');

  useEffect(() => {
    const fetchInsights = async () => {
      const { data } = await supabase.from('career_journey').select('organization, type, rating, pros, cons, benefits').gt('rating', 0);
      if (!data) return setLoading(false);

      const grouped = data.reduce((acc: any, curr: any) => {
        const name = curr.organization;
        if (!acc[name]) acc[name] = { name, type: curr.type, count: 0, totalRating: 0, pros: [], cons: [], benefits: new Set() };
        acc[name].count++;
        acc[name].totalRating += curr.rating;
        if (curr.pros) acc[name].pros.push(curr.pros);
        if (curr.cons) acc[name].cons.push(curr.cons);
        if (curr.benefits) curr.benefits.forEach((b: string) => acc[name].benefits.add(b));
        return acc;
      }, {});

      const result = Object.values(grouped).map((c: any) => ({
        ...c, avgRating: (c.totalRating / c.count).toFixed(1), benefits: Array.from(c.benefits)
      })).sort((a: any, b: any) => b.avgRating - a.avgRating);

      setCompanies(result);
      setLoading(false);
    };
    fetchInsights();
  }, []);

  const filteredCompanies = filter === 'all' ? companies : companies.filter(c => c.type === filter);

  if (loading) return <div className="min-h-screen bg-[#142239] flex items-center justify-center text-slate-400"><Loader2 className="w-10 h-10 text-[#D5205D] animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 font-sans p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">

        {/* HEADER PADRONIZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Insights de <span className="text-[#D5205D]">Mercado</span></h1>
            <p className="text-slate-400 text-sm mt-1">Avaliações e dados reais da comunidade ReGISS</p>
          </div>

          <div className="flex bg-[#15335E] p-1 rounded-xl border border-white/5 shadow-lg overflow-x-auto">
            {[
              { id: 'all', label: 'Tudo' },
              { id: 'job', label: 'Empresas' },
              { id: 'education', label: 'Ensino' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase whitespace-nowrap ${filter === f.id ? 'bg-[#D5205D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredCompanies.length === 0 && <p className="text-slate-500 text-center py-20 bg-[#15335E]/50 rounded-3xl border border-dashed border-white/10">Ainda não há avaliações suficientes.</p>}
          {filteredCompanies.map((comp, i) => (
            <div key={comp.name} className="bg-[#15335E] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl hover:border-white/10 transition-colors relative overflow-hidden">
              {i < 3 && <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 px-4 py-1.5 text-xs font-bold rounded-bl-2xl border-b border-l border-yellow-500/20 shadow-sm">#{i + 1} Melhor Avaliada</div>}
              <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#142239] rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
                      {comp.type === 'job' ? <Building size={24} className="text-slate-400" /> : <GraduationCap size={24} className="text-slate-400" />}
                    </div>
                    {comp.name}
                  </h3>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {comp.benefits.map((b: string) => (<span key={b} className="text-[10px] bg-[#142239] text-blue-400 font-bold border border-white/5 px-3 py-1 rounded-lg uppercase tracking-wider">{b}</span>))}
                  </div>
                </div>
                <div className="text-left md:text-right flex flex-col md:items-end w-full md:w-auto">
                  <div className="flex items-center justify-between md:justify-end gap-3 bg-[#142239] px-4 py-3 rounded-2xl border border-white/5 w-full md:w-auto shadow-inner">
                    <span className="text-3xl font-bold text-white">{comp.avgRating}</span>
                    <StarRating rating={Number(comp.avgRating)} readonly />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">{comp.count} avaliações na rede</span>
                </div>
              </div>

              <div className="bg-[#142239]/50 rounded-2xl p-6 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <span className="text-green-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4"><ThumbsUp size={14} /> Prós (Comunidade)</span>
                  <ul className="space-y-3">
                    {comp.pros.slice(0, 3).map((p: string, idx: number) => (<li key={idx} className="text-sm text-slate-300 border-l-2 border-green-500/30 pl-3 italic bg-[#142239] p-3 rounded-r-xl">"{p}"</li>))}
                  </ul>
                </div>
                <div>
                  <span className="text-red-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4"><ThumbsDown size={14} /> Contras (Comunidade)</span>
                  <ul className="space-y-3">
                    {comp.cons.slice(0, 3).map((c: string, idx: number) => (<li key={idx} className="text-sm text-slate-300 border-l-2 border-red-500/30 pl-3 italic bg-[#142239] p-3 rounded-r-xl">"{c}"</li>))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};