# Script de Despliegue a Azure Static Web Apps
# Wonderwall Frontend

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "wonder_wall",

    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppName = "wonderwall-frontend",

    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus2"
)

Write-Host "🚀 Wonderwall - Despliegue a Azure Static Web Apps" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si está logueado en Azure
Write-Host "📋 Verificando sesión de Azure..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "❌ No estás logueado en Azure" -ForegroundColor Red
    Write-Host "Ejecutando az login..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al hacer login" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Logueado como: $($account.user.name)" -ForegroundColor Green
Write-Host ""

# Verificar si existe el Resource Group
Write-Host "📋 Verificando Resource Group: $ResourceGroup..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "false") {
    Write-Host "❌ El Resource Group '$ResourceGroup' no existe" -ForegroundColor Red
    Write-Host "¿Deseas crearlo? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host "Creando Resource Group..." -ForegroundColor Yellow
        az group create --name $ResourceGroup --location $Location
        Write-Host "✅ Resource Group creado" -ForegroundColor Green
    } else {
        Write-Host "❌ Abortando despliegue" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Resource Group existe" -ForegroundColor Green
Write-Host ""

# Verificar si existe la Static Web App
Write-Host "📋 Verificando Static Web App: $StaticWebAppName..." -ForegroundColor Yellow
$swaExists = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroup 2>$null
if (-not $swaExists) {
    Write-Host "⚠️  La Static Web App '$StaticWebAppName' no existe" -ForegroundColor Yellow
    Write-Host "Se debe crear primero desde Azure Portal o con Azure CLI" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opción 1: Azure Portal" -ForegroundColor Cyan
    Write-Host "  https://portal.azure.com → Static Web Apps → Create" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Opción 2: Azure CLI" -ForegroundColor Cyan
    Write-Host "  az staticwebapp create --name $StaticWebAppName --resource-group $ResourceGroup --location $Location --source https://github.com/pabloalt/frontend-worder-wall-peru --branch develop" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
Write-Host "✅ Static Web App existe" -ForegroundColor Green
Write-Host ""

# Build de producción
Write-Host "🔨 Compilando aplicación Angular..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al compilar la aplicación" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Compilación exitosa" -ForegroundColor Green
Write-Host ""

# Verificar que existe la carpeta de build
if (-not (Test-Path "dist/frontend/browser")) {
    Write-Host "❌ No se encontró la carpeta de build: dist/frontend/browser" -ForegroundColor Red
    exit 1
}

# Obtener deployment token
Write-Host "🔑 Obteniendo deployment token..." -ForegroundColor Yellow
$deploymentToken = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroup --query "properties.apiKey" -o tsv
if (-not $deploymentToken) {
    Write-Host "❌ Error al obtener deployment token" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Token obtenido" -ForegroundColor Green
Write-Host ""

# Desplegar
Write-Host "🚀 Desplegando a Azure Static Web Apps..." -ForegroundColor Yellow
Write-Host "   Esto puede tomar varios minutos..." -ForegroundColor Gray

# Verificar si swa CLI está instalado
$swaInstalled = Get-Command swa -ErrorAction SilentlyContinue
if (-not $swaInstalled) {
    Write-Host "⚠️  SWA CLI no está instalado" -ForegroundColor Yellow
    Write-Host "¿Deseas instalarlo? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        npm install -g @azure/static-web-apps-cli
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error al instalar SWA CLI" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ SWA CLI es necesario para el despliegue" -ForegroundColor Red
        exit 1
    }
}

# Ejecutar despliegue
swa deploy dist/frontend/browser `
    --deployment-token $deploymentToken `
    --env production

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error durante el despliegue" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ ¡Despliegue exitoso!" -ForegroundColor Green
Write-Host ""

# Obtener URL de la app
Write-Host "📍 Obteniendo URL de la aplicación..." -ForegroundColor Yellow
$swaInfo = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroup | ConvertFrom-Json
$url = "https://$($swaInfo.defaultHostname)"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "✨ Despliegue Completado" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URL de la aplicación:" -ForegroundColor Cyan
Write-Host "   $url" -ForegroundColor White
Write-Host ""
Write-Host "📊 Ver deployments:" -ForegroundColor Cyan
Write-Host "   https://portal.azure.com/#resource/subscriptions/ab3262df-cd3e-489e-b24b-f948792f1348/resourceGroups/$ResourceGroup/providers/Microsoft.Web/staticSites/$StaticWebAppName/staticsite" -ForegroundColor Gray
Write-Host ""
Write-Host "🔍 Ver logs en tiempo real:" -ForegroundColor Cyan
Write-Host "   az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroup" -ForegroundColor Gray
Write-Host ""

# Preguntar si desea abrir en navegador
Write-Host "¿Deseas abrir la aplicación en el navegador? (S/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "S" -or $response -eq "s") {
    Start-Process $url
}

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green
