// Service Worker for Push Notifications
// Place this file in public/sw.js

const CACHE_NAME = 'mnbara-v1';
const OFFLINE_URL = '/offline.html';

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/icons/notification-icon.png',
        '/icons/badge-icon.png',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'Mnbara',
    body: 'You have a new notification',
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    tag: 'default',
    data: {},
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: getActionsForType(data.data?.type),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event.action);
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  // Handle action clicks
  if (event.action === 'view') {
    url = data.link || '/';
  } else if (event.action === 'reply') {
    url = `/chat/${data.conversationId}`;
  } else if (event.action === 'bid') {
    url = `/auctions/${data.auctionId}`;
  } else if (data.link) {
    url = data.link;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
  // Track notification dismissal if needed
});

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync', event.tag);
  
  if (event.tag === 'send-messages') {
    event.waitUntil(sendPendingMessages());
  }
});

// Helper function to get actions based on notification type
function getActionsForType(type) {
  const actionsMap = {
    new_message: [
      { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
      { action: 'view', title: 'View', icon: '/icons/view.png' },
    ],
    bid_outbid: [
      { action: 'bid', title: 'Bid Again', icon: '/icons/bid.png' },
      { action: 'view', title: 'View Auction', icon: '/icons/view.png' },
    ],
    order_update: [
      { action: 'view', title: 'Track Order', icon: '/icons/track.png' },
    ],
    auction_ending: [
      { action: 'bid', title: 'Place Bid', icon: '/icons/bid.png' },
    ],
  };

  return actionsMap[type] || [
    { action: 'view', title: 'View', icon: '/icons/view.png' },
  ];
}

// Send pending offline messages
async function sendPendingMessages() {
  // Implementation for offline message queue
  console.log('[SW] Sending pending messages');
}

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});
