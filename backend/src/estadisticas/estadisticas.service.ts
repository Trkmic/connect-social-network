import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model} from 'mongoose';
import { Publicacion, PublicacionDocument } from '../publicaciones/publicacion.schema';
import { Comentario, ComentarioDocument } from '../comentarios/comentario.schema';
import { User, UserDocument } from '../auth/user.schema';
import { LoginLog, LoginLogDocument } from '../logs/login-log.schema'; 
import { LikeLog, LikeLogDocument } from '../logs/like-log.schema';       
import { ProfileViewLog, ProfileViewLogDocument } from '../logs/profile-view-log.schema'; 

@Injectable()
export class EstadisticasService {
    constructor(
        @InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
        @InjectModel(Comentario.name) private comentarioModel: Model<ComentarioDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(LoginLog.name) private loginLogModel: Model<LoginLogDocument>, 
        @InjectModel(LikeLog.name) private likeLogModel: Model<LikeLogDocument>,  
        @InjectModel(ProfileViewLog.name) private profileViewLogModel: Model<ProfileViewLogDocument>, 
    ) {}

    // Helper para construir el filtro de fechas
    private getMatchQuery(fechaInicio: string, fechaFin: string, campoFecha: string = 'createdAt') {
        const query: any = {};
        if (fechaInicio) {
        query.$gte = new Date(fechaInicio);
        }
        if (fechaFin) {
        const endDate = new Date(fechaFin);
        endDate.setDate(endDate.getDate() + 1); 
        query.$lt = endDate;
        }
        return Object.keys(query).length > 0 ? { [campoFecha]: query } : {};
    }

    async publicacionesPorUsuario(fechaInicio: string, fechaFin: string) {
        const matchQuery = this.getMatchQuery(fechaInicio, fechaFin);

        return this.publicacionModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
            _id: '$usuarioId',
            cantidad: { $sum: 1 },
            },
        },
        {
            $addFields: {
                userObjectId: { $toObjectId: '$_id' }
            }
        },
        {
            $lookup: {
            from: 'users', 
            localField: 'userObjectId', 
            foreignField: '_id',
            as: 'usuarioDetalle',
            },
        },
        { $unwind: { path: '$usuarioDetalle', preserveNullAndEmptyArrays: true } },
        {
            $project: {
            _id: 0,
            usuarioId: '$_id',
            // Ahora debería encontrar el nombre correctamente
            nombreUsuario: { $ifNull: ['$usuarioDetalle.nombreUsuario', 'Usuario Eliminado'] },
            cantidad: '$cantidad',
            },
        },
        { $sort: { cantidad: -1 } },
        ]);
    }

    async comentariosTotales(fechaInicio: string, fechaFin: string) {
        const matchQuery = this.getMatchQuery(fechaInicio, fechaFin);

        const resultado = await this.comentarioModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            cantidad: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } }, // Ordenar por fecha
        ]);
        
        return resultado.map(item => ({
            fecha: item._id,
            cantidad: item.cantidad
        }));
    }

    async comentariosPorPublicacion(fechaInicio: string, fechaFin: string) {
        const matchQuery = this.getMatchQuery(fechaInicio, fechaFin);

        return this.comentarioModel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$publicacionId',
                    cantidad: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'publicacions', 
                    localField: '_id',
                    foreignField: '_id',
                    as: 'publicacionDetalle',
                },
            },
            { $unwind: { path: '$publicacionDetalle', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    publicacionId: '$_id',
                    tituloPublicacion: { $ifNull: ['$publicacionDetalle.titulo', 'Publicación Eliminada'] },
                    cantidad: '$cantidad',
                },
            },
            { $sort: { cantidad: -1 } }
        ]);
    }

    async loginsPorUsuario(fechaInicio: string, fechaFin: string) {
            const matchQuery = this.getMatchQuery(fechaInicio, fechaFin, 'fechaLogin');
        
            return this.loginLogModel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                _id: '$usuarioId',
                cantidad: { $sum: 1 },
                },
            },
            {
                $addFields: {
                    userObjectId: { $toObjectId: '$_id' }
                }
            },    
            {
                $lookup: {
                from: 'users',
                localField: 'userObjectId',
                foreignField: '_id',
                as: 'usuarioDetalle',
                },
            },
            { $unwind: { path: '$usuarioDetalle', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                _id: 0,
                nombreUsuario: { $ifNull: ['$usuarioDetalle.nombreUsuario', '📈📉'] },
                cantidad: '$cantidad',
                },
            },
            { $sort: { cantidad: -1 } },
            ]);
    }
    

    async visitasPerfilPorDia(fechaInicio: string, fechaFin: string) {

        const matchQuery = this.getMatchQuery(fechaInicio, fechaFin, 'fechaVista');
    
        const resultado = await this.profileViewLogModel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$fechaVista' } },
                    cantidad: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        
        return resultado.map(item => ({
            fecha: item._id,
            cantidad: item.cantidad
        }));
    }
    
    async likesOtorgadosPorDia(fechaInicio: string, fechaFin: string) {
        const matchQuery = this.getMatchQuery(fechaInicio, fechaFin, 'fechaLike');
    
        const resultado = await this.likeLogModel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$fechaLike' } },
                    cantidad: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        
        return resultado.map(item => ({
            fecha: item._id,
            cantidad: item.cantidad
        }));
    }
}

