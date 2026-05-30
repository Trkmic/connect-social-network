import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service'; 
import { NotificacionService } from '../../core/services/notificacion.service';
import { SocketService } from '../../core/services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  showPublicaciones = false;
  showMiPerfil = false;
  showSalir = false;
  showDashboardUsuarios = false;
  showDashboardEstadisticas = false;

  notificaciones: any[] = [];
  unreadCount = 0;
  showNotificacionesDropdown = false;
  isLoggedIn = false;

  private notifSubscription?: Subscription;
  
  constructor(
    private router: Router,
    private auth: AuthService,
    private notificacionesService: NotificacionService,
    private socketService: SocketService
  ) { 

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url;

        this.showPublicaciones = false;
        this.showMiPerfil = false;
        this.showSalir = false;
        this.showDashboardEstadisticas = false;

        if (url.includes('/publicaciones')) {
          this.showMiPerfil = true;
          this.showSalir = true;
        } else if (url.includes('/mi-perfil')) {
          this.showPublicaciones = true;
          this.showSalir = true;
        }else if (url.startsWith('/publicacion/')) {
          this.showPublicaciones = true;
          this.showSalir = true;
      }else if (url.startsWith('/dashboard')) {
        this.showPublicaciones = true;
        this.showSalir = true;
      }

      const loggedIn = this.auth.isLoggedIn();
      this.showSalir = loggedIn;
      this.isLoggedIn = loggedIn;

      if (loggedIn && this.auth.esAdministrador()) {
            this.showDashboardUsuarios = !url.includes('/dashboard/usuarios');
            this.showDashboardEstadisticas = !url.includes('/dashboard/estadisticas');
        }

      if (loggedIn && this.notificaciones.length === 0) {
            this.cargarNotificaciones();
        }
      
      }
    });
  }

  ngOnInit() {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (this.isLoggedIn) {
      this.cargarNotificaciones();
    }

    this.notifSubscription = this.socketService.onNuevaNotificacion().subscribe((notif) => {
      this.notificaciones.unshift(notif);
      this.unreadCount++;
    });
  }

  ngOnDestroy() {
    this.notifSubscription?.unsubscribe();
  }

  cargarNotificaciones() {
    this.notificacionesService.obtenerNotificaciones().subscribe({
      next: (notifs) => {
        this.notificaciones = notifs;
        this.unreadCount = notifs.filter(n => !n.leido).length;
      },
      error: (err) => {
        console.error('Error al cargar notificaciones:', err);
      }
    });
  }

  toggleNotificaciones() {
    this.showNotificacionesDropdown = !this.showNotificacionesDropdown;
    if (this.showNotificacionesDropdown && this.unreadCount > 0) {
      this.notificacionesService.marcarComoLeidas().subscribe({
        next: () => {
          this.unreadCount = 0;
          this.notificaciones.forEach(n => n.leido = true);
        }
      });
    }
  }

  getNotifTexto(notif: any): string {
    switch (notif.tipo) {
      case 'like':
        return ' le dio me gusta a tu publicación.';
      case 'comentario':
        return ' comentó tu publicación.';
      case 'follow':
        return ' comenzó a seguirte.';
      default:
        return ' realizó una acción.';
    }
  }

  clickNotificacion(notif: any) {
    this.showNotificacionesDropdown = false;
    if (notif.tipo === 'follow') {
      this.router.navigate([`/perfil/${notif.emisorId?._id || notif.emisorId?.id}`]);
    } else if (notif.publicacionId) {
      const pubId = typeof notif.publicacionId === 'object' ? notif.publicacionId._id || notif.publicacionId.id : notif.publicacionId;
      this.router.navigate([`/publicacion/${pubId}`]);
    }
  }

  clickLogo() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/publicaciones']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  navegador(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
