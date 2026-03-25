-- ARQUIVO: supabase_enable_deletes.sql
-- COLE ESTE CÓDIGO NO SQL EDITOR DO SUPABASE PARA PERMITIR AOS USUÁRIOS EXCLUÍREM SEUS PRÓPRIOS POSTS E COMENTÁRIOS

-- 1. Políticas para o Feed de Vagas e Geral (Tabela: posts)
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. Políticas para os Comentários do Feed (Tabela: post_comments)
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.post_comments;
CREATE POLICY "Users can delete their own comments" 
ON public.post_comments 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Políticas para os Comentários da Comunidade/Fórum (Tabela: community_comments)
DROP POLICY IF EXISTS "Deletar Respostas Comunidade" ON public.community_comments;
CREATE POLICY "Deletar Respostas Comunidade" 
ON public.community_comments 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Garantir que as tabelas estejam com RLS Habilitado (caso não estejam)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
