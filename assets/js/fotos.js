// Variables globales para el control del slideshow
let photos = [];
let currentPhotoIndex = 0;
let slideshowInterval;
let isPlaying = true;

// Variables para optimización de conexión
let connectionType = 'unknown';
let isSlowConnection = false;
let imageLoadingProgress = new Map();
let preloadQueue = [];

// Variables para optimización de cache
let cacheProgress = 0;
let totalPhotosToPrecache = 0;
let photosPreloaded = new Set();

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log('📋 DOM cargado - iniciando aplicación');
    // Animación de entrada
    document.body.classList.remove("fade-out");
    document.body.classList.add("fade-in");

    // Detectar tipo de conexión
    detectConnectionType();
    
    // Cargar fotos
    loadPhotos();
});

/**
 * Detecta el tipo de conexión del dispositivo
 */
function detectConnectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
        console.log('📡 Detección de conexión no disponible - asumiendo conexión normal');
        isSlowConnection = false;
        return;
    }

    connectionType = connection.effectiveType || 'unknown'; // '4g', '3g', '2g', 'slow-2g'
    
    // Considerar lenta si es 2g, 3g o slow-2g
    isSlowConnection = ['2g', '3g', 'slow-2g'].includes(connectionType);
    
    if (isSlowConnection) {
        console.warn(`⚠️ Conexión lenta detectada: ${connectionType} - optimizando para bajo ancho de banda`);
    } else {
        console.log(`✅ Conexión rápida detectada: ${connectionType}`);
    }

    // Escuchar cambios en la conexión
    connection.addEventListener('change', () => {
        const newType = connection.effectiveType;
        if (newType !== connectionType) {
            connectionType = newType;
            isSlowConnection = ['2g', '3g', 'slow-2g'].includes(connectionType);
            console.log(`📡 Tipo de conexión cambió a: ${connectionType}`);
        }
    });
}

/**
 * Pre-carga imágenes en background usando Service Worker
 */
function precachePhotosWithWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            if (registration.active && photos.length > 0) {
                console.log('🖼️ Enviando imágenes para pre-caché al Service Worker...');
                registration.active.postMessage({
                    type: 'PRECACHE_IMAGES',
                    images: photos
                });
            }
        }).catch(err => {
            console.warn('⚠️ No se pudo comunicar con Service Worker:', err);
        });
    }
}

/**
 * Pre-carga imágenes próximas de forma inteligente
 * @param {number} startIndex - Índice desde donde empezar a pre-cargar
 * @param {number} count - Número de imágenes a pre-cargar
 */
function intelligentPreload(startIndex = currentPhotoIndex, count = 5) {
    if (isSlowConnection) {
        count = 2; // En conexión lenta, cargar menos imágenes
    }

    console.log(`⚡ Pre-cargando ${count} imágenes a partir del índice ${startIndex}`);
    
    for (let i = 0; i < count; i++) {
        const index = (startIndex + i) % photos.length;
        const imageUrl = photos[index];
        
        // Si ya está cargada, saltar
        if (imageLoadingProgress.has(imageUrl) && imageLoadingProgress.get(imageUrl) === 'complete') {
            continue;
        }

        // Crear un elemento img oculto para pre-cargar
        const img = new Image();
        img.onload = () => {
            imageLoadingProgress.set(imageUrl, 'complete');
            console.log(`✅ Pre-cargada: ${imageUrl}`);
        };
        img.onerror = () => {
            imageLoadingProgress.set(imageUrl, 'error');
            console.warn(`❌ Error pre-cargando: ${imageUrl}`);
        };
        img.src = imageUrl;
        imageLoadingProgress.set(imageUrl, 'loading');
    }
}

/**
 * Carga las fotografías desde el archivo JSON e inicia pre-cacheing
 */
