# Modelagem Completa: AgendaJD

## 1. Visão Geral do Projeto

O AgendaJD é um aplicativo para a Loja Jacques DeMolay e entidades associadas, funcionando como um flanelógrafo digital e agenda com integração ao Google Calendar. O sistema gerencia eventos, recados e notificações, respeitando uma estrutura hierárquica de acesso.

## 2. Estrutura de Classes e Acesso

### Níveis de Acesso:
- **Maçom Admin Geral**: Acesso total a todas as funcionalidades e classes
- **Admin DM**: Acesso total à classe DM e eventos públicos de todas as classes
- **Admin FDJ**: Acesso total à classe FDJ e eventos públicos de todas as classes
- **Admin Fraterna**: Acesso total à classe Fraterna e eventos públicos de todas as classes
- **Usuários Comuns**:
  - **Maçom** (não admin): Acesso a todas as classes, incluindo eventos privados e públicos
  - **DM, FDJ e Fraterna**: Acesso aos eventos e notificações da própria classe e aos eventos públicos de todas as classes

## 3. Diagrama de Entidades (ER)

### Entidades Principais:
- **Usuário**: Armazena dados dos usuários, seu tipo e classe associada
- **Classe**: Representa as diferentes classes (DM, FDJ, Fraterna)
- **Evento**: Registro de eventos com indicador público/privado
- **Recado**: Mensagens para o mural digital
- **Notificação**: Sistema de avisos para usuários
- **UsuarioEvento**: Relação de confirmação de presença em eventos
- **Aniversário**: Registro de aniversários com mensagens

### Relações:
- Um usuário pertence a uma classe
- Eventos podem ser associados a uma classe
- Recados podem ser globais ou associados a uma classe
- Notificações são associadas a usuários e podem referenciar eventos ou recados
- Usuários podem confirmar presença em eventos

## 4. Modelagem do Banco de Dados

### Enums:
- **TipoUsuario**: MACOM_ADMIN_GERAL, ADMIN_DM, ADMIN_FDJ, ADMIN_FRATERNA, MACOM, MEMBRO_DM, MEMBRO_FDJ, MEMBRO_FRATERNA

### Modelos:
1. **Classe**:
   - id, nome, descricao
   - Relações: usuários, eventos, recados
   
2. **Usuario**:
   - id, nome, email, senha, tipoUsuario, dataNascimento, telefone, foto
   - Relações: classe, eventosAutor, recados, notificacoes, aniversarios, usuarioEventos
   
3. **Evento**:
   - id, titulo, descricao, data, publico, sincGCalendar
   - Relações: classe, autor, notificacoes, usuarioEventos
   
4. **Recado**:
   - id, texto, data, global
   - Relações: classe, autor, notificacoes
   
5. **Notificacao**:
   - id, titulo, mensagem, data, lida
   - Relações: usuario, evento, recado
   
6. **UsuarioEvento**:
   - id, confirmado
   - Relações: usuario, evento
   
7. **Aniversario**:
   - id, data, mensagem
   - Relações: usuario

## 5. Casos de Uso

### Caso de Uso 1: Cadastro de Evento
- **Ator Principal**: Administradores
- **Entradas**: Título, descrição, data/horário, tipo (público/privado), classe relacionada, opção de sincronização
- **Processos**: Validação, verificação de tipo, sincronização com Google Calendar, salvamento
- **Saídas**: Evento criado, notificações enviadas, calendário atualizado

### Caso de Uso 2: Notificação de Aniversário
- **Ator Principal**: Sistema
- **Entradas**: Data atual, lista de aniversariantes
- **Processos**: Verificação de aniversariantes, geração de notificações, mensagem personalizada
- **Saídas**: Notificações enviadas

### Caso de Uso 3: Sincronização com Google Calendar
- **Ator Principal**: Usuário
- **Entradas**: Evento selecionado, autorização Google
- **Processos**: Autenticação OAuth, sincronização via API, atualização de status
- **Saídas**: Evento sincronizado, confirmação ao usuário

### Caso de Uso 4: Notificação de Eventos
- **Ator Principal**: Sistema
- **Entradas**: Data atual, eventos ativos, classes associadas
- **Processos**: Filtragem de eventos, geração de notificações
- **Saídas**: Notificações enviadas aos usuários corretos

