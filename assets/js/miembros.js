// Variable para rastrear PDF actual en caché
let currentPdfUrl = '';

// Caché para fotos de perfil ya buscadas
const cacheFotos = new Map();

// Control de carga inteligente
let imageIntersectionObserver = null;
let connectionSpeed = 'fast';
let imagenesprecargadas = new Set();

// Detectar velocidad de conexión
function detectarVelocidadConexion() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
        connectionSpeed = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
        console.log(`📡 Velocidad de conexión: ${connectionSpeed}`);
        // Conexión lenta: reducimos tamaño de imágenes
        if (['2g', '3g', 'slow-2g'].includes(connectionSpeed)) {
            console.warn('⚠️ Conexión lenta detectada - optimizando imágenes');
        }
    }
}

detectarVelocidadConexion();

// Caché para Service Worker
const PERFIL_CACHE_V1 = 'elite-perfiles-cache-v1';

/**
 * Detecta si la página fue recargada (F5, Ctrl+R)
 * y limpia el caché para forzar actualización
 */
function detectarYActualizarAlRecargar() {
    console.log('� Detectando recarga de página...');
    
    // Usar performance.navigation para detectar si fue recarga
    // Type 1 = RELOAD (F5, Ctrl+R)
    // Type 2 = BACK_FORWARD (botones atrás/adelante)
    // Type 0 = NAVIGATE (navegación normal)
    const navegationType = performance.getEntriesByType('navigation')[0];
    const esRecarga = navegationType && (navegationType.type === 'reload' || navegationType.redirectCount > 0);
    
    if (esRecarga) {
        console.log('🔄 RECARGA detectada (F5/Ctrl+R) - limpiando caché para obtener versiones frescas...');
        
        // Limpiar caché de fotos de perfil en recarga
        if ('caches' in window) {
            caches.delete(PERFIL_CACHE_V1).then(() => {
                console.log('🗑️ Caché de fotos eliminado - se descargarán versiones frescas');
            }).catch(err => {
                console.warn('⚠️ Error al limpiar caché:', err);
            });
        }
        
        // Limpiar Map local de cacheFotos para forzar recarga
        cacheFotos.clear();
        console.log('💧 Caché local de fotos vacío');
        
        // Marcar que ya se limpió para esta sesión
        sessionStorage.setItem('cache-limpiado', 'true');
    } else {
        console.log('✅ Navegación normal - usando caché disponible (rápido)');
    }
    
    // Forzar actualización del Service Worker (siempre)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
                registration.update().then(() => {
                    console.log('✅ Service Worker actualizado');
                });
            });
        });
    }
}

// Detectar recarga al cargar la página
detectarYActualizarAlRecargar();

// Registrar Service Worker para caching optimizado
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('../assets/js/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker registrado:', registration);
                // Escuchar actualizaciones del Service Worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('📦 Nueva versión del Service Worker disponible - recargar fotos');
                            // Aquí se puede notificar al usuario o forzar recarga
                        }
                    });
                });
                
                // Comenzar precarga de imágenes una vez registrado
                setTimeout(precargarImagenesInteligentes, 2000);
            })
            .catch((error) => {
                console.log('⚠️ Service Worker no disponible:', error);
            });
    });
}

// Solo WebP ya que todas las fotos están en ese formato (90% más comprimidas)
const extensionesImagen = ['webp'];

/**
 * Obtiene la URL de la foto de perfil WebP del miembro
 * WebP proporciona 90% más compresión que JPG con mejor calidad
 * Devuelve la ruta esperada sin verificación (confiamos en miembros.json)
 * @param {string} nombreMiembro - Nombre del miembro (ej: "Juan_Perez_Gomez")
 * @returns {string} - URL de la imagen WebP
 */
