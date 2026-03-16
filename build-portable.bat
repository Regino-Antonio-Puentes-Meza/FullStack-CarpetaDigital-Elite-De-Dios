@echo off
cls
echo ============================================
echo     ELÍTE DE DIOS - CONSTRUCTOR PORTABLE
echo ============================================
echo.

REM Crear directorio portable
set PORTABLE_DIR=EliteDeDios_Portable
echo 📁 Creando directorio portable: %PORTABLE_DIR%
if exist "%PORTABLE_DIR%" rmdir /s /q "%PORTABLE_DIR%"
mkdir "%PORTABLE_DIR%"

:: Encriptar archivos
echo 🔐 Encriptando archivos...
call npm run encrypt

:: Crear ejecutable
echo 🔧 Compilando ejecutable...
call pkg server-portable.js --targets node18-win-x64 --output "%PORTABLE_DIR%\EliteDeDios.exe" --compress Brotli

:: Copiar solo archivos encriptados y imágenes
echo 📂 Copiando archivos encriptados...
xcopy "encrypted" "%PORTABLE_DIR%\encrypted" /E /I /H /Y

:: Copiar solo imágenes (no encriptadas) desde assets
echo �️ Copiando imágenes sin encriptar...
mkdir "%PORTABLE_DIR%\assets\img" 2>nul
xcopy "assets\img\*.svg" "%PORTABLE_DIR%\assets\img\" /S /Y 2>nul
xcopy "assets\img\*.png" "%PORTABLE_DIR%\assets\img\" /S /Y 2>nul
xcopy "assets\img\*.jpg" "%PORTABLE_DIR%\assets\img\" /S /Y 2>nul
xcopy "assets\img\*.jpeg" "%PORTABLE_DIR%\assets\img\" /S /Y 2>nul
xcopy "assets\img\*.gif" "%PORTABLE_DIR%\assets\img\" /S /Y 2>nul
xcopy "assets\img\*.ico" "%PORTABLE_DIR%\assets\img\" /S /Y 2>nul

:: Copiar documentos PDF sin encriptar
echo 📄 Copiando documentos PDF...
mkdir "%PORTABLE_DIR%\assets\docs" 2>nul
xcopy "assets\docs\*.pdf" "%PORTABLE_DIR%\assets\docs\" /S /Y 2>nul
mkdir "%PORTABLE_DIR%\assets\pdfs" 2>nul
xcopy "assets\pdfs\*.pdf" "%PORTABLE_DIR%\assets\pdfs\" /S /Y 2>nul

echo ⚠️ NOTA: HTML, CSS, JS y JSON están encriptados en la carpeta 'encrypted'

:: Crear script de inicio
echo 📝 Creando script de inicio...
echo @echo off > "%PORTABLE_DIR%\Iniciar_EliteDeDios.bat"
echo cls >> "%PORTABLE_DIR%\Iniciar_EliteDeDios.bat"
echo echo ============================================ >> "%PORTABLE_DIR%\Iniciar_EliteDeDios.bat"
echo echo   ELÍTE DE DIOS >> "%PORTABLE_DIR%\Iniciar_EliteDeDios.bat"
echo echo      Archivo Digital del Santuario v2.0 >> "%PORTABLE_DIR%\Iniciar_EliteDeDios.bat"
echo echo ============================================ >> "%PORTABLE_DIR%\Iniciar_EliteDeDios.bat"
echo echo. >> "%PORTABLE_DIR%\Iniciar_EliteDeDios.bat"
echo echo 🚀 Iniciando servidor... >> "%PORTABLE_DIR%\Iniciar_EliteDeDios.bat"
echo start "" "EliteDeDios.exe" >> "%PORTABLE_DIR%\Iniciar_EliteDeDios.bat"

:: Crear archivo README
echo 📋 Creando documentación...
echo ELÍTE DE DIOS > "%PORTABLE_DIR%\README.txt"
echo Archivo Digital del Santuario v2.0 >> "%PORTABLE_DIR%\README.txt"
echo ================================ >> "%PORTABLE_DIR%\README.txt"
echo. >> "%PORTABLE_DIR%\README.txt"
echo INSTRUCCIONES DE USO: >> "%PORTABLE_DIR%\README.txt"
echo 1. Ejecutar "Iniciar_EliteDeDios.bat" >> "%PORTABLE_DIR%\README.txt"
echo 2. El navegador se abrirá automáticamente >> "%PORTABLE_DIR%\README.txt"
echo 3. Para cerrar, presionar Ctrl+C en la ventana del servidor >> "%PORTABLE_DIR%\README.txt"
echo. >> "%PORTABLE_DIR%\README.txt"
echo CONTENIDO: >> "%PORTABLE_DIR%\README.txt"
echo - EliteDeDios.exe: Aplicación principal >> "%PORTABLE_DIR%\README.txt"
echo - assets/img/: Imágenes (SVG, PNG, JPG) sin encriptar >> "%PORTABLE_DIR%\README.txt"
echo - assets/docs/ y assets/pdfs/: Documentos PDF sin encriptar >> "%PORTABLE_DIR%\README.txt"
echo - encrypted/: TODOS los archivos HTML, CSS, JS y JSON encriptados >> "%PORTABLE_DIR%\README.txt"
echo. >> "%PORTABLE_DIR%\README.txt"
echo SEGURIDAD: >> "%PORTABLE_DIR%\README.txt"
echo - Código fuente completamente protegido con AES-256-CBC >> "%PORTABLE_DIR%\README.txt"
echo - Solo imágenes y PDFs accesibles directamente >> "%PORTABLE_DIR%\README.txt"

echo.
echo ✅ CONSTRUCCIÓN COMPLETADA
echo 📁 Carpeta portable creada: %PORTABLE_DIR%
echo 🚀 Para usar: Ejecutar "%PORTABLE_DIR%\Iniciar_EliteDeDios.bat"
echo.
pause