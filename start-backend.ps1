# Script para iniciar el Backend del Sistema ECE
# Requiere: Python con entorno virtual configurado y PostgreSQL activo

Write-Host "🚀 Iniciando Backend del Sistema ECE..." -ForegroundColor Cyan
Write-Host ""

# Navegar al directorio del backend
Set-Location -Path "$PSScriptRoot\BackEnd"

# Verificar que PostgreSQL esté corriendo
Write-Host "🔍 Verificando PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "✅ PostgreSQL está activo" -ForegroundColor Green
} else {
    Write-Host "⚠️ PostgreSQL podría no estar activo. Verifica el servicio." -ForegroundColor Yellow
}

# Buscar el entorno virtual
$venvPaths = @(
    "$PSScriptRoot\.venv\Scripts\python.exe",
    "$PSScriptRoot\BackEnd\.venv\Scripts\python.exe",
    "C:\Users\Dell\Desktop\Proyecto\.venv\Scripts\python.exe"
)

$pythonPath = $null
foreach ($path in $venvPaths) {
    if (Test-Path $path) {
        $pythonPath = $path
        break
    }
}

if (-not $pythonPath) {
    # Usar python del sistema
    $pythonPath = "python"
    Write-Host "⚠️ Usando Python del sistema (no se encontró entorno virtual)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Usando entorno virtual: $pythonPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "📡 Iniciando servidor Django en http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "   Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

# Iniciar el servidor
& $pythonPath manage.py runserver