function loadPhotos() {
    console.log('📷 Iniciando carga de fotos...');
    fetch('../assets/data/fotos.json')
        .then(res => {
            console.log('📷 Respuesta fetch recibida:', res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            photos = data;
            totalPhotosToPrecache = photos.length;
            
            createGallery();
            createSlideshow();
            updatePhotoCounter();
            
            // Iniciar pre-cacheo de fotos en background
            console.log('🚀 Iniciando optimización de cache para', totalPhotosToPrecache, 'fotos');
            precacheAllPhotos();
        })
        .catch(error => {
            console.error('Error cargando fotos:', error);
            showErrorMessage();
        });
}

/**
 * Pre-cachea todas las fotos de forma inteligente
 * Prioriza fotos visibles primero, luego pre-carga el resto en background
 */
function precacheAllPhotos() {
    if (!('caches' in window)) {
        console.warn('⚠️ Cache API no disponible - skipping pre-cache');
        return;
    }

    // Prioridad 1: Cachear primeras 5 fotos inmediatamente
    const priorityPhotos = photos.slice(0, 5);
    const restPhotos = photos.slice(5);

    // Cachear fotos prioritarias
    precachePhotosBatch(priorityPhotos, true).then(() => {
        console.log('✅ Fotos prioritarias cacheadas');
        
        // Luego cachear el resto sin bloquear
        if (restPhotos.length > 0) {
            // Usar requestIdleCallback si está disponible, senó usar setTimeout
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    precachePhotosBatch(restPhotos, false);
                });
            } else {
                setTimeout(() => {
                    precachePhotosBatch(restPhotos, false);
                }, 1000);
            }
        }
    });
}

/**
 * Cachea un lote de fotos
 * @param {Array} photoBatch - Lote de URLs de fotos
 * @param {boolean} isPriority - Si es prioridad (no usa delay entre requests)
 */
async function precachePhotosBatch(photoBatch, isPriority = false) {
    try {
        const cacheStorage = await caches.open('elite-fotos-cache-v2');
        
        for (let i = 0; i < photoBatch.length; i++) {
            const photoUrl = photoBatch[i];
            
            // Evitar pre-cachear foto que ya está cacheada
            if (photosPreloaded.has(photoUrl)) {
                cacheProgress++;
                continue;
            }
            
            try {
                const response = await fetch(photoUrl, {
                    priority: isPriority ? 'high' : 'low',
                    cache: 'default'
                });
                
                if (response && response.ok) {
                    await cacheStorage.put(photoUrl, response.clone());
                    photosPreloaded.add(photoUrl);
                    console.log(`💾 Foto ${cacheProgress + 1}/${totalPhotosToPrecache} cacheada: ${photoUrl.split('/').pop()}`);
                } else {
                    console.warn(`⚠️ Respuesta inválida para ${photoUrl}: status ${response?.status}`);
                    photosPreloaded.add(photoUrl); // Marcar como procesada aunque haya fallado
                }
            } catch (fetchError) {
                console.warn(`⚠️ Error precacheando ${photoUrl}: ${fetchError.message}`);
                // No marcar como procesada si falla - reintentar después
                // Pero incrementar contador para no quedarse atrapado
                photosPreloaded.add(photoUrl);
            }
            
            cacheProgress++;
            
            // Mostrar progreso cada 3 fotos
            if (cacheProgress % 3 === 0 || cacheProgress === totalPhotosToPrecache) {
                updateCacheProgress();
            }
            
            // Agregar pequeño delay si no es prioridad para no saturar conexión
            if (!isPriority && i < photoBatch.length - 1) {
                await new Promise(resolve => setTimeout(resolve, isSlowConnection ? 200 : 100));
            }
        }
        
        console.log(`✨ Pre-cache completado: ${cacheProgress}/${totalPhotosToPrecache} fotos`);
        updateCacheProgress();
        
    } catch (error) {
        console.error('❌ Error en pre-cache de fotos:', error);
    }
}

/**
 * Actualiza el indicador visual de progreso de cache
 */
function updateCacheProgress() {
    const percentage = Math.round((cacheProgress / totalPhotosToPrecache) * 100);
    console.log(`📊 Progreso de cache: ${cacheProgress}/${totalPhotosToPrecache} (${percentage}%)`);
    
    // Actualizar barra de progreso visual
    const cacheBadge = document.querySelector('.cache-progress-badge');
    if (cacheBadge) {
        const cachedBar = cacheBadge.querySelector('.cache-progress-bar');
        const progressText = cacheBadge.querySelector('.cache-progress-text');
        
        if (!cachedBar || !progressText) return;
        
        if (cacheProgress === totalPhotosToPrecache) {
            // Cache completado al 100%
            cachedBar.style.width = '100%';
            progressText.textContent = '✨ ¡Listo!';
            progressText.style.color = '#FAFAF7';
            progressText.style.fontWeight = '700';
            progressText.style.textShadow = '0 0 10px rgba(142, 28, 28, 1), 0 0 6px rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.4)';
            cacheBadge.setAttribute('data-complete', 'true');
            
            // Ocultar el indicador después de 3 segundos
            setTimeout(() => {
                cacheBadge.style.animation = 'fadeOutUp 0.5s ease-out forwards';
                setTimeout(() => {
                    cacheBadge.style.height = '0';
                    cacheBadge.style.padding = '0';
                    cacheBadge.style.margin = '0';
                    cacheBadge.style.overflow = 'hidden';
                }, 500);
            }, 3000);
        } else if (cacheProgress < totalPhotosToPrecache) {
            // Actualizar progreso de la barra
            cachedBar.style.width = `${percentage}%`;
            progressText.textContent = `Album Cargando... ${percentage}%`;
            progressText.style.color = '#FAFAF7';
            progressText.style.fontWeight = '700';
            progressText.style.textShadow = '0 0 10px rgba(142, 28, 28, 1), 0 0 6px rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.4)';
        }
    }
}

