# 🚀 Guía de Despliegue a Azure Static Web Apps

## 📋 Información del Recurso

- **Subscription ID:** `ab3262df-cd3e-489e-b24b-f948792f1348`
- **Resource Group:** `wonder_wall`
- **Región:** (a definir, recomendado: `East US 2` o `West Europe`)

---

## ⭐ Opción 1: Despliegue con GitHub Actions (RECOMENDADO)

### ✅ Ventajas:
- Despliegue automático en cada push
- Preview environments para PRs
- Rollback fácil
- Gratis con GitHub

### 📝 Pasos:

#### 1. Crear Static Web App en Azure Portal

```bash
# Opción A: Usar Azure Portal (UI)
1. Ir a https://portal.azure.com
2. Buscar "Static Web Apps"
3. Click en "+ Create"
4. Configurar:
   - Subscription: (tu suscripción)
   - Resource Group: wonder_wall
   - Name: wonderwall-frontend
   - Plan type: Free
   - Region: East US 2
   - Source: GitHub
   - GitHub Account: (autorizar)
   - Organization: pabloalt
   - Repository: frontend-worder-wall-peru
   - Branch: develop
   - Build Presets: Angular
   - App location: /
   - Api location: (dejar vacío)
   - Output location: dist/frontend/browser

# Opción B: Usar Azure CLI
az login
az staticwebapp create \
  --name wonderwall-frontend \
  --resource-group wonder_wall \
  --source https://github.com/pabloalt/frontend-worder-wall-peru \
  --location eastus2 \
  --branch develop \
  --app-location "/" \
  --output-location "dist/frontend/browser" \
  --login-with-github
```

#### 2. Obtener el Deployment Token

**Desde Azure Portal:**
1. Ir a la Static Web App creada
2. Settings → Configuration
3. Copiar el "Deployment token"

**Desde Azure CLI:**
```bash
az staticwebapp secrets list \
  --name wonderwall-frontend \
  --resource-group wonder_wall \
  --query "properties.apiKey" -o tsv
```

#### 3. Agregar Secret en GitHub

1. Ir a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: (pegar el deployment token copiado)
6. Click "Add secret"

#### 4. Configurar Environment Variables (Producción)

En Azure Portal:
1. Ir a Static Web App → Configuration
2. Agregar Application settings:
   ```
   API_URL = https://wonderwall-api.azurewebsites.net/api
   ```

#### 5. Push y Despliegue Automático

```bash
git add .github/workflows/azure-static-web-apps-deploy.yml
git commit -m "ci: Agregar workflow de despliegue a Azure Static Web Apps"
git push origin develop
```

El despliegue se iniciará automáticamente. Ver el progreso en:
- GitHub: Actions tab
- Azure Portal: Static Web App → Deployments

---

## 🔧 Opción 2: Despliegue Manual con SWA CLI

### 📦 Instalación:

```bash
npm install -g @azure/static-web-apps-cli
```

### 🚀 Despliegue:

```bash
# 1. Hacer build de producción
npm run build

# 2. Desplegar
swa deploy \
  --app-location . \
  --output-location dist/frontend/browser \
  --deployment-token <TU_DEPLOYMENT_TOKEN>
```

---

## 🌐 Opción 3: Usar Azure CLI (Manual)

```bash
# 1. Instalar Azure CLI
# https://aka.ms/installazurecliwindows

# 2. Login
az login

# 3. Build
npm run build

# 4. Desplegar
az staticwebapp deploy \
  --name wonderwall-frontend \
  --resource-group wonder_wall \
  --app-location dist/frontend/browser
```

---

## 📝 Configuración de Dominios Personalizados

### Agregar Dominio Custom:

```bash
# En Azure Portal:
1. Static Web App → Custom domains
2. Click "+ Add"
3. Ingresar dominio: wonderwall.com
4. Agregar DNS records (CNAME o A):
   - CNAME: www.wonderwall.com → <static-web-app-url>
   - TXT: asuid.wonderwall.com → <verification-id>

# Con Azure CLI:
az staticwebapp hostname set \
  --name wonderwall-frontend \
  --resource-group wonder_wall \
  --hostname wonderwall.com
```

---

## 🔐 Configuración de Autenticación (Azure AD)

Ya está configurado en `staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/admin/*",
      "allowedRoles": ["admin"]
    }
  ],
  "responseOverrides": {
    "401": {
      "redirect": "/.auth/login/aad",
      "statusCode": 302
    }
  }
}
```

### Configurar Azure AD:

1. Azure Portal → Azure Active Directory
2. App registrations → New registration
3. Configurar redirect URI: `https://<tu-app>.azurestaticapps.net/.auth/login/aad/callback`
4. En Static Web App → Authentication → Add identity provider → Azure AD

---

## 🧪 Verificar Despliegue

### URLs Generadas:

- **Producción:** `https://wonderwall-frontend-<hash>.azurestaticapps.net`
- **Preview (PR):** `https://wonderwall-frontend-<hash>-<pr-number>.azurestaticapps.net`

### Verificar Funcionalidad:

```bash
# 1. Verificar que la app carga
curl https://<tu-app>.azurestaticapps.net

# 2. Verificar routing
curl https://<tu-app>.azurestaticapps.net/dashboard

# 3. Verificar que llama al backend correcto
# Abrir DevTools → Network → Ver requests a API
```

---

## 📊 Monitoreo y Logs

### En Azure Portal:

1. Static Web App → Logs
2. Ver Application Insights (si está habilitado)
3. Ver deployment history

### Comandos útiles:

```bash
# Ver deployment history
az staticwebapp show \
  --name wonderwall-frontend \
  --resource-group wonder_wall

# Ver detalles de build
az staticwebapp build show \
  --name wonderwall-frontend \
  --resource-group wonder_wall
```

---

## 🔄 Rollback

### Desde Azure Portal:
1. Static Web App → Deployments
2. Seleccionar deployment anterior
3. Click "Activate"

### Desde GitHub:
1. Revertir commit
2. Push → se desplegará automáticamente

---

## 💰 Costos

**Azure Static Web Apps - Plan Free:**
- ✅ 100 GB bandwidth/mes
- ✅ 0.5 GB storage
- ✅ 2 custom domains
- ✅ Staging environments ilimitados
- ✅ **$0 USD/mes**

**Plan Standard (si se necesita más):**
- 100 GB bandwidth/mes incluido
- ~$9 USD/mes

---

## 🐛 Troubleshooting

### Build falla:

```bash
# Verificar node version en workflow
# Agregar en .github/workflows/azure-static-web-apps-deploy.yml:
- name: Setup Node
  uses: actions/setup-node@v3
  with:
    node-version: '20'
```

### App no carga:

1. Verificar `output_location` en workflow: `dist/frontend/browser`
2. Verificar build local: `npm run build`
3. Revisar `staticwebapp.config.json`

### API no funciona:

1. Verificar `environment.ts` tiene la URL correcta
2. Verificar CORS en el backend
3. Verificar que el backend esté desplegado

---

## 📚 Recursos

- [Azure Static Web Apps Docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [SWA CLI Docs](https://azure.github.io/static-web-apps-cli/)
- [Angular Deployment Guide](https://angular.io/guide/deployment)

---

**Última actualización:** Mayo 2, 2026
