-- Atualização da tabela profiles para suportar o Módulo de Coordenação e Alumnis Empregados

-- 1. Transformando a coluna "profession" que antes era um Enum Fechado, em um texto Livre 
-- (necessário para a Coordenação poder escrever sua formação original, ex: Médico, Economista, etc.)
ALTER TABLE public.profiles
ALTER COLUMN profession TYPE text USING profession::text;

-- 2. Adicionando a coluna current_company caso ela não exista
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_company text;

-- 3. Garantindo que a coluna role exista e tenha um valor padrão 
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 4. Inserindo comentários na tabela para documentação futura
COMMENT ON COLUMN public.profiles.current_company IS 'Empresa atual onde o Alumni trabalha ou a Instituição de base do Coordenador';
COMMENT ON COLUMN public.profiles.role IS 'Pode ser: user, admin, shadowbanned, ou coordination';
