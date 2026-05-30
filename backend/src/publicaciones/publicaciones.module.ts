import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesService } from './publicaciones.service';
import { PublicacionesController } from './publicaciones.controller';
import { Publicacion, PublicacionSchema } from './publicacion.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { User, UserSchema } from '../auth/user.schema';
import { AuthModule } from '../auth/auth.module';
import { LogsModule } from '../logs/logs.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ChatModule } from '../chat/chat.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: User.name, schema: UserSchema }
    ]),
    AuthModule,
    LogsModule,
    NotificacionesModule,
    ChatModule
  ],
  controllers: [PublicacionesController],
  providers: [PublicacionesService, CloudinaryService],
  exports: [PublicacionesService],
})
export class PublicacionesModule {}
