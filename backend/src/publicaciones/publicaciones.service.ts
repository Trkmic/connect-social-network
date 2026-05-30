import { Injectable, HttpException, HttpStatus,ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { Publicacion } from './publicacion.schema';
import { User , UserDocument} from '../auth/user.schema';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class PublicacionesService {
    constructor(
        @InjectModel(Publicacion.name)
        private readonly publicacionModel: Model<Publicacion>,
        @InjectModel(User.name) 
        private readonly userModel: Model<User>,
        private readonly logsService: LogsService,
      ) {}

    async crear(data: any): Promise<Publicacion> {
        try {
          const nueva = new this.publicacionModel(data);
          return await nueva.save();
        } catch (error) {
          throw new HttpException('Error al crear la publicación', HttpStatus.BAD_REQUEST);
        }
    }

    async obtenerTodas(options: { usuario?: string; limit?: string; offset?: string; orden?: 'fecha' | 'likes'; }): Promise<Publicacion[]> {
        try {
          const { usuario, limit, offset, orden } = options;
      
          const pipeline: any[] = [];
          if (usuario) {
            const userObjId = Types.ObjectId.isValid(usuario) ? new Types.ObjectId(usuario) : usuario;
            pipeline.push({ $match: { usuarioId: userObjId } });
          }
      
          if (orden === 'likes') {
            pipeline.push(
              {
                $addFields: {
                  likesCount: { $size: { $ifNull: ['$likes', []] } }
                }
              },
              {
                $sort: { likesCount: -1, createdAt: -1 }
              }
            );
          } else {
            pipeline.push({ $sort: { createdAt: -1 } });
          }
      
          const skipVal = offset ? parseInt(offset) : 0;
          if (skipVal > 0) {
            pipeline.push({ $skip: skipVal });
          }
      
          const limitVal = limit ? parseInt(limit) : 10;
          if (limitVal > 0) {
            pipeline.push({ $limit: limitVal });
          }
      
          const publicaciones = await this.publicacionModel.aggregate(pipeline).exec();
          
          return await this.publicacionModel.populate(publicaciones, {
            path: 'usuarioId',
            select: 'nombreUsuario imagenPerfil',
          }) as any;
        } catch (error: any) {
          console.error(' Error en obtenerTodas:', error);
          throw new HttpException(
            'Error interno al obtener publicaciones: ' + error.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      async eliminar(publicacionId: string, userId: string): Promise<any> {
        // Buscar la publicación
        const publicacion = await this.publicacionModel.findById(publicacionId).exec();

        if (!publicacion) {
            throw new NotFoundException(`Publicación con ID ${publicacionId} no encontrada.`);
        }

        // Obtener el ID del propietario y el usuario que intenta eliminar
        const ownerId = publicacion.usuarioId ? publicacion.usuarioId.toString() : null;
        
        // Busca el usuario solicitante para verificar si es Admin
        const user = await this.userModel.findById(userId).exec();
        
        const isOwner = ownerId === userId;
        const isAdmin = user && user.perfil === 'administrador'; 


        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('No tienes permiso para eliminar esta publicación.');
        }

        const result = await this.publicacionModel.deleteOne({ _id: publicacionId }).exec();

        if (result.deletedCount === 0) {
            throw new NotFoundException(`Publicación con ID ${publicacionId} no pudo ser eliminada.`);
        }

        return { message: 'Publicación eliminada con éxito' };
    }

    async darLike(id: string, userId: string): Promise<Publicacion> {
        const publicacion = await this.publicacionModel.findById(id);
        if (!publicacion)
        throw new HttpException('Publicación no encontrada', HttpStatus.NOT_FOUND);
    
        const userObjectId = new Types.ObjectId(userId);
    
        const yaTieneLike = publicacion.likes.some(likeId => likeId.equals(userObjectId));
    
        if (!yaTieneLike) {
        publicacion.likes.push(userObjectId);
        await publicacion.save();
        await this.logsService.logLike(userId, id);
        }
    
        const populated = await this.publicacionModel
        .findById(id)
        .populate('usuarioId', 'nombreUsuario imagenPerfil')
        .exec();
    
        if (!populated)
        throw new HttpException('Error al cargar publicación', HttpStatus.INTERNAL_SERVER_ERROR);
    
        return populated.toObject() as any;
    }
    
    async quitarLike(id: string, userId: string): Promise<Publicacion> {
        const publicacion = await this.publicacionModel.findById(id);
        if (!publicacion)
        throw new HttpException('Publicación no encontrada', HttpStatus.NOT_FOUND);
    
        const userObjectId = new Types.ObjectId(userId);
    
        publicacion.likes = publicacion.likes.filter(
        likeId => !likeId.equals(userObjectId)
        );
    
        await publicacion.save();
    
        const populated = await this.publicacionModel
        .findById(id)
        .populate('usuarioId', 'nombreUsuario imagenPerfil')
        .exec();
    
        if (!populated)
        throw new HttpException('Error al cargar publicación', HttpStatus.INTERNAL_SERVER_ERROR);
    
        return populated.toObject() as any;
    }

    async obtenerPorUsuario(
        usuarioId: string,
        options: { limit?: string; orden?: 'fecha' | 'likes' }
      ): Promise<Publicacion[]> {
        try {
          const { limit, orden } = options;
      
          const pipeline: any[] = [];
          const userObjId = Types.ObjectId.isValid(usuarioId) ? new Types.ObjectId(usuarioId) : usuarioId;
          pipeline.push({
            $match: {
              $or: [
                { usuarioId: usuarioId },
                { usuarioId: userObjId }
              ]
            }
          });
      
          if (orden === 'likes') {
            pipeline.push(
              {
                $addFields: {
                  likesCount: { $size: { $ifNull: ['$likes', []] } }
                }
              },
              {
                $sort: { likesCount: -1, createdAt: -1 }
              }
            );
          } else {
            pipeline.push({ $sort: { createdAt: -1 } });
          }
      
          const limitVal = limit ? parseInt(limit) : 10;
          if (limitVal > 0) {
            pipeline.push({ $limit: limitVal });
          }
      
          const publicaciones = await this.publicacionModel.aggregate(pipeline).exec();
          
          return await this.publicacionModel.populate(publicaciones, {
            path: 'usuarioId',
            select: 'nombreUsuario imagenPerfil',
          }) as any;
        } catch (error: any) {
          throw new HttpException(
            'Error interno al obtener publicaciones del usuario: ' + error.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      async actualizar(id: string, userId: string, data: { titulo?: string; mensaje?: string; imagen?: string }) {
        
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new UnauthorizedException('Usuario no válido');
        }

        const publicacion = await this.publicacionModel.findById(id);
        if (!publicacion) {
            throw new NotFoundException('Publicación no encontrada');
        }

        const isOwner = publicacion.usuarioId.toString() === userId;
        const isAdmin = user.perfil === 'administrador';

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('No tienes permiso para actualizar esta publicación.');
        }

        return this.publicacionModel.findByIdAndUpdate(id, data, { new: true });
    }

    async obtenerPorId(id: string) {
      const publicacion = await this.publicacionModel
        .findById(id)
        .populate('usuarioId', 'nombreUsuario imagenPerfil'); 

      if (!publicacion) {
        throw new NotFoundException('Publicación no encontrada');
      }
      return publicacion;
    }
}