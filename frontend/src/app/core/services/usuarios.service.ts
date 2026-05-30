import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; 
import { Usuario } from '../interfaces/usuario.interface';

@Injectable({
    providedIn: 'root'
})

export class UsuariosService {
    private apiUrl = `${environment.apiUrl}/usuarios`;
    private http = inject(HttpClient);


    // Listado de usuarios
    getUsuarios(): Observable<Usuario[]> {
        return this.http.get<Usuario[]>(this.apiUrl);
    }

    // Crear nuevo usuario (para el formulario de registro del administrador)
    crearUsuario(userData: any): Observable<Usuario> {
        return this.http.post<Usuario>(this.apiUrl, userData);
    }

    // Alta/Baja Lógica (habilitar/deshabilitar)
    toggleHabilitacion(id: string, habilitado: boolean): Observable<Usuario> {
        const url = `${this.apiUrl}/${id}/habilitar`;
        return this.http.put<Usuario>(url, { habilitado });
    }
    
    // actualizar
    actualizarUsuario(id: string, data: FormData): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, data);
    }
}