
// 🌟 ELÍTE DE DIOS - ARCHIVO DIGITAL DEL SANTUARIO
// Funcionalidad principal del sistema sagrado
// Código protegido pero funcional

document.addEventListener('DOMContentLoaded', function() {
    // === BOTÓN DEL SANTUARIO (ENTRAR AL SANTUARIO) ===
    const sanctuaryBtn = document.getElementById('enter-sanctuary-btn');
    
    if (sanctuaryBtn) {
        console.log('🏛️ Botón del Santuario encontrado correctamente');
        sanctuaryBtn.addEventListener('click', function() {
            console.log('🚪 Accediendo al Santuario...');
            // Efecto de transición sagrada
            document.body.style.transition = 'opacity 0.8s ease';
            document.body.style.opacity = '0';
            
            setTimeout(() => {
                window.location.href = 'pages/pag-menu-principal.html';
            }, 800);
        });
    } else {
        console.error('❌ Error: Botón del Santuario no encontrado');
        // Crear botón de respaldo si no se encuentra
        setTimeout(createFallbackButton, 1000);
    }
    
    // === EFECTOS DE ENTRADA ESPIRITUAL ===
    setTimeout(() => {
        document.body.classList.remove('fade-out');
        document.body.style.opacity = '1';
    }, 100);
    
    // === INICIALIZACIÓN DEL SANTUARIO ===
    initializeSanctuaryFeatures();
    
    // === PROTECCIÓN ESPIRITUAL ===
    implementSacredProtection();
});

/**
 * 🌟 Inicializa las características especiales del Santuario
 */
function initializeSanctuaryFeatures() {
    console.log('🏛️ Sistema del Santuario inicializado');
    
    // Efectos de iluminación divina
    createDivineLight();
    
    // Sonidos ambientales sagrados (opcional)
    // prepareAmbientSounds();
}

/**
 * ✨ Crea efectos de iluminación divina en la pantalla
 */
function createDivineLight() {
    // Efecto sutil de resplandor que se puede expandir
    const lightEffect = document.createElement('div');
    lightEffect.className = 'divine-light-effect';
    lightEffect.style.position = 'fixed';
    lightEffect.style.top = '0';
    lightEffect.style.left = '0';
    lightEffect.style.width = '100%';
    lightEffect.style.height = '100%';
    lightEffect.style.pointerEvents = 'none';
    lightEffect.style.zIndex = '999';
    lightEffect.style.background = `
        radial-gradient(ellipse at center, 
        rgba(212, 160, 23, 0.05) 0%, 
        transparent 70%)
    `;
    lightEffect.style.animation = 'divineGlow 6s ease-in-out infinite alternate';
    
    document.body.appendChild(lightEffect);
    
    // CSS para la animación si no existe
    if (!document.querySelector('#divine-light-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'divine-light-styles';
        styleSheet.textContent = `
            @keyframes divineGlow {
                0% { opacity: 0.3; }
                100% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

/**
 * 🛡️ Implementa protección sagrada del contenido
 */
function implementSacredProtection() {
    // Protección anti-tampering mejorada
    const originalLog = console.log;
    console.log = function() {
        if (arguments[0] && (
            arguments[0].includes('DevTools') || 
            arguments[0].includes('Inspector')
        )) {
            return;
        }
        originalLog.apply(console, arguments);
    };
    
    // Protección contra modificaciones no autorizadas
    Object.freeze(window.sanctuaryConfig || {});
}

/**
 * 🆘 Función de respaldo para crear el botón del Santuario
 */
function createFallbackButton() {
    const splashContent = document.querySelector('.splash-content');
    if (splashContent && !document.getElementById('enter-sanctuary-btn')) {
        console.log('🔧 Creando botón de respaldo...');
        
        const fallbackBtn = document.createElement('button');
        fallbackBtn.id = 'enter-sanctuary-btn';
        fallbackBtn.className = 'enter-btn';
        fallbackBtn.innerHTML = '<span class="door-text">Entrar al Santuario</span>';
        fallbackBtn.style.cssText = `
            position: relative;
            width: 300px;
            height: 90px;
            margin-top: 1rem;
            border: none;
            cursor: pointer;
            border-radius: 15px;
            background: linear-gradient(135deg, #D4A017, #B7950B);
            color: white;
            font-family: 'Cinzel', serif;
            font-size: 1.4rem;
            font-weight: 600;
            z-index: 1002;
            display: block;
            visibility: visible;
            opacity: 1;
        `;
        
        fallbackBtn.addEventListener('click', function() {
            window.location.href = 'pages/pag-menu-principal.html';
        });
        
        splashContent.appendChild(fallbackBtn);
    }
}

// === CONFIGURACIÓN DEL SANTUARIO ===
window.sanctuaryConfig = Object.freeze({
    theme: 'sanctuary',
    version: '2.0.0',
    conceptualDesign: 'Santuario del Antiguo Testamento',
    spiritualMode: true
});