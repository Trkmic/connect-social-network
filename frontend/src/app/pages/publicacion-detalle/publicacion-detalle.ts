import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute} from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionesService, Publicacion } from '../../core/services/publicaciones.service';
import { AuthService } from '../../core/services/auth.service';
import { FormateoHoraPipe } from '../../core/pipes/formateo_hora.pipe';
import { MayusculaLetraPipe } from '../../core/pipes/mayuscula_letra.pipe';
import Swal from 'sweetalert2';

export interface Comentario {
  _id: string;
  texto: string;
  usuarioId: {
    _id: string;
    nombreUsuario: string;
    imagenPerfil?: string;
  } | null;
  publicacionId: string;
  editado: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-publicacion-detalle',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormateoHoraPipe,
    MayusculaLetraPipe
  ],
  templateUrl: './publicacion-detalle.html',
  styleUrls: ['./publicacion-detalle.css'],
})

export class PublicacionDetalle implements OnInit {

  // Servicios
  private route = inject(ActivatedRoute);
  private pubService = inject(PublicacionesService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Datos
  publicacion: Publicacion | null = null;
  comentarios: Comentario[] = [];
  usuarioLogueado: any = null;
  isAdmin = false;
  
  // Paginación de comentarios
  private readonly limitComentarios = 5;
  private offsetComentarios = 0;
  public hayMasComentarios = true;

  // Formularios
  formComentario: FormGroup;
  formEditarComentario: FormGroup;

  // Estado de edición
  editandoComentarioId: string | null = null;

  loadingPublicacion: boolean = true; 
  sendingComentario: boolean = false;

  constructor() {
    this.formComentario = this.fb.group({
      texto: ['', [Validators.required,Validators.maxLength(50)]],
    });
    this.formEditarComentario = this.fb.group({
      texto: ['', [Validators.required,Validators.maxLength(50)]],
    });
  }

  ngOnInit(): void {
    this.usuarioLogueado = this.authService.getUsuarioLogueado();
    this.isAdmin = this.authService.esAdministrador();
    const publicacionId = this.route.snapshot.paramMap.get('id');

    if (publicacionId) {
      this.loadingPublicacion = true; 

      this.pubService.getPublicacionPorId(publicacionId).subscribe({
        next: (pub) => {
          this.publicacion = pub;
          this.loadingPublicacion = false;
          this.cargarComentarios();
        },
        error: () => {
            this.publicacion = null;
            this.loadingPublicacion = false;
        } 
      });
    } else {
        this.loadingPublicacion = false; 
    }
  }

  cargarComentarios(): void {
    if (!this.publicacion || !this.hayMasComentarios) return;

    this.pubService
      .getComentarios(this.publicacion._id, this.limitComentarios, this.offsetComentarios)
      .subscribe((nuevosComentarios) => {

        this.comentarios = [...this.comentarios, ...nuevosComentarios];
        
        this.offsetComentarios += nuevosComentarios.length;
        
        if (nuevosComentarios.length < this.limitComentarios) {
          this.hayMasComentarios = false;
        }
      });
  }

  enviarComentario(): void {
    if (this.formComentario.invalid || !this.publicacion || !this.usuarioLogueado) return;

    const texto = this.formComentario.value.texto;
    
    const comentarioOptimista: Comentario = {
      _id: 'temp-' + Date.now(),
      texto: texto,
      usuarioId: { 
        _id: this.usuarioLogueado._id || this.usuarioLogueado.id,
        nombreUsuario: this.usuarioLogueado.nombreUsuario,
        imagenPerfil: this.usuarioLogueado.imagenPerfil 
      },
      publicacionId: this.publicacion._id,
      editado: false,
      createdAt: new Date().toISOString()
    };

    this.comentarios.push(comentarioOptimista);
    this.formComentario.reset();
    this.sendingComentario = true;

    this.pubService.crearComentario(this.publicacion._id, texto).subscribe({
      next: (comentarioReal) => {
        const index = this.comentarios.findIndex(c => c._id === comentarioOptimista._id);
        if (index !== -1) {
          this.comentarios[index] = comentarioReal;
        }
        this.sendingComentario = false;
      },
      error: (err) => {
        this.comentarios = this.comentarios.filter(c => c._id !== comentarioOptimista._id);
        Swal.fire('Error', 'No se pudo enviar el comentario.', 'error');
        this.sendingComentario = false;
      }
    });
  }


  iniciarEdicion(comentario: Comentario): void {
    if (comentario._id.startsWith('temp-')) return;
    
    this.editandoComentarioId = comentario._id;
    this.formEditarComentario.patchValue({ texto: comentario.texto });
  }

  cancelarEdicion(): void {
    this.editandoComentarioId = null;
  }

  guardarEdicionComentario(comentarioId: string): void {
    if (this.formEditarComentario.invalid) return;

    const nuevoTexto = this.formEditarComentario.value.texto;
    this.pubService.editarComentario(comentarioId, nuevoTexto).subscribe((comentarioEditado) => {
      const index = this.comentarios.findIndex(c => c._id === comentarioId);
      if (index !== -1) {
        this.comentarios[index] = comentarioEditado;
      }
      this.cancelarEdicion();
    });
  }

  eliminarComentario(comentarioId: string): void {
    Swal.fire({
      title: '¿Seguro que deseas eliminar este comentario?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pubService.eliminarComentario(comentarioId).subscribe({
          next: () => {
            this.comentarios = this.comentarios.filter(c => c._id !== comentarioId);
            Swal.fire('Eliminado', 'El comentario fue eliminado con éxito.', 'success');
          },
          error: (err) => {
            Swal.fire('Error', 'Ocurrió un problema al eliminar el comentario.', 'error');
          }
        });
      }
    });
  }
}