/**
 * Crea la galería de fotos en el DOM
 */
function createGallery() {
    const gallery = document.getElementById('photo-gallery');

    if (photos.length === 0) {
        showNoPhotosMessage();
        return;
    }

    // Mostrar indicador de optimización de conexión si es lenta
    if (isSlowConnection) {
        const connectionWarning = document.createElement('div');
        connectionWarning.className = 'connection-warning';
        connectionWarning.innerHTML = `
            <i class="fas fa-wifi"></i>
            <span>Conexión lenta - optimizando carga de imágenes (${connectionType})</span>
        `;
        gallery.parentElement.insertBefore(connectionWarning, gallery);
    }

    photos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.style.animationDelay = `${index * 0.1}s`;

        // Determinar si usar lazy loading
        const isLazyLoad = index > 5;

        photoItem.innerHTML = `
            <div class="photo-card" onclick="openModal(${index})">
                <div class="photo-image-container">
                    <img src="${photo}" alt="Memoria del Santuario ${index + 1}" ${isLazyLoad ? 'loading="lazy"' : ''} class="gallery-photo" />
                    <div class="photo-overlay">
                        <div class="photo-info">
                            <h3>Encuentro en el Santuario</h3>
                            <p>Instante de fe, adoración y consagración espiritual</p>
                            <div class="photo-date">
                                <i class="fas fa-cross"></i>
                                <span>Testimonio Sagrado</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="view-btn">
                    <i class="fas fa-search-plus"></i>
                </button>
            </div>
        `;

        gallery.appendChild(photoItem);
    });

    // Agregar progreso de cache si está disponible
    if ('caches' in window && !isSlowConnection) {
        const cacheBadge = document.createElement('div');
        cacheBadge.className = 'cache-progress-badge';
        cacheBadge.innerHTML = `
            <div class="cache-progress-bar"></div>
            <span class="cache-progress-text">Cargando...</span>
        `;
        cacheBadge.style.cssText = `
            position: relative;
            width: 30%;
            height: 24px;
            background: rgba(30, 58, 138, 0.65);
            display: flex;
            align-items: center;
            padding: 0 12px;
            box-sizing: border-box;
            border: 2px solid #8E1C1C;
            border-radius: 9px;
            margin: 12px auto;
            box-shadow: 0 0 12px rgba(142, 28, 28, 0.4);
            backdrop-filter: blur(12px);
        `;
        // Insertar debajo del header si existe
        const header = document.querySelector('.gallery-header');
        if (header && header.parentElement) {
            header.parentElement.insertBefore(cacheBadge, header.nextSibling);
        } else {
            // Si no hay header, insertar antes de la galería
            gallery.parentElement.insertBefore(cacheBadge, gallery);
        }
    }
}

/**
 * Crea el slideshow automático
 */
function createSlideshow() {
    if (photos.length === 0) return;

    const slideshowImg = document.getElementById('slideshow-img');
    const indicators = document.getElementById('slideshow-indicators');

    // Cargar primera imagen desde cache si está disponible (evita GET request si está cacheada)
    loadImageWithCache(photos[0]).then((imageUrl) => {
        slideshowImg.src = imageUrl;
    }).catch((error) => {
        console.error('Error al cargar primera imagen del slideshow:', error);
        slideshowImg.src = photos[0]; // Fallback a URL original
    });

    // Crear indicadores
    photos.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
        indicator.onclick = () => goToSlide(index);
        indicators.appendChild(indicator);
    });

    // Iniciar slideshow automático
    startSlideshow();
}

