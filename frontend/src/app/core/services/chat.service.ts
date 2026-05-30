import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  obtenerMensajes(receptorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/chat/mensajes/${receptorId}`);
  }

  marcarLeidos(emisorId: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/chat/leer/${emisorId}`, {});
  }
}
