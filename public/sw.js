/**
 * Service Worker para AgendaJD
 * 
 * Este service worker é responsável por:
 * 1. Armazenar em cache recursos estáticos para funcionamento offline
 * 2. Receber e exibir notificações push
 * 3. Gerenciar cliques em notificações
 * 
 * Ele permanece ativo mesmo quando o usuário não está com a aplicação aberta,
 * o que permite o funcionamento das notificações push.
 */

// Nome do cache para armazenar recursos estáticos
const CACHE_NAME = 'agendajd-v1';

// Lista de recursos que serão armazenados em cache durante a instalação
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

/**
 * Evento de instalação do service worker
 * 
 * Este evento é disparado quando o service worker é instalado pela primeira vez
 * ou quando é atualizado. Usamos para pré-armazenar recursos essenciais.
 */
self.addEventListener('install', (event) => {
  // Força o service worker a ativar imediatamente, sem esperar que as abas sejam fechadas
  self.skipWaiting();
  console.log('Service Worker instalado com sucesso!');
  
  // Armazena recursos essenciais em cache
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache aberto com sucesso');
      return cache.addAll(urlsToCache);
    })
  );
});

/**
 * Evento de requisição (fetch)
 * 
 * Este evento é disparado para cada requisição feita pela aplicação.
 * Implementamos uma estratégia "Cache First", verificando primeiro se o recurso
 * está em cache antes de buscar na rede.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - retorna a resposta do cache
      if (response) {
        return response;
      }

      // Se não estiver em cache, busca na rede
      return fetch(event.request).then((response) => {
        // Verifica se a resposta é válida para ser armazenada em cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clona a resposta (Streams só podem ser lidos uma vez)
        const responseToCache = response.clone();

        // Armazena a resposta no cache para uso futuro
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

/**
 * Evento de ativação do service worker
 * 
 * Este evento é disparado quando o service worker é ativado.
 * Usamos para limpar caches antigos e assumir o controle de todas as páginas.
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado com sucesso!');
  
  // Lista de caches que devem ser mantidos (apenas o atual)
  const cacheWhitelist = [CACHE_NAME];
  
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Encontrou um cache antigo, exclui
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Assume o controle de todas as páginas abertas
  return self.clients.claim();
});

/**
 * Evento de notificação push
 * 
 * Este evento é disparado quando o servidor envia uma notificação push.
 * Extraímos os dados da notificação e exibimos para o usuário.
 */
self.addEventListener('push', (event) => {
  // Se não houver dados, retorna sem fazer nada
  if (!event.data) {
    console.log('Push recebido, mas sem dados.');
    return;
  }
  
  try {
    // Converte os dados recebidos para JSON
    const data = event.data.json();
    
    // Configura as opções da notificação
    const options = {
      body: data.mensagem,
      icon: '/icons/icon-192x192.png',  // Ícone principal
      badge: '/icons/badge-72x72.png',  // Ícone menor para dispositivos móveis
      vibrate: [100, 50, 100],  // Padrão de vibração: 100ms vibra, 50ms para, 100ms vibra
      data: {
        url: data.url || '/'  // URL para abrir quando a notificação for clicada
      }
    };
    
    // Exibe a notificação para o usuário
    event.waitUntil(
      self.registration.showNotification(data.titulo, options)
    );
  } catch (error) {
    console.error('Erro ao processar notificação push:', error);
  }
});

/**
 * Evento de clique em notificação
 * 
 * Este evento é disparado quando o usuário clica em uma notificação.
 * Normalmente, redireciona o usuário para uma URL específica.
 */
self.addEventListener('notificationclick', (event) => {
  // Fecha a notificação clicada
  event.notification.close();
  
  // Obtém a URL a ser aberta (definida nos dados da notificação)
  const url = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Verifica se já existe uma janela aberta e foca nela
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não houver janela aberta, abre uma nova
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
}); 