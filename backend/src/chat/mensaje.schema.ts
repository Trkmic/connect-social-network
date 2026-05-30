import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Mensaje extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  emisorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  receptorId: Types.ObjectId;

  @Prop({ required: true })
  contenido: string;

  @Prop({ default: false, index: true })
  leido: boolean;

  createdAt: Date;
}

export const MensajeSchema = SchemaFactory.createForClass(Mensaje);
