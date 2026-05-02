# 📦 Endpoint POST /api/pedidos - Referencia Rápida

## 🎯 URL y Método

```
POST https://wonderwall-api.azurewebsites.net/api/pedidos
POST http://localhost:7211/api/pedidos (desarrollo)
```

**⚠️ IMPORTANTE - Página Interna:**
- Este endpoint es SOLO para uso interno (panel de admin)
- SIEMPRE requiere autenticación de admin
- NO usa token de cliente (a diferencia de POST /api/clientes)
- Se llama desde el componente `/formulario` (protegido por AuthGuard)

**Headers:**
```
Authorization: Bearer {tu_token_de_admin}
Content-Type: application/json
```

---

## 📝 Request Body - Ejemplos

### ✅ Ejemplo 1: Pedido Simple (sin pago, sin logística)

```json
{
  "nombre": "NERY GERONIMO TORRES",
  "dni": "21492882",
  "celular": "967652359",
  "email": "NERI@GMAIL.COM",
  "fechaBoda": "2026-05-26T05:00:00.000Z",
  "detalles": [
    {
      "tipoKeke": "TORTA CLÁSICA",
      "relleno": "MANJAR BLANCO",
      "porciones": 80,
      "esMaqueta": false,
      "observaciones": "DECORACIÓN SENCILLA"
    }
  ]
}
```

---

