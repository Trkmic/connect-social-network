import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { GetUser } from '../auth/jwt/get-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('mensajes/:receptorId')
  async obtenerConversacion(
    @Param('receptorId') receptorId: string,
    @GetUser() user: any,
  ) {
    return this.chatService.obtenerConversacion(user._id.toString(), receptorId);
  }

  @Patch('leer/:emisorId')
  async marcarLeidos(
    @Param('emisorId') emisorId: string,
    @GetUser() user: any,
  ) {
    return this.chatService.marcarLeidos(emisorId, user._id.toString());
  }
}
