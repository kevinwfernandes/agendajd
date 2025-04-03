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

## Classes predefinidas

O sistema possui as seguintes classes predefinidas para eventos:

1. **Sessão Maçônica** - Visível apenas para Maçons (admins e membros regulares)
2. **Reunião DeMolay** - Visível para DeMolays e Maçons (admins ou não)
3. **Reunião FDJ** - Visível para Filhas de Jó e Maçons (admins ou não)
4. **Reunião Fraterna** - Visível para Fraternas e Maçons (admins ou não)

Eventos marcados como "públicos" são visíveis para todos os usuários, independentemente de sua classe.

## Scripts do projeto

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Constrói o projeto para produção (inclui seed das classes e criação do admin)
- `npm run start` - Inicia o servidor em modo de produção
- `npm run seed` - Insere as classes predefinidas e o usuário administrador no banco de dados
- `npm run prisma:migrate` - Executa migrações do Prisma em ambiente de desenvolvimento
- `npm run prisma:deploy` - Executa migrações do Prisma em ambiente de produção
- `npm run prisma:studio` - Abre o Prisma Studio para visualizar o banco de dados

## Deploy na Vercel com Banco de Dados Neon (Gratuito)

### 1. Configurar o Banco de Dados Neon

1. Crie uma conta no [Neon](https://neon.tech/)
2. Crie um novo projeto no Neon
3. Na tela do projeto, clique em "Connection Details" e copie a string de conexão
4. A string de conexão será semelhante a `postgres://user:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb`

### 2. Configurar o Projeto na Vercel

1. Faça o fork deste repositório no GitHub
2. Acesse [Vercel](https://vercel.com/) e crie uma conta (ou faça login)
3. Clique em "Add New Project" e importe o repositório do GitHub
4. Na seção de configuração do projeto, adicione as seguintes variáveis de ambiente:

   ```
   DATABASE_URL=sua_string_de_conexao_neon
   NEXTAUTH_URL=sua_url_de_producao (ex: https://agendajd.vercel.app)
   NEXTAUTH_SECRET=gere_um_valor_aleatorio_longo
   ADMIN_EMAIL=email_do_administrador
   ADMIN_PASSWORD=senha_do_administrador (será alterada após o primeiro login)
   ADMIN_NAME=Nome do Administrador Geral
   VAPID_PUBLIC_KEY=sua_chave_publica_vapid
   VAPID_PRIVATE_KEY=sua_chave_privada_vapid
   ```

5. Clique em "Deploy"

### 3. Gerando Chaves VAPID para Notificações

Para gerar as chaves VAPID necessárias para as notificações push, execute este comando antes do deploy:

```bash
npx web-push generate-vapid-keys
```

Copie as chaves pública e privada geradas para as variáveis de ambiente `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY`.

### 4. Primeiro Acesso

Após o deploy, o sistema já estará configurado com:

1. Um usuário administrador com as credenciais definidas nas variáveis de ambiente
2. As classes predefinidas para os eventos
3. Todas as configurações necessárias para o funcionamento do sistema

Para acessar o sistema, use o email e senha definidos nas variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

**Importante:** Altere a senha do administrador após o primeiro login por motivos de segurança.

## Desenvolvimento

Para começar o desenvolvimento:

1. Clone o repositório
2. Instale as dependências com `npm install`
3. Configure as variáveis de ambiente no arquivo `.env.local`
4. Execute `npm run prisma:migrate` para criar o banco de dados
5. Execute `npm run dev` para iniciar o servidor de desenvolvimento

## Solução de Problemas

### Classes não aparecem no seletor

Execute manualmente:
```
npm run seed
```

### Problemas com o banco de dados

Verifique a conexão com:
```
npx prisma db push
```

Para visualizar o banco de dados:
```
npx prisma studio
```
