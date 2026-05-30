import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { AuthService } from '../../core/services/auth.service';
import {PublicacionesService,Publicacion} from '../../core/services/publicaciones.service';
import { Types } from 'mongoose';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface PublicacionPoblada {
  _id: string;
  titulo: string;
  mensaje: string;
  imagen?: string | null;
  likes: string[];
  usuarioId: {
    _id: string;
    nombreUsuario: string;
    imagenPerfil?: string;
  };
  createdAt: string;
  comentarios?: { texto: string; usuario: string }[];
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, RouterLink], 
  templateUrl: './mi-perfil.html',
  styleUrls: ['./mi-perfil.css'],
})
export class MiPerfil implements OnInit {
  usuario: {
    _id: string;
    nombreUsuario: string;
    nombre?: string; 
    apellido?: string; 
    fechaNacimiento?: string; 
    descripcion?: string;
    imagenPerfil?: string;
    seguidores?: string[];
    siguiendo?: string[];
  } | null = null;

  publicaciones: PublicacionPoblada[] = [];

  formPerfil: FormGroup;
  editando = false;
  selectedFile: File | null = null;


  isOwner = false; // Indica si el perfil visualizado es el del usuario logueado
  isAdmin = false; // Indica si el usuario logueado es admin
  isFollowing = false; // Indica si el usuario logueado sigue a este perfil
  usuarioLogueado: any = null;
  userIdAVisualizar: string | null = null;
  private route = inject(ActivatedRoute);

  loadingUsuario: boolean = true; 
  loadingPublicaciones: boolean = true;

