import React from 'react';
import { Briefcase, GraduationCap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRegissStatus } from '../utils/regissLogic';

interface UserCardProps {
  id: string;
  full_name: string;
  profession?: string;
  job_title?: string;
  entry_year?: number;
  role?: string;
  avatar_url?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  id,
  full_name,
  profession,
  job_title,
  entry_year,
  role,
  avatar_url,
}) => {
  const navigate = useNavigate();

  const status = role === 'coordination'
    ? { label: 'ÁREA TÉCNICA', color: 'bg-amber-500/20 text-amber-500', border: 'border-amber-500/30' }
    : getRegissStatus(entry_year || 0, role);

  return (
    <div
      onClick={() => navigate(`/profile/${id}`)}
      className="bg-[#15335E] border border-white/5 hover:border-[#D5205D]/30 rounded-3xl p-6 cursor-pointer transition-all group shadow-xl hover:shadow-2xl flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#142239] bg-[#142239] flex-shrink-0">
            {avatar_url ? (
              <img src={avatar_url} alt={full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400">
                {full_name.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-white text-lg group-hover:text-[#D5205D] transition-colors">
              {full_name}
            </h3>
            <p className="text-sm text-slate-400">{profession || 'Profissão não informada'}</p>
          </div>
        </div>

        {/* Badge de Status */}
        <span
          className={`text-xs font-bold px-3 py-1 rounded-2xl border ${status.color} ${status.border}`}
        >
          {status.label}
        </span>
      </div>

      {/* Cargo */}
      <div className="flex items-center gap-2 text-slate-300 text-sm mb-6">
        <Briefcase size={16} className="text-[#D5205D]" />
        <span className="truncate">{job_title || status.defaultRole || 'Cargo não informado'}</span>
      </div>

      {/* Ano de entrada */}
      {entry_year && (
        <div className="flex items-center gap-2 text-slate-300 text-sm">
          <GraduationCap size={16} className="text-[#275A80]" />
          <span>Turma {entry_year}</span>
        </div>
      )}

      {/* Botão de ação */}
      <button className="mt-auto w-full py-3 bg-[#142239] hover:bg-[#D5205D] text-white rounded-2xl font-bold text-sm transition-all mt-6">
        Ver Perfil Completo
      </button>
    </div>
  );
};