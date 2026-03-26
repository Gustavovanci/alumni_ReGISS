import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, Gift, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MiniCalendar = () => {
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const currentMonth = new Date().getMonth() + 1;
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      setError(false);

      const monthStr = currentMonth.toString().padStart(2, '0');

      // Busca perfis que fazem aniversário neste mês
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, birth_date, profession')
        .not('birth_date', 'is', null)
        .like('birth_date', `%-${monthStr}-%`)
        .order('birth_date', { ascending: true });

      if (error) {
        // Se der erro (ex: coluna não existe), paramos silenciosamente para não piscar a tela
        console.warn("Aviso: Falha ao buscar aniversários (a coluna birth_date existe?).", error.message);
        setError(true);
        setBirthdays([]);
        return;
      }

      setBirthdays(data || []);
    } catch (err) {
      console.error("Erro inesperado no calendário:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getDayFromDate = (dateString: string) => {
    if (!dateString) return '';
    // Assume formato YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length === 3) return parts[2];
    return '';
  };

  if (error) {
    // Se deu erro no banco, não renderizamos nada para não poluir a tela
    return null;
  }

  return (
    <div className="bg-[#15335E] border border-white/5 rounded-3xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white flex items-center gap-2">
          <CalendarIcon size={18} className="text-[#275A80]" /> Aniversariantes
        </h3>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-[#142239] px-3 py-1 rounded-lg border border-white/5">
          {monthNames[currentMonth - 1]}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-slate-500" size={24} />
        </div>
      ) : birthdays.length === 0 ? (
        <div className="text-center py-8 bg-[#142239] rounded-2xl border border-white/5">
          <Gift className="mx-auto text-slate-500 mb-2 opacity-50" size={24} />
          <p className="text-sm text-slate-400">Nenhum aniversário este mês.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {birthdays.map((person) => (
            <div
              key={person.id}
              onClick={() => navigate(`/profile/${person.id}`)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-[#142239] border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#275A80]/50 overflow-hidden shrink-0 flex items-center justify-center">
                {person.avatar_url ? (
                  <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-slate-400 uppercase">{person.full_name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate group-hover:text-[#275A80] transition-colors">{person.full_name}</p>
                <p className="text-[10px] text-slate-400 truncate">{person.profession}</p>
              </div>
              <div className="flex flex-col items-center justify-center w-10 h-10 bg-[#15335E] rounded-xl border border-white/5 group-hover:bg-[#275A80] transition-colors shrink-0">
                <span className="text-xs font-black text-white">{getDayFromDate(person.birth_date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};