# Sistema de Notificações Push do AgendaJD

Este documento detalha o funcionamento, configuração e solução de problemas relacionados ao sistema de notificações push do AgendaJD.

## Visão Geral

O sistema de notificações push permite enviar alertas aos usuários mesmo quando não estão com o aplicativo aberto. É utilizado para notificar sobre:

- Novos eventos e atualizações de eventos
- Recados publicados no mural
- Comentários em recados
- Aniversários de membros
- Comunicados administrativos

## Arquitetura

O sistema de notificações push utiliza as seguintes tecnologias e componentes:

1. **Web Push API**: API padrão dos navegadores para envio de notificações push
2. **Service Worker**: Script que funciona em segundo plano para receber e exibir notificações
3. **VAPID Keys**: Chaves de autenticação para o servidor de push
4. **Banco de dados**: Armazena as inscrições de notificações dos usuários

### Fluxo de Funcionamento

1. **Registro do Service Worker**:
   - O arquivo `public/pwa.js` é carregado pelo navegador e registra o service worker
   - Código: `navigator.serviceWorker.register('/sw.js')`

2. **Ativação de Notificações**:
   - Usuário clica em "Ativar Notificações" no componente PushNotificationManager
   - Sistema solicita permissão do navegador: `Notification.requestPermission()`
   - Se concedida, cria uma inscrição: `registration.pushManager.subscribe()`
   - A inscrição é enviada para o servidor e armazenada no banco de dados

3. **Disparo de Notificações**:
   - Eventos do sistema (como novos recados) acionam o envio de notificações
   - O servidor recupera as inscrições dos usuários relevantes
   - Utiliza a biblioteca `web-push` para enviar a notificação para cada dispositivo

4. **Recebimento e Exibição**:
   - O service worker recebe o evento push: `self.addEventListener('push', event => {...})`
   - Extrai os dados e mostra a notificação: `self.registration.showNotification()`
   - Gerencia cliques na notificação: `self.addEventListener('notificationclick', event => {...})`

## Arquivos Principais

### 1. Service Worker (`public/sw.js`)

```javascript
// Configuração do service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker instalado com sucesso!');
  // Cache de recursos estáticos
});

// Recebimento de notificações push
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.mensagem,
      icon: '/icons/icon-192x192.png',
      data: { url: data.url || '/' }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.titulo, options)
    );
  } catch (error) {
    console.error('Erro ao processar notificação push:', error);
  }
});

// Ação ao clicar na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url;
  
  event.waitUntil(
    clients.openWindow(url)
  );
});
```

### 2. Registro PWA (`public/pwa.js`)

```javascript
// Registro do Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
      })
      .catch((error) => {
        console.log('Falha ao registrar o Service Worker:', error);
      });
  });
}
```

### 3. Componente de Gerenciamento (`PushNotificationManager.tsx`)

Este componente permite que usuários ativem ou desativem as notificações e mostra o status atual.

```typescript
export function PushNotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Verificar status atual da inscrição
  useEffect(() => {
    // Verifica se o navegador suporta notificações
    // Verifica se já existe uma inscrição
  }, []);
  
  // Habilitar/desabilitar notificações
  const handleSubscriptionToggle = async () => {
    // Solicita permissão se ainda não foi concedida
    // Cria ou remove a inscrição
    // Atualiza o banco de dados através da API
  };
  
  return (
    <div>
      <button onClick={handleSubscriptionToggle}>
        {isSubscribed ? 'Desativar Notificações' : 'Ativar Notificações'}
      </button>
    </div>
  );
}
```

### 4. API de Inscrição (`api/push/subscribe/route.ts`)

Gerencia o armazenamento e remoção de inscrições de notificações.

```typescript
// POST - Criar/atualizar inscrição
export async function POST(request: Request) {
  // Valida a autenticação
  // Extrai dados da inscrição
  // Armazena no banco de dados
}

// DELETE - Remover inscrição
export async function DELETE(request: Request) {
  // Remove inscrição do banco de dados
}
```

### 5. API de Envio (`api/push/send.ts`)

Utilitário para enviar notificações para usuários específicos ou grupos.

```typescript
export async function sendPushNotification({
  userIds,
  title,
  message,
  url
}) {
  // Busca inscrições dos usuários alvo
  // Envia notificação para cada inscrição
}
```

## Configuração

### Geração de Chaves VAPID

As chaves VAPID são essenciais para o funcionamento das notificações push. Elas identificam o servidor que está enviando as notificações.

1. **Gerar chaves**:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Configurar no arquivo `.env.local`**:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLH-...sua_chave_publica...
   VAPID_PRIVATE_KEY=nTH-...sua_chave_privada...
   VAPID_SUBJECT=mailto:contato@seudominio.com
   ```

3. **Adicionar as mesmas variáveis no ambiente de produção** (Vercel ou outro serviço)

### Uso do debug

A página `/debug` oferece ferramentas para diagnosticar problemas e testar o funcionamento das notificações:

1. **Verificação de Suporte**:
   - Mostra se o navegador suporta Service Worker e Push API
   - Exibe o status da permissão de notificações

2. **Testes**:
   - Botão para solicitar permissão explicitamente
   - Botão para enviar uma notificação de teste

3. **Detalhes de Configuração**:
   - Mostra a chave VAPID pública
   - Exibe detalhes da inscrição atual

## Resolução de Problemas

### Notificações não funcionam

1. **Verificar permissões no navegador**:
   - Chrome: chrome://settings/content/notifications
   - Firefox: about:preferences#privacy
   - Certifique-se que o site tem permissão para enviar notificações

2. **Verificar chaves VAPID**:
   - Acesse `/debug` para confirmar que a chave VAPID está configurada
   - Verifique se as variáveis de ambiente estão definidas corretamente

3. **Verificar registro do Service Worker**:
   - Chrome: chrome://serviceworker-internals/
   - Firefox: about:debugging#/runtime/this-firefox
   - Verifique se o service worker está registrado e ativo

4. **Verificar inscrição**:
   - Use a página `/debug` para ver detalhes da inscrição
   - Confirme que a inscrição existe no banco de dados (tabela PushSubscription)

5. **Verificar logs do console**:
   - Abra as ferramentas de desenvolvedor (F12)
   - Veja se há erros relacionados a notificações, service worker ou web-push

### Problemas comuns

1. **"Notificações ficam processando indefinidamente"**:
   - Possível problema com a chave VAPID pública (deve começar com `NEXT_PUBLIC_`)
   - Permissão do navegador bloqueada ou não concedida
   - Erro na conexão com o servidor de push

2. **"Service Worker não registrado"**:
   - Verificar se o arquivo `sw.js` está acessível na raiz do site
   - Certificar que o `pwa.js` está sendo carregado corretamente
   - HTTPS é obrigatório em produção (exceto em localhost)

3. **"Erro ao salvar inscrição no servidor"**:
   - Verificar se a API de inscrição está funcionando
   - Confirmar que a sessão do usuário está ativa
   - Verificar se a estrutura da inscrição está correta

## Referências

- [Web Push API (MDN)](https://developer.mozilla.org/pt-BR/docs/Web/API/Push_API)
- [Service Workers (MDN)](https://developer.mozilla.org/pt-BR/docs/Web/API/Service_Worker_API)
- [Notifications API (MDN)](https://developer.mozilla.org/pt-BR/docs/Web/API/Notifications_API)
- [web-push (NPM)](https://www.npmjs.com/package/web-push) 