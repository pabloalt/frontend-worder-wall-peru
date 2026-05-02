import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearPedidoRequest, EstadoPedido, Pedido } from '../models';
import { toUppercaseDeep } from '../utils/uppercase.util';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly base = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient) {}

  crearPedido(request: CrearPedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(this.base, toUppercaseDeep(request));
  }

  obtenerTodos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.base);
  }

  obtenerPorId(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.base}/${id}`);
  }

  actualizarEstado(id: number, estado: EstadoPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.base}/${id}/estado`, { estado });
  }
}
