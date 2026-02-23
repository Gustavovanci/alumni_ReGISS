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

  useEffect(() => {
    fetchBirthdays();
  }, [currentDate]);

  const fetchBirthdays = async () => {
    // Busca perfis para checar aniversários (MVP: busca todos e filtra no front, idealmente seria RPC no banco)
    const { data } = await supabase.from('profiles').select('full_name, birth_date');
    if (data) {
      const monthBirthdays = data.filter(p => {
        if (!p.birth_date) return false;
        const bdate = new Date(p.birth_date);
        // Ajuste de timezone simples para garantir o dia correto
        const userMonth = bdate.getUTCMonth();
        return userMonth === currentDate.getMonth();
      });
      setBirthdays(monthBirthdays);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const holidays = getHolidays(currentDate.getFullYear());

  const prevMonth = () => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)); setSelectedInfo(null); };
  const nextMonth = () => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)); setSelectedInfo(null); };

  const isResidencyStart = (day: number) => currentDate.getMonth() === 2 && day === 1;

  const getDayInfo = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    
    // 1. Feriados
    const holiday = holidays.find(h => h.date === dateStr);
    if (holiday) return { type: 'holiday', text: holiday.name };

    // 2. Aniversários
    const bdays = birthdays.filter(p => {
        const d = new Date(p.birth_date);
        return d.getUTCDate() === day;
    });
    if (bdays.length > 0) return { type: 'birthday', text: `Aniversário: ${bdays.map(b => b.full_name.split(' ')[0]).join(', ')}` };

    // 3. Residência
    if (isResidencyStart(day)) return { type: 'residency', text: 'Início do Ano Letivo HC' };

    return null;
  };

  return (
    <div className="bg-regiss-card border border-white/5 rounded-2xl p-5 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase">
          <CalendarIcon size={16} className="text-regiss-magenta"/> 
          {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-lg text-slate-400"><ChevronLeft size={16}/></button>
          <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-lg text-slate-400"><ChevronRight size={16}/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-500 uppercase mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d,i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const info = getDayInfo(day);
          const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

          return (
            <div 
              key={day} 
              onClick={() => setSelectedInfo(info ? info.text : null)}
              className={`
                h-8 flex flex-col items-center justify-center text-xs rounded-lg cursor-pointer relative transition-all
                ${isToday ? 'bg-regiss-magenta text-white font-bold' : 'text-slate-300 hover:bg-white/5'}
                ${info?.type === 'holiday' ? 'text-yellow-500 font-bold' : ''}
              `}
            >
              {day}
              <div className="flex gap-0.5 mt-0.5">
                 {info?.type === 'holiday' && <div className="w-1 h-1 rounded-full bg-yellow-500"/>}
                 {info?.type === 'birthday' && <div className="w-1 h-1 rounded-full bg-blue-400"/>}
                 {info?.type === 'residency' && <div className="w-1 h-1 rounded-full bg-regiss-petrol"/>}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedInfo && (
        <div className="mt-4 p-3 bg-regiss-deep rounded-xl border border-white/10 animate-fadeIn text-xs text-white flex gap-2 items-start">
           <Info size={14} className="text-regiss-magenta shrink-0 mt-0.5"/> {selectedInfo}
        </div>
      )}

      <button onClick={() => navigate('/events')} className="w-full mt-4 py-2.5 bg-regiss-deep hover:bg-regiss-petrol border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all">
        Ver Agenda Completa
      </button>
    </div>
  );
};