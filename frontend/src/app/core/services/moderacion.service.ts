import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModeracionService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  reportar(tipo: 'publicacion' | 'comentario', publicacionId?: string, comentarioId?: string, motivo?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/moderacion/reportar`, {
      tipo,
      publicacionId,
      comentarioId,
      motivo
    });
  }

  obtenerReportes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/moderacion/reportes`);
  }

  resolverReporte(id: string, accion: 'eliminar' | 'descartar'): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/moderacion/reportes/${id}/resolver`, {
      accion
    });
  }
}
