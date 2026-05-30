import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notificacion } from './notificacion.schema';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectModel(Notificacion.name)
    private readonly notificacionModel: Model<Notificacion>,
  ) {}

  async crear(data: { receptorId: any; emisorId: any; tipo: 'like' | 'comentario' | 'follow'; publicacionId?: any }): Promise<Notificacion> {
    const nueva = new this.notificacionModel(data);
    const guardada = await nueva.save();
    
    return await this.notificacionModel
      .findById(guardada._id)
      .populate('emisorId', 'nombreUsuario imagenPerfil')
      .exec() as any;
  }

  async obtenerParaUsuario(userId: string): Promise<Notificacion[]> {
    return this.notificacionModel
      .find({ receptorId: userId })
      .populate('emisorId', 'nombreUsuario imagenPerfil')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async marcarTodasComoLeidas(userId: string): Promise<any> {
    return this.notificacionModel
      .updateMany({ receptorId: userId, leido: false }, { leido: true })
      .exec();
  }
}