/**
 * Inicia el intervalo del slideshow
 */
function startSlideshow() {
    console.log('🎬 Iniciando slideshow automático con', photos.length, 'fotos');
    slideshowInterval = setInterval(() => {
        if (isPlaying) {
            nextSlide();
        }
    }, 4000);
}

/**
 * Avanza a la siguiente diapositiva
 */
function nextSlide() {
    currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
    console.log('🎬 Cambiando a foto', currentPhotoIndex);
    updateSlideshow();
}

/**
 * Va a una diapositiva específica
 * @param {number} index - Índice de la diapositiva
 */
function goToSlide(index) {
    currentPhotoIndex = index;
    updateSlideshow();
}

/**
 * Actualiza el slideshow con la siguiente imagen desde cache
 */
function updateSlideshow() {
    const slideshowImg = document.getElementById('slideshow-img');
    const indicators = document.querySelectorAll('.indicator');

    // Cargar siguiente imagen desde cache si está disponible
    loadImageWithCache(photos[currentPhotoIndex]).then((imageUrl) => {
        slideshowImg.src = imageUrl;
    }).catch((error) => {
        console.error('Error cargando imagen del slideshow:', error);
        slideshowImg.src = photos[currentPhotoIndex]; // Fallback
    });

    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentPhotoIndex);
    });
}

/**
 * Pausa el slideshow
 */
function pauseSlideshow() {
    isPlaying = false;
    updatePlayPauseButton();
    console.log('⏸️ Slideshow pausado manualmente');
}

/**
 * Reanuda el slideshow
 */
function playSlideshow() {
    isPlaying = true;
    updatePlayPauseButton();
    console.log('▶️ Slideshow reanudado manualmente');
}

/**
 * Alterna entre play y pause del slideshow
 */
function togglePlayPause() {
    if (isPlaying) {
        pauseSlideshow();
    } else {
        playSlideshow();
    }
}

/**
 * Actualiza la apariencia del botón play/pause
 */
function updatePlayPauseButton() {
    const btn = document.getElementById('playPauseBtn');
    const icon = btn.querySelector('i');
    const text = btn.querySelector('.control-text');

    if (isPlaying) {
        btn.classList.add('playing');
        btn.classList.remove('paused');
        icon.className = 'fas fa-pause';
        text.textContent = 'Pausar';
        btn.title = 'Pausar presentación';
    } else {
        btn.classList.add('paused');
        btn.classList.remove('playing');
        icon.className = 'fas fa-play';
        text.textContent = 'Reproducir';
        btn.title = 'Reproducir presentación';
    }
}

/**
 * Obtiene una imagen desde cache o fetch
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<string>} - Blob URL o URL original
 */
async function loadImageWithCache(imageUrl) {
    try {
        // Intentar obtener desde cache primero
        if ('caches' in window) {
            const cacheStorage = await caches.open('elite-fotos-cache-v2');
            const cachedResponse = await cacheStorage.match(imageUrl);
            
            if (cachedResponse) {
                const blob = await cachedResponse.blob();
                const blobUrl = URL.createObjectURL(blob);
                console.log(`✅ Imagen cargada desde CACHE: ${imageUrl}`);
                return blobUrl;
            }
        }
        
        // Si no está en cache, retornar URL original (el service worker lo manejará)
        console.log(`🔄 Imagen será descargada: ${imageUrl}`);
        return imageUrl;
    } catch (error) {
        console.warn(`⚠️ Error accediendo cache: ${error.message}, usando URL original`);
        return imageUrl;
    }
}

/**
 * Abre el modal y carga imagen desde cache si está disponible
 */
