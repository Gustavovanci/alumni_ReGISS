import React from 'react';
import { Briefcase, GraduationCap } from 'lucide-react';

interface UserCardProps {
  name: string;
  role: string;
  profession: 'Fisioterapia' | 'Nutrição' | 'Terapia Ocupacional' | 'Enfermagem' | 'Fonoaudiologia';
  year: number;
  image?: string;
}

const professionColors = {
  'Fisioterapia': 'bg-profession-fisio',
  'Nutrição': 'bg-profession-nutri',
  'Terapia Ocupacional': 'bg-profession-to',
  'Enfermagem': 'bg-profession-enf',
  'Fonoaudiologia': 'bg-profession-fono',
};

export const UserCard: React.FC<UserCardProps> = ({ name, role, profession, year, image }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
      {/* Barra colorida da profissão */}
      <div className={`absolute top-0 left-0 w-2 h-full ${professionColors[profession]}`} />
      
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
             <img src={image || `https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Briefcase size={14} /> {role}
            </p>
          </div>
        </div>
        
        {/* Badge do Ano */}
        <span className="bg-hc-50 text-hc-900 text-xs font-bold px-2 py-1 rounded-full border border-hc-100 flex items-center gap-1">
          <GraduationCap size={14} /> R{year}
        </span>
      </div>

      <div className="mt-4">
        <span className={`text-xs text-white px-3 py-1 rounded-full ${professionColors[profession]}`}>
          {profession}
        </span>
      </div>

      <button className="mt-6 w-full py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
        Conectar
      </button>
    </div>
  );
};