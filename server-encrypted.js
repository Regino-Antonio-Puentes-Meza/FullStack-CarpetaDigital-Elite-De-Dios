#!/usr/bin/env node
/**
 * Elíte de Dios - Servidor Web con Encriptación
 * Archivo Digital del Santuario
 * Servidor HTTP con desencriptación en tiempo real
 * Máxima protección de contenido
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const net = require('net');
const crypto = require('crypto');

// Configuración de encriptación (debe coincidir con encrypt.js)
const ENCRYPTION_CONFIG = {
    algorithm: 'aes-256-cbc',
    key: crypto.scryptSync('EliteDeDios_2025_ClaveEncriptada_32bits!', 'salt', 32), // Derivar clave de 32 bytes
    secretKey: 'EliteDeDios_2025_ClaveEncriptada_32bits!' // Clave original para referencia
};

// Detectar si estamos en un ejecutable empaquetado
const IS_PACKAGED = typeof process.pkg !== 'undefined';
const BASE_PATH = IS_PACKAGED ? process.cwd() : __dirname;

console.log('==================================================');
console.log('  CLUB DE AVENTUREROS SEAR JASUB');
console.log('     Elíte de Dios - Archivo Digital - MODO ULTRA SEGURO');
console.log('==================================================');
console.log('');
console.log(`🔐 Encriptación: HTML/CSS/JS/JSON ACTIVADA`);
console.log(`🔒 Modo: ${IS_PACKAGED ? 'PROTEGIDO (Recursos internos)' : 'DESARROLLO'}`);
console.log(`📂 Ejecutándose desde: ${BASE_PATH}`);
console.log('');

// Configuración
const CONFIG = {
    DEFAULT_PORT: 3000,
    HOST: 'localhost',
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

// Headers de seguridad
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; img-src 'self' data: https:; font-src 'self' https: data:;"
};

// Archivos que necesitan encriptación
const ENCRYPTED_EXTENSIONS = ['.html', '.css', '.js', '.json'];

/**
 * Desencripta contenido usando AES-256-CBC
 */