function openModal(index) {
    console.log('🔍 openModal llamado con index:', index);

    currentPhotoIndex = index;
    const modal = document.getElementById('photo-modal');
    const modalImage = document.getElementById('modalImage');
    const photoCounter = document.getElementById('photoCounter');

    console.log('🔍 Modal element:', modal);
    console.log('🔍 Modal image element:', modalImage);
    console.log('🔍 Photo URL:', photos[index]);

    // 🎬 PAUSAR SLIDESHOW AUTOMÁTICO PARA AHORRAR RECURSOS
    const wasPlaying = isPlaying;
    pauseSlideshow();

    // Guardar el estado anterior para restaurarlo al cerrar
    modal.dataset.wasPlaying = wasPlaying;

    photoCounter.textContent = `${index + 1} / ${photos.length}`;

    // Cargar imagen desde cache si está disponible (evita GET request si está cacheada)
    loadImageWithCache(photos[index]).then((imageUrl) => {
        modalImage.src = imageUrl;
        
        // Detectar orientación de imagen
        const img = new Image();
        img.onload = function () {
            if (this.height > this.width) {
                modalImage.classList.add('vertical-image');
                modalImage.classList.remove('horizontal-image');
            } else {
                modalImage.classList.add('horizontal-image');
                modalImage.classList.remove('vertical-image');
            }
        };
        img.src = imageUrl;
    }).catch((error) => {
        console.error('Error al cargar imagen:', error);
        modalImage.src = photos[index]; // Fallback a URL original
    });

    modal.style.display = 'flex';
    console.log('🔍 Modal abierto - Slideshow automático pausado para optimización');

    document.addEventListener('keydown', handleKeyboardNavigation);
}

/**
 * Cierra el modal
 */
function closeModal() {
    const modal = document.getElementById('photo-modal');
    const modalContent = document.querySelector('.modal-content');

    // Salir de pantalla completa si está activa ANTES de cerrar
    if (modalContent.classList.contains('fullscreen')) {
        exitCustomFullscreen();
    }

    modal.style.display = 'none';
    document.removeEventListener('keydown', handleKeyboardNavigation);

    // 🎬 REANUDAR SLIDESHOW SI ESTABA ACTIVO ANTES
    const wasPlaying = modal.dataset.wasPlaying === 'true';
    if (wasPlaying) {
        isPlaying = true;
        updatePlayPauseButton();
        console.log('🎬 Slideshow reanudado tras cerrar modal');
    } else {
        console.log('🎬 Slideshow se mantiene pausado (estaba pausado antes)');
    }

    // Limpiar el estado guardado
    delete modal.dataset.wasPlaying;
}

/**
 * Muestra la foto anterior en el modal
 */
function previousPhoto() {
    currentPhotoIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : photos.length - 1;
    updateModalPhoto();
}

/**
 * Muestra la siguiente foto en el modal
 */
function nextPhoto() {
    currentPhotoIndex = currentPhotoIndex < photos.length - 1 ? currentPhotoIndex + 1 : 0;
    updateModalPhoto();
}

/**
 * Actualiza la foto mostrada en el modal
 */
function updateModalPhoto() {
    const modalImage = document.getElementById('modalImage');
    const photoCounter = document.getElementById('photoCounter');

    modalImage.style.opacity = '0';

    setTimeout(() => {
        photoCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;

        // Cargar imagen desde cache si está disponible (evita GET request si está cacheada)
        loadImageWithCache(photos[currentPhotoIndex]).then((imageUrl) => {
            modalImage.src = imageUrl;

            // Detectar orientación
            const img = new Image();
            img.onload = function () {
                if (this.height > this.width) {
                    modalImage.classList.add('vertical-image');
                    modalImage.classList.remove('horizontal-image');
                } else {
                    modalImage.classList.add('horizontal-image');
                    modalImage.classList.remove('vertical-image');
                }
                modalImage.style.opacity = '1';
            };
            img.src = imageUrl;
        }).catch((error) => {
            console.error('Error al cargar imagen:', error);
            modalImage.src = photos[currentPhotoIndex]; // Fallback
            modalImage.style.opacity = '1';
        });
    }, 150);
}

/**
 * Maneja la navegación por teclado en el modal
 * @param {KeyboardEvent} event - Evento del teclado
 */
function handleKeyboardNavigation(event) {
    switch (event.key) {
        case 'ArrowLeft':
            previousPhoto();
            break;
        case 'ArrowRight':
            nextPhoto();
            break;
        case 'Escape':
            // Si está en pantalla completa, solo salir de pantalla completa
            const modalContent = document.querySelector('.modal-content');
            if (modalContent && modalContent.classList.contains('fullscreen')) {
                exitCustomFullscreen();
            } else {
                // Si no está en pantalla completa, cerrar modal completamente
                closeModal();
            }
            break;
        case 'f':
        case 'F':
            toggleFullscreen();
            break;
    }
}

/**
 * Actualiza el contador de fotos
 */
function updatePhotoCounter() {
    const counter = document.getElementById('total-photos');
    counter.textContent = `${photos.length} testimonios sagrados del santuario`;
}

/**
 * Muestra un mensaje de error
 */
