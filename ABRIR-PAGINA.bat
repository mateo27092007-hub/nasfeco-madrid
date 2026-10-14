@echo off
title NASFECO Madrid - pagina local
cd /d "%~dp0"
echo.
echo  NASFECO Madrid - vista local (no se publica en internet)
echo  Se abre en: http://127.0.0.1:8765/
echo.
echo  Para apagarla, cierra esta ventana.
echo.
where python >nul 2>nul
if errorlevel 1 (
  echo  No se encontro Python. Instalalo desde https://www.python.org/downloads/ y vuelve a abrir este archivo.
  pause
  exit /b
)
start "" cmd /c "timeout /t 2 /nobreak >nul & start "" http://127.0.0.1:8765/"
python _build\serve.py
pause
