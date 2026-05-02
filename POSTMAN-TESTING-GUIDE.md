# 🧪 Probar Backend con Postman

## 📋 Información del Backend

- **Base URL:** `https://wonderwall-api.azurewebsites.net/api`
- **Admin Token:** `wonderwall-dev-token-2026`
- **Content-Type:** `application/json`

---

## 🔑 Configurar Autenticación en Postman

### Opción 1: Por Request (Manual)

En cada request, agrega este header:

**Headers:**
```
Authorization: Bearer wonderwall-dev-token-2026
Content-Type: application/json
```

### Opción 2: Variables de Entorno (Recomendado)

1. En Postman, click en "Environments" → "Create Environment"
2. Nombre: `Wonderwall Production`
3. Variables:
   ```
   baseUrl: https://wonderwall-api.azurewebsites.net/api
   adminToken: wonderwall-dev-token-2026
   ```
4. Save
5. Selecciona el environment en el dropdown superior

Luego en tus requests:
- URL: `{{baseUrl}}/pedidos`
- Header: `Authorization: Bearer {{adminToken}}`

---

## 📝 Endpoints para Probar

### 1. **GET /api/clientes** - Listar Clientes

**Request:**
```
GET https://wonderwall-api.azurewebsites.net/api/clientes
Headers:
  Authorization: Bearer wonderwall-dev-token-2026
```

**Respuesta esperada:** `200 OK`
```json
[
  {
    "id": 1,
    "nombre": "JUAN PEREZ",
    "dni": "12345678",
    "celular": "987654321",
    "email": "juan@gmail.com",
    "fechaCumpleanios": "1990-01-15",
    "logistica": {
      "direccion": "AV. LIMA 123",
      "referencia": "CERCA AL PARQUE",
      "distrito": "MIRAFLORES"
    }
  }
]
```

---

### 2. **GET /api/pedidos** - Listar Pedidos

**Request:**
```
GET https://wonderwall-api.azurewebsites.net/api/pedidos
Headers:
  Authorization: Bearer wonderwall-dev-token-2026
```

**Respuesta esperada:** `200 OK`
```json
[
  {
    "id": 1,
    "nombreCliente": "JUAN PEREZ",
    "dni": "12345678",
    "fechaBoda": "2026-06-15T14:00:00",
    "estado": "Pendiente",
    "detalles": [...],
    "pago": {...},
    "logistica": {...}
  }
]
```

---

### 3. **POST /api/clientes** - Crear Cliente (Admin)

**Request:**
```
POST https://wonderwall-api.azurewebsites.net/api/clientes
Headers:
  Authorization: Bearer wonderwall-dev-token-2026
  Content-Type: application/json

Body (JSON):
{
  "nombre": "MARIA GARCIA",
  "dni": "87654321",
  "celular": "912345678",
  "email": "maria@gmail.com",
  "fechaCumpleanios": "1985-05-20",
  "logistica": {
    "direccion": "CALLE LOS OLIVOS 456",
    "referencia": "FRENTE AL MERCADO",
    "distrito": "SAN ISIDRO"
  }
}
```

**Respuesta esperada:** `201 Created`
```json
{
  "id": 2,
  "nombre": "MARIA GARCIA",
  "dni": "87654321",
  ...
}
```

---

### 4. **POST /api/pedidos** - Crear Pedido

**Request:**
```
POST https://wonderwall-api.azurewebsites.net/api/pedidos
Headers:
  Authorization: Bearer wonderwall-dev-token-2026
  Content-Type: application/json

Body (JSON):
{
  "nombre": "CARLOS RODRIGUEZ",
  "dni": "45678912",
  "celular": "998877665",
  "email": "carlos@gmail.com",
  "fechaBoda": "2026-08-20T16:00:00",
  "detalles": [
    {
      "categoria": "TORTAS",
      "sabor": "CHOCOLATE",
      "relleno": "MANJAR BLANCO",
      "cobertura": "FONDANT",
      "peso": "5KG",
      "pisos": 3,
      "forma": "REDONDA",
      "decoracion": "FLORES NATURALES",
      "cantidad": 1,
      "precioUnitario": 350.00,
      "subtotal": 350.00
    },
    {
      "categoria": "BOCADITOS SALADOS",
      "tipoUnidad": "DOCENAS",
      "cantidad": 10,
      "precioUnitario": 25.00,
      "subtotal": 250.00
    }
  ],
  "pago": {
    "adelanto": 200.00,
    "saldo": 400.00,
    "metodoPago": "TRANSFERENCIA",
    "fechaPago": "2026-05-03T10:00:00"
  },
  "logistica": {
    "direccion": "AV. AREQUIPA 789",
    "referencia": "AL LADO DEL HOTEL",
    "distrito": "LINCE",
    "horaEntrega": "15:00"
  }
}
```

