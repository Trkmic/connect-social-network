import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  
  private mensajeRecibidoSubject = new Subject<any>();
  private usuarioEscribiendoSubject = new Subject<{ emisorId: string; escribiendo: boolean }>();
  private nuevaNotificacionSubject = new Subject<any>();
  private usuariosEnLineaSubject = new Subject<string[]>();

  constructor() {
    if (this.getToken()) {
      this.conectar();
    }
  }

  private getToken() {
    return localStorage.getItem('token');
  }

  conectar() {
    if (this.socket?.connected) return;

    const token = this.getToken();
    if (!token) return;

    this.socket = io(environment.apiUrl, {
      auth: {
        token
      }
    });

    this.socket.on('recibirMensaje', (mensaje) => {
      this.mensajeRecibidoSubject.next(mensaje);
    });

    this.socket.on('usuarioEscribiendo', (data) => {
      this.usuarioEscribiendoSubject.next(data);
    });

    this.socket.on('nuevaNotificacion', (notificacion) => {
      this.nuevaNotificacionSubject.next(notificacion);
    });

    this.socket.on('usuariosEnLinea', (usuarios) => {
      this.usuariosEnLineaSubject.next(usuarios);
    });
  }

  desconectar() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  enviarMensaje(receptorId: string, contenido: string) {
    if (this.socket) {
      this.socket.emit('enviarMensaje', { receptorId, contenido });
    }
  }

  enviarEscribiendo(receptorId: string, escribiendo: boolean) {
    if (this.socket) {
      this.socket.emit('escribiendo', { receptorId, escribiendo });
    }
  }

  onNuevoMensaje(): Observable<any> {
    return this.mensajeRecibidoSubject.asObservable();
  }

  onUsuarioEscribiendo(): Observable<{ emisorId: string; escribiendo: boolean }> {
    return this.usuarioEscribiendoSubject.asObservable();
  }

  onNuevaNotificacion(): Observable<any> {
    return this.nuevaNotificacionSubject.asObservable();
  }

  onUsuariosEnLinea(): Observable<string[]> {
    return this.usuariosEnLineaSubject.asObservable();
  }
}
