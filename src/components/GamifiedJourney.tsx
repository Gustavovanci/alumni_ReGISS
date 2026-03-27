import React from 'react';
import { Briefcase, GraduationCap, Award, CalendarDays } from 'lucide-react';

interface JourneyItem {
   id: string;
   title: string;
   organization: string;
   type: string;
   start_date: string;
   end_date: string | null;
   rating: number;
}

export const GamifiedJourney = ({
   items,
   entryYear,
   profession,
}: {
   items: JourneyItem[];
   entryYear: number;
   profession: string;
}) => {
   const timelineItems = [...items];

   // Verifica se o usuário já tem o marco "regiss" salvo no banco.
   const hasRegissSaved = items.some(item => item.type === 'regiss');

   // Se não tiver salvo ainda, cria um visualmente
   if (entryYear && !hasRegissSaved) {
      timelineItems.push({
         id: 'regiss-milestone',
         title: 'R1 ReGISS',
         organization: 'HCFMUSP - ReGISS',
         type: 'regiss',
         start_date: `${entryYear}-03-01`,
         end_date: null,
         rating: 5,
      });
   }

   // Ordena do mais recente para o mais antigo
   const sortedTimeline = timelineItems.sort((a, b) => {
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
   });

   if (sortedTimeline.length === 0) {
      return (
         <div className="text-center py-20 bg-[#142239] border border-dashed border-white/10 rounded-3xl mt-10">
            <CalendarDays size={48} className="mx-auto text-slate-600 mb-6" />
            <p className="text-slate-500 italic font-medium">
               Nenhuma experiência ou formação cadastrada na jornada.
            </p>
         </div>
      );
   }

   return (
      <div className="relative py-12 px-2 md:px-6">
         {/* Linha vertical da timeline */}
         <div className="absolute left-6 md:left-10 top-2 bottom-2 w-1.5 bg-gradient-to-b from-[#D5205D] via-[#B32F50]/50 to-transparent rounded-full shadow-[0_0_15px_rgba(213,32,93,0.3)]"></div>

         <div className="space-y-12">
            {sortedTimeline.map((item) => {
               const isRegiss = item.type === 'regiss';
               const startDate = new Date(item.start_date);
               const year = startDate.getFullYear();
               const monthYear = startDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

               // 🔥 A TRAVA ABSOLUTA: Se for marco do ReGISS, ignora o banco e força "R1 ReGISS"
               const displayTitle = isRegiss ? 'R1 ReGISS' : item.title;

               return (
                  // Removi o opacity-0 para garantir que o card sempre apareça!
                  <div key={item.id} className="relative pl-16 md:pl-24 group transition-all duration-300">

                     {/* Bolinha da timeline */}
                     <div
                        className={`absolute left-2 md:left-6 top-1.5 w-10 h-10 rounded-2xl border-4 border-[#142239] flex items-center justify-center z-20 shadow-xl transition-all duration-300 group-hover:scale-110 
                   ${isRegiss
                              ? 'bg-gradient-to-br from-[#D5205D] to-[#B32F50]'
                              : 'bg-[#15335E]'
                           }`}
                     >
                        {isRegiss ? (
                           <Award size={18} className="text-white" />
                        ) : item.type === 'education' || item.type === 'graduation' || item.type === 'postgrad' ? (
                           <GraduationCap size={20} className="text-[#275A80]" />
                        ) : (
                           <Briefcase size={20} className="text-[#D5205D]" />
                        )}
                     </div>

                     {/* CARD PREMIUM */}
                     <div
                        className={`relative border rounded-[2rem] p-8 transition-all duration-500 shadow-xl group-hover:-translate-y-1
                   ${isRegiss
                              ? 'bg-[#15335E] border-[#D5205D]/60 shadow-[0_10px_30px_rgba(213,32,93,0.15)]'
                              : 'bg-[#15335E] border-white/5 hover:border-white/20'
                           }`}
                     >
                        {isRegiss && (
                           <div className="absolute top-8 left-0 w-2 h-16 bg-[#D5205D] rounded-r-full"></div>
                        )}

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                           <div className="flex-1">
                              {/* Usa o DisplayTitle que forçamos ali em cima */}
                              <h3 className={`font-bold text-xl md:text-2xl leading-tight ${isRegiss ? 'text-[#D5205D]' : 'text-white'}`}>
                                 {displayTitle}
                              </h3>
                              <p className="text-slate-300 text-sm md:text-base mt-1 font-medium">{item.organization}</p>
                           </div>

                           <div className="text-left md:text-right flex-shrink-0">
                              <span className="text-xs md:text-sm font-black font-mono text-slate-400 block uppercase tracking-wider bg-black/30 px-3 py-1 rounded-full border border-white/5">
                                 {monthYear}
                                 {item.end_date && ` — ${new Date(item.end_date).getFullYear()}`}
                              </span>

                              {isRegiss && (
                                 <div className="inline-flex mt-3 bg-[#D5205D] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10 shadow-lg">
                                    CONQUISTA ReGISS
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>

         {/* Bolinha de encerramento */}
         <div className="absolute left-[18px] md:left-[34px] bottom-0 w-5 h-5 bg-[#D5205D] rounded-full border-4 border-[#142239]"></div>
      </div>
   );
};