function obtenerFotoPerfil(nombreMiembro) {
    // Verificar si ya está en caché local
    if (cacheFotos.has(nombreMiembro)) {
        return cacheFotos.get(nombreMiembro);
    }
    
    // Si fue recarga, agregar timestamp para forzar versión fresca
    // Si es navegación normal, sin timestamp para usar caché rápido
    const esRecargaReciente = sessionStorage.getItem('cache-limpiado') === 'true';
    const timestamp = esRecargaReciente ? `?t=${new Date().getTime()}` : '';
    const rutaImagen = `../assets/img/perfiles/${nombreMiembro}.webp${timestamp}`;
    
    // Guardar en caché local
    cacheFotos.set(nombreMiembro, rutaImagen);
    
    // Precachear en background (no bloquea)
    // Usar URL sin timestamp para cachear correctamente
    const rutaSinTimestamp = `../assets/img/perfiles/${nombreMiembro}.webp`;
    guardarEnCacheStorage(rutaSinTimestamp).catch(() => {});
    
    return rutaImagen;
}

/**
 * Guarda una imagen en el cache storage del navegador
 * Garantiza que las fotos se almacenan offline
 * @param {string} rutaImagen - URL de la imagen a cachear (sin timestamp)
 * @returns {Promise<void>}
 */
async function guardarEnCacheStorage(rutaImagen) {
    try {
        if ('caches' in window) {
            const cache = await caches.open(PERFIL_CACHE_V1);
            const esRecargaReciente = sessionStorage.getItem('cache-limpiado') === 'true';
            
            // Verificar si ya está en caché
            const cached = await cache.match(rutaImagen);
            
            // Opciones de fetch
            const fetchOptions = esRecargaReciente ? {
                method: 'GET',
                cache: 'no-store',  // Si fue recarga, forzar versión fresca del servidor
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            } : {
                method: 'GET',
                cache: 'default'  // Navegación normal: usar caché HTTP del navegador
            };
            
            // Fetch
            const response = await fetch(rutaImagen, fetchOptions);
            
            if (response.ok) {
                // Eliminar versión anterior si fue recarga
                if (cached && esRecargaReciente) {
                    await cache.delete(rutaImagen);
                }
                // Guardar versión nueva
                await cache.put(rutaImagen, response.clone());
                console.log(`💾 Foto cacheada: ${rutaImagen.split('/').pop()}`);
            }
        }
    } catch (error) {
        console.warn(`⚠️ No se pudo cachear imagen: ${rutaImagen}`, error);
    }
}

/**
 * Obtiene una imagen desde el caché Storage (cache-first strategy)
 * Si no está en caché, la descarga y cachea automáticamente
 * @param {string} rutaImagen - URL de la imagen (sin timestamp)
 * @returns {Promise<Blob|null>} - Blob de la imagen o null
 */
async function obtenerFotoDelCache(rutaImagen) {
    try {
        if (!('caches' in window)) {
            return null;
        }
        
        const cache = await caches.open(PERFIL_CACHE_V1);
        const cached = await cache.match(rutaImagen);
        
        if (cached) {
            console.log(`⚡ Foto desde caché: ${rutaImagen.split('/').pop()}`);
            return await cached.blob();
        }
        
        // Si no está en caché, descargar
        console.log(`📥 Descargando foto: ${rutaImagen.split('/').pop()}`);
        
        const esRecargaReciente = sessionStorage.getItem('cache-limpiado') === 'true';
        const fetchOptions = esRecargaReciente ? {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        } : {
            method: 'GET',
            cache: 'default'
        };
        
        const response = await fetch(rutaImagen, fetchOptions);
        
        if (response.ok) {
            // Guardar en caché para próximas veces
            await cache.put(rutaImagen, response.clone());
            return await response.blob();
        }
        
        return null;
    } catch (error) {
        console.warn(`⚠️ Error al obtener foto del caché:`, error);
        return null;
    }
}

/**
 * Crea el HTML del avatar del miembro
 * Carga la foto directamente sin lazy loading para garantizar visibilidad
 * @param {object} persona - Objeto con datos del miembro
 * @param {string} rolDirectiva - Rol de directiva
 * @param {string} fotoUrl - URL de la foto si existe
 * @returns {string} - HTML del avatar
 */