function showErrorMessage() {
    const gallery = document.getElementById('photo-gallery');
    gallery.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error al cargar las fotografías</p>
        </div>
    `;
}

/**
 * Muestra un mensaje cuando no hay fotos
 */
function showNoPhotosMessage() {
    const gallery = document.getElementById('photo-gallery');
    gallery.innerHTML = `
        <div class="no-photos-message">
            <i class="fas fa-camera"></i>
            <p>Próximamente nuevas aventuras</p>
        </div>
    `;
}

/**
 * Alterna el modo pantalla completa
 */
function toggleFullscreen() {
    const modalContent = document.querySelector('.modal-content');
    const fullscreenBtn = document.querySelector('.modal-fullscreen i');
    const photoModal = document.getElementById('photo-modal');

    if (modalContent.classList.contains('fullscreen')) {
        exitCustomFullscreen();
    } else {
        // Entrar en pantalla completa
        modalContent.classList.add('fullscreen');
        if (photoModal) {
            photoModal.classList.add('fullscreen-mode');
        }
        if (fullscreenBtn) {
            fullscreenBtn.className = 'fas fa-compress';
            fullscreenBtn.parentElement.title = 'Salir de pantalla completa';
        }
        console.log('Entrando en pantalla completa');
    }
}

/**
 * Sale del modo pantalla completa personalizado
 * @returns {boolean} - true si se salió exitosamente, false caso contrario
 */
function exitCustomFullscreen() {
    try {
        const modalContent = document.querySelector('.modal-content');
        const fullscreenBtn = document.querySelector('.modal-fullscreen i');
        const photoModal = document.getElementById('photo-modal');

        if (modalContent && modalContent.classList.contains('fullscreen')) {
            modalContent.classList.remove('fullscreen');

            if (photoModal) {
                photoModal.classList.remove('fullscreen-mode');
            }

            if (fullscreenBtn) {
                fullscreenBtn.className = 'fas fa-expand';
                fullscreenBtn.parentElement.title = 'Pantalla completa';
            }

            // Forzar un reflow para asegurar que los cambios se apliquen
            modalContent.offsetHeight;

            console.log('✅ Saliendo de pantalla completa personalizada exitosamente');
            return true;
        } else {
            console.log('⚠️ No está en modo pantalla completa');
            return false;
        }
    } catch (error) {
        console.error('❌ Error al salir de pantalla completa:', error);
        return false;
    }
}

/**
 * Verifica qué fotos están en cache y reporta el estado
 */
async function checkCacheStatus() {
    if (!('caches' in window)) return;
    
    try {
        const cacheStorage = await caches.open('elite-fotos-cache-v2');
        let cachedCount = 0;
        
        for (let i = 0; i < photos.length; i++) {
            const response = await cacheStorage.match(photos[i]);
            if (response) {
                cachedCount++;
            } else {
                console.warn(`⚠️ Foto no en cache: ${photos[i]}`);
            }
        }
        
        const percentage = Math.round((cachedCount / photos.length) * 100);
        console.log(`📊 Estado de cache: ${cachedCount}/${photos.length} (${percentage}%)`);
        
        if (cachedCount === photos.length) {
            console.log('✨ ¡TODAS LAS FOTOS ESTÁN EN CACHE!');
        } else {
            console.warn(`⚠️ Faltan ${photos.length - cachedCount} fotos por cachear`);
        }
    } catch (error) {
        console.error('Error verificando cache:', error);
    }
}

// Verificar estado de cache cada 5 segundos después de cargar fotos
setTimeout(() => {
    if (photos.length > 0) {
        checkCacheStatus();
        setInterval(checkCacheStatus, 10000); // Cada 10 segundos después
    }
}, 5000);

/**
 * Configura los event listeners cuando el DOM está completamente cargado
 */
document.addEventListener('DOMContentLoaded', function () {
    // Detectar tipo de conexión y mostrar aviso
    detectConnectionQuality();
    
    // Cerrar modal al hacer clic fuera de la imagen (solo si no está en pantalla completa)
    const photoModal = document.getElementById('photo-modal');
    if (photoModal) {
        photoModal.addEventListener('click', function (e) {
            const modalContent = document.querySelector('.modal-content');

            // Solo cerrar si se hace clic fuera y NO está en pantalla completa
            if (e.target === this && !modalContent.classList.contains('fullscreen')) {
                closeModal();
            }
        });
    }

    // Añadir event listener para el botón de salir de pantalla completa
    const fullscreenExitBtn = document.querySelector('.fullscreen-exit-btn');
    if (fullscreenExitBtn) {
        fullscreenExitBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            console.log('Botón de salir de pantalla completa clickeado');
            exitCustomFullscreen();
        });
    }

    // 📍 CONTROL AUTOMÁTICO POR HOVER - Solo activo cuando el cursor está sobre el slideshow
    const slideshowContainer = document.getElementById('slideshow-container');
    if (slideshowContainer) {
        let wasPlayingBeforeLeave = isPlaying;

        // Cuando el cursor entra al contenedor del slideshow
        slideshowContainer.addEventListener('mouseenter', function () {
            console.log('📍 Cursor sobre slideshow - Activando reproducción automática');
            wasPlayingBeforeLeave = isPlaying;
            if (!isPlaying) {
                isPlaying = true;
                updatePlayPauseButton();
            }
            slideshowContainer.classList.add('hover-active');
        });

        // Cuando el cursor sale del contenedor del slideshow
        slideshowContainer.addEventListener('mouseleave', function () {
            console.log('📍 Cursor fuera del slideshow - Pausando para optimización');
            wasPlayingBeforeLeave = isPlaying;
            if (isPlaying) {
                isPlaying = false;
                updatePlayPauseButton();
            }
            slideshowContainer.classList.remove('hover-active');
        });
    }

    // Actualizar botón al cargar la página
    updatePlayPauseButton();
});

/**
 * Detecta la calidad de conexión del usuario
 */
function detectConnectionQuality() {
    if ('connection' in navigator) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;
        
        console.log(`📡 Tipo de conexión: ${effectiveType} (${downlink}Mbps)`);
        
        // Mostrar advertencia para conexiones lentas
        if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
            showSlowConnectionWarning();
        }
        
        // Escuchar cambios en la conexión
        connection.addEventListener('change', () => {
            const newType = connection.effectiveType;
            console.log(`🔄 Cambio de conexión a: ${newType}`);
            if (newType === 'slow-2g' || newType === '2g') {
                showSlowConnectionWarning();
            } else {
                removeSlowConnectionWarning();
            }
        });
    } else {
        console.warn('⚠️ Connection API no disponible');
    }
}

/**
 * Crea un badge visual de progreso de cache (NO UTILIZADO - la barra se crea en createGallery)
 */
// function createCacheProgressBadge() {
//     const gallery = document.querySelector('.gallery-section');
//     if (gallery) {
//         const badge = document.createElement('div');
//         badge.className = 'cache-progress-badge';
//         badge.style.cssText = `
//             position: fixed;
//             bottom: 20px;
//             right: 20px;
//             background: linear-gradient(135deg, rgba(230, 179, 37, 0.95), rgba(198, 152, 25, 0.95));
//             color: white;
//             padding: 12px 20px;
//             border-radius: 25px;
//             font-size: 12px;
//             z-index: 100;
//             backdrop-filter: blur(10px);
//             border: 1px solid rgba(255, 255, 255, 0.2);
//             display: none;
//             align-items: center;
//             gap: 8px;
//             box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
//         `;
//         badge.innerHTML = `
//             <i class="fas fa-cloud-download-alt"></i>
//             <span class="cache-percentage">0% en cache</span>
//         `;
//         document.body.appendChild(badge);
//     }
// }

/**
 * Muestra advertencia de conexión lenta
 */
function showSlowConnectionWarning() {
    const existing = document.querySelector('.slow-connection-warning');
    if (existing) return;
    
    const warning = document.createElement('div');
    warning.className = 'slow-connection-warning';
    warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, rgba(220, 53, 69, 0.95), rgba(176, 42, 55, 0.95));
        color: white;
        padding: 12px 20px;
        text-align: center;
        z-index: 1002;
        font-size: 14px;
        backdrop-filter: blur(10px);
        border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        animation: slideDown 0.3s ease;
    `;
    warning.innerHTML = `
        <i class="fas fa-wifi"></i>
        Conexión lenta detectada - Las fotos se están optimizando con cache para mejor rendimiento
    `;
    document.body.appendChild(warning);
    
    // Agregar animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Remueve la advertencia de conexión lenta
 */
function removeSlowConnectionWarning() {
    const warning = document.querySelector('.slow-connection-warning');
    if (warning) {
        warning.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => warning.remove(), 300);
    }
}
