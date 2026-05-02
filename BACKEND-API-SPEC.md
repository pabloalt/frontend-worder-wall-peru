# Especificación API Backend - Wonderwall

**Fecha:** Mayo 2026  
**Versión:** 2.0  
**URL Base (Desarrollo):** `http://localhost:7211/api`  
**URL Base (Producción):** `https://wonderwall-api.azurewebsites.net/api`

---

## 📋 Índice

1. [Autenticación y Seguridad](#autenticación-y-seguridad)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [Migración de Datos](#migración-de-datos)
4. [Endpoints - Clientes](#endpoints---clientes)
5. [Endpoints - Tokens](#endpoints---tokens)
6. [Endpoints - Pedidos](#endpoints---pedidos)
7. [Reglas de Negocio](#reglas-de-negocio)
8. [Manejo de Errores](#manejo-de-errores)

---

## 🔐 Autenticación y Seguridad

### **Tipos de Autenticación**

Este sistema usa **DOS** métodos de autenticación diferentes según el endpoint:

#### **1️⃣ Autenticación de Admin (Bearer Token)**

**Usado en:**
- ✅ GET /api/clientes
- ✅ GET /api/clientes/{id}
- ✅ PUT /api/clientes/{id}
- ✅ POST /api/clientes (cuando se crea desde panel interno)
- ✅ POST /api/tokens
- ✅ POST /api/pedidos ⭐ **SIEMPRE requiere admin**
- ✅ GET /api/pedidos
- ✅ GET /api/pedidos/{id}

**Header requerido:**
```
Authorization: Bearer {admin_token}
```

**Características:**
- Token de larga duración
- Usado para acciones administrativas
- Identifica al usuario administrador
- Sin fecha de expiración (o muy larga)

---

#### **2️⃣ Token de Cliente (One-Time Token)**

**Usado en:**
- ✅ POST /api/clientes (cuando se crea desde enlace público)
- ✅ GET /api/tokens/{token}/validar

**Campo en body:**
```json
{
  "token": "abc123xyz789"
}
```

**Características:**
- Token de corta duración (24 horas)
- Un solo uso (se marca como usado al crear cliente)
- Generado por admin para compartir enlace público
- Valida automáticamente en POST /api/clientes

**Flujo de uso:**
1. Admin genera token → `POST /api/tokens`
2. Admin comparte enlace → `https://wonderwall.com/registro-cliente?token=abc123`
3. Cliente valida token → `GET /api/tokens/abc123/validar`
4. Cliente registra datos → `POST /api/clientes` (con `token` en body)
5. Sistema marca token como usado ✅

---

### **⚠️ Diferencias Clave**

| Endpoint | Página | Tipo de Autenticación | Requiere |
|----------|--------|----------------------|----------|
| **POST /api/clientes** | Pública (`/registro-cliente`) | Token de Cliente | `token` en body |
| **POST /api/clientes** | Interna (`/clientes`) | Admin Token | `Authorization` header |
| **POST /api/pedidos** | Interna (`/formulario`) | Admin Token | `Authorization` header ⭐ |
| **POST /api/tokens** | Interna (`/clientes`) | Admin Token | `Authorization` header |

**Regla importante:**
- 🔵 **POST /api/clientes** → Acepta 2 formas (token de cliente O admin token)
- 🔴 **POST /api/pedidos** → SOLO acepta admin token (no usa token de cliente)

---

## 🗄️ Estructura de Base de Datos

### **Tabla: Clientes**

```sql
CREATE TABLE Clientes (
    Id BIGINT PRIMARY KEY,
    TipoDocumento NVARCHAR(20) NOT NULL,
    NumeroDocumento NVARCHAR(20) NOT NULL,
    Nombres NVARCHAR(100) NOT NULL,
    ApellidoPaterno NVARCHAR(100) NOT NULL,
    ApellidoMaterno NVARCHAR(100),
    FechaCumpleanios DATETIME2,
    FechaBoda DATETIME2 NOT NULL,
    Celular NVARCHAR(15),
    Email NVARCHAR(100),
    CreadoEn DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModificadoEn DATETIME2,
    CONSTRAINT UQ_Clientes_NumeroDocumento UNIQUE (NumeroDocumento)
);

CREATE INDEX IX_Clientes_NumeroDocumento ON Clientes(NumeroDocumento);
CREATE INDEX IX_Clientes_CreadoEn ON Clientes(CreadoEn DESC);
```

**Cambios respecto a versión anterior:**
- ✅ Se agregó columna `ModificadoEn`
- ❌ Se eliminarán columnas de logística (`Logistica_*`)

---

### **Tabla: LogisticaCliente** ⭐ NUEVA

```sql
CREATE TABLE LogisticaCliente (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    ClienteId BIGINT NOT NULL,
    NombreLocal NVARCHAR(200),
    Direccion NVARCHAR(300),
    UbicacionMaps NVARCHAR(500),
    HoraLlegada NVARCHAR(10),
    CreadoEn DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModificadoEn DATETIME2,
    CONSTRAINT FK_LogisticaCliente_Cliente FOREIGN KEY (ClienteId) 
        REFERENCES Clientes(Id) ON DELETE CASCADE
);

CREATE INDEX IX_LogisticaCliente_ClienteId ON LogisticaCliente(ClienteId);
```

**Propósito:**
- Separar la información de logística de la tabla principal de clientes
- Permitir tracking independiente de creación/modificación
- Facilitar consultas y mantenimiento

---

### **Tabla: Tokens** ⭐ NUEVA

```sql
CREATE TABLE Tokens (
    Token NVARCHAR(100) PRIMARY KEY,
    ExpiraEn DATETIME2 NOT NULL,
    Usado BIT NOT NULL DEFAULT 0,
    UsadoEn DATETIME2,
    ClienteIdCreado BIGINT,
    CreadoEn DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Tokens_Cliente FOREIGN KEY (ClienteIdCreado) 
        REFERENCES Clientes(Id) ON DELETE SET NULL
);

CREATE INDEX IX_Tokens_ExpiraEn ON Tokens(ExpiraEn);
CREATE INDEX IX_Tokens_Usado ON Tokens(Usado);
```

**Propósito:**
- Controlar acceso temporal a la página de registro de clientes
- Prevenir registros no autorizados
- Permitir auditoría de quién creó cada cliente

---

### **Tablas Existentes: Pedidos**

Las tablas de pedidos se mantienen sin cambios:
- `Pedidos`
- `DetallesPedido`
- `Pagos`
- `CuotasPago`
- `LogisticaPedido`

---

## 🔄 Migración de Datos

### **Script de Migración**

```sql
-- ========================================
-- PASO 1: Crear nuevas tablas
-- ========================================

-- Crear tabla LogisticaCliente
CREATE TABLE LogisticaCliente (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    ClienteId BIGINT NOT NULL,
    NombreLocal NVARCHAR(200),
    Direccion NVARCHAR(300),
    UbicacionMaps NVARCHAR(500),
    HoraLlegada NVARCHAR(10),
    CreadoEn DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModificadoEn DATETIME2,
    CONSTRAINT FK_LogisticaCliente_Cliente FOREIGN KEY (ClienteId) 
        REFERENCES Clientes(Id) ON DELETE CASCADE
);

-- Crear tabla Tokens
CREATE TABLE Tokens (
    Token NVARCHAR(100) PRIMARY KEY,
    ExpiraEn DATETIME2 NOT NULL,
    Usado BIT NOT NULL DEFAULT 0,
    UsadoEn DATETIME2,
    ClienteIdCreado BIGINT,
    CreadoEn DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Tokens_Cliente FOREIGN KEY (ClienteIdCreado) 
        REFERENCES Clientes(Id) ON DELETE SET NULL
);

-- ========================================
-- PASO 2: Agregar columna ModificadoEn
-- ========================================

ALTER TABLE Clientes ADD ModificadoEn DATETIME2;

-- ========================================
-- PASO 3: Migrar datos de logística
-- ========================================

INSERT INTO LogisticaCliente (ClienteId, NombreLocal, Direccion, UbicacionMaps, HoraLlegada, CreadoEn)
SELECT 
    Id,
    Logistica_NombreLocal,
    Logistica_Direccion,
    Logistica_UbicacionMaps,
    Logistica_HoraLlegada,
    CreadoEn
FROM Clientes
WHERE Logistica_NombreLocal IS NOT NULL 
   OR Logistica_Direccion IS NOT NULL 
   OR Logistica_UbicacionMaps IS NOT NULL 
   OR Logistica_HoraLlegada IS NOT NULL;

-- ========================================
-- PASO 4: Eliminar columnas antiguas
-- ========================================

ALTER TABLE Clientes DROP COLUMN Logistica_NombreLocal;
ALTER TABLE Clientes DROP COLUMN Logistica_Direccion;
ALTER TABLE Clientes DROP COLUMN Logistica_UbicacionMaps;
ALTER TABLE Clientes DROP COLUMN Logistica_HoraLlegada;

-- ========================================
-- PASO 5: Crear índices
-- ========================================

CREATE INDEX IX_Clientes_NumeroDocumento ON Clientes(NumeroDocumento);
CREATE INDEX IX_Clientes_CreadoEn ON Clientes(CreadoEn DESC);
CREATE INDEX IX_LogisticaCliente_ClienteId ON LogisticaCliente(ClienteId);
CREATE INDEX IX_Tokens_ExpiraEn ON Tokens(ExpiraEn);
CREATE INDEX IX_Tokens_Usado ON Tokens(Usado);

-- ========================================
-- PASO 6: Verificación
-- ========================================

-- Verificar que la migración fue exitosa
SELECT 
    'Clientes' AS Tabla,
    COUNT(*) AS TotalRegistros
FROM Clientes
UNION ALL
SELECT 
    'LogisticaCliente',
    COUNT(*)
FROM LogisticaCliente;

-- Verificar integridad
SELECT c.Id, c.Nombres, l.Id AS LogisticaId
FROM Clientes c
LEFT JOIN LogisticaCliente l ON c.Id = l.ClienteId;
```

---

## 📡 Endpoints - Clientes

### **GET /api/clientes**

Obtener todos los clientes con su información de logística.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:** Ninguno

**Response: 200 OK**

```json
[
  {
    "id": 1777689454787,
    "tipoDocumento": "DNI",
    "numeroDocumento": "21492882",
    "nombres": "NERY",
    "apellidoPaterno": "GERONIMO",
    "apellidoMaterno": "TORRES",
    "fechaCumpleanios": "1960-05-26T05:00:00.000Z",
    "fechaBoda": "2026-05-26T05:00:00.000Z",
    "celular": "967652359",
    "email": "NERI@GMAIL.COM",
    "creadoEn": "2026-05-02T02:37:34.788Z",
    "modificadoEn": null,
    "logistica": {
      "id": 1,
      "clienteId": 1777689454787,
      "nombreLocal": "SALÓN LOS JARDINES",
      "direccion": "AV. PRINCIPAL 123",
      "ubicacionMaps": "https://maps.google.com/...",
      "horaLlegada": "18:00",
      "creadoEn": "2026-05-02T02:37:34.788Z",
      "modificadoEn": null
    }
  }
]
```

**SQL Query:**
```sql
SELECT 
    c.Id,
    c.TipoDocumento,
    c.NumeroDocumento,
    c.Nombres,
    c.ApellidoPaterno,
    c.ApellidoMaterno,
    c.FechaCumpleanios,
    c.FechaBoda,
    c.Celular,
    c.Email,
    c.CreadoEn,
    c.ModificadoEn,
    l.Id AS Logistica_Id,
    l.ClienteId AS Logistica_ClienteId,
    l.NombreLocal AS Logistica_NombreLocal,
    l.Direccion AS Logistica_Direccion,
    l.UbicacionMaps AS Logistica_UbicacionMaps,
    l.HoraLlegada AS Logistica_HoraLlegada,
    l.CreadoEn AS Logistica_CreadoEn,
    l.ModificadoEn AS Logistica_ModificadoEn
FROM Clientes c
LEFT JOIN LogisticaCliente l ON c.Id = l.ClienteId
ORDER BY c.CreadoEn DESC;
```

**Errores:**
- `401 Unauthorized` - Token de autenticación inválido o expirado
- `500 Internal Server Error` - Error del servidor

---

### **GET /api/clientes/{id}**

Obtener un cliente específico por ID.

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id` (bigint) - ID del cliente

**Response: 200 OK**

```json
{
  "id": 1777689454787,
  "tipoDocumento": "DNI",
  "numeroDocumento": "21492882",
  "nombres": "NERY",
  "apellidoPaterno": "GERONIMO",
  "apellidoMaterno": "TORRES",
  "fechaCumpleanios": "1960-05-26T05:00:00.000Z",
  "fechaBoda": "2026-05-26T05:00:00.000Z",
  "celular": "967652359",
  "email": "NERI@GMAIL.COM",
  "creadoEn": "2026-05-02T02:37:34.788Z",
  "modificadoEn": null,
  "logistica": null
}
```

**SQL Query:**
```sql
SELECT 
    c.*,
    l.Id AS Logistica_Id,
    l.ClienteId AS Logistica_ClienteId,
    l.NombreLocal AS Logistica_NombreLocal,
    l.Direccion AS Logistica_Direccion,
    l.UbicacionMaps AS Logistica_UbicacionMaps,
    l.HoraLlegada AS Logistica_HoraLlegada,
    l.CreadoEn AS Logistica_CreadoEn,
    l.ModificadoEn AS Logistica_ModificadoEn
FROM Clientes c
LEFT JOIN LogisticaCliente l ON c.Id = l.ClienteId
WHERE c.Id = @Id;
```

**Errores:**
- `401 Unauthorized` - Token de autenticación inválido
- `404 Not Found` - Cliente no encontrado
- `500 Internal Server Error` - Error del servidor

---

### **POST /api/clientes**

Crear un nuevo cliente.

**⚠️ IMPORTANTE - Dos formas de uso:**

1. **Registro Público** (desde página `/registro-cliente?token=xxx`):
   - NO requiere `Authorization` header
   - SÍ requiere campo `token` en el body
   - El token se valida antes de crear el cliente

2. **Registro Interno** (desde panel admin `/clientes`):
   - SÍ requiere `Authorization: Bearer {admin_token}` header
   - NO requiere campo `token` en el body
   - Solo admin autenticado puede crear clientes directamente

**Headers (Registro Público):**
```
Content-Type: application/json
```

**Headers (Registro Interno):**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body (Registro Público con token):**

```json
{
  "tipoDocumento": "DNI",
  "numeroDocumento": "12345678",
  "nombres": "MARÍA",
  "apellidoPaterno": "GARCÍA",
  "apellidoMaterno": "LÓPEZ",
  "fechaCumpleanios": "1995-03-15T00:00:00.000Z",
  "fechaBoda": "2026-06-20T00:00:00.000Z",
  "celular": "987654321",
  "email": "MARIA@EXAMPLE.COM",
  "logistica": {
    "nombreLocal": "SALÓN LOS JARDINES",
    "direccion": "AV. PRINCIPAL 123",
    "ubicacionMaps": "https://maps.google.com/...",
    "horaLlegada": "18:00"
  },
  "token": "abc123xyz789"
}
```

**Request Body (Registro Interno sin token):**

```json
{
  "tipoDocumento": "DNI",
  "numeroDocumento": "12345678",
  "nombres": "MARÍA",
  "apellidoPaterno": "GARCÍA",
  "apellidoMaterno": "LÓPEZ",
  "fechaCumpleanios": "1995-03-15T00:00:00.000Z",
  "fechaBoda": "2026-06-20T00:00:00.000Z",
  "celular": "987654321",
  "email": "MARIA@EXAMPLE.COM",
  "logistica": {
    "nombreLocal": "SALÓN LOS JARDINES",
    "direccion": "AV. PRINCIPAL 123",
    "ubicacionMaps": "https://maps.google.com/...",
    "horaLlegada": "18:00"
  }
}
```

**Validaciones:**

1. ✅ **Autenticación** (validar PRIMERO):
   ```csharp
   // Si viene Authorization header → validar admin token
   if (Request.Headers.ContainsKey("Authorization")) {
       ValidarTokenAdmin(authHeader);
   }
   // Si NO viene Authorization → validar token de cliente en body
   else if (!string.IsNullOrEmpty(request.Token)) {
       ValidarTokenCliente(request.Token);
   }
   else {
       throw new UnauthorizedException("Se requiere autenticación o token de cliente");
   }
   ```

2. ✅ **Token de cliente válido** (solo si es registro público):
   ```sql
   SELECT * FROM Tokens 
   WHERE Token = @Token 
     AND Usado = 0 
     AND ExpiraEn > GETDATE();
   ```

3. ✅ **Documento único**:
   ```sql
   SELECT COUNT(*) FROM Clientes WHERE NumeroDocumento = @NumeroDocumento;
   -- Debe ser 0
   ```

4. ✅ **Campos requeridos:**
   - `tipoDocumento`
   - `numeroDocumento`
   - `nombres`
   - `apellidoPaterno`
   - `fechaBoda`

**Lógica de Negocio:**

```csharp
// Pseudocódigo
async Task<Cliente> CrearCliente(CrearClienteRequest request, string authHeader)
{
    bool esRegistroPublico = false;
    
    // 1. Validar autenticación (admin O token de cliente)
    if (!string.IsNullOrEmpty(authHeader))
    {
        // Registro interno desde admin
        await ValidarTokenAdmin(authHeader);
        esRegistroPublico = false;
    }
    else if (!string.IsNullOrEmpty(request.Token))
    {
        // Registro público con token
        var tokenValidacion = await ValidarToken(request.Token);
        if (!tokenValidacion.Valido) 
            throw new BadRequestException($"Token inválido: {tokenValidacion.Motivo}");
        esRegistroPublico = true;
    }
    else
    {
        throw new UnauthorizedException("Se requiere autenticación de admin o token de cliente");
    }
    
    // 2. Validar documento único
    if (await ExisteDocumento(request.NumeroDocumento))
        throw new ConflictException("Ya existe un cliente con este documento");
    
    // 3. Crear cliente
    var clienteId = DateTime.UtcNow.Ticks;
    var cliente = new Cliente
    {
        Id = clienteId,
        TipoDocumento = request.TipoDocumento,
        NumeroDocumento = request.NumeroDocumento,
        Nombres = request.Nombres,
        ApellidoPaterno = request.ApellidoPaterno,
        ApellidoMaterno = request.ApellidoMaterno,
        FechaCumpleanios = request.FechaCumpleanios,
        FechaBoda = request.FechaBoda,
        Celular = request.Celular,
        Email = request.Email,
        CreadoEn = DateTime.UtcNow
    };
    
    await db.Clientes.AddAsync(cliente);
    
    // 4. Crear logística si existe
    if (request.Logistica != null)
    {
        var logistica = new LogisticaCliente
        {
            ClienteId = clienteId,
            NombreLocal = request.Logistica.NombreLocal,
            Direccion = request.Logistica.Direccion,
            UbicacionMaps = request.Logistica.UbicacionMaps,
            HoraLlegada = request.Logistica.HoraLlegada,
            CreadoEn = DateTime.UtcNow
        };
        await db.LogisticaCliente.AddAsync(logistica);
    }
    
    // 5. Marcar token como usado (solo si es registro público)
    if (esRegistroPublico)
    {
        await MarcarTokenUsado(request.Token, clienteId);
    }
    
    // 6. Guardar cambios
    await db.SaveChangesAsync();
    
    // 7. Retornar cliente con logística
    return await ObtenerClientePorId(clienteId);
}
```

**Response: 201 Created**

```json
{
  "id": 1777689454788,
  "tipoDocumento": "DNI",
  "numeroDocumento": "12345678",
  "nombres": "MARÍA",
  "apellidoPaterno": "GARCÍA",
  "apellidoMaterno": "LÓPEZ",
  "fechaCumpleanios": "1995-03-15T00:00:00.000Z",
  "fechaBoda": "2026-06-20T00:00:00.000Z",
  "celular": "987654321",
  "email": "MARIA@EXAMPLE.COM",
  "creadoEn": "2026-05-02T03:00:00.000Z",
  "modificadoEn": null,
  "logistica": {
    "id": 1,
    "clienteId": 1777689454788,
    "nombreLocal": "SALÓN LOS JARDINES",
    "direccion": "AV. PRINCIPAL 123",
    "ubicacionMaps": "https://maps.google.com/...",
    "horaLlegada": "18:00",
    "creadoEn": "2026-05-02T03:00:00.000Z",
    "modificadoEn": null
  }
}
```

**Errores:**
- `400 Bad Request` - Token de cliente inválido, expirado o ya usado (registro público)
- `401 Unauthorized` - Token de admin inválido o faltante autenticación (registro interno)
- `409 Conflict` - Ya existe un cliente con ese número de documento
- `422 Unprocessable Entity` - Validación de campos fallida
- `500 Internal Server Error` - Error del servidor

---

### **PUT /api/clientes/{id}**

Actualizar un cliente existente (requiere autenticación).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters:**
- `id` (bigint) - ID del cliente

**Request Body:**

```json
{
  "tipoDocumento": "DNI",
  "numeroDocumento": "12345678",
  "nombres": "MARÍA FERNANDA",
  "apellidoPaterno": "GARCÍA",
  "apellidoMaterno": "LÓPEZ",
  "fechaCumpleanios": "1995-03-15T00:00:00.000Z",
  "fechaBoda": "2026-06-25T00:00:00.000Z",
  "celular": "987654321",
  "email": "MARIA.GARCIA@EXAMPLE.COM",
  "logistica": {
    "nombreLocal": "SALÓN VERSALLES",
    "direccion": "AV. SECUNDARIA 456",
    "ubicacionMaps": "https://maps.google.com/...",
    "horaLlegada": "19:00"
  }
}
```

**Lógica de Negocio:**

```csharp
// Pseudocódigo
async Task<Cliente> ActualizarCliente(long id, ActualizarClienteRequest request)
{
    // 1. Verificar que existe
    var cliente = await db.Clientes.FindAsync(id);
    if (cliente == null)
        throw new NotFoundException("Cliente no encontrado");
    
    // 2. Actualizar datos del cliente
    cliente.TipoDocumento = request.TipoDocumento;
    cliente.NumeroDocumento = request.NumeroDocumento;
    cliente.Nombres = request.Nombres;
    cliente.ApellidoPaterno = request.ApellidoPaterno;
    cliente.ApellidoMaterno = request.ApellidoMaterno;
    cliente.FechaCumpleanios = request.FechaCumpleanios;
    cliente.FechaBoda = request.FechaBoda;
    cliente.Celular = request.Celular;
    cliente.Email = request.Email;
    cliente.ModificadoEn = DateTime.UtcNow;
    
    // 3. Manejar logística
    var logisticaExistente = await db.LogisticaCliente
        .FirstOrDefaultAsync(l => l.ClienteId == id);
    
    if (request.Logistica != null)
    {
        if (logisticaExistente != null)
        {
            // UPDATE
            logisticaExistente.NombreLocal = request.Logistica.NombreLocal;
            logisticaExistente.Direccion = request.Logistica.Direccion;
            logisticaExistente.UbicacionMaps = request.Logistica.UbicacionMaps;
            logisticaExistente.HoraLlegada = request.Logistica.HoraLlegada;
            logisticaExistente.ModificadoEn = DateTime.UtcNow;
        }
        else
        {
            // INSERT
            var nuevaLogistica = new LogisticaCliente
            {
                ClienteId = id,
                NombreLocal = request.Logistica.NombreLocal,
                Direccion = request.Logistica.Direccion,
                UbicacionMaps = request.Logistica.UbicacionMaps,
                HoraLlegada = request.Logistica.HoraLlegada,
                CreadoEn = DateTime.UtcNow
            };
            await db.LogisticaCliente.AddAsync(nuevaLogistica);
        }
    }
    else if (logisticaExistente != null)
    {
        // DELETE (si no viene logística pero existía)
        db.LogisticaCliente.Remove(logisticaExistente);
    }
    
    // 4. Guardar cambios
    await db.SaveChangesAsync();
    
    // 5. Retornar cliente actualizado
    return await ObtenerClientePorId(id);
}
```

**Response: 200 OK**

```json
{
  "id": 1777689454788,
  "tipoDocumento": "DNI",
  "numeroDocumento": "12345678",
  "nombres": "MARÍA FERNANDA",
  "apellidoPaterno": "GARCÍA",
  "apellidoMaterno": "LÓPEZ",
  "fechaCumpleanios": "1995-03-15T00:00:00.000Z",
  "fechaBoda": "2026-06-25T00:00:00.000Z",
  "celular": "987654321",
  "email": "MARIA.GARCIA@EXAMPLE.COM",
  "creadoEn": "2026-05-02T03:00:00.000Z",
  "modificadoEn": "2026-05-02T03:30:00.000Z",
  "logistica": {
    "id": 1,
    "clienteId": 1777689454788,
    "nombreLocal": "SALÓN VERSALLES",
    "direccion": "AV. SECUNDARIA 456",
    "ubicacionMaps": "https://maps.google.com/...",
    "horaLlegada": "19:00",
    "creadoEn": "2026-05-02T03:00:00.000Z",
    "modificadoEn": "2026-05-02T03:30:00.000Z"
  }
}
```

**Errores:**
- `401 Unauthorized` - Token de autenticación inválido
- `404 Not Found` - Cliente no encontrado
- `422 Unprocessable Entity` - Validación fallida
- `500 Internal Server Error` - Error del servidor

---

## 🎟️ Endpoints - Tokens

### **POST /api/tokens**

Generar un nuevo token de acceso para registro de cliente.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:** `{}` (objeto vacío)

**Lógica de Negocio:**

```csharp
// Pseudocódigo
async Task<GenerarTokenResponse> GenerarToken()
{
    // 1. Generar token único
    var token = Guid.NewGuid().ToString("N"); // Ej: abc123xyz789
    
    // 2. Establecer expiración (24 horas)
    var expiraEn = DateTime.UtcNow.AddHours(24);
    
    // 3. Crear registro
    var nuevoToken = new Token
    {
        Token = token,
        ExpiraEn = expiraEn,
        Usado = false,
        CreadoEn = DateTime.UtcNow
    };
    
    await db.Tokens.AddAsync(nuevoToken);
    await db.SaveChangesAsync();
    
    return new GenerarTokenResponse
    {
        Token = token,
        ExpiraEn = expiraEn
    };
}
```

**SQL Insert:**
```sql
INSERT INTO Tokens (Token, ExpiraEn, Usado, CreadoEn)
VALUES (@Token, @ExpiraEn, 0, GETDATE());
```

**Response: 201 Created**

```json
{
  "token": "abc123xyz789def456ghi",
  "expiraEn": "2026-05-03T03:00:00.000Z"
}
```

**Errores:**
- `401 Unauthorized` - Token de autenticación de admin inválido
- `500 Internal Server Error` - Error del servidor

---

### **GET /api/tokens/{token}/validar**

Validar si un token es válido para uso.

**Headers:** Ninguno (endpoint público)

**Path Parameters:**
- `token` (string) - Token a validar

**Lógica de Negocio:**

```csharp
// Pseudocódigo
async Task<ValidarTokenResponse> ValidarToken(string tokenValue)
{
    var token = await db.Tokens.FindAsync(tokenValue);
    
    // Token no existe
    if (token == null)
    {
        return new ValidarTokenResponse
        {
            Valido = false,
            Motivo = "NO_ENCONTRADO"
        };
    }
    
    // Token ya usado
    if (token.Usado)
    {
        return new ValidarTokenResponse
        {
            Valido = false,
            Motivo = "USADO"
        };
    }
    
    // Token expirado
    if (token.ExpiraEn < DateTime.UtcNow)
    {
        return new ValidarTokenResponse
        {
            Valido = false,
            Motivo = "EXPIRADO"
        };
    }
    
    // Token válido
    return new ValidarTokenResponse
    {
        Valido = true
    };
}
```

**SQL Query:**
```sql
SELECT 
    Token,
    ExpiraEn,
    Usado,
    CASE 
        WHEN Usado = 1 THEN 'USADO'
        WHEN ExpiraEn < GETDATE() THEN 'EXPIRADO'
        ELSE 'VALIDO'
    END AS Estado
FROM Tokens
WHERE Token = @Token;
```

**Response: 200 OK**

**Caso 1: Token válido**
```json
{
  "valido": true
}
```

**Caso 2: Token expirado**
```json
{
  "valido": false,
  "motivo": "EXPIRADO"
}
```

**Caso 3: Token usado**
```json
{
  "valido": false,
  "motivo": "USADO"
}
```

**Caso 4: Token no encontrado**
```json
{
  "valido": false,
  "motivo": "NO_ENCONTRADO"
}
```

---

## 📦 Endpoints - Pedidos

### **GET /api/pedidos**

Obtener todos los pedidos.

**Headers:**
```
Authorization: Bearer {token}
```

**Response: 200 OK**

```json
[
  {
    "id": 1,
    "nombreCliente": "MARÍA GARCÍA LÓPEZ",
    "dni": "12345678",
    "email": "MARIA@EXAMPLE.COM",
    "celular": "987654321",
    "fechaBoda": "2026-06-20T00:00:00.000Z",
    "estado": "Cotizado",
    "contratoPdfUrl": "https://storage.../contrato-1.pdf",
    "creadoEn": "2026-05-02T03:00:00.000Z",
    "detalles": [
      {
        "tipoKeke": "TRES LECHES",
        "relleno": "MANJAR",
        "porciones": 100,
        "esMaqueta": false,
        "observaciones": "DECORACIÓN CON FLORES",
        "imagenReferencial": null
      }
    ],
    "logistica": {
      "nombreLocal": "SALÓN LOS JARDINES",
      "direccion": "AV. PRINCIPAL 123",
      "ubicacionMaps": "https://maps.google.com/...",
      "horaLlegada": "18:00"
    },
    "pago": {
      "importeTotal": 1500,
      "subtotal": 1271.19,
      "igv": 228.81,
      "numeroCuotas": 2,
      "cuotas": [
        {
          "numero": 1,
          "importe": 750,
          "fecha": null
        },
        {
          "numero": 2,
          "importe": 750,
          "fecha": "2026-06-01T00:00:00.000Z"
        }
      ]
    }
  }
]
```

---

### **GET /api/pedidos/{id}**

Obtener un pedido específico.

**Response:** Similar al anterior pero un solo objeto.

---

### **POST /api/pedidos**

Crear un nuevo pedido para un cliente existente.

**⚠️ IMPORTANTE - Página Interna:**
- Este endpoint es SOLO para uso interno (panel de admin)
- SIEMPRE requiere autenticación de admin con `Authorization: Bearer {admin_token}`
- NO usa token de cliente (a diferencia de POST /api/clientes)
- El cliente debe existir previamente en la tabla `Clientes`
- Los datos del pedido (nombre, dni, etc.) se copian del cliente seleccionado al pedido
- La logística del pedido es independiente de la logística del cliente

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body - Estructura Completa:**

```json
{
  "nombre": "MARÍA GARCÍA LÓPEZ",
  "dni": "12345678",
  "celular": "987654321",
  "email": "MARIA@EXAMPLE.COM",
  "fechaBoda": "2026-06-20T00:00:00.000Z",
  "detalles": [
    {
      "tipoKeke": "TRES LECHES",
      "relleno": "MANJAR",
      "porciones": 100,
      "esMaqueta": false,
      "observaciones": "DECORACIÓN CON FLORES",
      "imagenReferencial": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    },
    {
      "tipoKeke": "CHOCOLATE",
      "relleno": "CREMA CHANTILLY",
      "porciones": 50,
      "esMaqueta": true,
      "observaciones": "MAQUETA DECORATIVA",
      "imagenReferencial": null
    }
  ],
  "pago": {
    "importeTotal": 1500,
    "subtotal": 1271.19,
    "igv": 228.81,
    "numeroCuotas": 2,
    "cuotas": [
      {
        "numero": 1,
        "importe": 750,
        "fecha": null
      },
      {
        "numero": 2,
        "importe": 750,
        "fecha": "2026-06-01T00:00:00.000Z"
      }
    ]
  },
  "logistica": {
    "nombreLocal": "SALÓN LOS JARDINES",
    "direccion": "AV. PRINCIPAL 123",
    "ubicacionMaps": "https://maps.google.com/...",
    "horaLlegada": "18:00"
  }
}
```

**Campos del Request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | ✅ | Nombre completo del cliente |
| `dni` | string | ✅ | Número de documento del cliente |
| `celular` | string | ❌ | Teléfono celular |
| `email` | string | ❌ | Email para envío de contrato |
| `fechaBoda` | string (ISO) | ✅ | Fecha del evento |
| `detalles` | array | ✅ | Lista de tortas/kekes (mínimo 1) |
| `detalles[].tipoKeke` | string | ✅ | Tipo de torta |
| `detalles[].relleno` | string | ❌ | Relleno de la torta |
| `detalles[].porciones` | number | ✅ | Cantidad de porciones |
| `detalles[].esMaqueta` | boolean | ✅ | Si es decorativa |
| `detalles[].observaciones` | string | ❌ | Notas adicionales |
| `detalles[].imagenReferencial` | string | ❌ | Imagen en base64 |
| `pago` | object | ❌ | Información de pago |
| `pago.importeTotal` | number | ✅ | Total con IGV |
| `pago.subtotal` | number | ✅ | Subtotal sin IGV |
| `pago.igv` | number | ✅ | Monto del IGV |
| `pago.numeroCuotas` | number | ✅ | Cantidad de cuotas |
| `pago.cuotas` | array | ✅ | Detalle de cuotas |
| `pago.cuotas[].numero` | number | ✅ | Número de cuota (1, 2, 3...) |
| `pago.cuotas[].importe` | number | ✅ | Monto de la cuota |
| `pago.cuotas[].fecha` | string (ISO) | ❌ | Fecha de vencimiento (null = al firmar) |
| `logistica` | object | ❌ | Info de entrega |
| `logistica.nombreLocal` | string | ❌ | Nombre del local del evento |
| `logistica.direccion` | string | ❌ | Dirección de entrega |
| `logistica.ubicacionMaps` | string | ❌ | URL de Google Maps |
| `logistica.horaLlegada` | string | ❌ | Hora de llegada (formato: "18:00") |

**Ejemplo Request Mínimo:**

```json
{
  "nombre": "NERY GERONIMO TORRES",
  "dni": "21492882",
  "fechaBoda": "2026-05-26T00:00:00.000Z",
  "detalles": [
    {
      "tipoKeke": "TORTA CLÁSICA",
      "porciones": 80,
      "esMaqueta": false
    }
  ]
}
```

**Ejemplo Request Completo (múltiples tortas con pago en cuotas):**

```json
{
  "nombre": "MARÍA GARCÍA LÓPEZ",
  "dni": "12345678",
  "celular": "987654321",
  "email": "MARIA@EXAMPLE.COM",
  "fechaBoda": "2026-06-20T00:00:00.000Z",
  "detalles": [
    {
      "tipoKeke": "TORTA DE 3 PISOS",
      "relleno": "TRES LECHES CON MANJAR",
      "porciones": 150,
      "esMaqueta": false,
      "observaciones": "DECORACIÓN CON FLORES NATURALES Y TOPPER PERSONALIZADO",
      "imagenReferencial": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
    },
    {
      "tipoKeke": "CUPCAKES TEMÁTICOS",
      "relleno": "VAINILLA",
      "porciones": 50,
      "esMaqueta": false,
      "observaciones": "DECORADOS EN COLOR ROSA Y DORADO"
    },
    {
      "tipoKeke": "TORTA MAQUETA",
      "porciones": 1,
      "esMaqueta": true,
      "observaciones": "SOLO DECORATIVA PARA FOTOS"
    }
  ],
  "pago": {
    "importeTotal": 2500,
    "subtotal": 2118.64,
    "igv": 381.36,
    "numeroCuotas": 3,
    "cuotas": [
      {
        "numero": 1,
        "importe": 1000,
        "fecha": null
      },
      {
        "numero": 2,
        "importe": 1000,
        "fecha": "2026-06-01T00:00:00.000Z"
      },
      {
        "numero": 3,
        "importe": 500,
        "fecha": "2026-06-15T00:00:00.000Z"
      }
    ]
  },
  "logistica": {
    "nombreLocal": "SALÓN DE EVENTOS LOS JARDINES",
    "direccion": "AV. PRINCIPAL 123, MIRAFLORES, LIMA",
    "ubicacionMaps": "https://maps.google.com/?q=-12.1234,-77.5678",
    "horaLlegada": "17:30"
  }
}
```

**Lógica de Negocio:**

```csharp
async Task<Pedido> CrearPedido(CrearPedidoRequest request)
{
    // 1. Crear pedido
    var pedido = new Pedido
    {
        NombreCliente = request.Nombre,
        Dni = request.Dni,
        Celular = request.Celular,
        Email = request.Email,
        FechaBoda = request.FechaBoda,
        Estado = "Cotizado",
        CreadoEn = DateTime.UtcNow
    };
    await db.Pedidos.AddAsync(pedido);
    await db.SaveChangesAsync();
    
    // 2. Crear detalles
    foreach (var detalle in request.Detalles)
    {
        var det = new DetallePedido
        {
            PedidoId = pedido.Id,
            TipoKeke = detalle.TipoKeke,
            Relleno = detalle.Relleno,
            Porciones = detalle.Porciones,
            EsMaqueta = detalle.EsMaqueta,
            Observaciones = detalle.Observaciones,
            ImagenReferencial = detalle.ImagenReferencial
        };
        await db.DetallesPedido.AddAsync(det);
    }
    
    // 3. Crear pago si existe
    if (request.Pago != null)
    {
        var pago = new Pago
        {
            PedidoId = pedido.Id,
            ImporteTotal = request.Pago.ImporteTotal,
            Subtotal = request.Pago.Subtotal,
            Igv = request.Pago.Igv,
            NumeroCuotas = request.Pago.NumeroCuotas
        };
        await db.Pagos.AddAsync(pago);
        await db.SaveChangesAsync();
        
        foreach (var cuota in request.Pago.Cuotas)
        {
            var c = new CuotaPago
            {
                PagoId = pago.Id,
                Numero = cuota.Numero,
                Importe = cuota.Importe,
                Fecha = cuota.Fecha
            };
            await db.CuotasPago.AddAsync(c);
        }
    }
    
    // 4. Crear logística si existe
    if (request.Logistica != null)
    {
        var logistica = new LogisticaPedido
        {
            PedidoId = pedido.Id,
            NombreLocal = request.Logistica.NombreLocal,
            Direccion = request.Logistica.Direccion,
            UbicacionMaps = request.Logistica.UbicacionMaps,
            HoraLlegada = request.Logistica.HoraLlegada
        };
        await db.LogisticaPedido.AddAsync(logistica);
    }
    
    await db.SaveChangesAsync();
    
    // 5. Generar PDF del contrato
    var pdfUrl = await GenerarContratoPDF(pedido.Id);
    pedido.ContratoPdfUrl = pdfUrl;
    await db.SaveChangesAsync();
    
    // 6. Enviar email al cliente
    if (!string.IsNullOrEmpty(request.Email))
    {
        await EnviarEmailContrato(request.Email, pdfUrl);
    }
    
    // 7. Retornar pedido completo
    return await ObtenerPedidoPorId(pedido.Id);
}
```

**Response: 201 Created**

(Ver estructura en GET /api/pedidos)

---

## ⚖️ Reglas de Negocio

### **Normalización de Datos**

✅ **Todos los campos de texto se reciben en MAYÚSCULAS** desde el frontend.
- El frontend utiliza la función `toUppercaseDeep()` antes de enviar
- El backend debe almacenar tal cual los recibe

### **Gestión de Tokens**

1. ✅ Los tokens expiran en **24 horas** desde su creación
2. ✅ Un token solo puede usarse **una vez**
3. ✅ Al usar un token exitosamente:
   - Marcar `Usado = 1`
   - Establecer `UsadoEn = GETDATE()`
   - Establecer `ClienteIdCreado = {id_cliente_creado}`

### **Gestión de Logística de Cliente**

1. ✅ Al **CREAR** cliente:
   - Si viene `logistica` → INSERT en `LogisticaCliente`
   - Si NO viene → No crear registro

2. ✅ Al **ACTUALIZAR** cliente:
   - Si viene `logistica` y existe → UPDATE con `ModificadoEn`
   - Si viene `logistica` y NO existe → INSERT
   - Si NO viene `logistica` y existe → DELETE

3. ✅ Al **ELIMINAR** cliente:
   - CASCADE DELETE en `LogisticaCliente` (por FK)

### **Tracking de Fechas**

1. ✅ **CreadoEn:**
   - Se establece automáticamente al crear (DEFAULT GETDATE())
   - Nunca se modifica

2. ✅ **ModificadoEn:**
   - NULL al crear
   - Se actualiza en cada UPDATE
   - Solo en tablas: `Clientes`, `LogisticaCliente`

---

## ❌ Manejo de Errores

### **Códigos de Estado HTTP**

| Código | Descripción | Uso |
|--------|-------------|-----|
| `200` | OK | Operación exitosa (GET, PUT) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `400` | Bad Request | Token inválido, datos incorrectos |
| `401` | Unauthorized | Sin autenticación o token inválido |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto (ej: documento duplicado) |
| `422` | Unprocessable Entity | Validación de campos fallida |
| `500` | Internal Server Error | Error del servidor |

### **Formato de Respuesta de Error**

```json
{
  "error": {
    "codigo": "DOCUMENTO_DUPLICADO",
    "mensaje": "Ya existe un cliente con el número de documento 12345678",
    "detalles": {
      "campo": "numeroDocumento",
      "valor": "12345678"
    }
  }
}
```

### **Códigos de Error Personalizados**

| Código | Descripción |
|--------|-------------|
| `TOKEN_INVALIDO` | Token no encontrado |
| `TOKEN_EXPIRADO` | Token ha expirado |
| `TOKEN_USADO` | Token ya fue utilizado |
| `DOCUMENTO_DUPLICADO` | Número de documento ya existe |
| `CLIENTE_NO_ENCONTRADO` | Cliente no existe |
| `VALIDACION_FALLIDA` | Campos requeridos faltantes |

---

## 📝 Notas Adicionales

### **Autenticación**

- Los endpoints de **clientes** (GET, PUT) requieren autenticación con Bearer token
- El endpoint de **crear cliente** (POST) NO requiere autenticación (usa token temporal)
- El endpoint de **validar token** es público
- El endpoint de **generar token** requiere autenticación de admin

### **CORS**

Configurar CORS para permitir peticiones desde:
- **Desarrollo:** `http://localhost:4200`, `http://localhost:50188`
- **Producción:** `https://wonderwall.azurewebsites.net` (o el dominio que uses)

### **Logging**

Registrar en logs:
- ✅ Generación de tokens (quién, cuándo)
- ✅ Uso de tokens (token, IP, cliente creado)
- ✅ Intentos fallidos de validación de token
- ✅ Creación y actualización de clientes
- ✅ Errores del servidor

### **Seguridad**

1. ✅ Implementar rate limiting en endpoints públicos
2. ✅ Validar tamaño de imágenes base64 (máx 5 MB)
3. ✅ Sanitizar inputs para prevenir SQL injection
4. ✅ Implementar HTTPS en producción
5. ✅ Logs de auditoría para acciones críticas

---

## ✅ Checklist de Implementación

### **Base de Datos**
- [ ] Crear tabla `LogisticaCliente`
- [ ] Crear tabla `Tokens`
- [ ] Agregar columna `ModificadoEn` a `Clientes`
- [ ] Migrar datos de logística existentes
- [ ] Eliminar columnas antiguas de logística
- [ ] Crear índices recomendados
- [ ] Configurar Foreign Keys con CASCADE

### **Endpoints**
- [ ] GET /api/clientes (modificar para incluir logística)
- [ ] GET /api/clientes/{id} (modificar para incluir logística)
- [ ] POST /api/clientes (agregar validación de token y logística)
- [ ] PUT /api/clientes/{id} (nuevo endpoint)
- [ ] POST /api/tokens (nuevo endpoint)
- [ ] GET /api/tokens/{token}/validar (nuevo endpoint)

### **Funcionalidades**
- [ ] Sistema de generación de tokens únicos
- [ ] Validación de tokens (expiración, uso)
- [ ] Marcado de tokens como usados
- [ ] CRUD de logística de cliente
- [ ] Tracking de fechas (CreadoEn, ModificadoEn)
- [ ] Validación de documento único

### **Pruebas**
- [ ] Probar creación de cliente sin token (debe fallar)
- [ ] Probar creación con token expirado (debe fallar)
- [ ] Probar creación con token usado (debe fallar)
- [ ] Probar creación exitosa con logística
- [ ] Probar creación exitosa sin logística
- [ ] Probar actualización agregando logística
- [ ] Probar actualización modificando logística
- [ ] Probar actualización eliminando logística
- [ ] Verificar que ModificadoEn se actualiza correctamente
- [ ] Verificar que GET devuelve logística relacionada

### **Documentación**
- [ ] Documentar API con Swagger/OpenAPI
- [ ] Crear colección de Postman para pruebas
- [ ] Documentar códigos de error
- [ ] Documentar ejemplos de request/response

---

## 📊 APÉNDICE: Estructura Completa de Tablas de Pedidos

### **Tabla: Pedidos**

```sql
CREATE TABLE Pedidos (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    NombreCliente NVARCHAR(300) NOT NULL,
    Dni NVARCHAR(20) NOT NULL,
    Celular NVARCHAR(15),
    Email NVARCHAR(100),
    FechaBoda DATETIME2 NOT NULL,
    Estado NVARCHAR(20) NOT NULL DEFAULT 'Cotizado', -- Cotizado, Pagado, Entregado
    ContratoPdfUrl NVARCHAR(500),
    CreadoEn DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX IX_Pedidos_Dni ON Pedidos(Dni);
CREATE INDEX IX_Pedidos_FechaBoda ON Pedidos(FechaBoda);
CREATE INDEX IX_Pedidos_Estado ON Pedidos(Estado);
```

### **Tabla: DetallesPedido**

```sql
CREATE TABLE DetallesPedido (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    PedidoId BIGINT NOT NULL,
    TipoKeke NVARCHAR(200) NOT NULL,
    Relleno NVARCHAR(200),
    Porciones INT NOT NULL,
    EsMaqueta BIT NOT NULL DEFAULT 0,
    Observaciones NVARCHAR(500),
    ImagenReferencial NVARCHAR(MAX), -- Base64 de imagen
    CONSTRAINT FK_DetallesPedido_Pedido FOREIGN KEY (PedidoId) 
        REFERENCES Pedidos(Id) ON DELETE CASCADE
);

CREATE INDEX IX_DetallesPedido_PedidoId ON DetallesPedido(PedidoId);
```

### **Tabla: Pagos**

```sql
CREATE TABLE Pagos (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    PedidoId BIGINT NOT NULL,
    ImporteTotal DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    Igv DECIMAL(10,2) NOT NULL,
    NumeroCuotas INT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Pagos_Pedido FOREIGN KEY (PedidoId) 
        REFERENCES Pedidos(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IX_Pagos_PedidoId ON Pagos(PedidoId); -- 1 pago por pedido
```

### **Tabla: CuotasPago**

```sql
CREATE TABLE CuotasPago (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    PagoId BIGINT NOT NULL,
    Numero INT NOT NULL,
    Importe DECIMAL(10,2) NOT NULL,
    Fecha DATETIME2, -- NULL = al firmar contrato
    CONSTRAINT FK_CuotasPago_Pago FOREIGN KEY (PagoId) 
        REFERENCES Pagos(Id) ON DELETE CASCADE
);

CREATE INDEX IX_CuotasPago_PagoId ON CuotasPago(PagoId);
```

### **Tabla: LogisticaPedido**

```sql
CREATE TABLE LogisticaPedido (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    PedidoId BIGINT NOT NULL,
    NombreLocal NVARCHAR(200),
    Direccion NVARCHAR(300),
    UbicacionMaps NVARCHAR(500),
    HoraLlegada NVARCHAR(10),
    CONSTRAINT FK_LogisticaPedido_Pedido FOREIGN KEY (PedidoId) 
        REFERENCES Pedidos(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IX_LogisticaPedido_PedidoId ON LogisticaPedido(PedidoId); -- 1 logística por pedido
```

### **Diagrama de Relaciones - Pedidos**

```
Pedidos (1)
    ├── DetallesPedido (N) - Múltiples tortas/kekes por pedido
    ├── Pagos (0..1) - Un pago opcional por pedido
    │   └── CuotasPago (N) - Múltiples cuotas por pago
    └── LogisticaPedido (0..1) - Una logística opcional por pedido
```

### **Queries de Ejemplo para POST /api/pedidos**

**1. Insertar Pedido Principal:**
```sql
INSERT INTO Pedidos (NombreCliente, Dni, Celular, Email, FechaBoda, Estado, CreadoEn)
VALUES (@NombreCliente, @Dni, @Celular, @Email, @FechaBoda, 'Cotizado', GETDATE());

SELECT SCOPE_IDENTITY() AS PedidoId;
```

**2. Insertar Detalles:**
```sql
INSERT INTO DetallesPedido (PedidoId, TipoKeke, Relleno, Porciones, EsMaqueta, Observaciones, ImagenReferencial)
VALUES 
    (@PedidoId, 'TORTA DE 3 PISOS', 'TRES LECHES', 150, 0, 'DECORACIÓN CON FLORES', @Imagen1),
    (@PedidoId, 'CUPCAKES', 'VAINILLA', 50, 0, NULL, NULL),
    (@PedidoId, 'MAQUETA', NULL, 1, 1, 'SOLO DECORATIVA', NULL);
```

**3. Insertar Pago:**
```sql
INSERT INTO Pagos (PedidoId, ImporteTotal, Subtotal, Igv, NumeroCuotas)
VALUES (@PedidoId, 2500.00, 2118.64, 381.36, 3);

SELECT SCOPE_IDENTITY() AS PagoId;
```

**4. Insertar Cuotas:**
```sql
INSERT INTO CuotasPago (PagoId, Numero, Importe, Fecha)
VALUES 
    (@PagoId, 1, 1000.00, NULL), -- Al firmar
    (@PagoId, 2, 1000.00, '2026-06-01'),
    (@PagoId, 3, 500.00, '2026-06-15');
```

**5. Insertar Logística:**
```sql
INSERT INTO LogisticaPedido (PedidoId, NombreLocal, Direccion, UbicacionMaps, HoraLlegada)
VALUES (@PedidoId, 'SALÓN LOS JARDINES', 'AV. PRINCIPAL 123', 'https://maps...', '17:30');
```

**6. Query Completa para GET /api/pedidos/{id}:**
```sql
-- Pedido principal
SELECT * FROM Pedidos WHERE Id = @PedidoId;

-- Detalles
SELECT * FROM DetallesPedido WHERE PedidoId = @PedidoId;

-- Pago
SELECT * FROM Pagos WHERE PedidoId = @PedidoId;

-- Cuotas (si hay pago)
SELECT c.* 
FROM CuotasPago c
INNER JOIN Pagos p ON c.PagoId = p.Id
WHERE p.PedidoId = @PedidoId
ORDER BY c.Numero;

-- Logística
SELECT * FROM LogisticaPedido WHERE PedidoId = @PedidoId;
```

---

**Fin de la Especificación**

**Versión:** 2.0  
**Fecha:** Mayo 2026  
**Autor:** Equipo Wonderwall