function crearAvatarHTML(persona, rolDirectiva, fotoUrl) {
    if (fotoUrl) {
        return `
            <div class="member-avatar avatar-foto" id="avatar-${persona.nombre}">
                <div class="photo-loader"></div>
                <img src="${fotoUrl}" 
                     alt="${persona.nombre}" 
                     class="member-photo"
                     onload="mostrarFotoCargada(this)"
                     onclick="intentarExpandirFoto(event)"
                     onerror="mostrarIconoFallback(this)">
            </div>
        `;
    } else {
        return `
            <div class="member-avatar avatar-icon">
                <i class="fas fa-user-tie"></i>
            </div>
        `;
    }
}

/**
 * Configura el caching en background de imágenes
 * Las imágenes ya están cargadas directamente, esto solo las cachea
 */
function configurarCachingFotos() {
    const imageElements = document.querySelectorAll('.member-photo');
    
    // Cachear todas las imágenes en background (usar URL sin timestamp)
    imageElements.forEach(img => {
        if (img.src && !img.src.startsWith('data:')) {
            // Extraer URL sin timestamp para cachear correctamente
            const urSinTimestamp = img.src.split('?')[0];
            guardarEnCacheStorage(urSinTimestamp).catch(() => {});
        }
    });
    
    console.log(`💾 Iniciando precaché de ${imageElements.length} imágenes (versiones frescas)`);
}

/**
 * Muestra el icono de usuario cuando la foto no se puede cargar
 * @param {HTMLImageElement} imgElement - Elemento imagen que falló
 */
function mostrarIconoFallback(imgElement) {
    const avatar = imgElement.closest('.member-avatar.avatar-foto');
    if (avatar) {
        // Reemplazar con icono
        avatar.classList.remove('avatar-foto');
        avatar.classList.add('avatar-icon');
        avatar.innerHTML = '<i class="fas fa-user-tie"></i>';
        console.log(`🔄 Foto reemplazada con icono de usuario: ${imgElement.alt}`);
    }
}

/**
 * Intenta expandir una foto, pero primero verifica que esté cacheada
 * @param {Event} e - Evento del click
 */
async function intentarExpandirFoto(e) {
    const foto = e.target;
    const srcSinTimestamp = foto.src.split('?')[0];
    
    // Verificar que la foto cargó completamente
    if (!foto.classList.contains('photo-loaded')) {
        console.warn(`⏳ Foto aún está cargando: ${foto.alt}`);
        return;
    }
    
    // Verificar que está en caché
    const enCache = await estaFotoEnCache(srcSinTimestamp);
    if (!enCache) {
        console.warn(`🔒 Foto aún no cacheada: ${foto.alt}`);
        return;
    }
    
    // Si llegó aquí, expandir
    console.log(`🎯 Expandiendo foto: ${foto.alt}`);
    await manejarClickExpansion(e);
}

/**
 * Muestra la foto cuando ha terminado de cargar
 * Oculta el loader y muestra la imagen con transición suave
 * ADEMÁS: Cuando esté cacheada, cambia el cursor a indicar que es expandible
 * @param {HTMLImageElement} imgElement - Elemento imagen que cargó
 */
function mostrarFotoCargada(imgElement) {
    const avatar = imgElement.closest('.member-avatar.avatar-foto');
    if (avatar) {
        // Agregar clase al avatar y a la imagen para mostrar foto y ocultar loader
        avatar.classList.add('photo-loaded');
        imgElement.classList.add('photo-loaded');
        console.log(`✅ Foto cargada: ${imgElement.alt}`);
        
        // Monitorear el caché para cambiar cursor cuando esté disponible
        const monitoreoCaché = setInterval(async () => {
            const srcSinTimestamp = imgElement.src.split('?')[0];
            const enCache = await estaFotoEnCache(srcSinTimestamp);
            
            if (enCache) {
                // Foto ya está en caché, cambiar cursor y limpiar intervalo
                imgElement.style.cursor = 'pointer';
                imgElement.style.opacity = '1';
                console.log(`✨ Expansión HABILITADA para ${imgElement.alt} (está en caché)`);
                clearInterval(monitoreoCaché);
            }
        }, 500); // Revisar cada 500ms
        
        // Cancelar monitoreo después de 10 segundos (fallback)
        setTimeout(() => clearInterval(monitoreoCaché), 10000);
    }
}

