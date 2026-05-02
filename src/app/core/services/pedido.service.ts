import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearPedidoRequest, EstadoPedido, Pedido } from '../models';
import { toUppercaseDeep } from '../utils/uppercase.util';

const MOCK_PEDIDOS: Pedido[] = [
  // ── Marzo 2026 ─────────────────────────────────────────────
  {
    id: 1,
    nombreCliente: 'María García',
    dni: '12345678',
    email: 'maria@example.com',
    celular: '987654321',
    fechaBoda: '2026-03-07T00:00:00.000Z',
    estado: EstadoPedido.Entregado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-02-01T10:00:00.000Z',
    detalles: [
      { tipoKeke: 'Tres leches', relleno: 'Manjar', porciones: 100, esMaqueta: false, observaciones: '' }
    ],
    logistica: { nombreLocal: 'Salón Versalles', direccion: 'Av. Principal 123', horaLlegada: '17:00' }
  },
  {
    id: 2,
    nombreCliente: 'Carlos Pérez',
    dni: '87654321',
    email: 'carlos@example.com',
    celular: '912345678',
    fechaBoda: '2026-03-14T00:00:00.000Z',
    estado: EstadoPedido.Entregado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-02-10T09:00:00.000Z',
    detalles: [
      { tipoKeke: 'Chocolate', relleno: 'Crema chantilly', porciones: 80, esMaqueta: false },
      { tipoKeke: 'Vainilla', relleno: undefined, porciones: 20, esMaqueta: true, observaciones: 'Solo decorativa' }
    ]
  },
  {
    id: 3,
    nombreCliente: 'Diana Flores',
    dni: '55667788',
    email: 'diana@example.com',
    celular: '923456789',
    fechaBoda: '2026-03-21T00:00:00.000Z',
    estado: EstadoPedido.Pagado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-02-20T11:00:00.000Z',
    detalles: [
      { tipoKeke: 'Red Velvet', relleno: 'Queso crema', porciones: 120, esMaqueta: false }
    ],
    logistica: { nombreLocal: 'Hacienda San José', direccion: 'Km 45 Panamericana Sur', horaLlegada: '15:30' }
  },
  {
    id: 4,
    nombreCliente: 'Roberto Silva',
    dni: '33445566',
    email: 'roberto@example.com',
    celular: '956789012',
    fechaBoda: '2026-03-21T00:00:00.000Z',
    estado: EstadoPedido.Cotizado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-02-25T16:00:00.000Z',
    detalles: [
      { tipoKeke: 'Chiffon', relleno: 'Manjar blanco', porciones: 50, esMaqueta: false }
    ]
  },
  {
    id: 5,
    nombreCliente: 'Lucía Mendoza',
    dni: '99887766',
    email: 'lucia@example.com',
    celular: '934567890',
    fechaBoda: '2026-03-28T00:00:00.000Z',
    estado: EstadoPedido.Pagado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-03-01T09:30:00.000Z',
    detalles: [
      { tipoKeke: 'Tres leches', relleno: 'Fresa', porciones: 200, esMaqueta: false },
      { tipoKeke: 'Vainilla', relleno: undefined, porciones: 40, esMaqueta: true }
    ],
    logistica: { nombreLocal: 'Club Chiclayo', direccion: 'Av. Luis González 605', horaLlegada: '18:00' }
  },
  // ── Abril 2026 ─────────────────────────────────────────────
  {
    id: 6,
    nombreCliente: 'Eduardo Ramos',
    dni: '22334455',
    email: 'eduardo@example.com',
    celular: '945678901',
    fechaBoda: '2026-04-04T00:00:00.000Z',
    estado: EstadoPedido.Pagado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-03-05T08:00:00.000Z',
    detalles: [
      { tipoKeke: 'Chocolate', relleno: 'Trufa', porciones: 90, esMaqueta: false }
    ],
    logistica: { nombreLocal: 'Country Club Lima', direccion: 'Los Eucaliptos 590, San Isidro', horaLlegada: '17:00' }
  },
  {
    id: 7,
    nombreCliente: 'Patricia Vega',
    dni: '66778899',
    email: 'patricia@example.com',
    celular: '978901234',
    fechaBoda: '2026-04-11T00:00:00.000Z',
    estado: EstadoPedido.Cotizado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-03-08T14:00:00.000Z',
    detalles: [
      { tipoKeke: 'Red Velvet', relleno: 'Crema chantilly', porciones: 160, esMaqueta: false }
    ]
  },
  {
    id: 8,
    nombreCliente: 'Jorge Castillo',
    dni: '11002233',
    email: 'jorge@example.com',
    celular: '923456780',
    fechaBoda: '2026-04-18T00:00:00.000Z',
    estado: EstadoPedido.Pagado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-03-12T10:00:00.000Z',
    detalles: [
      { tipoKeke: 'Tres leches', relleno: 'Manjar', porciones: 140, esMaqueta: false },
      { tipoKeke: 'Chocolate', relleno: undefined, porciones: 30, esMaqueta: true }
    ],
    logistica: { nombreLocal: 'Hacienda Villa', direccion: 'Av. Circunvalación 123', horaLlegada: '16:00' }
  },
  {
    id: 9,
    nombreCliente: 'Sandra Ortiz',
    dni: '44556677',
    email: 'sandra@example.com',
    celular: '956781234',
    fechaBoda: '2026-04-25T00:00:00.000Z',
    estado: EstadoPedido.Cotizado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-03-14T11:30:00.000Z',
    detalles: [
      { tipoKeke: 'Vainilla', relleno: 'Lúcuma', porciones: 80, esMaqueta: false }
    ]
  },
  // ── Mayo 2026 ──────────────────────────────────────────────
  {
    id: 10,
    nombreCliente: 'Ana Torres',
    dni: '11223344',
    email: 'ana.torres@example.com',
    celular: '945678901',
    fechaBoda: '2026-05-02T00:00:00.000Z',
    estado: EstadoPedido.Cotizado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-03-15T14:30:00.000Z',
    detalles: [
      { tipoKeke: 'Red Velvet', relleno: 'Queso crema', porciones: 150, esMaqueta: false }
    ]
  },
  {
    id: 11,
    nombreCliente: 'Milagros Nieto',
    dni: '77889900',
    email: 'milagros@example.com',
    celular: '912340987',
    fechaBoda: '2026-05-16T00:00:00.000Z',
    estado: EstadoPedido.Pagado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-03-16T09:00:00.000Z',
    detalles: [
      { tipoKeke: 'Chiffon', relleno: 'Fresa', porciones: 110, esMaqueta: false },
      { tipoKeke: 'Vainilla', relleno: undefined, porciones: 25, esMaqueta: true }
    ],
    logistica: { nombreLocal: 'Centro de Convenciones', direccion: 'Av. Javier Prado 2465', horaLlegada: '15:00' }
  },
  {
    id: 12,
    nombreCliente: 'Luis Quispe',
    dni: '44332211',
    celular: '934567890',
    fechaBoda: '2026-05-30T00:00:00.000Z',
    estado: EstadoPedido.Cotizado,
    contratoPdfUrl: undefined,
    creadoEn: '2026-03-17T08:00:00.000Z',
    detalles: [
      { tipoKeke: 'Tres leches', relleno: 'Chirimoya', porciones: 60, esMaqueta: false }
    ]
  },
];

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly base = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient) {}

  crearPedido(request: CrearPedidoRequest): Observable<Pedido> {
    const normalizedRequest = toUppercaseDeep(request);
    console.log('📤 Enviando pedido al backend:', normalizedRequest);
    return this.http.post<Pedido>(this.base, normalizedRequest);
  }

  obtenerTodos(): Observable<Pedido[]> {
    if (!environment.production) {
      return of(MOCK_PEDIDOS);
    }
    return this.http.get<Pedido[]>(this.base);
  }

  obtenerPorId(id: number): Observable<Pedido> {
    if (!environment.production) {
      return of(MOCK_PEDIDOS.find(p => p.id === id)!);
    }
    return this.http.get<Pedido>(`${this.base}/${id}`);
  }

  actualizarEstado(id: number, estado: EstadoPedido): Observable<Pedido> {
    if (!environment.production) {
      const pedido = MOCK_PEDIDOS.find(p => p.id === id)!;
      pedido.estado = estado;
      return of({ ...pedido });
    }
    return this.http.patch<Pedido>(`${this.base}/${id}/estado`, { estado });
  }
}
