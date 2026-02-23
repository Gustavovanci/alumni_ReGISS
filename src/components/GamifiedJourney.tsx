import React from 'react';
import { Briefcase, GraduationCap, Award } from 'lucide-react';

interface JourneyItem {
   id: string; title: string; organization: string; type: string; start_date: string; end_date: string; rating: number; pros?: string; cons?: string; benefits?: string[];
}

export const GamifiedJourney = ({ items, entryYear, profession }: { items: JourneyItem[], entryYear: number, profession: string }) => {

   // 1. Inserir o Marco ReGISS na linha do tempo
   const regissMilestone = {
      id: 'regiss-start',
      title: `Início na Residência (${profession})`,
      organization: 'HCFMUSP - ReGISS',
      type: 'regiss',
      start_date: `${entryYear}-03-01`, // Data simbólica de início
      end_date: '',
      rating: 5,
      isMilestone: true
   };

   // 2. Mesclar e Ordenar (Do mais recente para o mais antigo)
   const timeline = [...items, regissMilestone].sort((a, b) => {
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
   });

   if (items.length === 0 && !entryYear) return <p className="text-slate-500 italic p-4 text-center">Jornada ainda não iniciada.</p>;

   return (
      <div className="relative py-10 px-4">
         {/* TRILHA (Linha conectora) */}
         <div className="absolute left-8 top-6 bottom-6 w-1 bg-gradient-to-b from-regiss-magenta via-regiss-petrol to-regiss-deep/10 rounded-full"></div>

         {timeline.map((item: any) => {
            const isRegiss = item.type === 'regiss';
            const isEducation = item.type === 'education';
            const year = new Date(item.start_date).getFullYear();

            return (
               <div key={item.id} className="relative mb-8 pl-20 group">

                  {/* NÓ DO CAMINHO (Bolinha) */}
                  <div className={`absolute left-4 top-5 w-9 h-9 rounded-full border-4 border-regiss-deep z-10 flex items-center justify-center shadow-lg transition-all 
                ${isRegiss ? 'bg-gradient-to-br from-regiss-magenta to-regiss-wine scale-110 shadow-neon' : isEducation ? 'bg-regiss-petrol' : 'bg-white'}`}>
                     {isRegiss ? <Award size={16} className="text-white" /> : isEducation ? <GraduationCap size={14} className="text-white" /> : <Briefcase size={14} className="text-regiss-deep" />}
                  </div>

                  {/* CARD SIMPLES (Sem Glassdoor Expansível) */}
                  <div
                     className={`
                  border rounded-2xl p-5 relative ml-4 transition-all duration-300
                  ${isRegiss ? 'bg-regiss-card/80 border-regiss-magenta/50 shadow-[0_0_15px_rgba(213,32,93,0.15)]' : 'bg-regiss-card border-white/5 hover:border-white/20 shadow-lg'}
               `}
                  >
                     {/* Cabeçalho do Card (Sempre Visível) */}
                     <div className="flex justify-between items-start">
                        <div>
                           <h3 className={`font-bold text-lg ${isRegiss ? 'text-regiss-magenta' : 'text-white'}`}>{item.title}</h3>
                           <p className={`font-bold text-sm ${isRegiss ? 'text-white' : isEducation ? 'text-regiss-petrol' : 'text-slate-300'}`}>{item.organization}</p>

                           {/* Ano / Data */}
                           <p className="text-xs text-slate-500 mt-1 font-mono flex items-center gap-2">
                              {year}
                              {item.end_date && ` — ${new Date(item.end_date).getFullYear()}`}
                              {isRegiss && <span className="bg-regiss-magenta/20 text-regiss-magenta px-2 py-0.5 rounded text-[10px] font-bold uppercase">Marco ReGISS</span>}
                           </p>
                        </div>
                     </div>

                     {/* Benefícios (Mantidos PÚBLICOS como marcadores de cultura das empresas?) 
                    O usuário pediu para tirar o Glassdoor. Os benefícios não revelam sentimento. 
                    Por via das dúvidas, vamos ocultar os benefícios do painel público também para deixar a interface clean. */}
                  </div>
               </div>
            );
         })}

         {/* FIM DO CAMINHO */}
         <div className="absolute left-[30px] bottom-0 w-2 h-2 bg-regiss-deep rounded-full border border-white/20"></div>
      </div>
   );
};