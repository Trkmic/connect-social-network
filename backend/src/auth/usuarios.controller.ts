import { Controller, Get, Param, NotFoundException, Put, Body, UseInterceptors, UploadedFile, UseGuards, Post, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { AdminGuard } from './admin.guard'; 
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { GetUser } from './jwt/get-user.decorator';
import { LogsService } from '../logs/logs.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('usuarios')
@UseGuards(JwtAuthGuard) 
export class UsuariosController {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>, 
        private readonly cloudinaryService: CloudinaryService,
        private readonly authService: AuthService, 
        private readonly logsService: LogsService,
        private readonly notificacionesService: NotificacionesService,
        private readonly chatGateway: ChatGateway,
    ) {}
    
    
    @Get()
    async getAllUsuarios() {
        const users = await this.userModel.find({ habilitado: true }).select('nombre apellido nombreUsuario imagenPerfil descripcion perfil seguidores siguiendo');
        return users;
    }

    @Get(':id')
    
    async getUsuarioPorId(@Param('id') profileId: string, @GetUser() loggedUser: any) { // ✅ CORRECCIÓN: Renombrar a 'loggedUser'
        
        const profileOwner = await this.userModel.findById(profileId).select('-password'); // ✅ CORRECCIÓN: Renombrar a 'profileOwner'
        if (!profileOwner) throw new NotFoundException('Usuario no encontrado');

        await this.logsService.logProfileView(loggedUser._id.toString(), profileId);
        
        return profileOwner;
    }

    @UseGuards(AdminGuard)
    @Post()
    async createUsuario(@Body() dto: RegisterAuthDto) {
    
        const newUser = await this.authService.register(dto);
        
        // Retorna el usuario sin el password
        const { password, ...result } = newUser.toJSON();
        return result;
    }

    @UseGuards(AdminGuard)
    @Put(':id/habilitar')
    async toggleHabilitado(@Param('id') id: string, @Body('habilitado') habilitado: boolean) {
        
        if (typeof habilitado !== 'boolean') {
            throw new BadRequestException('El campo "habilitado" es obligatorio y debe ser un booleano.');
        }
        
        const userUpdated = await this.userModel.findByIdAndUpdate(
            id, 
            { habilitado: habilitado }, 
            { new: true }
        ).select('-password');
        
        if (!userUpdated) {
            throw new NotFoundException('Usuario no encontrado para actualizar estado de habilitación');
        }
        
        return userUpdated;
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('imagenPerfil', { storage: memoryStorage() }))
    async actualizarUsuario(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File, 
        @Body() data: any,
        @GetUser() loggedUser: any,
    ) {
        const isSelf = loggedUser._id.toString() === id;
        const isAdmin = loggedUser.perfil === 'administrador';

        if (!isSelf && !isAdmin) {
            throw new ForbiddenException('No tienes permiso para actualizar este perfil.');
        }
        
        if (file) {
            try {
                const imageUrl = await this.cloudinaryService.uploadImage(file, 'usuarios');
                data.imagenPerfil = imageUrl; 
            } catch (error) {
            }
        }
        const userUpdated = await this.userModel.findByIdAndUpdate(id, data, { new: true }).select('-password');
        
        if (!userUpdated) {
            throw new NotFoundException('Usuario no encontrado para actualizar');
        }
        
        return userUpdated;
    }

    @Post(':id/seguir')
    async seguirUsuario(@Param('id') idParaSeguir: string, @GetUser() loggedUser: any) {
        if (loggedUser._id.toString() === idParaSeguir) {
            throw new BadRequestException('No puedes seguirte a ti mismo.');
        }

        const usuarioLogueado = await this.userModel.findById(loggedUser._id);
        const usuarioParaSeguir = await this.userModel.findById(idParaSeguir);

        if (!usuarioLogueado || !usuarioParaSeguir) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const yaSigue = (usuarioLogueado.siguiendo || []).some(id => id.toString() === idParaSeguir);
        if (!yaSigue) {
            if (!usuarioLogueado.siguiendo) usuarioLogueado.siguiendo = [];
            if (!usuarioParaSeguir.seguidores) usuarioParaSeguir.seguidores = [];

            usuarioLogueado.siguiendo.push(usuarioParaSeguir._id);
            usuarioParaSeguir.seguidores.push(usuarioLogueado._id);

            await usuarioLogueado.save();
            await usuarioParaSeguir.save();
            
            // Crear notificación en BD
            const notif = await this.notificacionesService.crear({
                receptorId: usuarioParaSeguir._id,
                emisorId: usuarioLogueado._id,
                tipo: 'follow'
            });

            // Emitir por WebSocket
            this.chatGateway.enviarNotificacionAUsuario(idParaSeguir, notif);
        }

        return { message: 'Usuario seguido con éxito' };
    }

    @Post(':id/dejar-de-seguir')
    async dejarDeSeguirUsuario(@Param('id') idParaDejar: string, @GetUser() loggedUser: any) {
        const usuarioLogueado = await this.userModel.findById(loggedUser._id);
        const usuarioParaDejar = await this.userModel.findById(idParaDejar);

        if (!usuarioLogueado || !usuarioParaDejar) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (usuarioLogueado.siguiendo) {
            usuarioLogueado.siguiendo = usuarioLogueado.siguiendo.filter(id => id.toString() !== idParaDejar);
        }
        if (usuarioParaDejar.seguidores) {
            usuarioParaDejar.seguidores = usuarioParaDejar.seguidores.filter(id => id.toString() !== loggedUser._id.toString());
        }

        await usuarioLogueado.save();
        await usuarioParaDejar.save();

        return { message: 'Has dejado de seguir al usuario con éxito' };
    }
}