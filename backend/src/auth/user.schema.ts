import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
    _id!: Types.ObjectId;
    
    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    apellido: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true, unique: true })
    nombreUsuario: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    fechaNacimiento: string;

    @Prop({ required: true })
    descripcion: string;

    @Prop({ default: 'usuario' })
    perfil: 'usuario' | 'administrador';

    @Prop({ default: true })
    habilitado: boolean;

    @Prop()
    imagenPerfil?: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    siguiendo: Types.ObjectId[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    seguidores: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

export interface IUser {
    nombre: string;
    apellido: string;
    email: string;
    nombreUsuario: string;
    password: string;
    fechaNacimiento: string;
    descripcion: string;
    perfil: 'usuario' | 'administrador';
    habilitado: boolean;
    imagenPerfil?: string;
    siguiendo?: Types.ObjectId[];
    seguidores?: Types.ObjectId[];
}
