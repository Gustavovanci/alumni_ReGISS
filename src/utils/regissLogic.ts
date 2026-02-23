export const getRegissStatus = (entryYear: number | null, role?: string) => {
  // 1. Regra para Coordenação (Ignora o ano de entrada)
  if (role === 'coordinator' || role === 'coordination') {
    return {
      label: 'Área Técnica',
      color: 'bg-purple-500/20 text-purple-400',
      border: 'border-purple-500/50',
      defaultRole: 'Coordenação ReGISS',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
      isResident: false
    };
  }

  // 2. Regra para Administrador do Sistema
  if (role === 'admin') {
    return {
      label: 'Administrador',
      color: 'bg-red-500/20 text-red-400',
      border: 'border-red-500/50',
      defaultRole: 'Gestão do Sistema',
      glow: '',
      isResident: false
    };
  }

  // Fallback caso algum usuário caia aqui sem ano de entrada definido
  if (!entryYear) {
    return {
      label: 'Convidado',
      color: 'bg-slate-500/20 text-slate-400',
      border: 'border-slate-500/50',
      defaultRole: 'Usuário',
      glow: '',
      isResident: false
    };
  }

  // 3. Lógica corrigida para R1, R2 e Alumni (O ano letivo vira dia 1º de Março)
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // Janeiro = 0, Fevereiro = 1, Março = 2

  // Se ainda não chegou março, a turma vigente "R1" é a do ano passado.
  const baseYear = currentMonth >= 2 ? currentYear : currentYear - 1;

  if (entryYear === baseYear) {
    return {
      label: 'R1',
      color: 'bg-blue-500/20 text-blue-400',
      border: 'border-blue-500/50',
      defaultRole: 'Residente R1',
      glow: '',
      isResident: true
    };
  } else if (entryYear === baseYear - 1) {
    return {
      label: 'R2',
      color: 'bg-emerald-500/20 text-emerald-400',
      border: 'border-emerald-500/50',
      defaultRole: 'Residente R2',
      glow: '',
      isResident: true
    };
  } else {
    return {
      label: `Alumni '${entryYear}`,
      color: 'bg-amber-500/20 text-amber-400',
      border: 'border-amber-500/50',
      defaultRole: 'Especialista',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.15)]',
      isResident: false
    };
  }
};