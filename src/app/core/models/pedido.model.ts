export enum EstadoPedido {
  Cotizado = 'Cotizado',
  Pagado = 'Pagado',
  Entregado = 'Entregado',
}

export interface Cliente {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  fechaCumpleanios?: string;
  fechaBoda: string;
  celular?: string;
  email?: string;
  creadoEn: string;
}

export interface CrearClienteRequest {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  fechaCumpleanios?: string;
  fechaBoda: string;
  celular?: string;
  email?: string;
  logistica?: LogisticaPedido;
}

export interface DetallePedido {
  tipoKeke: string;
  relleno?: string;
  porciones: number;
  esMaqueta: boolean;
  observaciones?: string;
  imagenReferencial?: string; // base64 comprimida para el contrato PDF
}

export interface CuotaPago {
  numero: number;
  importe: number;
  fecha?: string; // ISO — undefined significa 'al firmar el contrato'
}

export interface PagoPedido {
  importeTotal: number;
  subtotal: number;
  igv: number;
  numeroCuotas: number;
  cuotas: CuotaPago[];
}

export interface LogisticaPedido {
  nombreLocal?: string;
  direccion?: string;
  ubicacionMaps?: string;
  horaLlegada?: string;
}

export interface Pedido {
  id: number;
  nombreCliente: string;
  dni: string;
  email?: string;
  celular?: string;
  fechaBoda: string;
  estado: EstadoPedido;
  contratoPdfUrl?: string;
  creadoEn: string;
  detalles: DetallePedido[];
  logistica?: LogisticaPedido;
  pago?: PagoPedido;
}

// ---- Requests ----
export interface CrearPedidoRequest {
  nombre: string;
  dni: string;
  tipoDocumento?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  fechaCumpleanios?: string;
  celular?: string;
  email?: string;
  fechaBoda: string;
  detalles: DetallePedido[];
  logistica?: LogisticaPedido;
  pago?: PagoPedido;
}
