import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, CrearClienteRequest } from '../models';

const MOCK_CLIENTES: Cliente[] = [];

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly base = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  crearCliente(request: CrearClienteRequest): Observable<Cliente> {
    if (!environment.production) {
      const nuevo: Cliente = {
        id: Date.now(),
        tipoDocumento:    request.tipoDocumento,
        numeroDocumento:  request.numeroDocumento,
        nombres:          request.nombres,
        apellidoPaterno:  request.apellidoPaterno,
        apellidoMaterno:  request.apellidoMaterno,
        fechaCumpleanios: request.fechaCumpleanios,
        fechaBoda:        request.fechaBoda,
        celular:          request.celular,
        email:            request.email,
        creadoEn:         new Date().toISOString(),
      };
      MOCK_CLIENTES.push(nuevo);
      return of(nuevo);
    }
    return this.http.post<Cliente>(this.base, request);
  }

  obtenerTodos(): Observable<Cliente[]> {
    if (!environment.production) {
      return of(MOCK_CLIENTES);
    }
    return this.http.get<Cliente[]>(this.base);
  }

  obtenerPorId(id: number): Observable<Cliente> {
    if (!environment.production) {
      return of(MOCK_CLIENTES.find(c => c.id === id)!);
    }
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }
}
