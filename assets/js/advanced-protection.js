/*
 * PROTECCIONES AVANZADAS MINIMALISTAS - Elíte de Dios
 * Versión simplificada para mantener funcionalidad completa
 * Archivo Digital del Santuario
 */

(function() {
    'use strict';
    
    // Variables básicas
    const _0x2468 = {
        a: function(e) { 
            // Solo prevenir si no es elemento interactivo
            if (!e.target.closest('.photo-card') && 
                !e.target.closest('.modal') && 
                !e.target.closest('button') &&
                !e.target.closest('.slideshow-container')) {
                e.preventDefault(); 
            }
            return false; 
        },
        b: function() { 
            // Protección minimalista - solo log
            console.log('🛡️ Protección activada');
        },
        c: function(m) {
            // Advertencia muy simple
            console.warn('⚠️ ' + m);
        }
    };
    
    // Anti-bot simplificado
    function _0xantiScraping() {
        // Versión minimalista - solo detectar bots extremos
        let rapidClickCount = 0;
        let lastClick = Date.now();
        
        document.addEventListener('click', (event) => {
            // Permitir clicks normales en elementos de la galería
            if (event.target.closest('.photo-card') || 
                event.target.closest('.modal') || 
                event.target.closest('button') ||
                event.target.closest('.slideshow-container') ||
                event.target.closest('.nav-arrow') ||
                event.target.closest('.btn-back')) {
                rapidClickCount = 0; // Reset contador para elementos legítimos
                return true;
            }
            
            const now = Date.now();
            if (now - lastClick < 20) { // Solo detectar clicks ultra-rápidos (< 20ms)
                rapidClickCount++;
                if (rapidClickCount > 50) { // Muy alta tolerancia
                    _0x2468.c('Actividad inusualmente rápida detectada');
                }
            } else {
                rapidClickCount = 0;
            }
            
            lastClick = now;
        });
    }
    
    // Protección básica de impresión
    function _0xprintProtection() {
        const style = document.createElement('style');
        style.textContent = '@media print { .photo-grid { display: none !important; } }';
        document.head.appendChild(style);
    }
    
    // Protección minimalista de DevTools
    function _0xdevToolsBasic() {
        // Solo detectar casos muy obvios
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 300 || 
                window.outerWidth - window.innerWidth > 300) {
                _0x2468.c('Herramientas de desarrollo detectadas');
            }
        }, 5000); // Cada 5 segundos, no cada 500ms
    }
    
    // Inicialización
    function _0xinitAdvanced() {
        try {
            _0xantiScraping();
            _0xprintProtection();
            _0xdevToolsBasic();
            
            console.log('🔧 Protecciones avanzadas minimalistas activadas');
        } catch (e) {
            console.log('Error en protecciones avanzadas:', e);
        }
    }
    
    // Inicializar cuando esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _0xinitAdvanced);
    } else {
        _0xinitAdvanced();
    }
    
    // Exportar para uso si es necesario
    window._0xadvancedProtection = {
        init: _0xinitAdvanced,
        utils: _0x2468
    };
    
})();