**Respuesta esperada:** `201 Created`

---

### 5. **PUT /api/clientes/{id}** - Actualizar Cliente

**Request:**
```
PUT https://wonderwall-api.azurewebsites.net/api/clientes/1
Headers:
  Authorization: Bearer wonderwall-dev-token-2026
  Content-Type: application/json

Body (JSON):
{
  "nombre": "JUAN PEREZ ACTUALIZADO",
  "dni": "12345678",
  "celular": "987654322",
  "email": "juanperez@gmail.com",
  "fechaCumpleanios": "1990-01-15",
  "logistica": {
    "direccion": "AV. LIMA 124",
    "referencia": "CERCA AL PARQUE CENTRAL",
    "distrito": "MIRAFLORES"
  }
}
```

**Respuesta esperada:** `200 OK`

---

### 6. **POST /api/clientes/registro** - Registro Público (SIN Token)

**Request:**
```
POST https://wonderwall-api.azurewebsites.net/api/clientes/registro
Headers:
  Content-Type: application/json

Body (JSON):
{
  "nombre": "LAURA TORRES",
  "dni": "78945612",
  "celular": "945612378",
  "email": "laura@gmail.com"
}
```

**Respuesta esperada:** `201 Created`
```json
{
  "clienteId": 3,
  "token": "abc123def456...",
  "mensaje": "Cliente registrado exitosamente"
}
```

---

### 7. **POST /api/clientes/validar-token** - Validar Token de Cliente

**Request:**
```
POST https://wonderwall-api.azurewebsites.net/api/clientes/validar-token
Headers:
  Content-Type: application/json

Body (JSON):
{
  "token": "abc123def456..."
}
```

**Respuesta esperada:** `200 OK`
```json
{
  "valido": true,
  "cliente": {
    "id": 3,
    "nombre": "LAURA TORRES",
    "dni": "78945612"
  }
}
```

---

## ⚠️ Errores Comunes

### Error 401 Unauthorized
```json
{
  "error": "No autorizado"
}
```
**Solución:** Verifica que el header `Authorization` esté correcto:
```
Authorization: Bearer wonderwall-dev-token-2026
```

### Error 400 Bad Request
```json
{
  "error": "Datos inválidos"
}
```
**Solución:** Verifica el formato del JSON. Todos los strings deben estar en MAYÚSCULAS.

### Error 404 Not Found
```json
{
  "error": "Recurso no encontrado"
}
```
**Solución:** Verifica la URL del endpoint.

---

## 🧪 Secuencia de Prueba Recomendada

1. **GET /api/clientes** - Verificar que el backend responde
2. **GET /api/pedidos** - Verificar autenticación
3. **POST /api/clientes** - Crear un cliente de prueba
4. **POST /api/pedidos** - Crear un pedido con ese cliente
5. **PUT /api/clientes/{id}** - Actualizar el cliente
6. **POST /api/clientes/registro** - Probar registro público
7. **POST /api/clientes/validar-token** - Validar el token generado

---

## 📦 Importar Colección a Postman

Ver archivo: `wonderwall-postman-collection.json`

**Importar:**
1. Postman → Import
2. Seleccionar `wonderwall-postman-collection.json`
3. Configurar environment con `baseUrl` y `adminToken`
4. ¡Listo para probar!

---

## 💡 Tips

- Usa **environments** para cambiar fácilmente entre dev y prod
- Guarda responses de ejemplo en Postman para documentación
- Usa **Pre-request Scripts** para generar datos dinámicos
- Activa **Tests** para validar respuestas automáticamente

---

**¡Listo para probar!** 🚀