/**
 * Maneja el clic para expandir una foto
 * @param {Event} e - Evento del click
 */
async function manejarClickExpansion(e) {
    const foto = e.target;
    const card = foto.closest('.crew-card');
    
    if (!foto.classList.contains('photo-loaded')) {
        console.warn(`⏳ Foto aún está cargando: ${foto.alt}`);
        return;
    }
    
    e.stopPropagation();
    
    // Crear círculo expandido
    let photoExpanded = card.querySelector('.photo-expanded-circle');
    if (!photoExpanded) {
        // Crear contenedor con loader
        const expandedContainer = document.createElement('div');
        expandedContainer.className = 'expanded-photo-container';
        expandedContainer.style.position = 'absolute';
        expandedContainer.style.top = '60px';
        expandedContainer.style.left = '50%';
        expandedContainer.style.transform = 'translate(-50%, -50%)';
        expandedContainer.style.zIndex = '200';
        expandedContainer.style.width = '250px';
        expandedContainer.style.height = '250px';
        expandedContainer.style.display = 'flex';
        expandedContainer.style.alignItems = 'center';
        expandedContainer.style.justifyContent = 'center';
        
        // Loader
        const loader = document.createElement('div');
        loader.className = 'photo-loader';
        loader.style.position = 'absolute';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.right = '0';
        loader.style.bottom = '0';
        loader.style.margin = 'auto';
        loader.style.width = '60px';
        loader.style.height = '60px';
        loader.style.border = '5px solid rgba(230, 179, 37, 0.25)';
        loader.style.borderTopColor = '#E6B325';
        loader.style.borderRightColor = 'rgba(230, 179, 37, 0.6)';
        loader.style.borderRadius = '50%';
        loader.style.animation = 'spin 0.8s linear infinite';
        loader.style.zIndex = '10';
        loader.style.boxShadow = '0 0 15px rgba(230, 179, 37, 0.4)';
        loader.style.padding = '0';
        
        // Foto expandida
        photoExpanded = document.createElement('img');
        photoExpanded.className = 'photo-expanded-circle';
        photoExpanded.alt = foto.alt;
        photoExpanded.style.width = '250px';
        photoExpanded.style.height = '250px';
        photoExpanded.style.borderRadius = '50%';
        photoExpanded.style.objectFit = 'cover';
        photoExpanded.style.objectPosition = 'center';
        photoExpanded.style.boxShadow = '0 0 0 8px rgba(255, 255, 255, 0.9), 0 20px 60px rgba(230, 179, 37, 0.6), inset 0 0 20px rgba(0, 0, 0, 0.2)';
        photoExpanded.style.opacity = '0';
        photoExpanded.style.flexShrink = '0';
        
        // Handler para errores de carga de la imagen expandida
        photoExpanded.onerror = function() {
            console.error(`❌ Error al cargar foto expandida: ${foto.alt}`);
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
            
            // Mostrar icono fallback en lugar de la imagen fallida
            const fallbackIcon = document.createElement('div');
            fallbackIcon.style.width = '250px';
            fallbackIcon.style.height = '250px';
            fallbackIcon.style.borderRadius = '50%';
            fallbackIcon.style.display = 'flex';
            fallbackIcon.style.alignItems = 'center';
            fallbackIcon.style.justifyContent = 'center';
            fallbackIcon.style.backgroundColor = 'rgba(230, 179, 37, 0.15)';
            fallbackIcon.style.border = '3px solid rgba(230, 179, 37, 0.6)';
            fallbackIcon.innerHTML = '<i class="fas fa-user-tie" style="font-size: 80px; color: rgba(230, 179, 37, 0.8);"></i>';
            
            expandedContainer.appendChild(fallbackIcon);
            photoExpanded.style.display = 'none';
            
            // Transición suave
            setTimeout(() => {
                fallbackIcon.style.opacity = '1';
            }, 10);
        };
        
        expandedContainer.appendChild(loader);
        expandedContainer.appendChild(photoExpanded);
        
        card.style.position = 'relative';
        card.appendChild(expandedContainer);
        card.classList.add('photo-expanded');
        
        // 🎯 ESTRATEGIA CACHE-FIRST OPTIMIZADA:
        // 1. Intentar obtener del caché (instantáneo si está disponible)
        // 2. Si no está en caché, usar el src del avatar que ya funciona
        try {
            // Extraer URL sin timestamp para buscar en caché
            const srcSinTimestamp = foto.src.split('?')[0];
            
            const blob = await obtenerFotoDelCache(srcSinTimestamp);
            if (blob) {
                // ⚡ INSTANTÁNEO: Está en caché, crear blob URL
                const blobUrl = URL.createObjectURL(blob);
                photoExpanded.src = blobUrl;
                
                // Ocultar loader inmediatamente (ya tenemos la foto en memoria)
                loader.style.opacity = '0';
                loader.style.pointerEvents = 'none';
                photoExpanded.style.opacity = '1';
                console.log(`⚡ Foto desde caché (INSTANTÁNEO): ${foto.alt}`);
            } else {
                // No está en caché aún, usar src del avatar funcional
                photoExpanded.src = foto.src;
                console.log(`📥 Foto desde avatar (descargando si no esté en caché HTTP): ${foto.alt}`);
            }
        } catch (error) {
            // Fallback: usar src del avatar
            photoExpanded.src = foto.src;
            console.warn(`⚠️ Error con caché, usando src del avatar:`, error);
        }
        
        // El onload se dispara cuando la imagen termina de cargar (desde red o memoria)
        photoExpanded.onload = () => {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
            photoExpanded.style.opacity = '1';
            console.log(`✅ Foto expandida cargada: ${foto.alt}`);
        };
        
        // Función para cerrar la foto
        const closePhoto = () => {
            if (expandedContainer && expandedContainer.parentNode) {
                // Liberar objeto blob URL si existe
                if (photoExpanded.src && photoExpanded.src.startsWith('blob:')) {
                    URL.revokeObjectURL(photoExpanded.src);
                    console.log('🔸 Blob URL revocado');
                }
                expandedContainer.remove();
                card.classList.remove('photo-expanded');
                document.removeEventListener('click', closeExpanded);
                document.removeEventListener('keydown', closeExpanded);
                expandedContainer.removeEventListener('mouseleave', closePhoto);
            }
        };
        
        // Cerrar con click fuera o ESC
        const closeExpanded = (ev) => {
            if (ev.target === photoExpanded || ev.key === 'Escape') {
                closePhoto();
            }
        };
        
        // Cerrar con click fuera de la imagen
        setTimeout(() => {
            document.addEventListener('click', closeExpanded);
            document.addEventListener('keydown', closeExpanded);
        }, 10);
        
        // Cerrar automáticamente al salir el puntero (mouseleave)
        expandedContainer.addEventListener('mouseleave', closePhoto);
        
        // Cerrar con click en la foto expandida
        photoExpanded.addEventListener('click', (e) => {
            e.stopPropagation();
            closePhoto();
        });
    }
}

