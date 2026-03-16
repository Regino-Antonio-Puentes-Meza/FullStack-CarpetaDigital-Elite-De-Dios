#!/usr/bin/env node
/**
 * Elíte de Dios - Servidor Portable Mejorado
 * Archivo Digital del Santuario
 * Servidor HTTP con encriptación y detección de rutas mejorada
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const net = require('net');
const crypto = require('crypto');

// Configuración de encriptación
const ENCRYPTION_CONFIG = {
    algorithm: 'aes-256-cbc',
    key: crypto.scryptSync('EliteDeDios_2025_ClaveEncriptada_32bits!', 'salt', 32),
    secretKey: 'EliteDeDios_2025_ClaveEncriptada_32bits!'
};

// Detectar si estamos en un ejecutable empaquetado
const IS_PACKAGED = typeof process.pkg !== 'undefined';

// Configurar rutas según el entorno
let BASE_PATH, ENCRYPTED_PATH;

if (IS_PACKAGED) {
    // En ejecutable empaquetado, buscar archivos junto al .exe
    BASE_PATH = process.cwd();
    ENCRYPTED_PATH = path.join(process.cwd(), 'encrypted');
    console.log('🔍 Modo de ejecución: EJECUTABLE EMPAQUETADO');
} else {
    // En desarrollo, usar el directorio del script
    BASE_PATH = __dirname;
    ENCRYPTED_PATH = path.join(__dirname, 'encrypted');
    console.log('🔍 Modo de ejecución: DESARROLLO');
}

console.log('📂 Ruta base:', BASE_PATH);
console.log('🔐 Ruta encriptados:', ENCRYPTED_PATH);

console.log('');
console.log('==================================================');
console.log('  CLUB DE AVENTUREROS SEAR JASUB');
console.log('     Elíte de Dios - Archivo Digital - ULTRA PROTEGIDO');
console.log('==================================================');

// Configuración del servidor
const SERVER_CONFIG = {
    DEFAULT_PORT: 3000,
    TIMEOUT: 2000,
    MAX_PORT_ATTEMPTS: 10
};

// Tipos MIME
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// Extensiones que necesitan desencriptación
const ENCRYPTED_EXTENSIONS = ['.html', '.css', '.js', '.json'];

/**
 * Desencriptar contenido
 */
