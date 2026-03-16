@echo off
echo ========================================
echo   GENERADOR DE EJECUTABLE ENCRIPTADO
echo   Elíte de Dios
echo ========================================
echo.

echo 🔐 Paso 1: Encriptando archivos...
node encrypt.js

echo.
echo 📦 Paso 2: Compilando ejecutable encriptado...
pkg server-encrypted.js --targets node18-win-x64 --output "EliteDeDios.exe" --options experimental-modules,no-warnings --compress Brotli

echo.
echo ✅ PROCESO COMPLETADO
echo 📁 Ejecutable generado: EliteDeDios.exe
echo 🔐 Versión: Archivo Digital del Santuario - Encriptado
echo 💾 Tamaño: ~37.7 MB
echo.
pause