let observer = null;

/**
 * Precarga inteligente adicional de imágenes en background
 * Cachea algunas imágenes de directiva para acceso rápido posterior
 */
function precargarImagenesInteligentes() {
    try {
        const directivaCards = document.querySelectorAll('.crew-card.officer');
        const maxPreload = (['2g', '3g', 'slow-2g'].includes(connectionSpeed)) ? 3 : 6;
        
        let precargadas = 0;
        const imagenesAPrecarga = Array.from(directivaCards).slice(0, maxPreload);
        
        // Ejecutar precarga en background sin bloquear
        imagenesAPrecarga.forEach((card, index) => {
            setTimeout(() => {
                const img = card.querySelector('.member-photo');
                if (img && img.src) {
                    // Cachear sin timestamp (URL sin query params)
                    const urSinTimestamp = img.src.split('?')[0];
                    guardarEnCacheStorage(urSinTimestamp).catch(() => {});
                    precargadas++;
                }
            }, index * 100); // Distribuir en tiempo para no saturar
        });
        
        console.log(`⚡ Precargando ${Math.min(precargadas, maxPreload)} imágenes adicionales en background (versiones frescas)`);
    } catch (error) {
        console.warn('⚠️ Error en precarga de imágenes:', error);
    }
}

/**
 * Aplica efectos especiales según el cargo del miembro
 * Detecta por CARGO (solo en el campo cargo, no en el nombre)
 * @param {HTMLElement} div - Elemento de tarjeta del miembro
 * @param {object} persona - Objeto con datos del miembro
 */
