// Tipagem dos Usuários
export interface UserProfile {
  id: string;
  name: string;
  profession: 'Fisioterapia' | 'Nutrição' | 'Terapia Ocupacional' | 'Enfermagem' | 'Fonoaudiologia';
  residencyYear: number;
  currentRole: string;
  skills: string[]; // O que eu sei (ex: "Gestão", "Python", "Ventilação Mecânica")
  interests: string[]; // O que eu quero aprender (ex: "Liderança", "Data Science")
}

// O Algoritmo de Sugestão
export const findMentors = (currentUser: UserProfile, allUsers: UserProfile[]): UserProfile[] => {
  return allUsers
    .filter(user => user.id !== currentUser.id) // Não sugerir a si mesmo
    .map(user => {
      // Pontuação de Match
      let score = 0;

      // 1. Match de Interesse vs Habilidade (O mais forte)
      // Se o usuário tem uma skill que eu tenho interesse -> Ponto alto
      const skillMatch = user.skills.filter(skill => 
        currentUser.interests.includes(skill)
      );
      score += skillMatch.length * 5;

      // 2. Match de Profissão (Networking da área)
      if (user.profession === currentUser.profession) {
        score += 2;
      }

      // 3. Match de Senioridade (Alguém mais antigo pode ensinar)
      if (user.residencyYear < currentUser.residencyYear) {
        score += 3; // Alguém que se formou antes (veterano)
      }

      return { user, score, matchReasons: skillMatch };
    })
    .sort((a, b) => b.score - a.score) // Ordenar do maior score para o menor
    .slice(0, 5) // Pegar top 5
    .map(item => item.user);
};