#!/usr/bin/env node
/**
 * Elíte de Dios - Versión Ultra Segura
 * Archivo Digital del Santuario
 * Todos los recursos están empaquetados internamente
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const net = require('net');

// Detectar si estamos ejecutando desde ejecutable empaquetado
const IS_PACKAGED = typeof process.pkg !== 'undefined';
const BASE_PATH = IS_PACKAGED ? path.dirname(process.execPath) : __dirname;

// En modo empaquetado, los archivos están internos
const RESOURCE_PATH = IS_PACKAGED ? '/' : './';

console.log('==================================================');
console.log('  CLUB DE AVENTUREROS SEAR JASUB');
console.log('     Elíte de Dios - Archivo Digital - MODO SEGURO');
console.log('==================================================');
console.log('');
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
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

/**
 * Función segura para obtener archivos
 */
function getSecureFile(requestPath) {
    let filePath;
    
    if (IS_PACKAGED) {
        // En modo empaquetado, usar rutas internas de pkg
        filePath = path.join(__dirname, requestPath);
    } else {
        // En desarrollo, usar rutas del sistema de archivos
        filePath = path.join(BASE_PATH, requestPath);
    }
    
    // Normalizar y verificar la ruta
    const normalizedPath = path.normalize(filePath);
    const allowedBase = IS_PACKAGED ? __dirname : BASE_PATH;
    
    // Verificar que no se salga del directorio permitido
    if (!normalizedPath.startsWith(path.normalize(allowedBase))) {
        console.log(`🚫 Intento de acceso fuera del directorio: ${requestPath}`);
        return null;
    }
    
    return normalizedPath;
}

/**
 * Maneja peticiones de manera segura
 */
function handleSecureRequest(req, res) {
    let requestUrl = req.url === '/' ? '/index.html' : req.url;
    
    console.log(`📡 Petición: ${req.method} ${requestUrl}`);
    
    // Sanitizar la URL
    const cleanUrl = requestUrl.replace(/\.\./g, '').replace(/\/+/g, '/');
    const filePath = getSecureFile(cleanUrl);
    
    if (!filePath) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('🚫 Acceso denegado');
        return;
    }
    
    // Intentar leer el archivo
    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.log(`❌ Archivo no encontrado: ${filePath}`);
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('📄 Archivo no encontrado');
            return;
        }
        
        // Determinar tipo de contenido
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        // Configurar headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', content.length);
        
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
        
        console.log(`✅ Sirviendo: ${path.basename(filePath)} (${contentType}, ${content.length} bytes)`);
    });
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
 * Inicia el servidor
 */
async function startSecureServer() {
    try {
        const port = await findFreePort(CONFIG.DEFAULT_PORT);
        const server = http.createServer(handleSecureRequest);
        
        server.listen(port, CONFIG.HOST, () => {
            const url = `http://${CONFIG.HOST}:${port}`;
            
            console.log(`🚀 Servidor iniciado en: ${url}`);
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
startSecureServer();