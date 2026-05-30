import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../core/services/socket.service';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.css'
})
export class ChatPanel implements OnInit, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isExpanded = false;
  usuarios: any[] = [];
  usuariosEnLinea: string[] = [];
  activeUser: any = null;
  mensajes: any[] = [];
  nuevoMensajeText = '';
  currentUser: any = null;
  otroUsuarioEscribiendo = false;

  private subscriptions: Subscription[] = [];
  private typingTimeout: any;

  private socketService = inject(SocketService);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.currentUser = this.authService.getUsuarioLogueado();
    if (!this.currentUser) return;

    this.cargarUsuarios();

    // Escuchar usuarios en línea
    this.subscriptions.push(
      this.socketService.onUsuariosEnLinea().subscribe((userIds) => {
        this.usuariosEnLinea = userIds;
      })
    );

    // Escuchar mensajes entrantes
    this.subscriptions.push(
      this.socketService.onNuevoMensaje().subscribe((mensaje) => {
        if (!this.activeUser) return;
        const activeId = this.activeUser._id || this.activeUser.id;
        
        if (
          mensaje.emisorId === activeId || 
          mensaje.receptorId === activeId
        ) {
          const yaExiste = this.mensajes.some(m => m._id === mensaje._id);
          if (!yaExiste) {
            this.mensajes.push(mensaje);
            this.marcarLeidos();
            this.scrollToBottom();
          }
        }
      })
    );

    // Escuchar estado escribiendo
    this.subscriptions.push(
      this.socketService.onUsuarioEscribiendo().subscribe((data) => {
        if (!this.activeUser) return;
        const activeId = this.activeUser._id || this.activeUser.id;
        
        if (data.emisorId === activeId) {
          this.otroUsuarioEscribiendo = data.escribiendo;
          this.scrollToBottom();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  cargarUsuarios() {
    this.authService.getUsuarios().subscribe({
      next: (users) => {
        const loggedId = this.currentUser._id || this.currentUser.id;
        this.usuarios = users.filter(u => (u._id || u.id) !== loggedId);
      },
      error: (err) => console.error('Error al cargar usuarios para el chat:', err)
    });
  }

  isOnline(user: any): boolean {
    const userId = user._id || user.id;
    return this.usuariosEnLinea.includes(userId);
  }

  selectUser(user: any) {
    this.activeUser = user;
    this.mensajes = [];
    this.otroUsuarioEscribiendo = false;
    
    const userId = user._id || user.id;
    this.chatService.obtenerMensajes(userId).subscribe({
      next: (history) => {
        this.mensajes = history;
        this.marcarLeidos();
        this.scrollToBottom();
      },
      error: (err) => console.error('Error al cargar mensajes:', err)
    });
  }

  marcarLeidos() {
    if (!this.activeUser) return;
    const userId = this.activeUser._id || this.activeUser.id;
    this.chatService.marcarLeidos(userId).subscribe();
  }

  togglePanel() {
    this.isExpanded = !this.isExpanded;
    if (!this.isExpanded) {
      this.activeUser = null;
    }
  }

  closeChat() {
    this.activeUser = null;
  }

  onKeyPress(event: any) {
    if (event.key === 'Enter') {
      this.enviarMensaje();
    } else {
      this.notifyTyping();
    }
  }

  notifyTyping() {
    if (!this.activeUser) return;
    const receptorId = this.activeUser._id || this.activeUser.id;
    
    this.socketService.enviarEscribiendo(receptorId, true);
    
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    
    this.typingTimeout = setTimeout(() => {
      this.socketService.enviarEscribiendo(receptorId, false);
    }, 2000);
  }

  enviarMensaje() {
    if (!this.nuevoMensajeText.trim() || !this.activeUser) return;
    
    const receptorId = this.activeUser._id || this.activeUser.id;
    const contenido = this.nuevoMensajeText;
    
    this.socketService.enviarMensaje(receptorId, contenido);
    this.nuevoMensajeText = '';
    
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.socketService.enviarEscribiendo(receptorId, false);
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }, 50);
  }
}
