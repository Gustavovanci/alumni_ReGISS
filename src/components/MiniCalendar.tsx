import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, Gift, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MiniCalendar = () => {
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentMonth = new Date().getMonth() + 1;
  const monthStr = currentMonth.toString().padStart(2, '0');
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);

      // Buscamos os aniversariantes do mês usando um filtro RPC ou texto
      // Usamos .or para garantir que pegamos formatos YYYY-MM-DD ou DD/MM
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, birth_date, profession')
        .not('birth_date', 'is', null)
        .filter('birth_date', 'like', `%-${monthStr}-%`);

      if (error) throw error;
      setBirthdays(data || []);
    } catch (err) {
      console.error("Erro ao buscar aniversários:", err);
      setBirthdays([]);
    } finally {
      setLoading(false);
    }
  };

  const getDay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts.length === 3 ? parts[2] : dateStr.split('/')[0];
  };

  return (
    <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
          <CalendarIcon size={18} className="text-[#D5205D]" /> Aniversariantes
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase bg-[#142239] px-2 py-1 rounded">
          {monthNames[currentMonth - 1]}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-500" size={20} /></div>
      ) : birthdays.length === 0 ? (
        <p className="text-center text-slate-500 text-xs py-4 italic">Nenhum este mês.</p>
      ) : (
        <div className="space-y-3">
          {birthdays.map((person) => (
            <div
              key={person.id}
              onClick={() => navigate(`/profile/${person.id}`)}
              className="flex items-center gap-3 p-2 rounded-2xl bg-[#142239]/50 border border-white/5 hover:border-[#D5205D]/30 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                {person.avatar_url ? (
                  <img src={person.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-500">{person.full_name[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-[#D5205D] transition-colors">{person.full_name}</p>
                <p className="text-[9px] text-slate-500 truncate">{person.profession}</p>
              </div>
              <div className="bg-[#D5205D]/10 text-[#D5205D] text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-lg border border-[#D5205D]/20">
                {getDay(person.birth_date)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};