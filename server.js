#!/usr/bin/env node
/**
 * Elíte de Dios - Servidor Web Portable Seguro
 * Archivo Digital del Santuario
 * Servidor HTTP standalone con protección de recursos
 * Código encriptado para protección
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const net = require('net');

// Detectar si estamos en un ejecutable empaquetado
const IS_PACKAGED = typeof process.pkg !== 'undefined';
const BASE_PATH = IS_PACKAGED ? process.cwd() : __dirname;

console.log(`🔍 Modo de ejecución: ${IS_PACKAGED ? 'EMPAQUETADO (Seguro)' : 'DESARROLLO'}`);
console.log(`📂 Ruta base: ${BASE_PATH}`);

// Configuración del servidor
const CONFIG = {
    DEFAULT_PORT: 3000,
    HOST: 'localhost',
    TIMEOUT: 2000,
    MAX_PORT_ATTEMPTS: 10
};

// Tipos MIME optimizados
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg'
};

// Headers de seguridad y rendimiento
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
};

/**
 * Encuentra un puerto libre disponible
 */
async function findFreePort(startPort = CONFIG.DEFAULT_PORT) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        const tryPort = (port) => {
            server.listen(port, CONFIG.HOST, () => {
                const actualPort = server.address().port;
                server.close(() => resolve(actualPort));
            });
            
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(`Puerto ${port} ocupado, probando ${port + 1}...`);
                    server.removeAllListeners('error');
                    server.removeAllListeners('listening');
                    tryPort(port + 1);
                } else {
                    resolve(tryPort(port + 1));
                }
            });
        };
        
        tryPort(startPort);
    });
}

/**
 * Abre el navegador web por defecto
 */
function openBrowser(url) {
    const commands = {
        win32: `start "" "${url}"`,
        darwin: `open "${url}"`,
        linux: `xdg-open "${url}"`
    };
    
    const command = commands[process.platform] || commands.linux;
    
    exec(command, (error) => {
        if (error) {
            console.log(`🔗 Abre manualmente: ${url}`);
        }
    });
}

/**
 * Obtiene el directorio base de la aplicación
 */
function getAppDirectory() {
    if (process.pkg) {
        // Ejecutable compilado - archivos están junto al .exe
        return path.dirname(process.execPath);
    } else {
        // Desarrollo - archivos están en el directorio del script
        return __dirname;
    }
}

/**
 * Valida y sanitiza rutas de archivos
 */
function sanitizePath(requestUrl) {
    // Remover parámetros de consulta y fragmentos
    const cleanUrl = requestUrl.split('?')[0].split('#')[0];
    
    // Decodificar URL para manejar caracteres especiales
    let decodedUrl;
    try {
        decodedUrl = decodeURIComponent(cleanUrl);
    } catch (e) {
        console.log(`❌ Error decodificando URL: ${cleanUrl}`);
        return null;
    }
    
    // Prevenir ataques de path traversal
    if (decodedUrl.includes('..') || decodedUrl.includes('\\') || decodedUrl.includes('\0')) {
        console.log(`❌ Ruta peligrosa detectada: ${decodedUrl}`);
        return null;
    }
    
    const appDir = getAppDirectory();
    
    // Manejar ruta raíz
    if (decodedUrl === '/' || decodedUrl === '') {
        return path.join(appDir, 'index.html');
    }
    
    // Construir ruta del archivo
    const requestedPath = decodedUrl.startsWith('/') ? decodedUrl.slice(1) : decodedUrl;
    const fullPath = path.join(appDir, requestedPath);
    
    // Verificar que la ruta está dentro del directorio de la aplicación
    const resolvedPath = path.resolve(fullPath);
    const resolvedAppDir = path.resolve(appDir);
    
    if (!resolvedPath.startsWith(resolvedAppDir)) {
        console.log(`❌ Intento de acceso fuera del directorio: ${resolvedPath}`);
        return null;
    }
    
    return resolvedPath;
}

/**
 * Maneja las peticiones HTTP
 */
