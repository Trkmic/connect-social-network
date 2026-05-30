import { Injectable,UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>('JWT_SECRET') || 'SECRET_KEY',
        });
    }

    async validate(payload: any) {
        // Si el token no tiene 'sub' (ID de usuario), lo rechaza.
        if (!payload.sub) {
            throw new UnauthorizedException('Token inválido: falta el ID de usuario (sub)');
        }

        return { 
            _id: payload.sub, 
            nombreUsuario: payload.nombreUsuario, 
            email: payload.email,
            perfil: payload.perfil
        };
    }
}
