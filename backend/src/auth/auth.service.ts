import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        private readonly logsService: LogsService,
    ) {}

    async generateJwt(user: UserDocument) {
        const payload = { sub: user._id, nombreUsuario: user.nombreUsuario, email: user.email, perfil: user.perfil };
        return this.jwtService.sign(payload);
    }

    async validateUser(emailOrUsername: string, password: string) {
        const query = {
            $or: [
                { email: emailOrUsername.toLowerCase() },
                { nombreUsuario: emailOrUsername.toLowerCase() },
                ],
        };
    
        const user = await this.userModel.findOne(query);
        
        if (!user) return null;
        
        if (!user.habilitado) {
            throw new UnauthorizedException('Su cuenta ha sido deshabilitada. Contacte a un administrador.');
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) return null;
        
        return user;
    }

    async register(dto: RegisterAuthDto, imagenUrl?: string) {
        dto.email = dto.email.toLowerCase();
        dto.nombreUsuario = dto.nombreUsuario.toLowerCase();
    
        if (dto.password !== dto.repeatPassword) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }
    
        const existing = await this.userModel.findOne({
            $or: [{ email: dto.email }, { nombreUsuario: dto.nombreUsuario }],
        });
    
        if (existing) {
            if (existing.email === dto.email)
                throw new BadRequestException('El correo ya está registrado');
            if (existing.nombreUsuario === dto.nombreUsuario)
                throw new BadRequestException('El nombre de usuario ya está en uso');
        }
    
        const hashedPassword = await bcrypt.hash(dto.password, 10);
    
        const usuario = new this.userModel({
            nombre: dto.nombre,
            apellido: dto.apellido,
            email: dto.email,
            nombreUsuario: dto.nombreUsuario,
            password: hashedPassword,
            fechaNacimiento: dto.fechaNacimiento || '',
            descripcion: dto.descripcion || '',
            perfil: dto.perfil || 'usuario',
            imagenPerfil: imagenUrl || '',
            habilitado: true,
        });
    
        return await usuario.save();
    }
    
    async login(user: UserDocument) {
        await this.logsService.logLogin(user._id.toString()); 
        
        const token = await this.generateJwt(user);
        
        const { password, ...result } = user.toObject();
        return { user: result, token };
    }

    async verificarToken(token: string): Promise<any> {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            return null;
        }
    }
}