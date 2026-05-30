import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModeracionService } from './moderacion.service';
import { ModeracionController } from './moderacion.controller';
import { Reporte, ReporteSchema } from './reporte.schema';
import { Publicacion, PublicacionSchema } from '../publicaciones/publicacion.schema';
import { Comentario, ComentarioSchema } from '../comentarios/comentario.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reporte.name, schema: ReporteSchema },
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
    AuthModule,
  ],
  controllers: [ModeracionController],
  providers: [ModeracionService],
  exports: [ModeracionService],
})
export class ModeracionModule {}