### ✅ Ejemplo 2: Pedido con Pago en Cuotas

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
      "relleno": "TRES LECHES",
      "porciones": 150,
      "esMaqueta": false
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
        "importe": 750
      },
      {
        "numero": 2,
        "importe": 750,
        "fecha": "2026-06-10T00:00:00.000Z"
      }
    ]
  }
}
```

**Nota:** La cuota 1 tiene `fecha: null` porque se paga al firmar el contrato.

---

### ✅ Ejemplo 3: Pedido Completo (múltiples tortas + pago + logística)

```json
{
  "nombre": "CARLOS PÉREZ MENDOZA",
  "dni": "87654321",
  "celular": "912345678",
  "email": "CARLOS@EXAMPLE.COM",
  "fechaBoda": "2026-07-15T00:00:00.000Z",
  "detalles": [
    {
      "tipoKeke": "TORTA PRINCIPAL 4 PISOS",
      "relleno": "CHOCOLATE BELGA CON FRAMBUESA",
      "porciones": 200,
      "esMaqueta": false,
      "observaciones": "DECORACIÓN ELEGANTE EN ORO Y BLANCO",
      "imagenReferencial": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    },
    {
      "tipoKeke": "MINI TORTAS INDIVIDUALES",
      "relleno": "RED VELVET",
      "porciones": 50,
      "esMaqueta": false,
      "observaciones": "50 UNIDADES PARA MESA DE POSTRES"
    },
    {
      "tipoKeke": "TORTA MAQUETA GIGANTE",
      "porciones": 1,
      "esMaqueta": true,
      "observaciones": "SOLO PARA FOTOS - 2 METROS DE ALTO"
    }
  ],
  "pago": {
    "importeTotal": 3500,
    "subtotal": 2966.10,
    "igv": 533.90,
    "numeroCuotas": 3,
    "cuotas": [
      {
        "numero": 1,
        "importe": 1500
      },
      {
        "numero": 2,
        "importe": 1500,
        "fecha": "2026-07-01T00:00:00.000Z"
      },
      {
        "numero": 3,
        "importe": 500,
        "fecha": "2026-07-14T00:00:00.000Z"
      }
    ]
  },
  "logistica": {
    "nombreLocal": "COUNTRY CLUB LIMA HOTEL",
    "direccion": "AV. GOLF LOS INCAS 210, SANTIAGO DE SURCO",
    "ubicacionMaps": "https://maps.google.com/?q=-12.0956,-77.0088",
    "horaLlegada": "16:00"
  }
}
```

---

## 📋 Estructura de Campos

### **Nivel Raíz**

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| `nombre` | string | ✅ | Nombre completo del cliente |
| `dni` | string | ✅ | Documento de identidad |
| `celular` | string | ❌ | Teléfono celular |
| `email` | string | ❌ | Email (se envía contrato aquí) |
| `fechaBoda` | string ISO | ✅ | Fecha del evento |
| `detalles` | array | ✅ | Lista de tortas (mínimo 1) |
| `pago` | object | ❌ | Información de pago |
| `logistica` | object | ❌ | Información de entrega |

### **Objeto `detalles[]`**

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| `tipoKeke` | string | ✅ | Tipo de torta/keke |
| `relleno` | string | ❌ | Sabor del relleno |
| `porciones` | number | ✅ | Cantidad de porciones |
| `esMaqueta` | boolean | ✅ | true = decorativa, false = comestible |
| `observaciones` | string | ❌ | Notas adicionales |
| `imagenReferencial` | string | ❌ | Imagen en base64 (máx 5MB) |

### **Objeto `pago`**

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| `importeTotal` | number | ✅ | Total con IGV incluido |
| `subtotal` | number | ✅ | Subtotal sin IGV |
| `igv` | number | ✅ | Monto del IGV (18%) |
| `numeroCuotas` | number | ✅ | Cantidad de cuotas |
| `cuotas` | array | ✅ | Detalle de cada cuota |

### **Objeto `pago.cuotas[]`**

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| `numero` | number | ✅ | Número de cuota (1, 2, 3...) |
| `importe` | number | ✅ | Monto de la cuota |
| `fecha` | string ISO | ❌ | Fecha de vencimiento (null = al firmar) |

### **Objeto `logistica`**

| Campo | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| `nombreLocal` | string | ❌ | Nombre del local del evento |
| `direccion` | string | ❌ | Dirección completa |
| `ubicacionMaps` | string | ❌ | URL de Google Maps |
| `horaLlegada` | string | ❌ | Hora en formato "HH:mm" |

---

## ✅ Response Exitoso (201 Created)

```json
{
  "id": 123,
  "nombreCliente": "MARÍA GARCÍA LÓPEZ",
  "dni": "12345678",
  "email": "MARIA@EXAMPLE.COM",
  "celular": "987654321",
  "fechaBoda": "2026-06-20T00:00:00.000Z",
  "estado": "Cotizado",
  "contratoPdfUrl": "https://storage.wonderwall.com/contratos/123.pdf",
  "creadoEn": "2026-05-02T15:30:00.000Z",
  "detalles": [
    {
      "tipoKeke": "TORTA DE 3 PISOS",
      "relleno": "TRES LECHES",
      "porciones": 150,
      "esMaqueta": false,
      "observaciones": null,
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
        "fecha": "2026-06-10T00:00:00.000Z"
      }
    ]
  },
  "logistica": null
}
```

---

## ❌ Errores Comunes

### Error 401: Sin autenticación
```json
{
  "error": {
    "codigo": "NO_AUTORIZADO",
    "mensaje": "Token de autenticación requerido"
  }
}
```

### Error 422: Validación fallida
```json
{
  "error": {
    "codigo": "VALIDACION_FALLIDA",
    "mensaje": "El campo 'nombre' es requerido",
    "detalles": {
      "campo": "nombre"
    }
  }
}
```

### Error 422: Suma de cuotas incorrecta
```json
{
  "error": {
    "codigo": "SUMA_CUOTAS_INVALIDA",
    "mensaje": "La suma de las cuotas (1400) no coincide con el importe total (1500)",
    "detalles": {
      "sumaCuotas": 1400,
      "importeTotal": 1500,
      "diferencia": 100
    }
  }
}
```

---

## 🔄 Cálculos Automáticos

### IGV (18%)
```javascript
const importeTotal = 1500;
const subtotal = importeTotal / 1.18;  // 1271.19
const igv = importeTotal - subtotal;   // 228.81
```

### Validación de Cuotas
```javascript
const sumaCuotas = cuotas.reduce((sum, c) => sum + c.importe, 0);
const diferencia = Math.abs(sumaCuotas - importeTotal);

