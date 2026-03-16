#!/usr/bin/env node
/**
 * Encriptador de Archivos HTML/CSS/JS/JSON
 * Sistema de protección avanzada para contenido web
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuración de encriptación
const ENCRYPTION_CONFIG = {
    algorithm: 'aes-256-cbc',
    key: crypto.scryptSync('EliteDeDios_2025_ClaveEncriptada_32bits!', 'salt', 32), // Derivar clave de 32 bytes
    secretKey: 'EliteDeDios_2025_ClaveEncriptada_32bits!' // Clave original para referencia
};

// Extensiones a encriptar
const ENCRYPT_EXTENSIONS = ['.html', '.css', '.js', '.json'];

/**
 * Encripta contenido usando AES-256-CBC
 */
function encryptContent(content) {
    const iv = crypto.randomBytes(16); // Vector de inicialización aleatorio
    const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, ENCRYPTION_CONFIG.key, iv);
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combinar IV + contenido encriptado
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Desencripta contenido
 */
function decryptContent(encryptedContent) {
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
}

/**
 * Procesa un archivo para encriptación
 */
function processFile(filePath, outputDir) {
    try {
        console.log(`🔐 Encriptando: ${filePath}`);
        
        // Leer archivo original
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Encriptar contenido
        const encrypted = encryptContent(content);
        
        // Crear estructura de directorio en salida
        const relativePath = path.relative('.', filePath);
        const outputPath = path.join(outputDir, relativePath + '.enc');
        const outputDirPath = path.dirname(outputPath);
        
        if (!fs.existsSync(outputDirPath)) {
            fs.mkdirSync(outputDirPath, { recursive: true });
        }
        
        // Guardar archivo encriptado
        fs.writeFileSync(outputPath, encrypted);
        
        console.log(`✅ Guardado: ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Escanea directorio y encripta archivos
 */
function encryptDirectory(sourceDir, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    let processedFiles = 0;
    
    function scanDir(dir) {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (stat.isFile()) {
                const ext = path.extname(fullPath).toLowerCase();
                if (ENCRYPT_EXTENSIONS.includes(ext)) {
                    if (processFile(fullPath, outputDir)) {
                        processedFiles++;
                    }
                }
            }
        });
    }
    
    scanDir(sourceDir);
    return processedFiles;
}

/**
 * Función principal
 */
function main() {
    console.log('🔐 ENCRIPTADOR DE ARCHIVOS HTML/CSS/JS/JSON');
    console.log('==========================================');
    console.log('');
    
    const sourceDir = '.';
    const outputDir = './encrypted';
    
    console.log(`📂 Directorio fuente: ${sourceDir}`);
    console.log(`📂 Directorio destino: ${outputDir}`);
    console.log(`🔑 Algoritmo: ${ENCRYPTION_CONFIG.algorithm}`);
    console.log('');
    
    // Crear directorio de salida
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true });
    }
    
    // Encriptar archivos
    const processed = encryptDirectory(sourceDir, outputDir);
    
    console.log('');
    console.log('📊 RESUMEN:');
    console.log(`✅ Archivos procesados: ${processed}`);
    console.log(`📁 Archivos encriptados en: ${outputDir}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Guarda la clave de encriptación de forma segura');
    console.log(`🔑 Clave: ${ENCRYPTION_CONFIG.secretKey}`);
}

// Exportar funciones para uso en servidor
module.exports = {
    encryptContent,
    decryptContent,
    ENCRYPTION_CONFIG
};

// Ejecutar si se llama directamente
if (require.main === module) {
    main();
}