import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UsuariosController } from './usuarios.controller';

import { AuthModule } from './auth.module'; 
import { CloudinaryModule } from '../cloudinary/cloudinary.module'; 
import { LogsModule } from '../logs/logs.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ChatModule } from '../chat/chat.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        AuthModule, 
        CloudinaryModule,
        LogsModule,
        NotificacionesModule,
        ChatModule
    ],
    controllers: [UsuariosController],
    
    providers: [], 
})
export class UsuariosModule {}