function aplicarEfectosEspeciales(div, persona) {
    // Obtener cargo normalizado
    const cargoPersona = (persona.cargo || '').toLocaleUpperCase();
    const nombrePersona = (persona.nombre || '').replaceAll('_', ' ');
    
    // PRIORIDAD 1: Detectar SUBDIRECTORA/SUBDIRECTOR (más específico, debe ir primero)
    if (cargoPersona.includes('SUBDIRECTORA') || cargoPersona.includes('SUBDIRECTOR')) {
        div.classList.add('subdirector');
        console.log(`✨ Efecto de subdirector/a aplicado a: ${nombrePersona} (cargo: ${cargoPersona})`);
        return;
    }
    
    // PRIORIDAD 2: Detectar DIRECTORA/DIRECTOR
    if (cargoPersona.includes('DIRECTORA') || cargoPersona.includes('DIRECTOR')) {
        div.classList.add('director');
        console.log(`👑 Efecto de director/a aplicado a: ${nombrePersona} (cargo: ${cargoPersona})`);
        return;
    }
    
    // PRIORIDAD 3: Detectar SECRETARIA/SECRETARIO
    if (cargoPersona.includes('SECRETARIA') || cargoPersona.includes('SECRETARIO')) {
        div.classList.add('secretaria');
        console.log(`📋 Efecto de secretaria/o aplicado a: ${nombrePersona} (cargo: ${cargoPersona})`);
        return;
    }
    
    // PRIORIDAD 4: Detectar TESORERO/TESORERA
    if (cargoPersona.includes('TESORERO') || cargoPersona.includes('TESORERA')) {
        div.classList.add('tesorero');
        console.log(`💎 Efecto de tesorero/a aplicado a: ${nombrePersona} (cargo: ${cargoPersona})`);
        return;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Animación de entrada
    document.body.classList.remove("fade-out");
    document.body.classList.add("fade-in");

    // Ejecutar carga en función async
    cargarMiembros().catch(error => {
        console.error('❌ Error crítico al cargar miembros:', error);
        const directiva = document.getElementById('directiva-container');
        if (directiva) {
            directiva.innerHTML = `<p style="color: red; padding: 20px;">Error al cargar los miembros. Por favor, recarga la página.</p>`;
        }
    });
});

/**
 * Función async para cargar todos los miembros y configurar la página
 */
