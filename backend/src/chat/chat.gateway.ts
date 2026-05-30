import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Mapeo de userId -> socketId
  private connectedUsers: Map<string, string> = new Map();

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const decoded = await this.authService.verificarToken(token);
      if (!decoded) {
        client.disconnect();
        return;
      }

      const userId = decoded.sub.toString();
      this.connectedUsers.set(userId, client.id);
      
      client.data = { userId };
      
      this.emitOnlineUsers();
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.emitOnlineUsers();
    }
  }

  private emitOnlineUsers() {
    const onlineUserIds = Array.from(this.connectedUsers.keys());
    this.server.emit('usuariosEnLinea', onlineUserIds);
  }

  @SubscribeMessage('enviarMensaje')
  async handleEnviarMensaje(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receptorId: string; contenido: string },
  ) {
    const emisorId = client.data?.userId;
    if (!emisorId || !data.receptorId || !data.contenido) return;

    const mensaje = await this.chatService.crearMensaje(
      emisorId,
      data.receptorId,
      data.contenido,
    );

    const responsePayload = {
      _id: mensaje._id,
      emisorId: emisorId,
      receptorId: data.receptorId,
      contenido: data.contenido,
      createdAt: mensaje.createdAt,
      leido: false,
    };

    client.emit('recibirMensaje', responsePayload);

    const receptorSocketId = this.connectedUsers.get(data.receptorId);
    if (receptorSocketId) {
      this.server.to(receptorSocketId).emit('recibirMensaje', responsePayload);
    }
  }

  @SubscribeMessage('escribiendo')
  handleEscribiendo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receptorId: string; escribiendo: boolean },
  ) {
    const emisorId = client.data?.userId;
    if (!emisorId || !data.receptorId) return;

    const receptorSocketId = this.connectedUsers.get(data.receptorId);
    if (receptorSocketId) {
      this.server.to(receptorSocketId).emit('usuarioEscribiendo', {
        emisorId,
        escribiendo: data.escribiendo,
      });
    }
  }

  // Enviar notificación en tiempo real a un usuario conectado
  enviarNotificacionAUsuario(receptorId: string, notificacion: any) {
    const receptorSocketId = this.connectedUsers.get(receptorId);
    if (receptorSocketId) {
      this.server.to(receptorSocketId).emit('nuevaNotificacion', notificacion);
    }
  }
}
