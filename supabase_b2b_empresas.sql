-- Script SQL para gerar a nova tabela do Módulo de Empresas (B2B CRM)
-- Copie isso e cole no "SQL Editor" do seu Supabase Dashboard para excutar.

CREATE TABLE company_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    job_title TEXT NOT NULL,
    job_description TEXT,
    status TEXT DEFAULT 'pending' NOT NULL, -- Valores: pending (Novo), interviewing (Em negociação), approved (Fechado), archived (Lixeira)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security)
ALTER TABLE company_leads ENABLE ROW LEVEL SECURITY;

-- Política 1: PERMITE QUALQUER UM INSERIR (Visitantes da Landing Page Pública de Vendas precisam registrar Leads sem estar logados)
CREATE POLICY "Allow public insert on company_leads" 
ON company_leads FOR INSERT 
TO public 
WITH CHECK (true);

-- Política 2: APENAS ADMINS logados (ou dono do banco) PODEM VER, ATUALIZAR, APAGAR
CREATE POLICY "Allow select for authenticated admins" 
ON company_leads FOR SELECT 
TO authenticated 
USING (true); 

CREATE POLICY "Allow update for authenticated admins" 
ON company_leads FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow delete for authenticated admins" 
ON company_leads FOR DELETE 
TO authenticated 
USING (true);

-- --- PARTE 2: MAPEAMENTO DE CANDIDATURAS B2B "ANTI-GUPY" ---
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' NOT NULL, -- Valores: pending, interviewing, approved, rejected
    feedback TEXT, -- Para a regra "Fim do Vácuo" (Feedback obrigatório se rejeitado)
    match_score INTEGER DEFAULT 0, -- Porcentagem de similaridade calculada via Edge Function ou no lado do Cliente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, applicant_id) -- Impede que a pessoa aplique 2x para a mesma vaga
);

-- Ativar RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Autor pode aplicar pra vagas ou ver as que aplicou
CREATE POLICY "Users can insert their own applications" 
ON job_applications FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can read their own applications" 
ON job_applications FOR SELECT 
TO authenticated 
USING (auth.uid() = applicant_id);

-- Admins / Empresas autorizadas podem ler, atualizar (dar match e feedback)
CREATE POLICY "Admins can manage all applications" 
ON job_applications FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'coordination')
  )
);

