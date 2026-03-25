-- ARQUIVO: fix_posts_table.sql
-- COLE NO SQL EDITOR DO SUPABASE E EXECUTE

-- 1. Garante que as colunas necessárias existam na tabela posts
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='title') THEN
        ALTER TABLE public.posts ADD COLUMN title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='link_url') THEN
        ALTER TABLE public.posts ADD COLUMN link_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='expires_at') THEN
        ALTER TABLE public.posts ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '15 days');
    END IF;
END $$;

-- 2. Habilita RLS (caso esteja desativado)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 3. Cria a política de INSERÇÃO (Permite que usuários logados postem)
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts" 
ON public.posts 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 4. Cria a política de SELEÇÃO (Permite que todos vejam os posts)
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts" 
ON public.posts 
FOR SELECT 
TO authenticated 
USING (true);

-- 5. Cria a política de DELEÇÃO (Admin ou Autor)
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
