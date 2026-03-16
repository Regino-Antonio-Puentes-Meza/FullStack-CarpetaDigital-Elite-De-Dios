@echo off
title Creando Instalador - Elíte de Dios
color 0A
echo.
echo ================================================
echo   CREANDO INSTALADOR PORTABLE
echo   Elíte de Dios - Archivo Digital del Santuario v1.0
echo ================================================
echo.

REM Crear directorio de instalación
set INSTALL_DIR=EliteDeDios_Portable
if exist "%INSTALL_DIR%" (
    echo 🗑️  Limpiando instalacion anterior...
    rmdir /s /q "%INSTALL_DIR%"
)

echo 📁 Creando directorio de instalacion: %INSTALL_DIR%
mkdir "%INSTALL_DIR%"

REM Copiar ejecutable principal (ya compilado y encriptado)
echo 📋 Copiando ejecutable encriptado...
if exist "EliteDeDios.exe" (
    copy "EliteDeDios.exe" "%INSTALL_DIR%\"
    echo ✅ Ejecutable copiado correctamente
) else (
    echo ❌ Error: No se encontro EliteDeDios.exe
    echo 🔧 Ejecuta primero: npm run build
    pause
    exit /b 1
)

REM Copiar archivos web esenciales
echo 📋 Copiando archivos de la aplicacion...
copy "index.html" "%INSTALL_DIR%\"

REM Copiar directorio assets completo
echo 📋 Copiando recursos (CSS, JS, imagenes)...
xcopy "assets" "%INSTALL_DIR%\assets\" /E /I /H /Y /Q

REM Copiar directorio pages
echo 📋 Copiando paginas HTML...
xcopy "pages" "%INSTALL_DIR%\pages\" /E /I /H /Y /Q

REM Verificar si existe la carpeta pdfs y copiarla
if exist "pdfs" (
    echo 📋 Copiando documentos PDF...
    xcopy "pdfs" "%INSTALL_DIR%\pdfs\" /E /I /H /Y /Q
)

REM Crear archivo README detallado
echo 📝 Creando documentacion...
(
echo ================================================
echo  ELÍTE DE DIOS
echo     Archivo Digital del Santuario v1.0
echo ================================================
echo.
echo 🚀 INSTRUCCIONES DE USO:
echo.
echo 1. Haz doble clic en "EliteDeDios.exe"
echo 2. Espera a que aparezca la ventana del servidor
echo 3. El navegador se abrira automaticamente
echo 4. Para cerrar: cierra la ventana negra del servidor
echo.
echo 📱 CARACTERISTICAS:
echo.
echo ✅ Aplicacion 100%% portable
echo ✅ No requiere instalacion de Node.js
echo ✅ Codigo fuente protegido/encriptado
echo ✅ Compatible con Windows 7/8/10/11
echo ✅ Funciona sin conexion a internet
echo ✅ Tamaño optimizado (~15MB^)
echo.
echo 🔧 SOLUCION DE PROBLEMAS:
echo.
echo - Si no se abre el navegador, ve a: http://localhost:3000
echo - Si hay error de puerto, reinicia la aplicacion
echo - Asegurate de tener permisos de administrador si es necesario
echo.
echo 📂 ARCHIVOS INCLUIDOS:
echo.
echo EliteDeDios.exe      - Ejecutable principal
echo index.html           - Pagina de inicio
echo assets/              - Recursos ^(CSS, JS, imagenes^)
echo pages/               - Paginas adicionales
echo pdfs/                - Documentos ^(si existen^)
echo.
echo 🌐 TECNOLOGIA:
echo.
echo - Servidor HTTP integrado
echo - Interfaz web moderna
echo - Animaciones CSS3 y SVG
echo - Responsive design
echo.
echo ⚖️  LICENCIA: MIT
echo 👨‍💻 DESARROLLADO PARA: Elíte de Dios
echo 📅 VERSION: 1.0.0 - %date%
echo.
echo ================================================
echo Para soporte tecnico, contacta al administrador
echo del Archivo Digital del Santuario
echo ================================================
) > "%INSTALL_DIR%\INSTRUCCIONES.txt"

REM Crear script de verificación de integridad
echo � Creando script de verificacion...
(
echo @echo off
echo title Verificacion de Integridad - Elíte de Dios
echo echo Verificando archivos...
echo if not exist "EliteDeDios.exe" ^(
echo   echo ❌ Error: Falta el ejecutable principal
echo   pause
echo   exit /b 1
echo ^)
echo if not exist "index.html" ^(
echo   echo ❌ Error: Falta el archivo index.html
echo   pause
echo   exit /b 1
echo ^)
echo if not exist "assets" ^(
echo   echo ❌ Error: Falta la carpeta assets
echo   pause
echo   exit /b 1
echo ^)
echo echo ✅ Todos los archivos estan presentes
echo echo 🚀 Iniciando aplicacion...
echo start "" "EliteDeDios.exe"
) > "%INSTALL_DIR%\Verificar_e_Iniciar.bat"

REM Obtener tamaño del ejecutable para información
for %%A in ("EliteDeDios.exe") do set "size=%%~zA"
set /a sizeMB=%size%/1024/1024

echo.
echo ✅ ¡INSTALACION PORTABLE COMPLETADA!
echo.
echo 🔠 ESTADISTICAS:
echo    📁 Directorio: %INSTALL_DIR%\
echo    🔍 Tamaño ejecutable: %sizeMB% MB
echo    📦 Archivos copiados: HTML, CSS, JS, imagenes, PDFs
echo.
echo 🎏 SIGUIENTES PASOS:
echo    1. Prueba la aplicacion ejecutando "%INSTALL_DIR%\EliteDeDios.exe"
echo    2. Lee las instrucciones en "%INSTALL_DIR%\INSTRUCCIONES.txt"
echo    3. Distribuye la carpeta completa a otros usuarios
echo.
echo 💡 NOTA: Esta aplicacion es completamente PORTABLE
echo    Puedes copiar toda la carpeta a cualquier PC Windows
echo    y funcionara sin necesidad de instalaciones adicionales.
echo.
echo 🔒 El codigo fuente esta protegido y encriptado.
echo.

REM Preguntar si desea abrir la carpeta
set /p "abrir=¿Deseas abrir la carpeta de instalacion? (S/N): "
if /i "%abrir%"=="S" (
    explorer "%INSTALL_DIR%"
)

echo.
echo 🎉 ¡Listo para usar!
pause