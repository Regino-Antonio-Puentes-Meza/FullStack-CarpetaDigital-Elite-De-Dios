// Variable para rastrear PDF actual en caché
let currentPdfUrl = '';

// Registro de Service Worker para caching optimizado
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('../assets/js/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker registrado:', registration);
            })
            .catch((error) => {
                console.log('⚠️ Service Worker no disponible:', error);
            });
    });
}

// Array de extensiones de imagen a intentar
const extensionesImagen = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Intenta cargar una foto de perfil desde la carpeta img/perfiles
 * @param {string} nombreMiembro - Nombre del miembro (tal como está en JSON)
 * @returns {Promise<string>} - URL de la imagen si existe, undefined si no
 */
async function obtenerFotoPerfil(nombreMiembro) {
    try {
        // Normalizar el nombre para el archivo (reemplazar espacios por guiones)
        const nombreArchivo = nombreMiembro.replace(/_/g, '_');
        
        for (const ext of extensionesImagen) {
            try {
                const rutaImagen = `../assets/img/perfiles/${nombreArchivo}.${ext}`;
                const response = await fetch(rutaImagen, { 
                    method: 'HEAD',
                    cache: 'default',
                    mode: 'no-cors'
                });
                
                if (response.ok || response.type === 'opaque') {
                    console.log(`✅ Foto encontrada: ${rutaImagen}`);
                    return rutaImagen;
                }
            } catch (error) {
                // Continue con la siguiente extensión
                continue;
            }
        }
        
        console.log(`⚠️ Foto no encontrada para: ${nombreMiembro}`);
        return undefined;
    } catch (error) {
        console.error(`❌ Error al obtener foto de ${nombreMiembro}:`, error);
        return undefined;
    }
}

/**
 * Crea el HTML del avatar del miembro
 * @param {object} persona - Objeto con datos del miembro
 * @param {string} rolDirectiva - Rol de directiva
 * @param {string} fotoUrl - URL de la foto si existe
 * @returns {string} - HTML del avatar
 */
function crearAvatarHTML(persona, rolDirectiva, fotoUrl) {
    if (fotoUrl) {
        return `
            <div class="member-avatar avatar-foto">
                <img src="${fotoUrl}" alt="${persona.nombre}" class="member-photo">
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

document.addEventListener("DOMContentLoaded", async () => {
    // Animación de entrada
    document.body.classList.remove("fade-out");
    document.body.classList.add("fade-in");

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
        let totalMiembros = 0;

        // Procesar cada miembro
        for (const persona of data) {
            try {
                const div = document.createElement('div');
                div.classList.add('crew-card');
                
                if (persona.rol.toLocaleUpperCase() === rolDirectiva) {
                    div.classList.add('officer');
                }

                // Obtener foto de perfil si existe
                let fotoUrl;
                try {
                    fotoUrl = await obtenerFotoPerfil(persona.nombre);
                } catch (photoError) {
                    console.warn(`⚠️ Error al cargar foto de ${persona.nombre}:`, photoError);
                    fotoUrl = undefined;
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

                totalMiembros++;
                console.log(`✅ Miembro cargado: ${persona.nombre}`);
                
            } catch (personError) {
                console.error(`❌ Error al procesar miembro:`, personError, persona);
                continue; // Continuar con el siguiente miembro si uno falla
            }
        }

        console.log(`✨ Total de miembros cargados: ${totalMiembros}`);
        
        // Configurar buscador después de cargar todos los miembros
        configurarBuscador(totalMiembros);
        
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
});

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
 * Configura los eventos para expandir fotos al hacer clic
 */
function configurarExpansionFotos() {
    const fotos = document.querySelectorAll('.member-avatar.avatar-foto .member-photo');
    
    fotos.forEach(foto => {
        foto.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = e.target.closest('.crew-card');
            
            // Crear círculo expandido
            let photoExpanded = card.querySelector('.photo-expanded-circle');
            if (!photoExpanded) {
                photoExpanded = document.createElement('img');
                photoExpanded.className = 'photo-expanded-circle';
                photoExpanded.src = foto.src;
                photoExpanded.alt = foto.alt;
                card.style.position = 'relative';
                card.appendChild(photoExpanded);
                card.classList.add('photo-expanded');
                
                console.log(`🔍 Foto expandida: ${foto.alt}`);
                
                // Función para cerrar la foto
                const closePhoto = () => {
                    if (photoExpanded && photoExpanded.parentNode) {
                        photoExpanded.remove();
                        card.classList.remove('photo-expanded');
                        document.removeEventListener('click', closeExpanded);
                        document.removeEventListener('keydown', closeExpanded);
                        photoExpanded.removeEventListener('mouseleave', closePhoto);
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
                photoExpanded.addEventListener('mouseleave', closePhoto);
                
                // Cerrar con click en la foto expandida
                photoExpanded.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closePhoto();
                });
            }
        });
    });
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