if (diferencia > 0.01) {
  throw new Error('Suma de cuotas no coincide con el total');
}
```

---

## 🗄️ Tablas Afectadas

Cuando creas un pedido, se insertan registros en:

1. ✅ **Pedidos** - 1 registro con datos principales
2. ✅ **DetallesPedido** - N registros (uno por cada torta)
3. ✅ **Pagos** - 0 o 1 registro (si viene `pago`)
4. ✅ **CuotasPago** - N registros (si viene `pago.cuotas`)
5. ✅ **LogisticaPedido** - 0 o 1 registro (si viene `logistica`)

---

## 📧 Acciones Post-Creación

Después de crear el pedido, el backend debe:

1. ✅ Generar PDF del contrato
2. ✅ Guardar PDF en storage (Azure Blob, S3, etc.)
3. ✅ Actualizar campo `contratoPdfUrl` en la tabla Pedidos
4. ✅ Enviar email al cliente con el PDF adjunto
5. ✅ Retornar el pedido completo con la URL del contrato

---

## 🧪 Prueba con cURL

```bash
curl -X POST https://wonderwall-api.azurewebsites.net/api/pedidos \
  -H "Authorization: Bearer tu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "NERY GERONIMO TORRES",
    "dni": "21492882",
    "celular": "967652359",
    "email": "NERI@GMAIL.COM",
    "fechaBoda": "2026-05-26T05:00:00.000Z",
    "detalles": [
      {
        "tipoKeke": "TORTA CLÁSICA",
        "porciones": 80,
        "esMaqueta": false
      }
    ]
  }'
```

---

## 📱 Ejemplo desde el Frontend Angular

```typescript
const pedidoData = {
  nombre: 'NERY GERONIMO TORRES',
  dni: '21492882',
  celular: '967652359',
  email: 'NERI@GMAIL.COM',
  fechaBoda: new Date('2026-05-26').toISOString(),
  detalles: [
    {
      tipoKeke: 'TORTA CLÁSICA',
      relleno: 'MANJAR BLANCO',
      porciones: 80,
      esMaqueta: false,
      observaciones: 'DECORACIÓN SENCILLA'
    }
  ]
};

this.http.post<Pedido>('https://wonderwall-api.azurewebsites.net/api/pedidos', pedidoData)
  .subscribe({
    next: (pedido) => {
      console.log('Pedido creado:', pedido);
      console.log('URL del contrato:', pedido.contratoPdfUrl);
    },
    error: (error) => {
      console.error('Error al crear pedido:', error);
    }
  });
```

---

## 🔐 Comparación: POST /api/pedidos vs POST /api/clientes

### ❓ ¿Cuál es la diferencia en autenticación?

| Aspecto | POST /api/pedidos | POST /api/clientes |
|---------|------------------|-------------------|
| **Tipo de página** | Interna (admin) | Pública O Interna |
| **Autenticación** | SIEMPRE admin token | Token de cliente O admin token |
| **Header requerido** | `Authorization: Bearer {admin_token}` | Depende del origen |
| **Campo `token` en body** | ❌ NO se usa | ✅ Solo si es público |
| **Protección en frontend** | AuthGuard | Validación de token en query param |
| **Componente** | `/formulario` | `/registro-cliente` (público) o `/clientes` (admin) |

---

### 📌 Regla Clave

```
POST /api/pedidos
  → Página INTERNA
  → SIEMPRE usa Authorization: Bearer {admin_token}
  → NO acepta token de cliente en el body

POST /api/clientes
  → Puede ser PÚBLICA (con token) o INTERNA (con admin token)
  → Si viene desde /registro-cliente?token=xxx → usa token en body
  → Si viene desde /clientes (admin) → usa Authorization header
```

---

**Última actualización:** Mayo 2026
