import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Comentario } from '../../pages/publicacion-detalle/publicacion-detalle'; 

export interface Publicacion {
    _id: string;
    titulo: string;
    mensaje: string;
    imagen?: string | null;
    usuarioId: {
        _id: string;
        nombreUsuario: string;
        imagenPerfil?: string;
    };
    likes: string[];
    createdAt: string;
    comentarios?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class PublicacionesService {
    private baseUrl = `${environment.apiUrl}/publicaciones`;
    private comentariosUrl = `${environment.apiUrl}/comentarios`;

    constructor(private http: HttpClient, private authService: AuthService) {}

    obtenerPublicaciones(
        orden: 'fecha' | 'likes' = 'fecha',
        offset = 0,
        limit = 10,
        siguiendo = 'false',
        userId = ''
    ): Observable<Publicacion[]> {
        let url = `${this.baseUrl}?orden=${orden}&offset=${offset}&limit=${limit}`;
        if (siguiendo === 'true' && userId) {
            url += `&siguiendo=true&userId=${userId}`;
        }
        return this.http.get<Publicacion[]>(url);
    }

    getPublicacionesUsuario(userId: string, limit: number = 3): Observable<Publicacion[]> {
        return this.http.get<Publicacion[]>(
            `${this.baseUrl}/usuario/${userId}?limit=${limit}&orden=fecha`
        );
    }


    crearPublicacion(data: FormData): Observable<Publicacion> {
        const user = this.authService.getUsuarioLogueado();
        if (!user) return throwError(() => new Error('Usuario no logueado'));

        const userId = user._id || user.id; 
        data.append('usuarioId', userId);

        return this.http.post<Publicacion>(this.baseUrl, data);
    }


    darLike(id: string, userId: string): Observable<Publicacion> {
        
        if (!userId) return throwError(() => new Error('No se proveyó userId para dar like'));
        return this.http.post<Publicacion>(`${this.baseUrl}/${id}/like`, { userId: userId });
    }


    quitarLike(id: string, userId: string): Observable<Publicacion> {

        if (!userId) return throwError(() => new Error('No se proveyó userId para quitar like'));
        return this.http.delete<Publicacion>(`${this.baseUrl}/${id}/like?userId=${userId}`);
    }

    eliminarPublicacion(id: string): Observable<any> {
        const user = this.authService.getUsuarioLogueado();
        if (!user) return throwError(() => new Error('Usuario no logueado'));

        const userId = user._id || user.id;
        return this.http.delete(`${this.baseUrl}/${id}?userId=${userId}`);
    }


    actualizarPublicacion(id: string, data: { titulo: string; mensaje: string }, file: File | null): Observable<Publicacion> {
        const user = this.authService.getUsuarioLogueado();
        if (!user) return throwError(() => new Error('Usuario no logueado'));
        const formData = new FormData();
        
        formData.append('usuarioId', user._id || user.id); 
        formData.append('titulo', data.titulo);
        formData.append('mensaje', data.mensaje);

        if (file) {
            formData.append('imagen', file, file.name);
        }

        return this.http.put<Publicacion>(`${this.baseUrl}/${id}`, formData);
    }

    getPublicacionPorId(id: string): Observable<Publicacion> {
        return this.http.get<Publicacion>(`${this.baseUrl}/${id}`);
    }


    getComentarios(publicacionId: string, limit: number, offset: number): Observable<Comentario[]> {
        return this.http.get<Comentario[]>(
            `${this.comentariosUrl}/publicacion/${publicacionId}?limit=${limit}&offset=${offset}`
        );
    }

    crearComentario(publicacionId: string, texto: string): Observable<Comentario> {
        return this.http.post<Comentario>(this.comentariosUrl, {
            publicacionId,
            texto,
        });
    
    }

    editarComentario(comentarioId: string, texto: string): Observable<Comentario> {
        return this.http.put<Comentario>(`${this.comentariosUrl}/${comentarioId}`, {
            texto,
        });
    }

    eliminarComentario(comentarioId: string): Observable<any> {
        return this.http.delete(`${this.comentariosUrl}/${comentarioId}`);
    }
}