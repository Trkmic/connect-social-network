import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Request, ParseIntPipe, DefaultValuePipe, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ComentariosService } from './comentarios.service';


@Controller('comentarios')
export class ComentariosController {
    constructor(private readonly comentariosService: ComentariosService) {}

    @Get('publicacion/:id')
    async getPorPublicacion(
        @Param('id') publicacionId: string,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    ) {
        return this.comentariosService.getPorPublicacion(publicacionId, limit, offset);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async crear(
        @Request() req: any,
        @Body('texto') texto: string,
        @Body('publicacionId') publicacionId: string,
    ) {
        const userId = req.user._id; 
        
        if (!userId) {
            throw new HttpException('ID de usuario no encontrado en el token', HttpStatus.UNAUTHORIZED);
        }

        return this.comentariosService.crear(texto, userId, publicacionId);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async editar(
        @Param('id') comentarioId: string,
        @Request() req: any,
        @Body('texto') texto: string,
    ) {
        const userId = req.user._id;
        return this.comentariosService.editar(comentarioId, userId, texto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async eliminar(
        @Param('id') comentarioId: string,
        @Request() req: any,
    ) {
        const userId = req.user._id;
        return this.comentariosService.eliminar(comentarioId, userId);
    }
}