async function cargarMiembros() {
    try {
        const response = await fetch("../assets/data/miembros.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`📋 Cargados ${data.length} miembros desde JSON`);
        
        const directiva = document.getElementById('directiva-container');
        const club = document.getElementById('club-container');
        
        if (!directiva || !club) {
            throw new Error('No se encontraron contenedores de miembros en el DOM');
        }
        
        let rolDirectiva = "DIRECTIVA";
        
        // Obtener rutas de fotos (instantáneo, sin bloquear)
        console.log('🖼️ Obteniendo rutas de fotos...');
        const fotos = data.map(persona => obtenerFotoPerfil(persona.nombre));
        console.log('✅ Rutas obtenidas');
        
        // Ahora renderizar todos los miembros inmediatamente
        for (let i = 0; i < data.length; i++) {
            try {
                const persona = data[i];
                const fotoUrl = fotos[i];
                
                const div = document.createElement('div');
                div.classList.add('crew-card');
                
                if (persona.rol.toLocaleUpperCase() === rolDirectiva) {
                    div.classList.add('officer');
                }
                
                const avatarHTML = crearAvatarHTML(persona, rolDirectiva, fotoUrl);

                div.innerHTML = `
                    <div class="card-header">
                        ${avatarHTML}
                        <div class="rank-badge ${persona.rol.toLocaleUpperCase() === rolDirectiva ? 'officer-rank' : 'crew-rank'}">
                            <i class="fas ${persona.rol.toLocaleUpperCase() === rolDirectiva ? 'fa-crown' : 'fa-dove'}"></i>
                        </div>
                    </div>
                    <div class="card-content">
                        <h3 class="member-name">${persona.nombre.replaceAll('_', ' ')}</h3>
                        <p class="member-role">${persona.rol.toLocaleUpperCase() === rolDirectiva ? `${persona.rol + '-'+ persona.cargo}` : 'Integrante'}</p>
                        <button class="view-profile" onclick="abrirPDF('../assets/pdfs/${persona.nombre}.pdf')">
                            <i class="fas fa-scroll"></i>
                            <span>Ver Perfil</span>
                        </button>
                    </div>
                `;

                if (persona.rol.toLocaleUpperCase() === rolDirectiva) {
                    directiva.appendChild(div);
                } else {
                    club.appendChild(div);
                }

                // Aplicar efectos especiales según cargo
                aplicarEfectosEspeciales(div, persona);
                
            } catch (personError) {
                console.error(`❌ Error al procesar miembro:`, personError, data[i]);
                continue;
            }
        }

        console.log(`✨ Total de miembros renderizados: ${data.length}`);
        
        // Cachear imágenes en background (no bloquea la visualización)
        configurarCachingFotos();
        
        // Configurar buscador después de cargar todos los miembros
        configurarBuscador(data.length);
        
        // Configurar expansión de fotos al hacer clic
        configurarExpansionFotos();

    } catch (error) {
        console.error('❌ Error crítico al cargar miembros:', error);
        // Mostrar mensaje de error en la página
        const directiva = document.getElementById('directiva-container');
        if (directiva) {
            directiva.innerHTML = `<p style="color: red; padding: 20px;">Error al cargar los miembros. Por favor, recarga la página.</p>`;
        }
    }
}

/**
 * Configura el buscador de miembros
 * @param {number} totalMiembros - Total de miembros cargados
 */
function configurarBuscador(totalMiembros) {
    const filtroInput = document.getElementById("buscador");
    const contador = document.getElementById("contador-miembros");

    filtroInput.addEventListener("input", () => {
        const filtro = filtroInput.value.toLowerCase();
        const tarjetas = document.querySelectorAll(".crew-card");

        tarjetas.forEach(card => {
            const nombre = card.querySelector(".member-name").textContent.toLowerCase();
            if (nombre.includes(filtro)) {
                card.style.display = "block";
                card.style.animation = "fadeInUp 0.5s ease";
            } else {
                card.style.display = "none";
            }
        });

        actualizarContador(totalMiembros);
        actualizarSecciones();
    });

    // Actualizar contador inicial
    actualizarContador(totalMiembros);
}

/**
 * Actualiza el contador de miembros
 * @param {number} totalMiembros - Total de miembros
 */
function actualizarContador(totalMiembros) {
    const contador = document.getElementById("contador-miembros");
    const filtroInput = document.getElementById("buscador");
    const visibles = document.querySelectorAll(".crew-card:not([style*='display: none'])");
    const filtro = filtroInput.value.toLowerCase();

    if (filtro.trim() === "") {
        // Sin filtro: mostrar solo el total
        contador.textContent = `Total: ${totalMiembros} miembro${totalMiembros === 1 ? '' : 's'}`;
    } else {
        // Con filtro: mostrar encontrados de total
        contador.textContent = `Encontrados: ${visibles.length} de ${totalMiembros} miembro${totalMiembros === 1 ? '' : 's'}`;
    }
}

/**
 * Actualiza la visibilidad de las secciones según los resultados del filtro
 */
function actualizarSecciones() {
    // Verificar Liderazgo Ministerial
    const directivaCards = document.querySelectorAll("#directiva-container .crew-card:not([style*='display: none'])");
    const liderazgoSection = document.querySelector("#directiva-container").closest('.crew-section');

    // Verificar Ministerio General  
    const clubCards = document.querySelectorAll("#club-container .crew-card:not([style*='display: none'])");
    const ministerioSection = document.querySelector("#club-container").closest('.crew-section');

    // Mostrar/ocultar secciones según tengan resultados
    if (directivaCards.length > 0) {
        liderazgoSection.style.display = "block";
    } else {
        liderazgoSection.style.display = "none";
    }

    if (clubCards.length > 0) {
        ministerioSection.style.display = "block";
    } else {
        ministerioSection.style.display = "none";
    }
}

/**
 * Abre el modal con el perfil PDF del miembro
 * @param {string} ruta - Ruta al archivo PDF
 */
function abrirPDF(ruta) {
    console.log('📄 Abriendo perfil PDF:', ruta);
    const modal = document.getElementById('pdfModal');
    const viewer = document.getElementById('pdfViewer');
    const loader = document.getElementById('pdfLoader');
    
    if (!modal || !viewer) return;
    
    // Mostrar modal inmediatamente
    modal.classList.add('visible');
    
    // Si es el mismo PDF y ya está cargado, no recargar
    if (currentPdfUrl === ruta && viewer.src) {
        console.log('⚡ PDF en caché, apertura instantánea');
        if (loader) loader.style.display = 'none';
        viewer.style.opacity = '1';
        return;
    }
    
    // Mostrar loader solo para PDFs nuevos
    if (loader && currentPdfUrl !== ruta) {
        loader.style.display = 'flex';
    }
    
    // Configurar evento de carga
    viewer.onload = () => {
        if (loader) loader.style.display = 'none';
        viewer.style.opacity = '1';
        currentPdfUrl = ruta;
        console.log('✅ Perfil cargado y cacheado');
    };
    
    // Cargar PDF
    viewer.src = ruta;
}

/**
 * Verifica si una imagen está en el caché Storage sin descargarla
 * @param {string} rutaImagen - URL de la imagen (sin timestamp)
 * @returns {Promise<boolean>} - true si está en caché, false si no
 */
async function estaFotoEnCache(rutaImagen) {
    try {
        if (!('caches' in window)) return false;
        const cache = await caches.open(PERFIL_CACHE_V1);
        const cached = await cache.match(rutaImagen);
        return cached !== undefined;
    } catch (error) {
        return false;
    }
}

/**
 * Configura los eventos iniciales para expandir fotos
 * NOTA: Los listeners se agregan dinámicamente cuando las fotos se cachean en mostrarFotoCargada()
 */
function configurarExpansionFotos() {
    // Solo verificar que el sistema está listo
    console.log('📸 Sistema de expansión de fotos configurado (listeners dinámicos)');
}

/**
 * Cierra el modal del PDF
 */
function cerrarPDF() {
    const modal = document.getElementById('pdfModal');
    const viewer = document.getElementById('pdfViewer');

    if (modal && viewer) {
        modal.classList.remove('visible');
        viewer.style.opacity = '1';
        // No limpiar src para mantener caché en memoria
    }
}
