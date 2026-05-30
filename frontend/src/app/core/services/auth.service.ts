import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { Observable, of, Subscription, timer, interval } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; 
import { jwtDecode } from 'jwt-decode';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private baseUrl = environment.apiUrl;
  private sessionWarningTimer?: Subscription;
  private sessionLogoutTimer?: Subscription;
  
  private sessionProactiveCheckSubscription: Subscription | null = null;
  private readonly PROACTIVE_CHECK_INTERVAL = 300000;



  constructor(private http: HttpClient, 
    private router: Router,
    private socketService: SocketService
  )
    {
      if (this.getToken()) {
          this.startProactiveCheck();
      }
    }

  register(formData: FormData) {
    return this.http.post(`${this.baseUrl}/auth/register`, formData);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, data).pipe(
      tap((res: any) => {
        if (res.token && res.user) { 
          const usuario = res.user;
          if (usuario.id && !usuario._id) {
            usuario._id = usuario.id;
          }
          localStorage.setItem('token', res.token);
          localStorage.setItem('usuario', JSON.stringify(usuario));
        
          this.startProactiveCheck();
          this.startSessionTimers(); 
          this.socketService.conectar();
        }
      })
    );
  }

  logout(showModal = true) { 
    this.stopSessionTimers(); 
    this.stopProactiveCheck(); 
    this.socketService.desconectar();
    
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    
    const currentUrl = this.router.url;
    const isPublicRoute = currentUrl === '/login' || currentUrl === '/registro';

    if (showModal && !isPublicRoute) {
        Swal.fire({
            title: 'Sesión Expirada', 
            text: 'Tu sesión ha caducado. Por favor, vuelve a iniciar sesión.', 
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            allowOutsideClick: false,
        }).then(() => {
            this.router.navigate(['/login']);
        });
    } else {
        this.router.navigate(['/login']);
    }
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    return !!token; 
  }

  getUsuarioLogueado(): any {
    const user = localStorage.getItem('usuario');
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch {
      localStorage.removeItem('usuario');
      return null;
    }
  }

  getUsuarioPorId(id: string) {
    return this.http.get(`${this.baseUrl}/usuarios/${id}`);
  }

  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/usuarios`);
  }

  seguir(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/usuarios/${id}/seguir`, {});
  }

  dejarDeSeguir(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/usuarios/${id}/dejar-de-seguir`, {});
  }

  actualizarUsuario(id: string, data: any, file: File | null): Observable<any> {
    
    const formData = new FormData();

    formData.append('nombre', data.nombre || '');
    formData.append('apellido', data.apellido || '');
    formData.append('descripcion', data.descripcion || '');

    if (file) {
      formData.append('imagenPerfil', file, file.name);
    }

    return this.http.put(`${this.baseUrl}/usuarios/${id}`, formData).pipe(
      tap((usuarioActualizado: any) => {

        if (usuarioActualizado.id && !usuarioActualizado._id) {
          usuarioActualizado._id = usuarioActualizado.id;
        }
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
      })
    );
  }

  checkTokenValidity(): Observable<boolean> {
    const token = this.getToken();
    const user = this.getUsuarioLogueado();
    const userId = user?._id || user?.id;

    if (!token || !userId) {
      this.stopSessionTimers();
      this.stopProactiveCheck();
      return of(false);
    }

    return this.getUsuarioPorId(userId).pipe(
      tap((usuarioActualizado: any) => {

        if (usuarioActualizado.id && !usuarioActualizado._id) {
          usuarioActualizado._id = usuarioActualizado.id;
        }

        const usuarioViejo = this.getUsuarioLogueado() || {}; 

        const usuarioFinal = {
          ...usuarioViejo,
          ...usuarioActualizado
        };

        localStorage.setItem('usuario', JSON.stringify(usuarioFinal));
        this.startSessionTimers();
      }),
      map(() => true), 
      catchError((error) => {
        if (error.status === 401 || error.status === 403) {
          this.logout(true);
          return of(false);
        }
        return of(true);
      })
    );
  }

  startSessionTimers() {
    this.stopSessionTimers();

    const t = 1000 * 60; 

    this.sessionWarningTimer = timer(10 * t).subscribe(() => {
      this.showExtensionModal();
    });

    this.sessionLogoutTimer = timer(15 * t).subscribe(() => {
      this.logout(false); 
    });
  }

  stopSessionTimers() {
    this.sessionWarningTimer?.unsubscribe();
    this.sessionLogoutTimer?.unsubscribe();
  }

  showExtensionModal() {
    Swal.fire({
      title: 'Tu sesión está por expirar',
      text: 'Quedan 5 minutos. ¿Deseas extender tu sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, extender',
      cancelButtonText: 'No, salir'
    }).then((result) => {
      if (result.isConfirmed) {
        this.refreshToken().subscribe();
      } else {
        this.logout();
      }
    });
  }

  refreshToken(): Observable<any> {

    return this.http.post(`${this.baseUrl}/auth/refresh`, {}).pipe(
      tap((res: any) => {
        if (res.token) {

          localStorage.setItem('token', res.token);
          this.startSessionTimers();
        }
      }),
      catchError((err) => {
        this.logout();
        return of(null);
      })
    );
  }

  public esAdministrador(): boolean {
    const token = this.getToken();
    if (!token) {
        return false;
    }

    try {
        // Decodifica el token para obtener el payload
        const payload: any = jwtDecode(token);
        
        return payload.perfil === 'administrador';
    } catch (error) {
        console.error('Error al decodificar el token:', error);
        return false;
    }
  }

  startProactiveCheck(): void {
    this.stopProactiveCheck(); 

    this.sessionProactiveCheckSubscription = interval(this.PROACTIVE_CHECK_INTERVAL)
      .pipe(
        switchMap(() => this.http.post<any>(`${this.baseUrl}/auth/refresh`, {})
          .pipe(
            catchError(error => {
                return of(null); 
            })
          )
        )
      )
      .subscribe({
          next: (res) => {
            if (res && res.token) {
                // Si el refresh fue exitoso, actualizamos el token
                localStorage.setItem('token', res.token);
                this.startSessionTimers();
            }
          },
          error: (err) => {} 
      });
  }

stopProactiveCheck(): void {
    if (this.sessionProactiveCheckSubscription) {
      this.sessionProactiveCheckSubscription.unsubscribe();
      this.sessionProactiveCheckSubscription = null;
    }
}
}

