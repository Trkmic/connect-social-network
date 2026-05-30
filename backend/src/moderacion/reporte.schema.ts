import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Reporte extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporteroId: Types.ObjectId;

  @Prop({ required: true, enum: ['publicacion', 'comentario'] })
  tipo: 'publicacion' | 'comentario';

  @Prop({ type: Types.ObjectId, ref: 'Publicacion', required: false, index: true })
  publicacionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comentario', required: false, index: true })
  comentarioId?: Types.ObjectId;

  @Prop({ required: true })
  motivo: string;

  @Prop({ default: 'pendiente', enum: ['pendiente', 'resuelto', 'descartado'], index: true })
  estado: 'pendiente' | 'resuelto' | 'descartado';
}

export const ReporteSchema = SchemaFactory.createForClass(Reporte);
