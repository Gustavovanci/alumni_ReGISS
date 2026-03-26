import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Gift, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getHolidays } from '../utils/holidays';

export const MiniCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);

  // Busca aniversariantes do mês atual
  useEffect(() => {
    const fetchBirthdays = async () => {
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const { data } = await supabase
        .from('profiles')
        .select('full_name, birth_date')
        .not('birth_date', 'is', null)
        .like('birth_date', `%-${month}-%`);

      if (data) {
        setBirthdays(data);
      }
    };
    fetchBirthdays();
  }, [currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const holidays = getHolidays(currentDate.getFullYear());

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getDayInfo = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Feriado
    const holiday = holidays.find((h) => h.date === dateStr);
    if (holiday) return { type: 'holiday', text: holiday.name };

    // Aniversário
    const bdays = birthdays.filter((p) => {
      if (!p.birth_date) return false;
      const bDate = new Date(p.birth_date);
      return bDate.getUTCDate() === day && bDate.getUTCMonth() === currentDate.getMonth();
    });

    if (bdays.length > 0) {
      return {
        type: 'birthday',
        text: `🎂 ${bdays.map((b) => b.full_name.split(' ')[0]).join(', ')}`,
      };
    }

    // Início da Residência (1º de Março)
    if (currentDate.getMonth() === 2 && day === 1) {
      return { type: 'residency', text: 'Início do Ano Letivo ReGISS' };
    }

    return null;
  };

  return (
    <div className="bg-[#15335E] border border-white/5 rounded-3xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CalendarIcon size={18} className="text-[#D5205D]" />
          {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>

        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7 gap-1">
        {/* Dias do mês anterior (vazios) */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}

        {/* Dias do mês atual */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const info = getDayInfo(day);
          const today = isToday(day);

          return (
            <div
              key={day}
              onClick={() => setSelectedInfo(info ? info.text : null)}
              className={`h-8 flex flex-col items-center justify-center text-xs rounded-2xl cursor-pointer transition-all relative
                ${today ? 'bg-[#D5205D] text-white font-bold shadow-neon' : 'text-slate-300 hover:bg-white/10'}
                ${info?.type === 'holiday' ? 'text-yellow-400 font-semibold' : ''}
              `}
            >
              {day}

              {/* Indicadores */}
              <div className="flex gap-px absolute bottom-1">
                {info?.type === 'holiday' && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />}
                {info?.type === 'birthday' && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
                {info?.type === 'residency' && <div className="w-1.5 h-1.5 bg-[#275A80] rounded-full" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informação do dia clicado */}
      {selectedInfo && (
        <div className="mt-5 p-4 bg-[#142239] rounded-2xl border border-white/10 flex gap-3 text-sm animate-fadeIn">
          <Info size={18} className="text-[#D5205D] mt-0.5 flex-shrink-0" />
          <p className="text-slate-200">{selectedInfo}</p>
        </div>
      )}

      {/* Botão para agenda completa */}
      <button
        onClick={() => navigate('/events')}
        className="w-full mt-6 py-3 bg-[#142239] hover:bg-[#D5205D] border border-white/10 hover:border-transparent text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
      >
        Ver Agenda Completa
        <CalendarIcon size={16} />
      </button>
    </div>
  );
};