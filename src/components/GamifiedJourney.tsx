import React from 'react';
import { Briefcase, GraduationCap, Award } from 'lucide-react';

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
   // Adiciona automaticamente o marco da Residência ReGISS
   const timelineItems = [...items];

   if (entryYear) {
      timelineItems.push({
         id: 'regiss-milestone',
         title: `Residência em ${profession}`,
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
         <p className="text-slate-500 italic text-center py-8">
            Nenhuma experiência cadastrada ainda.
         </p>
      );
   }

   return (
      <div className="relative py-10 px-4">
         {/* Linha vertical da timeline */}
         <div className="absolute left-8 top-4 bottom-4 w-1 bg-gradient-to-b from-[#D5205D] via-[#275A80] to-transparent rounded-full"></div>

         {sortedTimeline.map((item) => {
            const isRegiss = item.type === 'regiss';
            const year = new Date(item.start_date).getFullYear();

            return (
               <div key={item.id} className="relative mb-12 pl-20 group">
                  {/* Bolinha da timeline */}
                  <div
                     className={`absolute left-4 top-2 w-9 h-9 rounded-2xl border-4 border-[#142239] flex items-center justify-center z-10 shadow-lg transition-all
                ${isRegiss
                           ? 'bg-gradient-to-br from-[#D5205D] to-[#B32F50] scale-110 shadow-neon'
                           : 'bg-[#15335E]'
                        }`}
                  >
                     {isRegiss ? (
                        <Award size={18} className="text-white" />
                     ) : item.type === 'education' || item.type === 'graduation' || item.type === 'postgrad' ? (
                        <GraduationCap size={18} className="text-[#275A80]" />
                     ) : (
                        <Briefcase size={18} className="text-[#D5205D]" />
                     )}
                  </div>

                  {/* Card */}
                  <div
                     className={`border rounded-3xl p-6 transition-all duration-300 shadow-lg
                ${isRegiss
                           ? 'bg-[#15335E] border-[#D5205D]/40 shadow-neon'
                           : 'bg-[#15335E] border-white/10 hover:border-white/20'
                        }`}
                  >
                     <div className="flex justify-between items-start">
                        <div className="flex-1">
                           <h3 className={`font-bold text-lg ${isRegiss ? 'text-[#D5205D]' : 'text-white'}`}>
                              {item.title}
                           </h3>
                           <p className="text-slate-400 text-sm mt-1">{item.organization}</p>
                        </div>

                        <div className="text-right">
                           <span className="text-xs font-mono text-slate-500 block">
                              {year}
                              {item.end_date && ` — ${new Date(item.end_date).getFullYear()}`}
                           </span>
                           {isRegiss && (
                              <span className="inline-block mt-2 bg-[#D5205D]/10 text-[#D5205D] text-[10px] font-bold px-3 py-1 rounded-full">
                                 MARCO ReGISS
                              </span>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            );
         })}

         {/* Fim da timeline */}
         <div className="absolute left-[30px] bottom-0 w-3 h-3 bg-[#D5205D] rounded-full border-2 border-[#142239]"></div>
      </div>
   );
};