### Caso de Uso 5: Gerenciamento de Recados
- **Ator Principal**: Administradores
- **Entradas**: Texto, classe relacionada, tipo de recado
- **Processos**: Validação, verificação de classe, salvamento, notificações
- **Saídas**: Recado exibido, notificações enviadas

### Caso de Uso 6: Visualização do Calendário
- **Ator Principal**: Usuário
- **Entradas**: Classe do usuário, data de visualização
- **Processos**: Filtragem de eventos, renderização
- **Saídas**: Calendário exibido com eventos filtrados

## 6. Passo a Passo de Implementação

### Fase 1: Configuração Inicial
1. Configurar o projeto Next.js
2. Configurar o Prisma com PostgreSQL
3. Estruturação de pastas

### Fase 2: Autenticação e Controle de Acesso
1. Implementar sistema de autenticação
2. Desenvolver middleware de autorização

### Fase 3: Implementação de Recursos Básicos
1. Gerenciamento de Usuários
2. Sistema de Eventos
3. Mural de Recados

### Fase 4: Recursos Avançados
1. Sistema de Notificações
2. Integração com Google Calendar
3. Sistema de Aniversários

### Fase 5: Interface de Usuário
1. Layout responsivo
2. Calendário Interativo
3. Painel de Administração

### Fase 6: Testes e Otimização
1. Testes unitários e de integração
2. Otimização de Performance

### Fase 7: Deploy e Monitoramento
1. Configuração do Deploy na Vercel
2. Monitoramento e Analytics

## 7. Controle de Acesso - Regras

### Regras Gerais:
- **Eventos Públicos**: Visíveis para todos (aniversários, festas, reuniões abertas)
- **Eventos Privados**: Visíveis apenas para membros da classe e Maçons
- **Notificações**:
  - Eventos públicos: Notificar todos os usuários
  - Eventos privados: Notificar membros da classe e Maçons

### Regras por Função:
1. **Maçom Admin Geral**:
   - Acesso total a todas as funcionalidades
   - Pode criar/editar/excluir qualquer evento ou recado
   - Visualiza todos os eventos (públicos e privados)

2. **Admin DM/FDJ/Fraterna**:
   - Gerencia apenas sua própria classe
   - Visualiza eventos públicos de todas as classes
   - Visualiza eventos privados apenas de sua classe

3. **Maçom (não admin)**:
   - Visualiza todos os eventos (públicos e privados)
   - Não pode gerenciar eventos ou recados

4. **Membros DM/FDJ/Fraterna**:
   - Visualiza eventos da própria classe
   - Visualiza eventos públicos de todas as classes
   - Não pode gerenciar eventos ou recados

## 8. Deploy no Vercel

### Configuração do Projeto para Deploy:
1. Configurar variáveis de ambiente
2. Configurar build e deploy
3. Configuração do Prisma
4. Configurar integração contínua

## 9. Cronograma de Implementação

1. **Semana 1-2**: Configuração e Autenticação
2. **Semana 3-4**: Implementação de Recursos Básicos
3. **Semana 5-6**: Sistema de Notificações e Permissões
4. **Semana 7-8**: Integração com Google Calendar e UI
5. **Semana 9-10**: Testes e Otimização
6. **Semana 11-12**: Deploy e Finalização

## 10. Considerações Finais

Este projeto é um sistema completo para gerenciamento de agenda e comunicação entre diferentes classes de usuários da Loja Jacques DeMolay. A implementação seguirá as melhores práticas de desenvolvimento, com foco em:

1. **Segurança**: Controle de acesso rigoroso e autenticação segura
2. **Performance**: Otimização de consultas e uso de caching
3. **Experiência do Usuário**: Interface intuitiva e responsiva
4. **Escalabilidade**: Arquitetura que permite crescimento futuro
5. **Manutenibilidade**: Código limpo e bem documentado

O sistema permitirá uma comunicação eficiente entre todos os membros, com respeito às hierarquias e privacidades necessárias, servindo como um flanelógrafo digital e agenda integrada para a organização. 