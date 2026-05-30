import { Controller, Get, Post, Patch, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ModeracionService } from './moderacion.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { GetUser } from '../auth/jwt/get-user.decorator';

@Controller('moderacion')
@UseGuards(JwtAuthGuard)
export class ModeracionController {
  constructor(private readonly moderacionService: ModeracionService) {}

  @Post('reportar')
  async reportar(
    @GetUser() user: any,
    @Body('tipo') tipo: 'publicacion' | 'comentario',
    @Body('publicacionId') publicacionId?: string,
    @Body('comentarioId') comentarioId?: string,
    @Body('motivo') motivo?: string,
  ) {
    return this.moderacionService.reportar(
      user._id.toString(),
      tipo,
      publicacionId,
      comentarioId,
      motivo,
    );
  }

  @Get('reportes')
  @UseGuards(AdminGuard)
  async obtenerTodos() {
    return this.moderacionService.obtenerTodos();
  }

  @Patch('reportes/:id/resolver')
  @UseGuards(AdminGuard)
  async resolver(
    @Param('id') id: string,
    @Body('accion') accion: 'eliminar' | 'descartar',
  ) {
    return this.moderacionService.resolver(id, accion);
  }
}
