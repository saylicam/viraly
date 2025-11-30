@echo off
echo Configuration de l'environnement Laragon...
set PATH=C:\laragon\bin\nodejs\node-v22;%PATH%
cd /d "%~dp0"

echo Verification des dependances...
if not exist node_modules (
    echo Installation des dependances...
    call npm install --legacy-peer-deps
)

echo Demarrage de l'application Expo...
call npm start

