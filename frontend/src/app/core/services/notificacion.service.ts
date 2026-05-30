import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  obtenerNotificaciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/notificaciones`);
  }

  marcarComoLeidas(): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/notificaciones/leer`, {});
  }
}
