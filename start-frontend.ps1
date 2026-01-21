# Script para iniciar el Frontend del Sistema ECE
# Requiere: Node.js instalado con dependencias

Write-Host "🎨 Iniciando Frontend del Sistema ECE..." -ForegroundColor Cyan
Write-Host ""

# Navegar al directorio del frontend
Set-Location -Path "$PSScriptRoot\Front-End"

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias de npm..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "✅ Dependencias listas" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Iniciando servidor Vite en http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

# Iniciar el servidor de desarrollo
npm run dev
