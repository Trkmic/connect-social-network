import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Mensaje } from './mensaje.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Mensaje.name)
    private readonly mensajeModel: Model<Mensaje>,
  ) {}

  async crearMensaje(emisorId: string, receptorId: string, contenido: string): Promise<Mensaje> {
    const nuevo = new this.mensajeModel({
      emisorId: new Types.ObjectId(emisorId),
      receptorId: new Types.ObjectId(receptorId),
      contenido,
      leido: false,
    });
    return await nuevo.save();
  }

  async obtenerConversacion(usuario1Id: string, usuario2Id: string): Promise<Mensaje[]> {
    const u1 = new Types.ObjectId(usuario1Id);
    const u2 = new Types.ObjectId(usuario2Id);

    return this.mensajeModel
      .find({
        $or: [
          { emisorId: u1, receptorId: u2 },
          { emisorId: u2, receptorId: u1 },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();
  }

  async marcarLeidos(emisorId: string, receptorId: string): Promise<any> {
    const emisor = new Types.ObjectId(emisorId);
    const receptor = new Types.ObjectId(receptorId);

    return this.mensajeModel
      .updateMany(
        { emisorId: emisor, receptorId: receptor, leido: false },
        { leido: true },
      )
      .exec();
  }
}
