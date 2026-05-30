import { Controller, Get, Post, Body, Delete, Param, Query, UseInterceptors, UploadedFile, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PublicacionesService } from './publicaciones.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('publicaciones')
export class PublicacionesController {
    constructor(
        private readonly publicacionesService: PublicacionesService,
        private readonly cloudinaryService: CloudinaryService
    ) {}

    @Post()
    @UseInterceptors(FileInterceptor('imagen', { storage: memoryStorage() }))
    async crear(@UploadedFile() file: Express.Multer.File, @Body() data: any) {
        if (file) {
        const imageUrl = await this.cloudinaryService.uploadImage(file, 'publicaciones');
        data.imagen = imageUrl;
        }
        return this.publicacionesService.crear(data);
    }

    @Get(':id')
    async obtenerPorId(@Param('id') id: string) {
        return this.publicacionesService.obtenerPorId(id);
    }

    @Get('usuario/:id')
    async obtenerPorUsuario(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('orden') orden?: 'fecha' | 'likes',
    ) {
    return this.publicacionesService.obtenerPorUsuario(id, { limit, orden });
    }

    @Get()
    async obtenerTodas(
        @Query('usuario') usuario?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
        @Query('orden') orden?: 'fecha' | 'likes',
        @Query('siguiendo') siguiendo?: string,
        @Query('userId') userId?: string,
    ) {
        return this.publicacionesService.obtenerTodas({ usuario, limit, offset, orden, siguiendo, userId });
    }

    @Delete(':id')
    async eliminar(@Param('id') id: string, @Query('userId') userId: string) {
        return this.publicacionesService.eliminar(id, userId);
    }

    @Post(':id/like')
    darLike(@Param('id') id: string, @Body('userId') userId: string) {
        return this.publicacionesService.darLike(id, userId);
    }

    @Delete(':id/like')
    quitarLike(@Param('id') id: string, @Query('userId') userId: string) {
        return this.publicacionesService.quitarLike(id, userId);
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('imagen', { storage: memoryStorage() }))
    async actualizar(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() data: any, 
    ) {
        const userId = data.usuarioId || data.userId;
        const updateData: any = {
            titulo: data.titulo,
            mensaje: data.mensaje,
        };

        if (file) {
            const imageUrl = await this.cloudinaryService.uploadImage(file, 'publicaciones');
            updateData.imagen = imageUrl;
        }

        return this.publicacionesService.actualizar(id, userId, updateData);
    }

}