import { Controller, Get, Param, NotFoundException, Put, Body, UseInterceptors, UploadedFile, UseGuards, Post, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

@Controller('usuarios')
@UseGuards(JwtAuthGuard) 
export class UsuariosController {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>, 
        private readonly cloudinaryService: CloudinaryService,
        private readonly authService: AuthService, 
        private readonly logsService: LogsService,
    ) {}
    
    
    @UseGuards(AdminGuard)
    @Get()
    async getAllUsuarios() {
        const users = await this.userModel.find().select('-password');
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

}