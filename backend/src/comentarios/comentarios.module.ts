import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comentario, ComentarioSchema } from './comentario.schema';
import { ComentariosController } from './comentarios.controller';
import { ComentariosService } from './comentarios.service';
import { User, UserSchema } from '../auth/user.schema';
import { Publicacion, PublicacionSchema } from '../publicaciones/publicacion.schema';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ChatModule } from '../chat/chat.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Comentario.name, schema: ComentarioSchema },
            { name: User.name, schema: UserSchema },
            { name: Publicacion.name, schema: PublicacionSchema }
        ]),
        NotificacionesModule,
        ChatModule
    ],
    controllers: [ComentariosController],
    providers: [ComentariosService],
})
export class ComentariosModule {}