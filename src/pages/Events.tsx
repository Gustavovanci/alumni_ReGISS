import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon, Clock, Globe, Lock, Plus,
  ChevronLeft, ChevronRight, ChevronDown, X, Check, Trash2, CalendarDays, CalendarSync, Loader2
} from 'lucide-react';
import { getHolidays } from '../utils/holidays';

export const Events = () => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [localEvents, setLocalEvents] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', start_time: '', end_time: '', is_public: false
  });

  const holidays = getHolidays(currentDate.getFullYear());
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data: local } = await supabase.from('events').select('*').order('start_time', { ascending: true });
    setLocalEvents(local || []);

    const { data: profiles } = await supabase.from('profiles').select('full_name, birth_date');
    if (profiles) {
      const monthBdays = profiles.filter(p => {
        if (!p.birth_date) return false;
        return new Date(p.birth_date).getUTCMonth() === currentDate.getMonth();
      });
      setBirthdays(monthBdays);
    }
    setLoading(false);
  };

  const getDayDetails = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayHolidays = holidays.filter(h => h.date === dateStr);
    const dayBirthdays = birthdays.filter(p => new Date(p.birth_date).getUTCDate() === date.getDate());
    const events = localEvents.filter(e => new Date(e.start_time).toDateString() === date.toDateString());
    return { dayHolidays, dayBirthdays, events };
  };

  const openDayCard = (date: Date, presetHour?: number) => {
    const { events } = getDayDetails(date);
    const now = new Date();

    const startHour = presetHour !== undefined ? presetHour : now.getHours();
    const startMinute = presetHour !== undefined ? 0 : now.getMinutes();

    const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMinute);
    const endTime = new Date(startTime.getTime() + 60 * 60000);

    const formatLocalISO = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    setNewEvent({
      ...newEvent,
      start_time: formatLocalISO(startTime),
      end_time: formatLocalISO(endTime)
    });

    setSelectedDate(date);
    setSelectedDateEvents(events);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja apagar este evento?')) return;
    
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      
      toast.success("Evento apagado com sucesso.");
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao apagar evento.");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return toast.error("Você precisa estar logado para criar eventos.");
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('events').insert([{ 
        user_id: currentUser.id, 
        ...newEvent 
      }]);
      
      if (error) throw error;
      
      toast.success("Evento criado com sucesso!");
      setIsModalOpen(false);
      setNewEvent({ title: '', description: '', start_time: '', end_time: '', is_public: false });
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao criar o evento. Verifique as permissões do banco.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days: { day: number, currentMonth: boolean, date: Date }[] = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = firstDay; i > 0; i--) {
      days.push({ day: prevMonthLastDay - i + 1, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i + 1) });
    }
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }
    while (days.length < 42) {
      const nextDay = days.length - (lastDay + firstDay) + 1;
      days.push({ day: nextDay, currentMonth: false, date: new Date(year, month + 1, nextDay) });
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="bg-[#15335E] p-4 text-center text-[10px] font-black text-slate-500 uppercase">{d}</div>
        ))}
        {days.map((item, i) => {
          const { dayHolidays, dayBirthdays, events } = getDayDetails(item.date);
          const isToday = new Date().toDateString() === item.date.toDateString();

          return (
            <div
              key={i}
              onClick={() => openDayCard(item.date)}
              className={`bg-[#142239] min-h-[110px] p-2 border-r border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer group ${!item.currentMonth && 'opacity-20'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-[#D5205D] text-white shadow-lg' : 'text-slate-500 group-hover:text-white'}`}>{item.day}</span>
                <div className="flex gap-0.5">
                  {dayHolidays.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                  {dayBirthdays.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </div>
              </div>
              <div className="space-y-1">
                {dayHolidays.map((h, idx) => <div key={idx} className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1 rounded truncate uppercase font-bold">{h.name}</div>)}
                {dayBirthdays.map((b, idx) => <div key={idx} className="text-[8px] bg-cyan-500/10 text-cyan-300 px-1 rounded truncate">🎂 {b.full_name.split(' ')[0]}</div>)}
                {events.slice(0, 2).map((ev, idx) => (
                  <div key={idx} className="text-[8px] px-1 rounded truncate bg-blue-600 text-white shadow-sm border border-blue-400/30">
                    {new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {ev.title}
                  </div>
                ))}
                {events.length > 2 && <p className="text-[7px] text-slate-500 font-bold pl-1">+{events.length - 2} mais</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTimeGrid = (isSingleDay: boolean) => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const daysToShow = isSingleDay ? [currentDate] : Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d;
    });

    return (
      <div className="bg-[#15335E] rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[650px] shadow-2xl">
        <div className="flex border-b border-white/10 bg-[#142239]">
          <div className="w-16 shrink-0 border-r border-white/10" />
          {daysToShow.map((d, i) => (
            <div key={i} className="flex-1 p-3 text-center border-r border-white/5 last:border-r-0">
              <p className="text-[10px] text-slate-500 uppercase font-black">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
              <p className={`text-lg font-bold ${d.toDateString() === new Date().toDateString() ? 'text-[#D5205D]' : 'text-white'}`}>{d.getDate()}</p>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {hours.map(hour => (
            <div key={hour} className="flex h-20 border-b border-white/5 relative">
              <div className="w-16 shrink-0 text-[10px] text-slate-500 p-2 text-right font-bold border-r border-white/10">{`${hour}:00`}</div>
              {daysToShow.map((date, i) => {
                const { events } = getDayDetails(date);
                const hourEvents = events.filter(e => new Date(e.start_time).getHours() === hour);
                const isCurrentHourAndDay = date.toDateString() === currentTime.toDateString() && currentTime.getHours() === hour;

                return (
                  <div
                    key={i}
                    onClick={() => openDayCard(date, hour)}
                    className="flex-1 relative border-r border-white/5 last:border-r-0 hover:bg-white/[0.03] cursor-pointer"
                  >
                    {isCurrentHourAndDay && (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-[#D5205D] z-30 pointer-events-none"
                        style={{ top: `${(currentTime.getMinutes() / 60) * 100}%` }}
                      >
                        <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-[#D5205D] rounded-full shadow-[0_0_8px_#D5205D]"></div>
                      </div>
                    )}

                    {hourEvents.map((ev, idx) => (
                      <div key={idx} className="absolute inset-x-1 top-1 bottom-1 bg-blue-600 text-white p-2 rounded-lg text-[10px] font-bold shadow-lg overflow-hidden border-l-4 border-blue-300 z-10">
                        {ev.title}
                        <p className="text-[8px] opacity-70 mt-0.5">{new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#142239] text-white p-4 md:p-8 pb-24 font-sans relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agenda <span className="text-[#D5205D]">Alumni</span></h1>
            <p className="text-slate-400 text-sm mt-1">Gerencie seus compromissos e eventos da rede</p>
          </div>
          <div className="flex bg-[#15335E] p-1 rounded-xl border border-white/5 shadow-lg">
            {['month', 'week', 'day'].map((v) => (
              <button key={v} onClick={() => setView(v as any)} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase ${view === v ? 'bg-[#D5205D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="space-y-6">
            <div className="bg-[#15335E] p-6 rounded-3xl border border-white/5 shadow-xl">
              <button onClick={() => openDayCard(new Date())} className="w-full bg-[#D5205D] hover:bg-pink-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg mb-4">
                <Plus size={20} /> Novo Evento
              </button>

              <button onClick={() => setCurrentDate(new Date())} className="w-full bg-[#142239] border border-white/5 hover:border-white/10 hover:text-white transition-all text-xs font-bold py-2.5 rounded-xl text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 mb-8">
                <CalendarSync size={14} /> Ir para Hoje
              </button>

              <div className="flex items-center justify-between bg-[#142239] p-3 rounded-xl border border-white/10 mb-6 relative">
                <button onClick={() => { const d = new Date(currentDate); view === 'month' ? d.setMonth(d.getMonth() - 1) : view === 'week' ? d.setDate(d.getDate() - 7) : d.setDate(d.getDate() - 1); setCurrentDate(d); setShowMonthPicker(false); }} className="hover:text-[#D5205D] p-1"><ChevronLeft size={20} /></button>

                <div className="relative flex-1 flex justify-center">
                  <button onClick={() => { setPickerYear(currentDate.getFullYear()); setShowMonthPicker(!showMonthPicker); }} className="text-xs font-bold capitalize text-center hover:text-[#D5205D] transition-colors flex items-center gap-1">
                    {view === 'day' ? currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    <ChevronDown size={14} />
                  </button>

                  {showMonthPicker && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#15335E] border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 w-56 animate-fadeIn">
                      <div className="flex justify-between items-center mb-4">
                        <button onClick={() => setPickerYear(y => y - 1)} className="p-1 hover:text-[#D5205D] transition-colors"><ChevronLeft size={16} /></button>
                        <span className="font-black text-sm">{pickerYear}</span>
                        <button onClick={() => setPickerYear(y => y + 1)} className="p-1 hover:text-[#D5205D] transition-colors"><ChevronRight size={16} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (
                          <button
                            key={m}
                            onClick={() => { const newDate = new Date(currentDate); newDate.setFullYear(pickerYear); newDate.setMonth(i); setCurrentDate(newDate); setShowMonthPicker(false); }}
                            className={`py-2 text-[10px] font-bold rounded-xl transition-all uppercase ${currentDate.getMonth() === i && currentDate.getFullYear() === pickerYear ? 'bg-[#D5205D] text-white shadow-lg' : 'bg-[#142239] hover:bg-white/10 text-slate-300'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => { const d = new Date(currentDate); view === 'month' ? d.setMonth(d.getMonth() + 1) : view === 'week' ? d.setDate(d.getDate() + 7) : d.setDate(d.getDate() + 1); setCurrentDate(d); setShowMonthPicker(false); }} className="hover:text-[#D5205D] p-1"><ChevronRight size={20} /></button>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Legenda</h4>
                <div className="flex items-center gap-3 text-xs text-slate-300"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Feriados</div>
                <div className="flex items-center gap-3 text-xs text-slate-300"><div className="w-3 h-3 rounded-full bg-cyan-400" /> Aniversários</div>
                <div className="flex items-center gap-3 text-xs text-slate-300"><div className="w-3 h-3 rounded-full bg-blue-600" /> Seus Eventos</div>
                <div className="flex items-center gap-3 text-xs text-slate-300"><div className="w-3 h-3 rounded-full bg-[#D5205D]" /> Hoje / Seleção</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 relative">
            {showMonthPicker && <div className="absolute inset-0 z-40" onClick={() => setShowMonthPicker(false)} />}
            {view === 'month' && renderMonthGrid()}
            {view === 'week' && renderTimeGrid(false)}
            {view === 'day' && renderTimeGrid(true)}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#15335E] w-full max-w-sm rounded-[32px] border border-white/10 shadow-2xl overflow-hidden animate-fadeIn scale-100">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#142239]/80">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-white leading-tight">Agendar</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                  {selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"><X size={18} /></button>
            </div>

            <div className="p-5">
              {selectedDateEvents.length > 0 && (
                <div className="mb-5 space-y-2">
                  {selectedDateEvents.map((ev, i) => (
                    <div key={i} className="bg-[#142239] p-3 rounded-2xl border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div>
                          <p className="font-bold text-xs text-white leading-tight">{ev.title}</p>
                          <p className="text-[9px] text-slate-400">{new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      {currentUser?.id === ev.user_id && (
                        <button onClick={() => handleDeleteEvent(ev.id)} className="text-slate-500 hover:text-red-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <input
                  type="text" placeholder="Adicionar título"
                  className="w-full bg-[#142239] border border-white/10 rounded-2xl p-3.5 text-sm text-white outline-none focus:border-[#D5205D] transition-all placeholder:text-slate-500"
                  value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required
                />
                <div className="flex gap-3">
                  <div className="flex-1 bg-[#142239] border border-white/10 rounded-2xl p-2.5">
                    <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1 ml-1">Início</label>
                    <input type="datetime-local" className="w-full bg-transparent text-xs text-white outline-none" style={{ colorScheme: 'dark' }} value={newEvent.start_time} onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })} required />
                  </div>
                  <div className="flex-1 bg-[#142239] border border-white/10 rounded-2xl p-2.5">
                    <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1 ml-1">Fim</label>
                    <input type="datetime-local" className="w-full bg-transparent text-xs text-white outline-none" style={{ colorScheme: 'dark' }} value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} required />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewEvent({ ...newEvent, is_public: false })} className={`flex-1 py-2.5 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${!newEvent.is_public ? 'bg-white text-[#142239] border-white' : 'text-slate-400 border-white/10 bg-transparent'}`}><Lock size={12} /> Privado</button>
                  <button type="button" onClick={() => setNewEvent({ ...newEvent, is_public: true })} className={`flex-1 py-2.5 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${newEvent.is_public ? 'bg-[#D5205D] text-white border-[#D5205D]' : 'text-slate-400 border-white/10 bg-transparent'}`}><Globe size={12} /> Público</button>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center gap-2 bg-[#D5205D] text-white font-bold py-3.5 rounded-2xl mt-2 shadow-lg hover:bg-pink-600 transition-all text-sm disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};