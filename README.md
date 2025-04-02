# AgendaJD

Sistema de gerenciamento de agenda e comunicação para a Loja Jacques DeMolay e entidades associadas. Funcionando como um flanelógrafo digital e agenda com integração ao Google Calendar.

## Tecnologias

- Next.js
- Prisma
- PostgreSQL
- TypeScript
- NextAuth.js
- TailwindCSS

## Funcionalidades Principais

- Sistema de eventos públicos e privados
- Mural de recados
- Notificações personalizadas
- Integração com Google Calendar
- Controle de acesso baseado em hierarquia
- Sistema de aniversários

## Estrutura do Projeto

O projeto segue uma arquitetura moderna utilizando Next.js App Router, Prisma ORM para acesso ao banco de dados PostgreSQL, e implementa controles de acesso baseados em hierarquia para diferentes tipos de usuários.

Para mais detalhes sobre a modelagem do projeto, consulte o documento [agendajd-modelagem.md](agendajd-modelagem.md).

## Instalação e Execução

1. Clone o repositório
```bash
git clone https://github.com/kevinwfernandes/agendajd.git
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env` baseado no `.env.example`

4. Execute as migrações do Prisma
```bash
npm run prisma:migrate
```

5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

## Cronograma de Desenvolvimento

O desenvolvimento está planejado em 7 fases, ao longo de 12 semanas, conforme detalhado no documento de modelagem.

## Licença

Projeto desenvolvido para uso exclusivo da Loja Jacques DeMolay.