function decryptContent(encryptedContent) {
    try {
        const parts = encryptedContent.split(':');
        if (parts.length !== 2) throw new Error('Formato inválido');
        
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        const decipher = crypto.createDecipheriv(ENCRYPTION_CONFIG.algorithm, ENCRYPTION_CONFIG.key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.log('❌ Error desencriptando:', error.message);
        return null;
    }
}

/**
 * Verificar si un archivo necesita desencriptación
 */
function shouldDecrypt(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ENCRYPTED_EXTENSIONS.includes(ext);
}

/**
 * Buscar archivo en múltiples ubicaciones
 */
function findFile(requestPath) {
    const possiblePaths = [];
    
    // PRIORIDAD: Si necesita desencriptación, buscar SOLO versión encriptada
    if (shouldDecrypt(requestPath)) {
        possiblePaths.push(path.join(ENCRYPTED_PATH, requestPath + '.enc'));
    } else {
        // Para archivos estáticos (imágenes, PDFs, SVG, etc.) usar ruta base
        possiblePaths.push(path.join(BASE_PATH, requestPath));
    }
    
    // Verificar qué archivo existe
    for (const filePath of possiblePaths) {
        try {
            if (fs.existsSync(filePath)) {
                console.log(`✅ Archivo encontrado: ${filePath}`);
                return {
                    path: filePath,
                    needsDecryption: filePath.includes('encrypted') && filePath.endsWith('.enc')
                };
            }
        } catch (error) {
            continue;
        }
    }
    
    console.log(`❌ Archivo no encontrado en ninguna ubicación: ${requestPath}`);
    console.log(`   Rutas buscadas:`, possiblePaths);
    return null;
}

/**
 * Servir contenido
 */
function serveContent(res, originalRequestPath, content) {
    // Obtener extensión del archivo original (no del .enc)
    const ext = path.extname(originalRequestPath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    
    res.statusCode = 200;
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (typeof content === 'string') {
        res.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
        console.log(`✅ Sirviendo: ${path.basename(originalRequestPath)} (${mimeType}, ${Buffer.byteLength(content, 'utf8')} bytes)`);
        res.end(content, 'utf8');
    } else {
        res.setHeader('Content-Length', content.length);
        console.log(`✅ Sirviendo: ${path.basename(originalRequestPath)} (${mimeType}, ${content.length} bytes)`);
        res.end(content);
    }
}

/**
 * Manejar peticiones HTTP
 */
function handleRequest(req, res) {
    let requestUrl = req.url === '/' ? '/index.html' : req.url;
    
    // Limpiar parámetros de consulta
    requestUrl = requestUrl.split('?')[0];
    
    // Decodificar URL para manejar espacios y caracteres especiales
    try {
        requestUrl = decodeURIComponent(requestUrl);
    } catch (e) {
        console.log('⚠️ Error decodificando URL:', e.message);
        // Si hay error en decodificación, usar URL original
    }
    
    console.log(`📡 Petición: ${req.method} ${requestUrl}`);
    
    // Sanitizar la URL
    const cleanUrl = requestUrl.replace(/\.\./g, '').replace(/\/+/g, '/');
    
    // Buscar el archivo
    const fileInfo = findFile(cleanUrl);
    
    if (!fileInfo) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('📄 Archivo no encontrado');
        return;
    }
    
    // Leer el archivo
    const encoding = fileInfo.needsDecryption ? 'utf8' : null;
    
    fs.readFile(fileInfo.path, encoding, (err, content) => {
        if (err) {
            console.log(`❌ Error leyendo archivo: ${err.message}`);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('❌ Error interno del servidor');
            return;
        }
        
        let finalContent = content;
        
        // Desencriptar si es necesario
        if (fileInfo.needsDecryption) {
            console.log(`🔓 Desencriptando: ${path.basename(fileInfo.path)}`);
            finalContent = decryptContent(content);
            
            if (!finalContent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('❌ Error desencriptando archivo');
                return;
            }
        }
        
        serveContent(res, cleanUrl, finalContent);
    });
}

/**
 * Verificar si un puerto está disponible
 */
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, () => {
            server.once('close', () => resolve(true));
            server.close();
        });
        server.on('error', () => resolve(false));
    });
}

/**
 * Buscar puerto disponible
 */
async function findAvailablePort(startPort = SERVER_CONFIG.DEFAULT_PORT) {
    for (let i = 0; i < SERVER_CONFIG.MAX_PORT_ATTEMPTS; i++) {
        const port = startPort + i;
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    throw new Error('No se pudo encontrar un puerto disponible');
}

/**
 * Abrir navegador
 */
function openBrowser(url) {
    const platform = process.platform;
    const command = platform === 'win32' ? 'start' : 
                   platform === 'darwin' ? 'open' : 'xdg-open';
    
    exec(`${command} ${url}`, (error) => {
        if (error) {
            console.log('⚠️  No se pudo abrir el navegador automáticamente');
            console.log(`🌐 Abra manualmente: ${url}`);
        }
    });
}

/**
 * Iniciar servidor
 */
async function startServer() {
    try {
        const port = await findAvailablePort();
        const server = http.createServer(handleRequest);
        
        // Configurar timeouts
        server.timeout = SERVER_CONFIG.TIMEOUT;
        server.keepAliveTimeout = SERVER_CONFIG.TIMEOUT;
        server.headersTimeout = SERVER_CONFIG.TIMEOUT;
        
        server.listen(port, () => {
            const url = `http://localhost:${port}`;
            
            console.log('');
            console.log(`🚀 Servidor iniciado en: ${url}`);
            console.log(`📂 Sirviendo desde: ${BASE_PATH}`);
            console.log('🌐 Abriendo navegador...');
            console.log('');
            console.log('📌 Para cerrar la aplicación:');
            console.log('   - Presiona Ctrl+C o cierra esta ventana');
            console.log('');
            
            openBrowser(url);
        });
        
        server.on('error', (error) => {
            console.error('❌ Error del servidor:', error.message);
            process.exit(1);
        });
        
        // Manejo de cierre elegante
        process.on('SIGINT', () => {
            console.log('');
            console.log('🔒 Cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
                console.log('👋 ¡Hasta pronto, aventurero!');
                process.exit(0);
            });
        });
        
        process.on('SIGTERM', () => {
            server.close(() => process.exit(0));
        });
        
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error.message);
        process.exit(1);
    }
}

// Iniciar la aplicación
startServer();