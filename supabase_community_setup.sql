-- ARQUIVO: supabase_community_setup.sql
-- COLE ESTE CÓDIGO NO SQL EDITOR DO SUPABASE PARA PREPARAR O BANCO.

-- 1. Tabela de Postagens (Mural da Comunidade)
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    community_id TEXT NOT NULL, -- Usado TEXT porque os IDs são fixos (ex: 'prof-fisio')
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Leitura (Todos Autenticados Podem Ver)
CREATE POLICY "Qualquer logado pode ler topicos da comunidade"
    ON public.community_posts FOR SELECT
    TO authenticated
    USING (true);

-- 3. Políticas de Criação (Requer logado e ID próprio)
CREATE POLICY "Criar Topicos"
    ON public.community_posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 4. Políticas de Exclusão (Admin ou Autor)
CREATE POLICY "Deletar Topicos"
    ON public.community_posts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- (Opcional) Tabela de Comentários / Respostas aos Tópicos
CREATE TABLE IF NOT EXISTS public.community_replies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ler Respostas" ON public.community_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enviar Respostas" ON public.community_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Deletar Respostas" ON public.community_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);
