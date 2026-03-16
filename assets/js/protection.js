/*
 * PROTECCIÓN MINIMALISTA - Club Élite de Dios
 * Versión 1.0 - Junio 2026
 * Versión simplificada para permitir funcionalidad completa
 */

(function() {
    'use strict';
    
    // Variables ofuscadas básicas
    const _0xa1b2c3 = 'protection-active';
    const _0xd4e5f6 = 'warning-shown';
    let _0xg7h8i9 = false;
    
    // Función para mostrar advertencia minimalista
    function _0xshowWarning() {
        if (_0xg7h8i9) return;
        _0xg7h8i9 = true;
        
        const warning = document.createElement('div');
        warning.innerHTML = `
            <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                        background:rgba(255,0,0,0.9);color:white;padding:15px;
                        border-radius:8px;z-index:999999;font-family:Arial;
                        text-align:center;box-shadow:0 0 15px rgba(0,0,0,0.5);">
                <h4>🔒 Contenido Protegido</h4>
                <p>Club Élite de Dios © 2026</p>
            </div>
        `;
        document.body.appendChild(warning);
        
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
            _0xg7h8i9 = false;
        }, 2000);
    }
    
    // Protección de teclado minimalista
    function _0xkeyProtection(event) {
        const key = event.key || event.keyCode;
        const ctrl = event.ctrlKey;
        const shift = event.shiftKey;
        
        // Solo bloquear F12
        if (key === 'F12' || key === 123) {
            event.preventDefault();
            _0xshowWarning();
            return false;
        }
        
        // Solo bloquear Ctrl+Shift+I (DevTools)
        if (ctrl && shift && (key === 'I' || key === 73)) {
            event.preventDefault();
            _0xshowWarning();
            return false;
        }
        
        return true;
    }
    
    // Protección de click derecho minimalista
    function _0xcontextProtection(event) {
        // Permitir click derecho en elementos de la galería
        if (event.target.closest('.photo-card') || 
            event.target.closest('.modal') || 
            event.target.closest('button') ||
            event.target.closest('.slideshow-container') ||
            event.target.closest('.nav-arrow') ||
            event.target.closest('.btn-back')) {
            return true;
        }
        
        // Solo bloquear click derecho en otros elementos
        if (event.button === 2) {
            event.preventDefault();
            _0xshowWarning();
            return false;
        }
        
        return true;
    }
    
    // Protección básica de selección
    function _0xselectProtection(event) {
        // Permitir selección en elementos interactivos
        if (event.target.closest('.modal') || 
            event.target.closest('.photo-card') ||
            event.target.closest('button')) {
            return true;
        }
        
        // Solo prevenir selección de texto en otros elementos
        if (window.getSelection && window.getSelection().toString().length > 50) {
            event.preventDefault();
            return false;
        }
        
        return true;
    }
    
    // Inicialización cuando el DOM esté listo
    function _0xinitProtection() {
        // Event listeners minimalistas
        document.addEventListener('keydown', _0xkeyProtection, true);
        document.addEventListener('contextmenu', _0xcontextProtection, true);
        document.addEventListener('selectstart', _0xselectProtection, false);
        
        // Marcar como inicializado
        document.body.setAttribute('data-protection', _0xa1b2c3);
        
        console.log('🛡️ Protección minimalista activada');
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _0xinitProtection);
    } else {
        _0xinitProtection();
    }
    
    // Protección básica de consola
    const originalLog = console.log;
    console.log = function(...args) {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('DevTools')) {
            return;
        }
        return originalLog.apply(console, args);
    };
    
})();