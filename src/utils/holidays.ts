// Algoritmo para calcular feriados móveis (Páscoa, Carnaval, Corpus Christi)
const getEasterDate = (year: number) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
};

export const getHolidays = (year: number) => {
  const easter = getEasterDate(year);
  
  // Carnaval: 47 dias antes da Páscoa
  const carnival = new Date(easter);
  carnival.setDate(easter.getDate() - 47);

  // Corpus Christi: 60 dias após a Páscoa
  const corpus = new Date(easter);
  corpus.setDate(easter.getDate() + 60);

  // Sexta-feira Santa: 2 dias antes da Páscoa
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);

  const fixedHolidays = [
    { date: `${year}-01-01`, name: 'Confraternização Universal' },
    { date: `${year}-04-21`, name: 'Tiradentes' },
    { date: `${year}-05-01`, name: 'Dia do Trabalho' },
    { date: `${year}-09-07`, name: 'Independência do Brasil' },
    { date: `${year}-10-12`, name: 'Nossa Senhora Aparecida' },
    { date: `${year}-11-02`, name: 'Finados' },
    { date: `${year}-11-15`, name: 'Proclamação da República' },
    { date: `${year}-11-20`, name: 'Dia da Consciência Negra' },
    { date: `${year}-12-25`, name: 'Natal' },
  ];

  const mobileHolidays = [
    { date: carnival.toISOString().split('T')[0], name: 'Carnaval (Ponto Facultativo)' },
    { date: goodFriday.toISOString().split('T')[0], name: 'Sexta-feira Santa' },
    { date: corpus.toISOString().split('T')[0], name: 'Corpus Christi' },
  ];

  return [...fixedHolidays, ...mobileHolidays];
};