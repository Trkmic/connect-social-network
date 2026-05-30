import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reporte } from './reporte.schema';
import { Publicacion } from '../publicaciones/publicacion.schema';
import { Comentario } from '../comentarios/comentario.schema';

@Injectable()
export class ModeracionService {
  constructor(
    @InjectModel(Reporte.name)
    private readonly reporteModel: Model<Reporte>,
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<Publicacion>,
    @InjectModel(Comentario.name)
    private readonly comentarioModel: Model<Comentario>,
  ) {}

  async reportar(
    reporteroId: string,
    tipo: 'publicacion' | 'comentario',
    publicacionId?: string,
    comentarioId?: string,
    motivo?: string,
  ): Promise<Reporte> {
    const data: any = {
      reporteroId: new Types.ObjectId(reporteroId),
      tipo,
      motivo: motivo || 'Sin motivo especificado',
    };

    if (publicacionId) {
      data.publicacionId = new Types.ObjectId(publicacionId);
    }
    if (comentarioId) {
      data.comentarioId = new Types.ObjectId(comentarioId);
    }

    const nuevo = new this.reporteModel(data);
    return await nuevo.save();
  }

  async obtenerTodos(): Promise<Reporte[]> {
    return this.reporteModel
      .find()
      .populate('reporteroId', 'nombreUsuario')
      .populate({
        path: 'publicacionId',
        select: 'titulo mensaje',
        strictPopulate: false,
      })
      .populate({
        path: 'comentarioId',
        select: 'texto usuarioId',
        populate: {
          path: 'usuarioId',
          select: 'nombreUsuario',
          strictPopulate: false,
        },
        strictPopulate: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async resolver(id: string, accion: 'eliminar' | 'descartar'): Promise<Reporte> {
    const reporte = await this.reporteModel.findById(id).exec();
    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (accion === 'eliminar') {
      if (reporte.tipo === 'publicacion' && reporte.publicacionId) {
        await this.publicacionModel.deleteOne({ _id: reporte.publicacionId }).exec();
      } else if (reporte.tipo === 'comentario' && reporte.comentarioId) {
        await this.comentarioModel.deleteOne({ _id: reporte.comentarioId }).exec();
      }
      reporte.estado = 'resuelto';
    } else {
      reporte.estado = 'descartado';
    }

    return await reporte.save();
  }
}
