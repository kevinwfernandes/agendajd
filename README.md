# 📅 AgendaJD - Sistema de Agenda e Mural para Loja Jacques DeMolay

Este é um sistema completo para gerenciamento de eventos, recados e notificações, desenvolvido especificamente para a Loja Jacques DeMolay.

## 🌟 Funcionalidades Principais

- **🗓️ Calendário de Eventos**: Visualização e gerenciamento de eventos
- **📝 Mural de Recados**: Sistema de comunicação com comentários
- **🔔 Notificações Push**: Alertas para eventos e recados
- **👤 Gestão de Usuários**: Diferentes níveis de acesso por tipo de usuário
- **🏛️ Sistema de Classes**: Organização por grupos e classes
- **📱 Interface Responsiva**: Compatível com desktop e dispositivos móveis

## 🛠️ Tecnologias Utilizadas

- **Next.js 15**: Framework React com App Router
- **TypeScript**: Para tipagem estática
- **Prisma ORM**: Para acesso ao banco de dados
- **PostgreSQL**: Banco de dados relacional
- **NextAuth.js**: Autenticação e gerenciamento de sessões
- **TailwindCSS**: Framework CSS para estilização
- **Web Push**: Sistema de notificações push

## 📁 Estrutura do Projeto

```
/src
  /app                   # Rotas e páginas (App Router)
    /api                 # APIs e endpoints
      /auth              # Autenticação
      /eventos           # API de eventos
      /recados           # API de recados
      /push              # API de notificações push
      /usuarios          # API de usuários
      /classes           # API de classes
    /calendario          # Página de calendário
    /recados             # Página de mural de recados
    /perfil              # Página de perfil do usuário
    /admin               # Páginas de administração
    /debug               # Página de diagnóstico (desenvolvimento)
  
  /components            # Componentes reutilizáveis
    Navbar.tsx           # Barra de navegação
    Calendar.tsx         # Componente de calendário
    EventModal.tsx       # Modal de criação/edição de eventos
    PushNotificationManager.tsx # Gerenciador de notificações push
    NotificacoesDropdown.tsx # Dropdown de notificações
    
  /lib                   # Bibliotecas e utilidades
    auth.ts              # Configuração de autenticação
    
/prisma                  # Configuração do Prisma ORM
  schema.prisma          # Schema do banco de dados
  
/public                  # Arquivos estáticos
  sw.js                  # Service Worker para notificações push
  pwa.js                 # Configuração de PWA (Progressive Web App)
  
/.env.local              # Variáveis de ambiente (não versionado)
```

## 💽 Modelos de Dados

### Usuários e Autenticação
- **User**: Usuários do sistema
- **Account**: Contas vinculadas (NextAuth)
- **Session**: Sessões ativas (NextAuth)
- **VerificationToken**: Tokens de verificação (NextAuth)

### Conteúdo
- **Evento**: Eventos do calendário
- **Recado**: Recados no mural
- **ComentarioRecado**: Comentários em recados

### Organização
- **Classe**: Classes ou grupos organizacionais

### Notificações
- **Notificacao**: Notificações do sistema
- **PushSubscription**: Inscrições de notificações push
- **Aniversario**: Registro de aniversários

## 🔐 Controle de Acesso

O sistema possui diferentes níveis de acesso:

- **Administrador Geral (MACOM_ADMIN_GERAL)**: Acesso total ao sistema
- **Administradores por Área**: ADMIN_DM, ADMIN_FDJ, ADMIN_FRATERNA
- **Membros Comuns**: MACOM, MEMBRO_DM, MEMBRO_FDJ, MEMBRO_FRATERNA

## 🔔 Sistema de Notificações

### Como Funciona

1. **Registro**:
   - Usuários se registram para receber notificações na página de perfil
   - O sistema armazena a inscrição no banco de dados (tabela PushSubscription)

2. **Disparo**:
   - Notificações são enviadas quando:
     - Eventos estão prestes a acontecer
     - Novos recados são publicados
     - Comentários são adicionados em recados
     - Aniversários de membros

3. **Entrega**:
   - O service worker (sw.js) recebe e exibe as notificações
   - Cliques nas notificações direcionam o usuário para a página relevante

### Configuração

Para habilitar as notificações push, é necessário configurar:

1. **Variáveis de ambiente**:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica
   VAPID_PRIVATE_KEY=sua_chave_privada
   VAPID_SUBJECT=mailto:seu_email@exemplo.com
   ```

2. **Gerar chaves VAPID**:
   ```bash
   npx web-push generate-vapid-keys
   ```

## 📋 API Endpoints

### Eventos
- `GET /api/eventos`: Listar eventos
- `POST /api/eventos`: Criar evento
- `PUT /api/eventos/:id`: Atualizar evento
- `DELETE /api/eventos/:id`: Excluir evento

### Recados
- `GET /api/recados`: Listar recados
- `POST /api/recados`: Criar recado
- `POST /api/recados/:id/comentarios`: Adicionar comentário

### Usuários
- `GET /api/usuarios`: Listar usuários (admin)
- `GET /api/usuarios/:id`: Obter usuário
- `PATCH /api/usuarios/editar-proprio-perfil`: Editar próprio perfil

### Notificações Push
- `POST /api/push/subscribe`: Inscrever para notificações
- `DELETE /api/push/subscribe`: Cancelar inscrição
- `GET /api/push/test`: Testar envio de notificação (apenas para desenvolvimento)

## 💻 Como Executar

### Pré-requisitos
- Node.js 18 ou superior
- PostgreSQL

### Configuração
1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o banco de dados no arquivo `.env.local`:
   ```
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/agendajd"
   ```
4. Configure o NextAuth:
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=sua_chave_secreta
   ```
5. Configure as chaves VAPID:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica
   VAPID_PRIVATE_KEY=sua_chave_privada
   VAPID_SUBJECT=mailto:seu_email@exemplo.com
   ```
6. Execute as migrações do Prisma:
   ```bash
   npx prisma migrate dev
   ```

### Execução em Desenvolvimento
```bash
npm run dev
```

### Build para Produção
```bash
npm run build
npm start
```

## 🔍 Depuração

### Página de Debug
O sistema inclui uma página de debug em `/debug` que permite:
- Verificar o status do service worker
- Ver detalhes da configuração de notificações push
- Testar o envio de notificações
- Solicitar permissões explicitamente

### Logs
Os componentes incluem logs detalhados que podem ser visualizados no console do navegador:
- Service Worker: `console.log('Service Worker instalado com sucesso!')`
- Componente de Notificações: `console.log('Inscrição salva com sucesso no servidor')`

## 📱 PWA (Progressive Web App)

O sistema pode ser instalado como um aplicativo nos dispositivos dos usuários através dos recursos de PWA:
- Service Worker para funcionamento offline
- Manifesto para instalação como aplicativo
- Ícones e splash screens

## 👨‍💻 Desenvolvimento Contínuo

Para desenvolvedores trabalhando no projeto:
- Use `npm run dev` para iniciar o servidor de desenvolvimento
- Acesse a página `/debug` para testar notificações
- Utilize o console do navegador para ver os logs detalhados
