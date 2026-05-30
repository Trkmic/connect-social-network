import { Controller, Post, Body, UploadedFile, UseInterceptors, HttpCode, HttpStatus, HttpException,UseGuards,Request} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard'; 
import { LogsService } from '../logs/logs.service';
import { Document} from 'mongoose';
import { UserDocument } from './user.schema';

@Controller('auth')
export class AuthController{

    constructor(
        private readonly authService: AuthService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly logsService: LogsService
    ) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginAuthDto) {
        const user = await this.authService.validateUser(dto.emailOrUsername, dto.password) as UserDocument;

        if (!user) {
            throw new HttpException('Usuario o contraseña incorrectos', HttpStatus.UNAUTHORIZED);
        }

        const { user: userDetails, token } = await this.authService.login(user); 

        return {
            message: 'Login exitoso',
            user: userDetails, // Contiene nombre, apellido, etc. (sin password)
            token,
        };
    }
    
    @Post('refresh')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Request() req: any) {
        // req.user payload decodificado
        const payload = req.user;

        if (!payload) {
            throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
        }

        const usuarioParaToken = {
            _id: payload.sub, 
            nombreUsuario: payload.nombreUsuario,
            email: payload.email
        };

        const token = await this.authService.generateJwt(usuarioParaToken as any);

        return {
            message: 'Token refrescado exitosamente',
            token,
        };
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('imagenPerfil', { storage: memoryStorage() }))
    async register(@UploadedFile() archivo?: Express.Multer.File, @Body() body?: any) {
        
        const dto = plainToInstance(RegisterAuthDto, {
            nombre: String(body.nombre || '').trim(),
            apellido: String(body.apellido || '').trim(),
            email: String(body.email || '').trim(),
            nombreUsuario: String(body.nombreUsuario || '').trim(),
            password: String(body.password || '').trim(),
            repeatPassword: String(body.repeatPassword || '').trim(),
            fechaNacimiento: body.fechaNacimiento ? String(body.fechaNacimiento) : '',
            descripcion: body.descripcion ? String(body.descripcion) : '',
            perfil: body.perfil ? String(body.perfil) : 'usuario',
        });

        if (!dto.nombreUsuario) {
            throw new HttpException('El nombre de usuario es obligatorio', HttpStatus.BAD_REQUEST);
        }
        if (!dto.email) {
            throw new HttpException('El email es obligatorio', HttpStatus.BAD_REQUEST);
        }

        const errors = await validate(dto);
        if (errors.length > 0) {
            const messages = errors.map(err => Object.values(err.constraints || {})).flat();
            throw new HttpException(
                { statusCode: 400, error: 'Bad Request', message: messages },
                HttpStatus.BAD_REQUEST,
            );
        }

        let urlImagen: string | undefined;
    if (archivo) {
        urlImagen = await this.cloudinaryService.uploadImage(archivo, 'usuarios');
    }

    try {
        // registra el usuario.
        return await this.authService.register(dto, urlImagen);
    } catch (err) {
        if (err instanceof HttpException) {
            throw err; 
        }
        throw new HttpException(
            'Error interno al registrar el usuario (Error de servidor/base de datos)',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
    }
}