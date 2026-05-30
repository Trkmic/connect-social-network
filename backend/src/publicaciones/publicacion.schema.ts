import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Publicacion extends Document {
    @Prop({ required: true , index: true})
    titulo: string;

    @Prop({ required: true , index: true})
    mensaje: string;

    @Prop()
    imagen?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true , index: true})
    usuarioId: Types.ObjectId;
    
    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] , index: true})
    likes: Types.ObjectId[];
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
export type PublicacionDocument = Publicacion & Document;