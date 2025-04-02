# Diagrama de Entidade-Relacionamento - AgendaJD

```
┌───────────────────┐        ┌─────────────────────┐        ┌───────────────────┐
│     Usuario       │        │       Evento        │        │      Recado       │
├───────────────────┤        ├─────────────────────┤        ├───────────────────┤
│ id (PK)           │        │ id (PK)             │        │ id (PK)           │
│ nome              │◄───────┤ titulo              │        │ texto             │
│ email             │        │ descricao           │        │ data              │
│ senha             │        │ data                │        │ global            │
│ tipoUsuario       │        │ publico             │        │ classeId (FK)     │────┐
│ dataNascimento    │        │ sincGCalendar       │        │ autorId (FK)      │────┼─┐
│ telefone          │        │ classeId (FK)       │────┐   └───────────────────┘    │ │
│ foto              │        │ autorId (FK)        │────┼──┐                         │ │
│ classeId (FK)     │────┐   └─────────────────────┘    │  │                         │ │
└───────────────────┘    │                              │  │                         │ │
                         │                              │  │                         │ │
                         │   ┌─────────────────────┐    │  │                         │ │
                         └──►│       Classe        │◄───┘  │                         │ │
                             ├─────────────────────┤       │                         │ │
                             │ id (PK)             │       │                         │ │
                             │ nome                │       │                         │ │
                             │ descricao           │       │                         │ │
                             └─────────────────────┘       │                         │ │
                                                           │                         │ │
                             ┌─────────────────────┐       │                         │ │
                             │    Notificacao      │       │                         │ │
                             ├─────────────────────┤       │                         │ │
                             │ id (PK)             │       │                         │ │
                             │ titulo              │       │                         │ │
                             │ mensagem            │       │                         │ │
                             │ data                │       │                         │ │
                             │ lida                │       │                         │ │
                             │ usuarioId (FK)      │◄──────┼─────────────────────────┘ │
                             │ eventoId (FK)       │◄──────┘                           │
                             │ recadoId (FK)       │◄──────────────────────────────────┘
                             └─────────────────────┘
                                    ▲
                                    │
           ┌─────────────────────┐  │  ┌─────────────────────┐
           │   UsuarioEvento     │  │  │    Aniversario      │
           ├─────────────────────┤  │  ├─────────────────────┤
           │ id (PK)             │  │  │ id (PK)             │
           │ confirmado          │  │  │ data                │
           │ usuarioId (FK)      │──┼──┤ mensagem            │
           │ eventoId (FK)       │──┘  │ usuarioId (FK)      │
           └─────────────────────┘     └─────────────────────┘
```

## Legenda

- **PK**: Chave Primária
- **FK**: Chave Estrangeira
- **──►**: Relacionamento um para muitos
- **◄──**: Relacionamento muitos para um
- **─┼─►**: Relacionamentos múltiplos

## Entidades

### Usuario
- Armazena informações dos usuários do sistema
- Tipos: Maçom Admin Geral, Admin DM, Admin FDJ, Admin Fraterna, Maçom, Membro DM, Membro FDJ, Membro Fraterna
- Pode pertencer a uma classe específica

### Classe
- Representa as divisões organizacionais (DM, FDJ, Fraterna)
- Possui vários usuários associados
- Pode ter eventos e recados específicos

### Evento
- Representa um evento na agenda
- Pode ser público (visível para todos) ou privado (visível apenas para membros da classe e Maçons)
- Associado a uma classe específica e a um autor (usuário que criou)
- Pode ser sincronizado com Google Calendar

### Recado
- Mensagens para o mural digital
- Pode ser global (visível para todos) ou específico para uma classe
- Associado a um autor

### Notificacao
- Sistema de alertas para usuários
- Pode ser relacionada a eventos, recados ou aniversários
- Direcionada a um usuário específico

### UsuarioEvento
- Representa a confirmação de presença em eventos
- Estabelece uma relação muitos-para-muitos entre usuários e eventos

### Aniversario
- Registra aniversários de usuários
- Pode conter mensagens personalizadas
- Gera notificações automáticas

## Relacionamentos Principais

1. **Usuario-Classe**: Um usuário pertence a uma classe (opcional para Maçons)
2. **Evento-Classe**: Um evento pode estar associado a uma classe específica
3. **Evento-Autor**: Um evento é criado por um usuário (autor)
4. **Recado-Classe**: Um recado pode estar associado a uma classe específica
5. **Recado-Autor**: Um recado é criado por um usuário (autor)
6. **Usuario-Evento**: Usuários podem confirmar presença em eventos (UsuarioEvento)
7. **Notificacao-Usuario**: Notificações são direcionadas a usuários específicos
8. **Notificacao-Origem**: Notificações podem ser originadas de eventos, recados ou aniversários
9. **Aniversario-Usuario**: Aniversários são associados a usuários específicos 