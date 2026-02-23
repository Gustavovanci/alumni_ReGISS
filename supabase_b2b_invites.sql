-- --- FASE 12: CÓDIGOS DE ACESSO PARA EMPRESAS ---

CREATE TABLE IF NOT EXISTS company_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- Valores: pending, used
    used_by UUID, -- Armazenará o ID do perfil da empresa após o cadastro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE company_invites ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar os convites gerados
CREATE POLICY "Admins can manage invites" 
ON company_invites FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin')
  )
);

-- Qualquer um não autenticado pode ler os convites PENDENTES (Para validar no /company-register)
CREATE POLICY "Public can read pending invites" 
ON company_invites FOR SELECT 
TO public
USING (status = 'pending');
