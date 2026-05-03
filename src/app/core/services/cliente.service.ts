import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActualizarClienteRequest, Cliente, CrearClienteRequest, GenerarTokenResponse, ValidarTokenResponse } from '../models';
import { toUppercaseDeep } from '../utils/uppercase.util';
import { SKIP_AUTH } from '../interceptors/auth.interceptor';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly base = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  crearCliente(request: CrearClienteRequest, skipAuth = false): Observable<Cliente> {
    const context = skipAuth ? new HttpContext().set(SKIP_AUTH, true) : undefined;
    return this.http.post<Cliente>(this.base, toUppercaseDeep(request), { context });
  }

  obtenerTodos(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.base);
  }

  obtenerPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }

  actualizarCliente(id: number, request: ActualizarClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.base}/${id}`, toUppercaseDeep(request));
  }

  generarToken(): Observable<GenerarTokenResponse> {
    return this.http.post<GenerarTokenResponse>(`${environment.apiUrl}/tokens`, {});
  }

  validarToken(token: string): Observable<ValidarTokenResponse> {
    return this.http.get<ValidarTokenResponse>(`${environment.apiUrl}/tokens/${token}/validar`);
  }
}
