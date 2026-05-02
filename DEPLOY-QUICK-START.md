# 🚀 Despliegue Rápido - Wonderwall Frontend

## ⭐ Opción Recomendada: GitHub Actions (Automático)

### 1️⃣ Crear Static Web App en Azure Portal

```
1. Ir a https://portal.azure.com
2. Buscar "Static Web Apps" → Create
3. Configurar:
   - Resource Group: wonder_wall
   - Name: wonderwall-frontend
   - Plan: Free
   - Region: East US 2
   - Source: GitHub
   - Repository: frontend-worder-wall-peru
   - Branch: develop
   - Build Preset: Angular
   - Output location: dist/frontend/browser
```

### 2️⃣ Copiar Deployment Token

```
Azure Portal → Static Web App → Configuration → Copy "Deployment token"
```

### 3️⃣ Agregar Secret en GitHub

```
GitHub → Settings → Secrets → New repository secret
Name: AZURE_STATIC_WEB_APPS_API_TOKEN
Value: <pegar token>
```

### 4️⃣ Push del Workflow

```bash
git add .
git commit -m "ci: Agregar workflow de Azure Static Web Apps"
git push origin develop
```

**¡Listo!** El despliegue se ejecutará automáticamente en cada push.

---

## 🔧 Opción Alternativa: Despliegue Manual

### Con Script PowerShell:

```powershell
npm run deploy:azure
```

### Con Azure CLI:

```bash
# 1. Login
az login

# 2. Build
npm run build:prod

# 3. Deploy
az staticwebapp deploy \
  --name wonderwall-frontend \
  --resource-group wonder_wall \
  --app-location dist/frontend/browser
```

---

## 📚 Documentación Completa

Ver [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) para instrucciones detalladas.

---

## 🌐 URLs

- **Producción:** `https://wonderwall-frontend-<hash>.azurestaticapps.net`
- **Portal Azure:** https://portal.azure.com/#resource/subscriptions/ab3262df-cd3e-489e-b24b-f948792f1348/resourceGroups/wonder_wall

---

## 💰 Costos

**Plan Free:** $0 USD/mes
- 100 GB bandwidth
- 0.5 GB storage
- 2 custom domains