function decryptContent(encryptedContent) {
    try {
        const parts = encryptedContent.split(':');
        if (parts.length !== 2) {
            throw new Error('Formato de contenido encriptado inválido');
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        const decipher = crypto.createDecipheriv(ENCRYPTION_CONFIG.algorithm, ENCRYPTION_CONFIG.key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('❌ Error desencriptando contenido:', error.message);
        return null;
    }
}

/**
 * Verifica si un archivo debe ser desencriptado
 */
function shouldDecrypt(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ENCRYPTED_EXTENSIONS.includes(ext);
}

/**
 * Función segura para obtener archivos
 */
function getSecureFile(requestPath) {
    let filePath;
    
    if (IS_PACKAGED) {
        // En ejecutable empaquetado, usar el directorio donde está el .exe
        filePath = path.join(process.cwd(), requestPath);
    } else {
        filePath = path.join(BASE_PATH, requestPath);
    }
    
    // Normalizar y verificar la ruta
    const normalizedPath = path.normalize(filePath);
    const allowedBase = IS_PACKAGED ? process.cwd() : BASE_PATH;
    
    // Verificar que no se salga del directorio permitido
    if (!normalizedPath.startsWith(path.normalize(allowedBase))) {
        console.log(`🚫 Intento de acceso fuera del directorio: ${requestPath}`);
        return null;
    }
    
    return normalizedPath;
}

/**
 * Maneja peticiones con desencriptación automática
 */
function handleEncryptedRequest(req, res) {
    let requestUrl = req.url === '/' ? '/index.html' : req.url;
    
    console.log(`📡 Petición: ${req.method} ${requestUrl}`);
    
    // Sanitizar la URL
    const cleanUrl = requestUrl.replace(/\.\./g, '').replace(/\/+/g, '/');
    let filePath = getSecureFile(cleanUrl);
    
    if (!filePath) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('🚫 Acceso denegado');
        return;
    }
    
    // Verificar si el archivo necesita desencriptación
    const needsDecryption = shouldDecrypt(filePath);
    let encryptedPath;
    
    if (needsDecryption) {
        // Buscar archivos encriptados en la carpeta 'encrypted'
        const relativePath = path.relative(IS_PACKAGED ? process.cwd() : BASE_PATH, filePath);
        encryptedPath = path.join(IS_PACKAGED ? process.cwd() : BASE_PATH, 'encrypted', relativePath + '.enc');
    } else {
        encryptedPath = filePath;
    }
    
    // Intentar leer el archivo (encriptado o normal)
    fs.readFile(needsDecryption ? encryptedPath : filePath, needsDecryption ? 'utf8' : null, (err, content) => {
        if (err) {
            // Si no existe el archivo encriptado, intentar el original
            if (needsDecryption && err.code === 'ENOENT') {
                fs.readFile(filePath, 'utf8', (originalErr, originalContent) => {
                    if (originalErr) {
                        console.log(`❌ Archivo no encontrado: ${filePath}`);
                        res.statusCode = 404;
                        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                        res.end('📄 Archivo no encontrado');
                        return;
                    }
                    
                    // Servir archivo original sin encriptar
                    serveContent(res, filePath, originalContent);
                });
                return;
            }
            
            console.log(`❌ Archivo no encontrado: ${filePath}`);
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('📄 Archivo no encontrado');
            return;
        }
        
        let finalContent = content;
        
        // Desencriptar si es necesario
        if (needsDecryption) {
            console.log(`🔓 Desencriptando: ${path.basename(filePath)}`);
            finalContent = decryptContent(content);
            
            if (!finalContent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('❌ Error desencriptando archivo');
                return;
            }
        }
        
        serveContent(res, filePath, finalContent);
    });
}

/**
 * Sirve contenido al cliente
 */
function serveContent(res, filePath, content) {
    // Determinar tipo de contenido
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Configurar headers
    res.setHeader('Content-Type', contentType);
    
    if (typeof content === 'string') {
        res.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
    } else {
        res.setHeader('Content-Length', content.length);
    }
    
    // Headers de seguridad (excepto para PDFs)
    if (ext !== '.pdf') {
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
    } else {
        res.setHeader('Content-Disposition', 'inline');
    }
    
    // Servir el archivo
    res.statusCode = 200;
    res.end(content);
    
    const size = typeof content === 'string' ? Buffer.byteLength(content, 'utf8') : content.length;
    console.log(`✅ Sirviendo: ${path.basename(filePath)} (${contentType}, ${size} bytes)`);
}

/**
 * Encuentra un puerto libre
 */
async function findFreePort(startPort) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        
        server.on('error', () => {
            console.log(`Puerto ${startPort} ocupado, probando ${startPort + 1}...`);
            resolve(findFreePort(startPort + 1));
        });
    });
}

/**
 * Inicia el servidor encriptado
 */
async function startEncryptedServer() {
    try {
        const port = await findFreePort(CONFIG.DEFAULT_PORT);
        const server = http.createServer(handleEncryptedRequest);
        
        server.listen(port, CONFIG.HOST, () => {
            const url = `http://${CONFIG.HOST}:${port}`;
            
            console.log(`🚀 Servidor iniciado en: ${url}`);
            console.log(`🔐 Desencriptación: TIEMPO REAL`);
            console.log(`🔒 Modo seguro: ${IS_PACKAGED ? 'ACTIVADO' : 'DESARROLLO'}`);
            console.log(`🌐 Abriendo navegador...`);
            console.log('');
            console.log('📌 Para cerrar la aplicación:');
            console.log('   - Presiona Ctrl+C o cierra esta ventana');
            console.log('');
            
            // Abrir navegador
            const openCommand = process.platform === 'win32' ? 'start' : 
                               process.platform === 'darwin' ? 'open' : 'xdg-open';
            exec(`${openCommand} ${url}`);
        });
        
        server.on('error', (err) => {
            console.error(`❌ Error del servidor: ${err.message}`);
            process.exit(1);
        });
        
        // Manejo de cierre elegante
        process.on('SIGINT', () => {
            console.log('\n🔒 Cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
                console.log('👋 ¡Hasta pronto, aventurero!');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error(`❌ Error iniciando servidor: ${error.message}`);
        process.exit(1);
    }
}

// Iniciar servidor
startEncryptedServer();