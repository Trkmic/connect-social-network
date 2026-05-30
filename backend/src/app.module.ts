import { MiddlewareConsumer, NestModule, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './auth/usuarios.module';
import { PublicacionesModule } from './publicaciones/publicaciones.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ValidarTamanioImagenMiddleware } from './middlewares/validar_tamanio_imagen.middlewares';
import { ComentariosModule } from './comentarios/comentarios.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module'; // 👈 AGREGAR
import { LogsModule } from './logs/logs.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { ChatModule } from './chat/chat.module';
import { ModeracionModule } from './moderacion/moderacion.module';

import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    AuthModule,
    PublicacionesModule,
    DatabaseModule,
    UsuariosModule,
    ComentariosModule,
    CloudinaryModule,
    EstadisticasModule,
    LogsModule,
    NotificacionesModule,
    ChatModule,
    ModeracionModule
  ],
  controllers: [AppController], 
  providers: [AppService], 
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ValidarTamanioImagenMiddleware)
      .forRoutes({ path: '/auth/register', method: RequestMethod.POST });
  }
}