import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { GetUser } from '../auth/jwt/get-user.decorator';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  async obtenerTodas(@GetUser() user: any) {
    return this.notificacionesService.obtenerParaUsuario(user._id.toString());
  }

  @Patch('leer')
  async marcarComoLeidas(@GetUser() user: any) {
    return this.notificacionesService.marcarTodasComoLeidas(user._id.toString());
  }
}