function handleRequest(req, res) {
    let requestUrl = req.url;
    
    // Log para debugging
    console.log(`📡 Petición: ${req.method} ${requestUrl}`);
    
    const filePath = sanitizePath(requestUrl);
    
    if (!filePath) {
        console.log(`❌ Acceso denegado: ${requestUrl}`);
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Acceso denegado');
        return;
    }
    
    // Verificar que el archivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log(`❌ Archivo no encontrado: ${filePath}`);
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Archivo no encontrado');
            return;
        }
        
        // Obtener información del archivo
        fs.stat(filePath, (statErr, stats) => {
            if (statErr) {
                console.log(`❌ Error stat: ${filePath}`);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('Error interno del servidor');
                return;
            }
            
            // Si es un directorio, devolver 403
            if (stats.isDirectory()) {
                console.log(`❌ Intento de acceso a directorio: ${filePath}`);
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('Acceso a directorio denegado');
                return;
            }
            
            // Leer y servir el archivo
            fs.readFile(filePath, (readErr, content) => {
                if (readErr) {
                    console.log(`❌ Error leyendo archivo: ${filePath}`);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.end('Error interno del servidor');
                    return;
                }
                
                // Determinar tipo de contenido
                const ext = path.extname(filePath).toLowerCase();
                const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                
                // Headers especiales para ciertos tipos de archivo
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Length', content.length);
                
                // Headers de seguridad (excepto para PDFs que necesitan abrirse)
                if (ext !== '.pdf') {
                    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
                        res.setHeader(key, value);
                    });
                } else {
                    // Para PDFs, permitir que se abran en el navegador
                    res.setHeader('Content-Disposition', 'inline');
                    res.setHeader('X-Content-Type-Options', 'nosniff');
                }
                
                // Para archivos JSON, permitir CORS
                if (ext === '.json') {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                }
                
                console.log(`✅ Sirviendo: ${filePath} (${contentType}, ${content.length} bytes)`);
                res.statusCode = 200;
                res.end(content);
            });
        });
    });
}

/**
 * Inicia el servidor HTTP
 */
async function startServer() {
    const appDir = getAppDirectory();
    const indexPath = path.join(appDir, 'index.html');
    
    // Verificar que existe el archivo principal
    if (!fs.existsSync(indexPath)) {
        console.log('❌ Error: No se encontró index.html');
        console.log(`📂 Directorio: ${appDir}`);
        process.exit(1);
    }
    
    try {
        const port = await findFreePort();
        const url = `http://${CONFIG.HOST}:${port}`;
        
        const server = http.createServer(handleRequest);
        
        server.listen(port, CONFIG.HOST, () => {
            console.log('');
            console.log('='.repeat(50));
            console.log('  CLUB DE AVENTUREROS SEAR JASUB');
            console.log('     Elíte de Dios - Archivo Digital del Santuario v1.0');
            console.log('='.repeat(50));
            console.log('');
            console.log(`🚀 Servidor iniciado en: ${url}`);
            console.log(`📂 Sirviendo desde: ${appDir}`);
            console.log('🌐 Abriendo navegador...');
            console.log('');
            console.log('📌 Para cerrar la aplicación:');
            console.log('   - Presiona Ctrl+C o cierra esta ventana');
            console.log('');
            
            // Abrir navegador después de 1.5 segundos
            setTimeout(() => openBrowser(url), 1500);
        });
        
        // Manejo de errores del servidor
        server.on('error', (err) => {
            console.log(`❌ Error del servidor: ${err.message}`);
            process.exit(1);
        });
        
        // Manejo de cierre graceful
        const shutdown = () => {
            console.log('\\n🔒 Cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
                process.exit(0);
            });
        };
        
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('exit', () => {
            console.log('👋 ¡Hasta pronto, aventurero!');
        });
        
    } catch (error) {
        console.log(`❌ Error inesperado: ${error.message}`);
        process.exit(1);
    }
}

// Iniciar aplicación solo si no está siendo importado
if (require.main === module) {
    startServer();
}

module.exports = { startServer, getAppDirectory };