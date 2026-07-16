# Alumni ReGISS

**Ecossistema digital para relacionamento entre residentes, egressos, coordenações e empresas.**

> Status: MVP de portfólio em evolução. Não representa uma plataforma institucional oficialmente implantada.

## Visão geral

O Alumni ReGISS foi criado para explorar uma necessidade comum aos programas de residência: manter uma rede ativa após a conclusão da formação e transformar vínculos dispersos em oportunidades de colaboração, carreira e aprendizagem contínua.

A proposta combina comunidade, networking, trajetória profissional, vagas, eventos, conteúdos e áreas específicas para coordenação e empresas.

## Problema abordado

Após o encerramento de uma residência, contatos e experiências tendem a ficar distribuídos entre grupos informais e redes genéricas. Isso dificulta:

- localizar profissionais com interesses semelhantes;
- acompanhar trajetórias de egressos;
- divulgar oportunidades qualificadas;
- organizar eventos e comunidades;
- manter o relacionamento institucional;
- gerar inteligência sobre a rede alumni.

## Solução proposta

### Para residentes e egressos

- autenticação e onboarding;
- feed de publicações;
- busca e descoberta de profissionais;
- perfil e trajetória;
- networking;
- vagas;
- eventos;
- insights e conteúdos;
- comunidades;
- notificações.

### Para coordenações

- área específica de coordenação;
- visão da comunidade;
- apoio à comunicação e ao relacionamento com egressos.

### Para empresas

- página institucional;
- painel para empresas;
- conexão com profissionais e oportunidades.

### Para administração

- painel administrativo;
- gestão de usuários e estrutura da plataforma.

## Tecnologias

- React;
- TypeScript;
- Vite;
- Supabase;
- React Router;
- Zustand;
- Framer Motion;
- Tailwind CSS;
- PWA;
- notificações de interface com Sonner.

## Arquitetura conceitual

```text
Autenticação Supabase
        ↓
Perfil e papel do usuário
        ↓
Feed, rede, vagas, eventos e comunidades
        ↓
Interações e notificações
        ↓
Coordenação, empresas e administração
```

## Minha atuação

- concepção do produto;
- definição dos públicos e jornadas;
- modelagem inicial de perfis e relacionamentos;
- desenvolvimento frontend;
- integração com Supabase;
- organização das rotas e regras de acesso;
- criação das experiências de comunidade, carreira e gestão;
- evolução do MVP e documentação.

## Diferenciais do projeto

- nasce de um problema real de relacionamento pós-residência;
- reúne públicos diferentes em uma única arquitetura;
- combina comunidade e carreira;
- demonstra visão de produto além da implementação técnica;
- permite evolução para análises da rede e parcerias institucionais.

## Execução local

```bash
git clone https://github.com/Gustavovanci/alumni_ReGISS.git
cd alumni_ReGISS
npm install
npm run dev
```

É necessário configurar um projeto Supabase próprio. Variáveis reais não devem ser publicadas no repositório.

## Privacidade e segurança

- utilize usuários e dados fictícios na demonstração pública;
- não publique bases de residentes ou egressos;
- aplique Row Level Security no Supabase;
- valide permissões por papel no backend;
- proteja informações de contato;
- documente consentimento e finalidade de uso antes de um piloto real.

## Próximos passos

- documentar o modelo de dados;
- ampliar testes e validações de acesso;
- aprimorar mensagens e notificações em tempo real;
- criar moderação e denúncia de conteúdo;
- publicar demonstração com dados sintéticos;
- realizar testes de usabilidade com egressos e coordenações;
- definir métricas de ativação, retenção e conexão.
