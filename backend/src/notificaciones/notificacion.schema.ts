import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notificacion extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  receptorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  emisorId: Types.ObjectId;

  @Prop({ required: true, enum: ['like', 'comentario', 'follow'] })
  tipo: 'like' | 'comentario' | 'follow';

  @Prop({ type: Types.ObjectId, ref: 'Publicacion', required: false })
  publicacionId?: Types.ObjectId;

  @Prop({ default: false, index: true })
  leido: boolean;
}

export const NotificacionSchema = SchemaFactory.createForClass(Notificacion);
