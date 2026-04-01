// Service Worker optimizado para caching de fotos y assets
// Estrategia: Cache First para imágenes, Network First para HTML/JSON
const CACHE_VERSION = 'elite-de-dios-v3';
const IMAGES_CACHE = 'elite-fotos-cache-v2';
const PERFILES_CACHE = 'elite-perfiles-cache-v1';
const ASSETS_CACHE = 'elite-assets-cache-v2';

// Pre-cachear archivos esenciales
const precacheAssets = [
  '../assets/data/fotos.json',
  '../assets/css/fotos.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) => {
      console.log('📦 Pre-cacheando assets essenciales');
      return cache.addAll(precacheAssets).catch(err => {
        console.warn('⚠️ Error pre-cacheando algunos assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Mantener solo los caches actuales
          if (cacheName !== CACHE_VERSION && 
              cacheName !== IMAGES_CACHE &&
              cacheName !== PERFILES_CACHE &&
              cacheName !== ASSETS_CACHE) {
            console.log('🗑️ Borrando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  // Mensaje para forzar salto inmediato del Service Worker
  if (event.data.type === 'SKIP_WAITING') {
    console.log('⚡ SKIP_WAITING recibido - activando nueva versión del Service Worker');
    self.skipWaiting();
  }
  
  if (event.data.type === 'PRECACHE_IMAGES') {
    console.log('🖼️ Iniciando pre-carga de imágenes...');
    // Pre-cargar imágenes en segundo plano
    precacheImages(event.data.images);
  }
});

/**
 * Pre-cachea un array de imágenes en background
 * @param {Array<string>} imageUrls - URLs de las imágenes
 */
async function precacheImages(imageUrls) {
  try {
    const cache = await caches.open(IMAGES_CACHE);
    for (const url of imageUrls) {
      try {
        const response = await fetch(url);
        if (response && response.status === 200) {
          await cache.put(url, response.clone());
          console.log(`✅ Pre-cacheada: ${url}`);
        }
      } catch (err) {
        console.warn(`⚠️ Error pre-cacheando ${url}:`, err);
      }
    }
  } catch (error) {
    console.error('❌ Error abriendo cache para pre-cacheador:', error);
  }
}


self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Solo cachear GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // ESTRATEGIA 1: IMÁGENES - Cache First (usar cache, actualizar en background)
  if (url.pathname.includes('/fotos-actividades/')) {
    event.respondWith(
      caches.open(IMAGES_CACHE).then((cache) => {
        // Primero buscar en cache
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log(`✅ Imagen servida desde CACHE: ${url.pathname}`);
            // Actualizar en background silenciosamente
            updateImageInCache(event.request, cache);
            return cachedResponse;
          }
          
          // Si no está en cache, descargar
          console.log(`📥 Descargando imagen (no en cache): ${url.pathname}`);
          return fetch(event.request).then((response) => {
            // Validar respuesta
            if (!response || response.status !== 200 || response.type === 'error') {
              console.warn(`⚠️ Respuesta inválida para ${url.pathname}: ${response?.status}`);
              return response;
            }
            
            // Guardar en cache para futuras solicitudes
            const responseToCache = response.clone();
            cache.put(event.request, responseToCache).then(() => {
              console.log(`💾 Imagen cacheada: ${url.pathname}`);
            });
            
            return response;
          }).catch((error) => {
            console.warn(`❌ Error descargando imagen: ${url.pathname}`, error);
            // En caso de error, intenta buscar en cache nuevamente
            return cache.match(event.request).then((fallbackResponse) => {
              return fallbackResponse || responses.placeholderImage();
            });
          });
        });
      })
    );
  }
  
  // ESTRATEGIA 1.5: FOTOS DE PERFIL - Cache First (elite-perfiles-cache-v1)
  if (url.pathname.includes('/assets/img/perfiles/')) {
    event.respondWith(
      caches.open(PERFILES_CACHE).then((cache) => {
        // Normalizar URL sin timestamp para buscar en caché
        const urlSinTimestamp = event.request.url.split('?')[0];
        const requestSinTimestamp = new Request(urlSinTimestamp);
        
        // Primero buscar en cache (sin timestamp)
        return cache.match(requestSinTimestamp).then((cachedResponse) => {
          if (cachedResponse) {
            console.log(`⚡ Foto de perfil desde CACHE: ${url.pathname.split('/').pop()}`);
            // Actualizar en background con URL fresca (con timestamp)
            updateImageInCache(event.request, cache, requestSinTimestamp);
            return cachedResponse;
          }
          
          // Si no está en cache, descargar versión fresca del servidor
          console.log(`📥 Descargando foto de perfil: ${url.pathname.split('/').pop()}`);
          return fetch(requestSinTimestamp).then((response) => {
            // Validar respuesta
            if (!response || response.status !== 200 || response.type === 'error') {
              console.warn(`⚠️ Respuesta inválida para foto: ${url.pathname}`);
              return response;
            }
            
            // Guardar en cache sin timestamp para futuras solicitudes
            const responseToCache = response.clone();
            cache.put(requestSinTimestamp, responseToCache).then(() => {
              console.log(`💾 Foto de perfil cacheada: ${url.pathname.split('/').pop()}`);
            });
            
            return response;
          }).catch((error) => {
            console.warn(`❌ Error descargando foto de perfil: ${url.pathname}`, error);
            // En caso de error, intenta buscar en cache nuevamente
            return cache.match(requestSinTimestamp).then((fallbackResponse) => {
              return fallbackResponse || responses.placeholderImage();
            });
          });
        });
      })
    );
    return;
  }
  
  // ESTRATEGIA 2: JSON y datos - Network First
  if (url.pathname.includes('/assets/data/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(ASSETS_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // ESTRATEGIA 3: CSS y JS - Network First
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(ASSETS_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
});

/**
 * Actualiza una imagen en cache en background
 * @param {Request} request - Request de la imagen (con timestamp)
 * @param {Cache} cache - Cache storage
 * @param {Request} requestSinTimestamp - Request normalizado (opcional, sin timestamp)
 */
async function updateImageInCache(request, cache, requestSinTimestamp) {
  try {
    // Usar request sin timestamp para actualizar caché
    const requestAActualizar = requestSinTimestamp || request;
    
    // Fetch desde red (usar caché HTTP normal para actualización rápida)
    const response = await fetch(requestAActualizar, {
      cache: 'default'
    });
    
    if (response && response.status === 200) {
      await cache.put(requestAActualizar, response.clone());
      console.log(`🔄 Foto actualizada en cache: ${requestAActualizar.url.split('/').pop()}`);
    }
  } catch (err) {
    console.warn('⚠️ Error actualizando imagen en cache:', err);
  }
}

/**
 * Objeto con respuestas predefinidas
 */
const responses = {
  placeholderImage: () => {
    // Retornar una imagen placeholder en SVG
    const svgBlob = new Blob([`
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
        <rect width="300" height="300" fill="#e6b325"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-size="16" fill="white" font-family="Arial">
          Sin conexión - Imagen no disponible
        </text>
      </svg>
    `], { type: 'image/svg+xml' });
    
    return new Response(svgBlob, {
      headers: { 'Content-Type': 'image/svg+xml' },
      status: 200
    });
  }
};