  constructor(
    private authService: AuthService,
    private publicacionesService: PublicacionesService,
    private fb: FormBuilder 
  ) {
    
    this.formPerfil = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      descripcion: [''],
    });
  }

  ngOnInit(): void {
    const storedUser = this.authService.getUsuarioLogueado();
    
    // ❌ ELIMINAR ESTE BLOQUE:
    // if (!storedUser?.id) { 
    //   window.location.href = '/login'; 
    //   return;
    // }

    // Si el Guard permite el acceso, 'storedUser' debería ser válido
    if (!storedUser || (!storedUser._id && !storedUser.id)) {
        // En caso de un fallo inesperado (token válido, pero localStorage dañado)
        this.authService.logout(false);
        return;
    }
    
    // Asignar el usuario logueado y verificar si es admin
    this.usuarioLogueado = storedUser;

    this.isAdmin = this.authService.esAdministrador();

    // Lógica para obtener el ID de la URL o el ID del usuario logueado
    this.route.params.subscribe(params => {
            // Asegúrate de usar storedUser.id si _id no está disponible.
            const userIdentifier = storedUser._id || storedUser.id;
            
            this.userIdAVisualizar = params['id'] || userIdentifier;
      
            this.isOwner = (this.userIdAVisualizar === userIdentifier);
      
            if (this.userIdAVisualizar) {
                this.cargarPerfil(this.userIdAVisualizar);
            }
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  guardarPerfil(): void {
    if (this.formPerfil.invalid) {
      return;
    }
    if (!this.usuario) return;
    if (!this.isOwner) return;

    const data = this.formPerfil.value;

    this.authService.actualizarUsuario(this.usuario._id, data, this.selectedFile).subscribe({
      next: (usuarioActualizado) => {
        this.usuario = { ...this.usuario, ...usuarioActualizado }; 
        this.editando = false;
        this.selectedFile = null;
        Swal.fire('¡Éxito!', 'Tu perfil ha sido actualizado.', 'success');
      }
    });
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.selectedFile = null; 
    if (this.usuario) {
      this.formPerfil.patchValue(this.usuario);
    }
  }

  cargarPerfil(userId: string): void {
    this.loadingUsuario = true;

    this.authService.getUsuarioPorId(userId).subscribe({
      next: (userFromServer: any) => {
        this.usuario = {
        _id: userFromServer._id,
        nombreUsuario: userFromServer.nombreUsuario,
        descripcion: userFromServer.descripcion,
        imagenPerfil: userFromServer.imagenPerfil,
        nombre: userFromServer.nombre, 
        apellido: userFromServer.apellido, 
        fechaNacimiento: userFromServer.fechaNacimiento, 
        seguidores: userFromServer.seguidores || [],
        siguiendo: userFromServer.siguiendo || [],
      };
    
      const loggedId = (this.usuarioLogueado._id || this.usuarioLogueado.id).toString();
      this.isFollowing = (userFromServer.seguidores || []).some((id: any) => id.toString() === loggedId);

      // Solo se aplica el patch si es el perfil del dueño
        if (this.isOwner) {
          this.formPerfil.patchValue({
            nombre: this.usuario.nombre || '',
            apellido: this.usuario.apellido || '',
            descripcion: this.usuario.descripcion || ''
            });
          }
            this.loadingUsuario = false;
            this.cargarPublicaciones(userId);
          },
          error: (err: any) => {
            console.error('Error al cargar usuario:', err);
            this.loadingUsuario = false; // 🔴 Fin de carga de usuario en error
          }
        });
    }

    cargarPublicaciones(userId: string): void {
      this.loadingPublicaciones = true;    
      
      this.publicacionesService.getPublicacionesUsuario(userId, 3).subscribe({ // Se limita a 3 publicaciones
            next: (res: Publicacion[]) => {
              this.publicaciones = res.map((pub) => ({
                _id: pub._id,
                titulo: pub.titulo,
                mensaje: pub.mensaje,
                imagen: pub.imagen || null,
                likes: pub.likes?.map((l: string | Types.ObjectId) => l.toString()) || [],
                usuarioId: {
                  _id: (pub.usuarioId as any)._id,
                  nombreUsuario:
                    (pub.usuarioId as any).nombreUsuario ||
                    (pub.usuarioId as any).username,
                  imagenPerfil: (pub.usuarioId as any).imagenPerfil,
              },
              createdAt: pub.createdAt,
              comentarios: pub.comentarios || [],
              }));
              this.loadingPublicaciones = false;
            },
            error: (err: any) => {
              console.error('Error al cargar publicaciones:', err);
              this.loadingPublicaciones = false; // 🔴 Fin de carga de publicaciones en error
            }
          });
  }

  eliminarPublicacion(id: string): void {

        Swal.fire({
          title: '¿Seguro que deseas eliminar esta publicación?',
          text: 'Esta acción no se puede deshacer.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
    
          if (result.isConfirmed) {
            this.publicacionesService.eliminarPublicacion(id).subscribe({
              next: () => {
                if (this.userIdAVisualizar) {
                  this.cargarPublicaciones(this.userIdAVisualizar); // Recargar publicaciones del perfil actual
                }
                Swal.fire('Eliminada', 'La publicación fue eliminada con éxito.', 'success');
              },
              error: (err) => {
                Swal.fire('Error', 'Ocurrió un problema al eliminar la publicación.', 'error');
              }
            });
          }
        });
  }

  toggleFollow() {
    if (!this.usuario) return;
    const userId = this.usuario._id;
    if (this.isFollowing) {
      this.authService.dejarDeSeguir(userId).subscribe({
        next: () => {
          this.isFollowing = false;
          const loggedId = (this.usuarioLogueado._id || this.usuarioLogueado.id).toString();
          if (this.usuario && this.usuario.seguidores) {
            this.usuario.seguidores = this.usuario.seguidores.filter(id => id.toString() !== loggedId);
          }
        },
        error: (err) => console.error('Error al dejar de seguir:', err)
      });
    } else {
      this.authService.seguir(userId).subscribe({
        next: () => {
          this.isFollowing = true;
          const loggedId = (this.usuarioLogueado._id || this.usuarioLogueado.id).toString();
          if (this.usuario) {
            if (!this.usuario.seguidores) this.usuario.seguidores = [];
            this.usuario.seguidores.push(loggedId);
          }
        },
        error: (err) => console.error('Error al seguir:', err)
      });
    }
  }
}
